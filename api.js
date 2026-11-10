/* =========================================================
   WHEELWISE API
   Public article reads + authenticated admin + image storage.
   Uses the Supabase publishable key only. Never put a secret
   or service_role key in browser-side files.
   ========================================================= */
(function () {
    "use strict";

    const SESSION_KEY = "wheelwise_admin_session";
    const BUCKET = "wheelwise-images";

    function config() {
        if (!window.SUPABASE_URL || !window.SUPABASE_PUBLISHABLE_KEY) {
            throw new Error("Supabase configuration missing. Check api-config.js.");
        }
        return {
            url: window.SUPABASE_URL.replace(/\/$/, ""),
            key: window.SUPABASE_PUBLISHABLE_KEY
        };
    }

    function readSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
        catch (_) { return null; }
    }

    function saveSession(session) {
        if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        else localStorage.removeItem(SESSION_KEY);
    }

    async function request(path, options, authenticated) {
        const c = config();
        const opts = options || {};
        const headers = Object.assign({
            "apikey": c.key,
            "Accept": "application/json"
        }, opts.headers || {});
        if (authenticated) {
            const session = await getValidSession();
            if (!session || !session.access_token) throw new Error("Please log in again.");
            headers.Authorization = "Bearer " + session.access_token;
        } else {
            headers.Authorization = "Bearer " + c.key;
        }
        if (opts.body && !(opts.body instanceof FormData) && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }
        const response = await fetch(c.url + path, Object.assign({}, opts, { headers }));
        const text = await response.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
        if (!response.ok) {
            const message = data && (data.message || data.msg || data.error_description || data.error)
                ? (data.message || data.msg || data.error_description || data.error)
                : text || ("HTTP " + response.status);
            throw new Error("Supabase (" + response.status + "): " + message);
        }
        return data;
    }

    async function getValidSession() {
        let session = readSession();
        if (!session) return null;
        const expiry = Number(session.expires_at || 0);
        if (expiry && expiry > Math.floor(Date.now() / 1000) + 60) return session;
        if (!session.refresh_token) { saveSession(null); return null; }
        try {
            const c = config();
            const response = await fetch(c.url + "/auth/v1/token?grant_type=refresh_token", {
                method: "POST",
                headers: { apikey: c.key, "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: session.refresh_token })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || data.message || "Session expired.");
            session = Object.assign({}, data, {
                expires_at: data.expires_at || (Math.floor(Date.now()/1000) + Number(data.expires_in || 3600))
            });
            saveSession(session);
            return session;
        } catch (error) {
            saveSession(null);
            throw new Error("Your admin session expired. Please log in again.");
        }
    }

    async function loadArticles() {
        const data = await request(
            "/rest/v1/articles?select=id,title,date,category,readTime,image,description,contentHtml,popular&status=eq.published&order=date.desc",
            { method: "GET", cache: "no-store" }, false
        );
        if (!Array.isArray(data)) throw new Error("Invalid articles response.");
        return data;
    }

    async function signIn(email, password) {
        const c = config();
        const response = await fetch(c.url + "/auth/v1/token?grant_type=password", {
            method: "POST",
            headers: { apikey: c.key, "Content-Type": "application/json" },
            body: JSON.stringify({ email: String(email).trim(), password: String(password) })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || data.message || data.error_description || "Login failed.");
        const session = Object.assign({}, data, {
            expires_at: data.expires_at || (Math.floor(Date.now()/1000) + Number(data.expires_in || 3600))
        });
        saveSession(session);
        try {
            const admin = await checkAdmin();
            if (!admin) {
                await signOut();
                throw new Error("This account is not authorized as a WheelWise admin.");
            }
        } catch (error) {
            await signOut();
            throw error;
        }
        return session.user;
    }

    async function checkAdmin() {
        const session = await getValidSession();
        if (!session || !session.user || !session.user.id) return false;
        const rows = await request(
            "/rest/v1/wheelwise_admins?select=user_id&user_id=eq." + encodeURIComponent(session.user.id) + "&limit=1",
            { method: "GET", cache: "no-store" }, true
        );
        return Array.isArray(rows) && rows.length > 0;
    }

    async function requireAdmin() {
        const session = await getValidSession();
        if (!session || !session.user) throw new Error("Admin login required.");
        if (!(await checkAdmin())) throw new Error("This account is not an authorized WheelWise admin.");
        return session.user;
    }

    async function signOut() {
        const session = readSession();
        if (session && session.access_token) {
            try {
                const c = config();
                await fetch(c.url + "/auth/v1/logout", {
                    method: "POST",
                    headers: { apikey: c.key, Authorization: "Bearer " + session.access_token }
                });
            } catch (_) { /* Local sign-out still clears the session. */ }
        }
        saveSession(null);
    }

    async function loadAdminArticles() {
        await requireAdmin();
        const rows = await request(
            "/rest/v1/articles?select=*&order=updatedAt.desc.nullslast,date.desc",
            { method: "GET", cache: "no-store" }, true
        );
        return Array.isArray(rows) ? rows : [];
    }

    async function saveArticle(article, isNew) {
        await requireAdmin();
        const payload = Object.assign({}, article, { updatedAt: new Date().toISOString() });
        if (isNew) payload.createdAt = new Date().toISOString();
        const path = "/rest/v1/articles" + (isNew ? "" : "?id=eq." + encodeURIComponent(article.id));
        const data = await request(path, {
            method: isNew ? "POST" : "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(payload)
        }, true);
        return Array.isArray(data) ? data[0] : data;
    }

    async function deleteArticle(id) {
        await requireAdmin();
        await request("/rest/v1/articles?id=eq." + encodeURIComponent(id), {
            method: "DELETE"
        }, true);
        return true;
    }

    async function uploadImage(file) {
        await requireAdmin();
        if (!file || !file.type || !file.type.startsWith("image/")) {
            throw new Error("Please choose a valid image file.");
        }
        if (file.size > 5 * 1024 * 1024) throw new Error("Image size must be 5 MB or less.");
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.type)) throw new Error("Use JPG, PNG, WEBP or GIF images.");
        const extension = ({ "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp", "image/gif":"gif" })[file.type];
        const safeName = (file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60);
        const uniqueId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
            (Date.now().toString(36) + Math.random().toString(36).slice(2));
        const path = new Date().toISOString().slice(0,10) + "/" + uniqueId + "-" + safeName.replace(/\.[^.]+$/, "") + "." + extension;
        const c = config();
        const session = await getValidSession();
        const response = await fetch(c.url + "/storage/v1/object/" + BUCKET + "/" + path, {
            method: "POST",
            headers: {
                apikey: c.key,
                Authorization: "Bearer " + session.access_token,
                "Content-Type": file.type,
                "x-upsert": "false"
            },
            body: file
        });
        if (!response.ok) {
            const message = await response.text();
            throw new Error("Image upload failed: " + message);
        }
        return c.url + "/storage/v1/object/public/" + BUCKET + "/" + path;
    }

    function safeImageUrl(value) {
        if (!value) return "";
        try {
            const parsed = new URL(String(value), window.location.href);
            return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
        } catch (_) { return ""; }
    }

    window.WheelWiseAPI = {
        loadArticles, signIn, signOut, checkAdmin, requireAdmin,
        loadAdminArticles, saveArticle, deleteArticle, uploadImage,
        safeImageUrl, getSession: getValidSession
    };
})();
