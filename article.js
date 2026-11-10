/* =========================================================
   WHEELWISE ARTICLE PAGE
   Loads the requested published article from the API.
   ========================================================= */

"use strict";

const loadingMessage = document.getElementById("articleLoading");
const notFoundMessage = document.getElementById("articleNotFound");
const articleContent = document.getElementById("articleContent");

function setArticleText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = value || "";
}

function formatArticleDate(dateString) {
    const date = new Date(String(dateString || "") + "T12:00:00");

    if (Number.isNaN(date.getTime())) {
        return dateString || "";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

/**
 * Rebuilds article HTML using a small safe tag allow-list.
 * Scripts, styles, event attributes, iframes and unsafe links are discarded.
 */
function appendSafeArticleNodes(sourceNode, destination) {
    const allowedTags = new Set([
        "P", "H2", "H3", "UL", "OL", "LI",
        "STRONG", "B", "EM", "I", "A", "BLOCKQUOTE", "BR", "IMG"
    ]);

    Array.from(sourceNode.childNodes).forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
            destination.appendChild(document.createTextNode(node.textContent));
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const tag = node.tagName.toUpperCase();

        // Unapproved tags are not copied, but their text/allowed child elements remain.
        if (!allowedTags.has(tag)) {
            appendSafeArticleNodes(node, destination);
            return;
        }

        const cleanElement = document.createElement(tag.toLowerCase());

        if (tag === "A") {
            const href = node.getAttribute("href") || "";
            try {
                const parsed = new URL(href, window.location.href);
                if (parsed.protocol === "https:" || parsed.protocol === "http:") {
                    cleanElement.href = parsed.href;
                    cleanElement.target = "_blank";
                    cleanElement.rel = "noopener noreferrer";
                }
            } catch (error) {
                // Keep link text but discard an invalid destination.
            }
        }

        if (tag === "IMG") {
            const imageUrl = WheelWiseAPI.safeImageUrl(node.getAttribute("src"));
            if (!imageUrl) return;
            cleanElement.src = imageUrl;
            cleanElement.alt = (node.getAttribute("alt") || "Article image").slice(0, 180);
            cleanElement.loading = "lazy";
            cleanElement.className = "article-inline-image";
            destination.appendChild(cleanElement);
            return;
        }

        appendSafeArticleNodes(node, cleanElement);
        destination.appendChild(cleanElement);
    });
}

function renderArticleBody(contentHtml, description) {
    const body = document.getElementById("articleBody");
    body.replaceChildren();

    if (typeof contentHtml === "string" && contentHtml.trim()) {
        const parsed = new DOMParser().parseFromString(contentHtml, "text/html");
        appendSafeArticleNodes(parsed.body, body);
    }

    if (!body.children.length && description) {
        const paragraph = document.createElement("p");
        paragraph.textContent = description;
        body.appendChild(paragraph);
    }

    if (!body.children.length) {
        const paragraph = document.createElement("p");
        paragraph.textContent = "Full article content will be added soon.";
        body.appendChild(paragraph);
    }
}

function showArticleError(message) {
    if (loadingMessage) loadingMessage.hidden = true;
    if (notFoundMessage) {
        notFoundMessage.hidden = false;
        const paragraph = notFoundMessage.querySelector("p");
        if (paragraph && message) paragraph.textContent = message;
    }
}

function displayArticle(article) {
    if (!article) {
        showArticleError("This article may not exist or may not be published.");
        document.title = "Article Not Found | WheelWise";
        return;
    }

    setArticleText("articleCategory", article.category);
    setArticleText("articleTitle", article.title);
    setArticleText("articleDate", formatArticleDate(article.date));
    setArticleText("articleReadTime", article.readTime);
    setArticleText("articleDescription", article.description);

    const image = document.getElementById("articleImage");
    const imageUrl = WheelWiseAPI.safeImageUrl(article.image);

    image.src = imageUrl;
    image.alt = article.title || "Car news";
    image.hidden = !imageUrl;
    image.onerror = function () {
        image.hidden = true;
    };

    renderArticleBody(article.contentHtml, article.description);

    document.title = (article.title || "Car News") + " | WheelWise";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && article.description) {
        metaDescription.content = article.description;
    }

    if (loadingMessage) loadingMessage.hidden = true;
    if (notFoundMessage) notFoundMessage.hidden = true;
    if (articleContent) articleContent.hidden = false;
}

function loadArticle() {
    const parameters = new URLSearchParams(window.location.search);
    const articleId = parameters.get("id");

    if (!articleId) {
        showArticleError("No article ID was provided in this link.");
        return;
    }

    WheelWiseAPI.loadArticles()
        .then(function (articles) {
            const article = articles.find(item => item.id === articleId);
            displayArticle(article);
        })
        .catch(function (error) {
            showArticleError("Article data could not be loaded. " + error.message);
            console.error("WheelWise article API:", error);
        });
}

loadArticle();
