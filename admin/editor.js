 "use strict";
const $ = id => document.getElementById(id);
const editor = $("contentEditor");
const message = $("editorMessage");
const statusLine = $("saveStatus");
let currentArticleId = null;
let busy = false;

function safeContentHtml(source) {
    const parsed = new DOMParser().parseFromString(String(source || ""), "text/html");
    const allowed = new Set(["P","H2","H3","UL","OL","LI","STRONG","B","EM","I","A","BLOCKQUOTE","BR","IMG"]);
    function clean(node, parent) {
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) { parent.appendChild(document.createTextNode(child.textContent)); return; }
            if (child.nodeType !== Node.ELEMENT_NODE) return;
            const tag = child.tagName;
            if (!allowed.has(tag)) { clean(child, parent); return; }
            const out = document.createElement(tag.toLowerCase());
            if (tag === "A") {
                try {
                    const u = new URL(child.getAttribute("href") || "");
                    if (u.protocol === "https:" || u.protocol === "http:") { out.href=u.href; out.target="_blank"; out.rel="noopener noreferrer"; }
                } catch (_) {}
            }
            if (tag === "IMG") {
                const src = WheelWiseAPI.safeImageUrl(child.getAttribute("src"));
                if (!src) return;
                out.src = src; out.alt = (child.getAttribute("alt") || "Article image").slice(0,180);
                out.loading = "lazy"; out.className = "article-inline-image";
                parent.appendChild(out); return;
            }
            clean(child, out); parent.appendChild(out);
        });
    }
    const container = document.createElement("div");
    clean(parsed.body, container);
    return container.innerHTML;
}
function slugify(value) {
    return String(value || "").toLowerCase().normalize("NFKD")
        .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
        .replace(/^-|-$/g,"").slice(0,70) || "wheelwise-article";
}
function setMessage(text, type) {
    message.textContent = text || "";
    message.className = "form-message" + (type ? " " + type : "");
    statusLine.textContent = type === "success" ? "Saved" : "Unsaved changes";
}
function updateFeaturedPreview(url) {
    const preview = $("featuredPreview");
    const safe = WheelWiseAPI.safeImageUrl(url);
    preview.replaceChildren();
    if (safe) {
        const img = document.createElement("img"); img.src=safe; img.alt="Featured image preview";
        preview.appendChild(img);
    } else preview.textContent = "Image preview";
}
function collectArticle(status) {
    const title = $("articleTitle").value.trim();
    const description = $("articleDescription").value.trim();
    if (!title || !description || !$("articleDate").value) throw new Error("Please complete the title, date and short description.");
    const image = WheelWiseAPI.safeImageUrl($("articleImage").value.trim());
    if ($("articleImage").value.trim() && !image) throw new Error("Featured image must use a valid HTTP or HTTPS URL.");
    const contentHtml = safeContentHtml(editor.innerHTML);
    if (!contentHtml.replace(/<[^>]*>/g,"").trim() && !editor.querySelector("img")) {
        throw new Error("Please add the article content before saving.");
    }
    return {
        id: currentArticleId || slugify(title) + "-" + Date.now().toString(36),
        title, date: $("articleDate").value,
        category: $("articleCategory").value,
        readTime: $("readTime").value,
        image, description, contentHtml,
        status, popular: $("popularArticle").checked
    };
}
async function save(status) {
    if (busy) return;
    busy = true;
    $("saveDraftButton").disabled = $("publishButton").disabled = true;
    try {
        const article = collectArticle(status);
        await WheelWiseAPI.saveArticle(article, !currentArticleId);
        currentArticleId = article.id;
        $("editorHeading").textContent = "Edit article";
        history.replaceState(null, "", "editor.html?id=" + encodeURIComponent(currentArticleId));
        setMessage(status === "published" ? "Article published successfully." : "Draft saved successfully.", "success");
    } catch (error) {
        setMessage(error.message, "error");
    } finally {
        busy = false;
        $("saveDraftButton").disabled = $("publishButton").disabled = false;
    }
}
async function uploadFile(file, target) {
    if (!file) return;
    setMessage("Uploading image…");
    try {
        const url = await WheelWiseAPI.uploadImage(file);
        if (target === "featured") {
            $("articleImage").value = url; updateFeaturedPreview(url);
            $("featuredStatus").textContent = "Image uploaded successfully.";
        } else {
            editor.focus();
            document.execCommand("insertHTML", false, '<p><img src="' + url.replace(/&/g,"&amp;").replace(/"/g,"&quot;") + '" alt="Article image"></p>');
        }
        setMessage("Image uploaded. Remember to save your article.", "success");
    } catch (error) { setMessage(error.message, "error"); }
}
async function initialize() {
    try {
        await WheelWiseAPI.requireAdmin();
        $("articleDate").value = new Date().toISOString().slice(0,10);
        const id = new URLSearchParams(location.search).get("id");
        if (id) {
            const articles = await WheelWiseAPI.loadAdminArticles();
            const article = articles.find(item => item.id === id);
            if (!article) throw new Error("Article not found.");
            currentArticleId = article.id;
            $("editorHeading").textContent = "Edit article";
            $("articleTitle").value = article.title || "";
            $("articleCategory").value = article.category || "New Launches";
            $("articleDate").value = article.date || $("articleDate").value;
            $("readTime").value = article.readTime || "3 min read";
            $("articleDescription").value = article.description || "";
            $("articleImage").value = article.image || "";
            updateFeaturedPreview(article.image);
            editor.innerHTML = safeContentHtml(article.contentHtml);
            $("popularArticle").checked = !!article.popular;
        }
    } catch (error) {
        if (/login|session|authorized/i.test(error.message)) location.replace("login.html");
        else setMessage(error.message, "error");
    }
}
document.querySelectorAll(".editor-toolbar [data-command]").forEach(button => {
    button.addEventListener("click", () => {
        editor.focus();
        document.execCommand(button.dataset.command, false, button.dataset.value || null);
    });
});
$("addLinkButton").addEventListener("click", () => {
    const url = prompt("Enter an https:// link:");
    if (!url) return;
    try {
        const parsed = new URL(url);
        if (!["https:","http:"].includes(parsed.protocol)) throw new Error();
        editor.focus(); document.execCommand("createLink", false, parsed.href);
    } catch (_) { alert("Please enter a valid http:// or https:// URL."); }
});
$("uploadFeaturedButton").addEventListener("click", () => $("featuredFile").click());
$("featuredFile").addEventListener("change", event => uploadFile(event.target.files[0], "featured"));
$("insertImageButton").addEventListener("click", () => $("inlineImageFile").click());
$("inlineImageFile").addEventListener("change", event => uploadFile(event.target.files[0], "inline"));
$("articleImage").addEventListener("input", () => updateFeaturedPreview($("articleImage").value));
$("saveDraftButton").addEventListener("click", () => save("draft"));
$("publishButton").addEventListener("click", () => save("published"));
$("articleForm").addEventListener("submit", event => event.preventDefault());
initialize();
