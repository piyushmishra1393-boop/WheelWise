
/* =========================================================
   WHEELWISE - HOMEPAGE JAVASCRIPT
   ========================================================= */


/* =========================================================
   1. MOBILE MENU
   ========================================================= */

const menuButton = document.getElementById("menuButton");
const mobileMenu = document.getElementById("mobileMenu");

if (menuButton && mobileMenu) {

    menuButton.addEventListener("click", function () {

        mobileMenu.classList.toggle("show");

    });

}


/* =========================================================
   2. CLOSE MOBILE MENU AFTER CLICKING A LINK
   ========================================================= */

if (mobileMenu) {

    const mobileLinks = mobileMenu.querySelectorAll("a");

    mobileLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            mobileMenu.classList.remove("show");

        });

    });

}


/* =========================================================
   3. DARK MODE
   ========================================================= */

const themeButton = document.getElementById("themeButton");

function applyTheme(isDark) {

    document.body.classList.toggle("dark", isDark);

    if (themeButton) {

        themeButton.innerHTML = isDark
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';

    }

    localStorage.setItem("wheelwiseDarkMode", String(isDark));

}


// Load saved theme

const savedTheme = localStorage.getItem("wheelwiseDarkMode");

applyTheme(savedTheme === "true");


// Toggle theme

if (themeButton) {

    themeButton.addEventListener("click", function () {

        const isDark = document.body.classList.contains("dark");

        applyTheme(!isDark);

    });

}


/* =========================================================
   4. HERO IMAGE SLIDER
   ========================================================= */

const slides = document.querySelectorAll(".hero-slide");
const dots = document.querySelectorAll(".dot");

let currentSlide = 0;

function showSlide(number) {

    // Stop if no slides exist

    if (slides.length === 0) {
        return;
    }

    // Keep slide number within available range

    currentSlide = number % slides.length;

    slides.forEach(function (slide) {

        slide.classList.remove("active");

    });

    dots.forEach(function (dot) {

        dot.classList.remove("active");

    });

    slides[currentSlide].classList.add("active");

    if (dots[currentSlide]) {

        dots[currentSlide].classList.add("active");

    }

}


// Dot click events

dots.forEach(function (dot, index) {

    dot.addEventListener("click", function () {

        showSlide(index);

    });

});


// Automatic slider

if (slides.length > 1) {

    setInterval(function () {

        showSlide(currentSlide + 1);

    }, 5000);

}


/* =========================================================
   5. SEARCH FUNCTION
   ========================================================= */

// Redirect search to News page

function searchWheelWise(searchText) {

    const query = searchText.trim();

    if (query === "") {

        alert("Please enter a car, brand or feature.");

        return;

    }

    window.location.href =
        "news.html?search=" + encodeURIComponent(query);

}


// Hero search

const searchButton = document.getElementById("searchButton");
const heroSearch = document.getElementById("heroSearch");

if (searchButton && heroSearch) {

    searchButton.addEventListener("click", function () {

        searchWheelWise(heroSearch.value);

    });

    heroSearch.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            searchWheelWise(heroSearch.value);

        }

    });

}


// Navbar search

const navSearch = document.getElementById("navSearch");

if (navSearch) {

    navSearch.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            searchWheelWise(navSearch.value);

        }

    });

}


/* =========================================================
   7. NEWSLETTER
   ========================================================= */

// This is currently a demonstration only.
// Actual email storage will be implemented separately.

const newsletterButton =
    document.querySelector(".newsletter button");

const newsletterInput =
    document.querySelector(".newsletter input");


if (newsletterButton && newsletterInput) {

    newsletterButton.addEventListener("click", function () {

        const email = newsletterInput.value.trim();

        if (email === "") {

            alert("Please enter your email address.");

            return;

        }

        // Basic email format validation

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            alert("Please enter a valid email address.");

            return;

        }

        alert("Thank you! Newsletter integration is coming soon.");

        newsletterInput.value = "";

    });

}





/* =========================================================
   8. HOMEPAGE NEWS FROM SUPABASE
   ========================================================= */

function formatHomeDate(dateString) {
    const date = new Date(String(dateString || "") + "T12:00:00");
    if (Number.isNaN(date.getTime())) return String(dateString || "");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function homeCategoryClass(category) {
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

function renderHomeNews(articles) {
    const grid = document.getElementById("homeNewsGrid");
    if (!grid) return;

    grid.replaceChildren();

    const latest = articles
        .slice()
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .slice(0, 4);

    if (!latest.length) {
        const message = document.createElement("p");
        message.className = "home-news-status";
        message.textContent = "No published news articles are available yet.";
        grid.appendChild(message);
        return;
    }

    latest.forEach(function (article) {
        const card = document.createElement("article");
        card.className = "news-card";
        card.dataset.articleId = article.id;

        const image = document.createElement("img");
        image.src = WheelWiseAPI.safeImageUrl(article.image);
        image.alt = article.title || "Car news";
        image.loading = "lazy";
        if (!image.src) image.hidden = true;
        image.onerror = function () { image.hidden = true; };

        const content = document.createElement("div");
        content.className = "card-content";

        const category = document.createElement("span");
        category.className = "category " + homeCategoryClass(article.category);
        category.textContent = article.category || "Automotive News";

        const title = document.createElement("h3");
        title.textContent = article.title || "Untitled article";

        const meta = document.createElement("div");
        meta.className = "card-meta";

        const date = document.createElement("span");
        date.innerHTML = '<i class="fa-regular fa-calendar"></i> ';
        date.appendChild(document.createTextNode(formatHomeDate(article.date)));

        const readTime = document.createElement("span");
        readTime.innerHTML = '<i class="fa-regular fa-clock"></i> ';
        readTime.appendChild(document.createTextNode(article.readTime || ""));

        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-label", "Read " + (article.title || "article"));
        button.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
        button.addEventListener("click", function () {
            window.location.href = "article.html?id=" + encodeURIComponent(article.id);
        });

        meta.append(date, readTime, button);
        content.append(category, title, meta);
        card.append(image, content);
        card.addEventListener("click", function (event) {
            if (event.target.closest("button")) return;
            window.location.href = "article.html?id=" + encodeURIComponent(article.id);
        });

        grid.appendChild(card);
    });
}

const homeNewsGrid = document.getElementById("homeNewsGrid");

if (homeNewsGrid && window.WheelWiseAPI) {
    WheelWiseAPI.loadArticles()
        .then(renderHomeNews)
        .catch(function (error) {
            homeNewsGrid.replaceChildren();
            const message = document.createElement("p");
            message.className = "home-news-status";
            message.textContent = "News could not be loaded. " + error.message;
            homeNewsGrid.appendChild(message);
            console.error("WheelWise homepage API:", error);
        });
}

/* =========================================================
   END OF WHEELWISE JAVASCRIPT
   ========================================================= */
