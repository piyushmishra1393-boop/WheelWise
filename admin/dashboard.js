"use strict";
let allArticles = [];
const rows = document.getElementById("articleRows");
const message = document.getElementById("dashboardMessage");

function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[ch]));
}
function renderDashboard() {
    const query = document.getElementById("articleSearch").value.trim().toLowerCase();
    const status = document.getElementById("statusFilter").value;
    const filtered = allArticles.filter(article =>
        (!query || String(article.title || "").toLowerCase().includes(query)) &&
        (status === "all" || article.status === status)
    );
    document.getElementById("totalCount").textContent = allArticles.length;
    document.getElementById("publishedCount").textContent = allArticles.filter(a => a.status === "published").length;
    document.getElementById("draftCount").textContent = allArticles.filter(a => a.status === "draft").length;
    rows.replaceChildren();
    if (!filtered.length) {
        rows.innerHTML = '<tr><td colspan="4" class="empty-cell">No articles match this view. Create your first article.</td></tr>';
        return;
    }
    filtered.forEach(article => {
        const tr = document.createElement("tr");
        const date = article.date ? new Date(article.date + "T12:00:00").toLocaleDateString("en-IN") : "—";
        tr.innerHTML = `
          <td><div class="article-cell">${article.image ? `<img src="${esc(WheelWiseAPI.safeImageUrl(article.image))}" alt="">` : '<span class="thumb-placeholder">🚘</span>'}
          <span><b>${esc(article.title || "Untitled")}</b><small>${esc(article.category || "Uncategorised")}</small></span></div></td>
          <td>${esc(date)}</td><td><span class="status-pill ${article.status === "published" ? "is-published" : "is-draft"}">${esc(article.status || "draft")}</span></td>
          <td><div class="row-actions"><a class="small-btn" href="editor.html?id=${encodeURIComponent(article.id)}">Edit</a>
          <button class="small-btn" data-action="toggle" data-id="${esc(article.id)}">${article.status === "published" ? "Unpublish" : "Publish"}</button>
          <button class="small-btn danger-btn" data-action="delete" data-id="${esc(article.id)}">Delete</button></div></td>`;
        rows.appendChild(tr);
    });
}
async function loadDashboard() {
    try {
        const user = await WheelWiseAPI.requireAdmin();
        document.getElementById("adminEmail").textContent = user.email || "Admin";
        allArticles = await WheelWiseAPI.loadAdminArticles();
        message.textContent = allArticles.length ? "" : "No articles yet. Select “New article” to start writing.";
        renderDashboard();
    } catch (error) {
        if (/login|session|authorized/i.test(error.message)) location.replace("login.html");
        else message.textContent = error.message;
    }
}
document.getElementById("articleSearch").addEventListener("input", renderDashboard);
document.getElementById("statusFilter").addEventListener("change", renderDashboard);
rows.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const article = allArticles.find(item => item.id === button.dataset.id);
    if (!article) return;
    if (button.dataset.action === "delete") {
        if (!confirm("Delete “" + article.title + "”? This cannot be undone.")) return;
        button.disabled = true;
        try { await WheelWiseAPI.deleteArticle(article.id); await loadDashboard(); }
        catch (error) { alert(error.message); button.disabled = false; }
    } else {
        button.disabled = true;
        try {
            await WheelWiseAPI.saveArticle(Object.assign({}, article, {
                status: article.status === "published" ? "draft" : "published"
            }), false);
            await loadDashboard();
        } catch (error) { alert(error.message); button.disabled = false; }
    }
});
document.getElementById("logoutButton").addEventListener("click", async () => {
    await WheelWiseAPI.signOut();
    location.replace("login.html");
});
loadDashboard();
