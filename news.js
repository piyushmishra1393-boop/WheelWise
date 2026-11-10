/* =========================================================
   WHEELWISE ALL NEWS PAGE
   Loads published articles from Supabase through api.js.
   ========================================================= */

"use strict";

const articlesPerPage = 6;
let articles = [];
let selectedCategory = "All News";
let currentPage = 1;
let searchTerm = "";

function formatDate(dateString) {
    const date = new Date(String(dateString || "") + "T12:00:00");
    if (Number.isNaN(date.getTime())) return String(dateString || "");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function articleUrl(article) {
    return "article.html?id=" + encodeURIComponent(article.id);
}

function categoryClass(category) {
    const classes = {
        "New Launches": "blue",
        "Car Reviews": "purple",
        "Comparison": "green",
        "Future Cars": "orange",
        "Launch Updates": "red",
        "Technology": "teal",
        "Car Guides": "violet"
    };
    return classes[category] || "blue";
}

function safeText(value) {
    return String(value === null || value === undefined ? "" : value);
}

function createNewsImage(article, className) {
    const link = document.createElement("a");
    link.className = className;
    link.href = articleUrl(article);

    const image = document.createElement("img");
    image.src = WheelWiseAPI.safeImageUrl(article.image);
    image.alt = article.title || "Car news";
    image.loading = "lazy";
    if (!image.src) image.hidden = true;
    image.onerror = function () { image.hidden = true; };

    link.appendChild(image);
    return link;
}

function getFilteredArticles() {
    let result = articles.slice();

    if (selectedCategory !== "All News") {
        result = result.filter(article => article.category === selectedCategory);
    }

    if (searchTerm) {
        result = result.filter(article => {
            const searchableText = (
                safeText(article.title) + " " +
                safeText(article.category) + " " +
                safeText(article.description)
            ).toLowerCase();

            return searchableText.includes(searchTerm);
        });
    }

    const sortSelect = document.getElementById("sortNews");
    const sortMode = sortSelect ? sortSelect.value : "newest";

    if (sortMode === "newest") {
        result.sort((a, b) => safeText(b.date).localeCompare(safeText(a.date)));
    } else if (sortMode === "oldest") {
        result.sort((a, b) => safeText(a.date).localeCompare(safeText(b.date)));
    } else if (sortMode === "az") {
        result.sort((a, b) => safeText(a.title).localeCompare(safeText(b.title)));
    }

    return result;
}

function renderArticles() {
    const grid = document.getElementById("allNewsGrid");
    const noNews = document.getElementById("noNews");
    const count = document.getElementById("articleCount");
    const pagination = document.getElementById("pagination");

    if (!grid || !noNews || !count || !pagination) return;

    const filtered = getFilteredArticles();
    const totalPages = Math.ceil(filtered.length / articlesPerPage);

    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

    const start = (currentPage - 1) * articlesPerPage;
    const visibleArticles = filtered.slice(start, start + articlesPerPage);

    count.textContent = "Showing " + filtered.length + " articles";
    grid.replaceChildren();
    noNews.hidden = filtered.length !== 0;

    if (!filtered.length) {
        pagination.replaceChildren();
        return;
    }

    visibleArticles.forEach(article => {
        const card = document.createElement("article");
        card.className = "all-news-card";

        const imageLink = createNewsImage(article, "news-card-image");

        const content = document.createElement("div");
        content.className = "all-news-card-content";

        const category = document.createElement("span");
        category.className = "category-tag " + categoryClass(article.category);
        category.textContent = article.category || "Automotive News";

        const heading = document.createElement("h2");
        const headingLink = document.createElement("a");
        headingLink.href = articleUrl(article);
        headingLink.textContent = article.title || "Untitled article";
        heading.appendChild(headingLink);

        const meta = document.createElement("div");
        meta.className = "article-meta";

        const date = document.createElement("span");
        date.innerHTML = '<i class="fa-regular fa-calendar"></i> ';
        date.appendChild(document.createTextNode(formatDate(article.date)));

        const readTime = document.createElement("span");
        readTime.innerHTML = '<i class="fa-regular fa-clock"></i> ';
        readTime.appendChild(document.createTextNode(article.readTime || ""));

        meta.append(date, readTime);

        const description = document.createElement("p");
        description.textContent = article.description || "";

        const readMore = document.createElement("a");
        readMore.className = "read-more";
        readMore.href = articleUrl(article);
        readMore.appendChild(document.createTextNode("Read More "));
        const arrow = document.createElement("i");
        arrow.className = "fa-solid fa-arrow-right";
        readMore.appendChild(arrow);

        content.append(category, heading, meta, description, readMore);
        card.append(imageLink, content);
        grid.appendChild(card);
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById("pagination");
    pagination.replaceChildren();

    if (totalPages <= 1) return;

    function addPageButton(label, page, disabled, selected, ariaLabel) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.disabled = Boolean(disabled);
        if (selected) button.classList.add("selected");
        if (ariaLabel) button.setAttribute("aria-label", ariaLabel);

        button.addEventListener("click", function () {
            currentPage = page;
            renderArticles();
            window.scrollTo({ top: 250, behavior: "smooth" });
        });

        pagination.appendChild(button);
    }

    addPageButton("‹", currentPage - 1, currentPage === 1, false, "Previous page");

    for (let page = 1; page <= totalPages; page++) {
        addPageButton(String(page), page, false, page === currentPage, "Page " + page);
    }

    addPageButton("›", currentPage + 1, currentPage === totalPages, false, "Next page");
}

function renderCategories() {
    const categoryList = document.getElementById("categoryList");
    if (!categoryList) return;

    const categories = ["All News", ...new Set(
        articles.map(article => article.category).filter(Boolean)
    )];

    categoryList.replaceChildren();

    categories.forEach(category => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "category-filter";
        if (category === selectedCategory) button.classList.add("selected");

        const name = document.createElement("span");
        name.className = "category-filter-name";

        const dot = document.createElement("span");
        dot.className = "category-dot " + categoryClass(category);

        name.append(dot, document.createTextNode(category));

        const number = document.createElement("span");
        number.textContent = category === "All News"
            ? articles.length
            : articles.filter(article => article.category === category).length;

        button.append(name, number);
        button.addEventListener("click", function () {
            selectedCategory = category;
            currentPage = 1;
            renderCategories();
            renderArticles();
        });

        categoryList.appendChild(button);
    });
}

function renderPopularArticles() {
    const container = document.getElementById("popularArticles");
    if (!container) return;

    const popular = articles.filter(article => article.popular).slice(0, 4);
    container.replaceChildren();

    popular.forEach(article => {
        const item = document.createElement("a");
        item.className = "popular-item";
        item.href = articleUrl(article);

        const image = document.createElement("img");
        image.src = WheelWiseAPI.safeImageUrl(article.image);
        image.alt = article.title || "Car news";
        image.loading = "lazy";
        if (!image.src) image.hidden = true;
        image.onerror = function () { image.hidden = true; };

        const text = document.createElement("span");
        text.className = "popular-item-text";

        const title = document.createElement("strong");
        title.textContent = article.title || "Untitled article";

        const date = document.createElement("small");
        date.textContent = formatDate(article.date);

        text.append(title, date);

        const arrow = document.createElement("i");
        arrow.className = "fa-solid fa-angle-right";

        item.append(image, text, arrow);
        container.appendChild(item);
    });
}

function showNewsError(message) {
    const grid = document.getElementById("allNewsGrid");
    const count = document.getElementById("articleCount");
    const noNews = document.getElementById("noNews");
    const pagination = document.getElementById("pagination");

    if (grid) {
        grid.replaceChildren();
        const error = document.createElement("p");
        error.className = "news-api-message";
        error.textContent = "News could not be loaded. " + message;
        grid.appendChild(error);
    }

    if (count) count.textContent = "Unable to load articles";
    if (noNews) noNews.hidden = true;
    if (pagination) pagination.replaceChildren();
}

function initializeNewsPage() {
    const searchInput = document.getElementById("newsSearch");
    const sortSelect = document.getElementById("sortNews");
    const menuButton = document.getElementById("newsMenuButton");
    const mobileMenu = document.getElementById("newsMobileMenu");
    const themeButton = document.getElementById("newsThemeButton");
    const newsletterForm = document.getElementById("newsletterForm");

    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("search") || "";
    if (searchInput) searchInput.value = initialSearch;
    searchTerm = initialSearch.trim().toLowerCase();

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            searchTerm = this.value.trim().toLowerCase();
            currentPage = 1;
            renderArticles();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", function () {
            currentPage = 1;
            renderArticles();
        });
    }

    if (menuButton && mobileMenu) {
        menuButton.addEventListener("click", function () {
            mobileMenu.classList.toggle("show");
        });
    }

    function applyNewsTheme(isDark) {
        document.body.classList.toggle("dark", isDark);
        if (themeButton) {
            themeButton.innerHTML = isDark
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';
        }
        localStorage.setItem("wheelwiseDarkMode", String(isDark));
    }

    applyNewsTheme(localStorage.getItem("wheelwiseDarkMode") === "true");

    if (themeButton) {
        themeButton.addEventListener("click", function () {
            applyNewsTheme(!document.body.classList.contains("dark"));
        });
    }

    if (newsletterForm) {
        newsletterForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const message = document.getElementById("newsletterMessage");
            if (message) {
                message.textContent = "Demo only: newsletter signup is not connected yet.";
            }
        });
    }

    const count = document.getElementById("articleCount");
    if (count) count.textContent = "Loading articles...";

    WheelWiseAPI.loadArticles()
        .then(function (loadedArticles) {
            articles = loadedArticles;
            renderCategories();
            renderArticles();
            renderPopularArticles();
        })
        .catch(function (error) {
            showNewsError(error.message);
            console.error("WheelWise news API:", error);
        });
}

initializeNewsPage();
