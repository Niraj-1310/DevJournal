// ============================================================
// DevJournal - Main JavaScript
// ============================================================

"use strict";


// ============================================================
// CSRF TOKEN
// ============================================================

function getCSRFToken() {

    const meta = document.querySelector(
        'meta[name="csrf-token"]'
    );

    if (meta) {
        return meta.getAttribute("content");
    }

    const input = document.querySelector(
        'input[name="csrf_token"]'
    );

    if (input) {
        return input.value;
    }

    return null;
}


// ============================================================
// TOAST SYSTEM
// ============================================================

function showToast(message, category = "info") {

    if (!message) {
        return;
    }

    let container =
        document.querySelector(".toast-container");

    if (!container) {

        container = document.createElement("div");

        container.className =
            "toast-container";

        document.body.appendChild(container);
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${category}`;

    toast.textContent =
        message;

    container.appendChild(toast);

    requestAnimationFrame(() => {

        toast.classList.add("show");

    });

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);
}

// ============================================================
// LOGOUT CONFIRMATION MODAL
// ============================================================

function initializeLogoutConfirm() {

    const logoutForm =
        document.querySelector(".menu-logout")?.closest("form");

    const overlay =
        document.getElementById("logout-modal-overlay");

    const cancelBtn =
        document.getElementById("logout-modal-cancel");

    const confirmBtn =
        document.getElementById("logout-modal-confirm");

    if (!logoutForm || !overlay || !cancelBtn || !confirmBtn) {
        return;
    }

    function openModal() {
        overlay.classList.add("open");
    }

    function closeModal() {
        overlay.classList.remove("open");
    }

    logoutForm.addEventListener("submit", function (event) {

        if (logoutForm.dataset.confirmed === "true") {
            return;
        }

        event.preventDefault();
        openModal();
    });

    cancelBtn.addEventListener("click", closeModal);

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
            closeModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && overlay.classList.contains("open")) {
            closeModal();
        }
    });

    confirmBtn.addEventListener("click", function () {
        logoutForm.dataset.confirmed = "true";
        logoutForm.submit();
    });
}

// ============================================================
// READING PROGRESS BAR
// ============================================================

function initializeReadingProgress() {

    const progressBar =
        document.getElementById("reading-progress-bar");

    const postBody =
        document.querySelector(".post-body");

    if (!progressBar || !postBody) {
        return;
    }

    progressBar.classList.add("active");

    function updateProgress() {

        const scrollTop =
            window.scrollY;

        const docHeight =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const progress =
            docHeight > 0
                ? (scrollTop / docHeight) * 100
                : 0;

        progressBar.style.width =
            Math.min(100, Math.max(0, progress)) + "%";
    }

    window.addEventListener("scroll", updateProgress, { passive: true });

    updateProgress();
}


// ============================================================
// NAVBAR SCROLL ELEVATION
// ============================================================

function initializeNavbarElevation() {

    const navbar =
        document.querySelector(".navbar");

    if (!navbar) {
        return;
    }

    function updateNavbarState() {

        if (window.scrollY > 12) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }

    window.addEventListener("scroll", updateNavbarState, { passive: true });

    updateNavbarState();
}


// ============================================================
// LIKE BUTTON BURST EFFECT
// ============================================================

function triggerLikeBurst(form, heartIcon) {

    if (heartIcon) {

        heartIcon.classList.remove("pop");

        // Force reflow so the animation can replay
        void heartIcon.offsetWidth;

        heartIcon.classList.add("pop");
    }

    const particleCount = 6;

    for (let i = 0; i < particleCount; i++) {

        const particle =
            document.createElement("span");

        particle.className = "like-burst";

        const angle =
            (Math.PI * 2 * i) / particleCount;

        const distance = 22;

        particle.style.setProperty(
            "--burst-x",
            `${Math.cos(angle) * distance}px`
        );

        particle.style.setProperty(
            "--burst-y",
            `${Math.sin(angle) * distance}px`
        );

        form.appendChild(particle);

        requestAnimationFrame(() => {
            particle.classList.add("animate");
        });

        setTimeout(() => {
            particle.remove();
        }, 650);
    }
}

// ============================================================
// FLASK FLASH MESSAGES
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const flashMessages =
            document.querySelectorAll(
                ".toast-container .toast"
            );

        flashMessages.forEach(message => {

            // Make the Flask flash message visible
            requestAnimationFrame(() => {
                message.classList.add("show");
            });

            // Automatically remove after 3 seconds
            setTimeout(() => {

                message.classList.remove("show");

                setTimeout(() => {
                    message.remove();
                }, 300);

            }, 3000);
        });
    }
);

// ============================================================
// SAFE AJAX FETCH
// ============================================================

async function djFetch(url, options = {}) {

    const csrfToken =
        getCSRFToken();

    const headers = {
        "X-Requested-With": "XMLHttpRequest",
        ...(options.headers || {})
    };

    const method =
        (options.method || "GET").toUpperCase();

    if (
        csrfToken &&
        method !== "GET" &&
        method !== "HEAD"
    ) {

        headers["X-CSRFToken"] =
            csrfToken;
    }

    const response =
        await fetch(url, {
            ...options,
            headers
        });

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    let data;

    if (
        contentType.includes(
            "application/json"
        )
    ) {

        data =
            await response.json();

    } else {

        const text =
            await response.text();

        try {

            data =
                JSON.parse(text);

        } catch {

            data = {
                success: response.ok,
                message: text
            };
        }
    }

    if (!response.ok) {

        throw new Error(
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`
        );
    }

    return data;
}


// ============================================================
// LIKE SYSTEM
// ============================================================

function initializeLikeSystem() {

    document.querySelectorAll(
        ".like-form"
    ).forEach(form => {

        if (
            form.dataset.likeInitialized === "true"
        ) {
            return;
        }

        form.dataset.likeInitialized =
            "true";

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const button =
                    form.querySelector(
                        "button[type='submit']"
                    ) ||
                    form.querySelector(
                        "button"
                    );

                if (!button) {
                    return;
                }

                if (button.disabled) {
                    return;
                }

                const heartIcon =
                    form.querySelector(
                        ".heart-icon"
                    ) ||
                    form.querySelector(
                        ".like-icon"
                    );

                const likeCount =
                    form.querySelector(
                        ".like-count"
                    );

                button.disabled =
                    true;

                try {

                    const data =
                        await djFetch(
                            form.action,
                            {
                                method: "POST"
                            }
                        );

                    if (
                        data.success === false ||
                        data.error
                    ) {

                        throw new Error(
                            data.message ||
                            data.error ||
                            "Unable to update like."
                        );
                    }

                    const newCount =
                        data.likes ??
                        data.like_count ??
                        data.count;

                    if (
                        likeCount &&
                        newCount !== undefined &&
                        newCount !== null
                    ) {

                        likeCount.textContent =
                            newCount;
                    }

                    const liked =
                        data.liked ??
                        data.is_liked ??
                        data.status === "liked";

                    if (heartIcon) {

                        heartIcon.textContent =
                            liked
                                ? "❤️"
                                : "🤍";
                    }

                    form.classList.toggle(
                        "liked",
                        liked
                    );

                    button.classList.toggle(
                        "liked",
                        liked
                    );

                    if (liked) {
                        triggerLikeBurst(form, heartIcon);
                    }

                    if (data.message) {

                        showToast(
                            data.message,
                            "success"
                        );
                    }

                } catch (error) {

                    showToast(
                        error.message ||
                        "Something went wrong while liking the post.",
                        "error"
                    );

                } finally {

                    button.disabled =
                        false;
                }
            }
        );
    });
}


// ============================================================
// SAVE SYSTEM
// ============================================================

function initializeSaveSystem() {

    document.querySelectorAll(
        ".save-form"
    ).forEach(form => {

        if (
            form.dataset.saveInitialized === "true"
        ) {
            return;
        }

        form.dataset.saveInitialized =
            "true";

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const button =
                    form.querySelector(
                        "button[type='submit']"
                    ) ||
                    form.querySelector(
                        "button"
                    );

                if (!button) {
                    return;
                }

                if (button.disabled) {
                    return;
                }

                const saveText =
                    form.querySelector(
                        ".save-text"
                    );

                const saveIcon =
                    form.querySelector(
                        ".save-icon"
                    );

                button.disabled =
                    true;

                try {

                    const data =
                        await djFetch(
                            form.action,
                            {
                                method: "POST"
                            }
                        );

                    if (
                        data.success === false ||
                        data.error
                    ) {

                        throw new Error(
                            data.message ||
                            data.error ||
                            "Unable to update saved post."
                        );
                    }

                    const saved =
                        data.saved ??
                        data.is_saved ??
                        data.status === "saved";

                    if (saveText) {

                        saveText.textContent =
                            saved
                                ? "🔖 Saved"
                                : "📑 Save";
                    }

                    form.classList.toggle(
                        "saved",
                        saved
                    );

                    button.classList.toggle(
                        "saved",
                        saved
                    );

                    if (saveIcon) {

                        saveIcon.classList.toggle(
                            "saved",
                            saved
                        );
                    }

                    if (data.message) {

                        showToast(
                            data.message,
                            "success"
                        );
                    }

                } catch (error) {

                    showToast(
                        error.message ||
                        "Something went wrong while saving the post.",
                        "error"
                    );

                } finally {

                    button.disabled =
                        false;
                }
            }
        );
    });
}


// ============================================================
// BACK BUTTON
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const backButton =
            document.querySelector(
                ".back-arrow"
            );

        if (!backButton) {
            return;
        }

        backButton.addEventListener(
            "click",
            function (event) {

                const directBack =
                    backButton.dataset.directBack === "1";

                if (directBack) {

                    event.preventDefault();

                    window.location.href =
                        backButton.href;

                    return;
                }

                const editReturnUrl =
                    sessionStorage.getItem(
                        "devjournal_edit_return_url"
                    );

                if (editReturnUrl) {

                    event.preventDefault();

                    sessionStorage.setItem(
                        "devjournal_edit_restore_scroll",
                        sessionStorage.getItem(
                            "devjournal_edit_return_scroll"
                        ) || "0"
                    );

                    sessionStorage.removeItem(
                        "devjournal_edit_return_url"
                    );

                    sessionStorage.removeItem(
                        "devjournal_edit_return_scroll"
                    );

                    window.location.href =
                        editReturnUrl;

                    return;
                }

                if (window.history.length > 1) {

                    event.preventDefault();

                    window.history.back();
                }
            }
        );
    }
);


// ============================================================
// PAGE-SPECIFIC SCROLL RESTORE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if ("scrollRestoration" in history) {

            history.scrollRestoration =
                "manual";
        }

        const pageKey =
            "devjournal_scroll_" +
            window.location.pathname +
            window.location.search;

        const savedScroll =
            sessionStorage.getItem(
                pageKey
            );

        if (
            window.location.hash ===
            "#comments"
        ) {
            return;
        }

        if (savedScroll === null) {
            return;
        }

        const navigationEntry =
            performance.getEntriesByType(
                "navigation"
            )[0];

        const navigationType =
            navigationEntry
                ? navigationEntry.type
                : "navigate";

        if (
            navigationType === "reload"
        ) {

            setTimeout(function () {

                window.scrollTo({
                    top: parseInt(
                        savedScroll,
                        10
                    ),
                    behavior: "smooth"
                });

                sessionStorage.removeItem(
                    pageKey
                );

            }, 150);

            return;
        }

        setTimeout(function () {

            window.scrollTo({
                top: parseInt(
                    savedScroll,
                    10
                ),
                behavior: "smooth"
            });

            sessionStorage.removeItem(
                pageKey
            );

        }, 150);
    }
);


// ============================================================
// SAVE SCROLL FOR REFRESH
// ============================================================

window.addEventListener(
    "beforeunload",
    function () {

        const pageKey =
            "devjournal_scroll_" +
            window.location.pathname +
            window.location.search;

        sessionStorage.setItem(
            pageKey,
            window.scrollY
        );
    }
);


// ============================================================
// RETURN TO COMMENTS AFTER ACTION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const commentForm =
            document.getElementById(
                "comment-form"
            );

        if (commentForm) {

            commentForm.addEventListener(
                "submit",
                function () {

                    sessionStorage.setItem(
                        "devjournal_return_comments",
                        "true"
                    );
                }
            );
        }

        document.querySelectorAll(
            ".comment-actions .edit-btn"
        ).forEach(link => {

            link.addEventListener(
                "click",
                function () {

                    sessionStorage.setItem(
                        "devjournal_return_comments",
                        "true"
                    );
                }
            );
        });

        document.querySelectorAll(
            ".comment-actions form"
        ).forEach(form => {

            form.addEventListener(
                "submit",
                function () {

                    sessionStorage.setItem(
                        "devjournal_return_comments",
                        "true"
                    );
                }
            );
        });
    }
);


// ============================================================
// RESTORE COMMENTS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const fromCommentEdit =
            new URLSearchParams(
                window.location.search
            ).get(
                "from_comment_edit"
            );

        if (
            fromCommentEdit === "1"
        ) {

            sessionStorage.setItem(
                "devjournal_return_comments",
                "true"
            );
        }

        const shouldReturn =
            sessionStorage.getItem(
                "devjournal_return_comments"
            );

        const commentsSection =
            document.getElementById(
                "comments"
            );

        if (
            shouldReturn !== "true" ||
            !commentsSection
        ) {
            return;
        }

        setTimeout(function () {

            commentsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            sessionStorage.removeItem(
                "devjournal_return_comments"
            );

        }, 150);
    }
);


// ============================================================
// HOME PAGINATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const isHomePage =
            window.location.pathname === "/" ||
            window.location.pathname === "/home";

        if (!isHomePage) {
            return;
        }

        document.querySelectorAll(
            ".pagination a"
        ).forEach(link => {

            link.addEventListener(
                "click",
                function () {

                    sessionStorage.setItem(
                        "devjournal_pagination_scroll",
                        "posts"
                    );
                }
            );
        });
    }
);


// ============================================================
// RESTORE AFTER PAGINATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const shouldRestore =
            sessionStorage.getItem(
                "devjournal_pagination_scroll"
            );

        if (
            shouldRestore !== "posts"
        ) {
            return;
        }

        const postsSection =
            document.querySelector(
                ".posts"
            );

        if (!postsSection) {
            return;
        }

        setTimeout(function () {

            postsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            sessionStorage.removeItem(
                "devjournal_pagination_scroll"
            );

        }, 150);
    }
);


// ============================================================
// PROFILE PICTURE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const fileInput =
            document.querySelector(
                ".profile-file-input"
            );

        const fileLabel =
            document.querySelector(
                ".custom-file-label"
            );

        if (
            !fileInput ||
            !fileLabel
        ) {
            return;
        }

        fileInput.addEventListener(
            "change",
            function () {

                if (
                    this.files &&
                    this.files.length > 0
                ) {

                    fileLabel.textContent =
                        "📷 " +
                        this.files[0].name;

                    fileLabel.classList.add(
                        "file-selected"
                    );

                } else {

                    fileLabel.textContent =
                        "📷 Choose Profile Picture";

                    fileLabel.classList.remove(
                        "file-selected"
                    );
                }
            }
        );
    }
);


// ============================================================
// DARK MODE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const themeToggle =
            document.getElementById(
                "theme-toggle"
            );

        const themeText =
            document.getElementById(
                "theme-text"
            );

        if (!themeToggle) {
            return;
        }

        const userId =
            document.body.dataset.userId ||
            null;

        const isLoggedIn =
            userId !== null &&
            userId !== "";

        const themeStorageKey =
            isLoggedIn
                ? `devjournal_theme_${userId}`
                : null;


        function updateThemeUI(isDark) {

            if (themeText) {

                themeText.textContent =
                    isDark
                        ? "Dark Mode"
                        : "Light Mode";
            }

            themeToggle.setAttribute(
                "aria-label",
                isDark
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            );
        }


        function applyTheme(isDark) {

            document.documentElement.classList.toggle(
                "dark-mode",
                isDark
            );

            document.body.classList.toggle(
                "dark-mode",
                isDark
            );

            updateThemeUI(
                isDark
            );
        }


        let isDark = false;

        if (isLoggedIn) {

            const savedTheme =
                localStorage.getItem(
                    themeStorageKey
                );

            isDark =
                savedTheme === "dark";
        }

        applyTheme(
            isDark
        );


        if (
            themeToggle.dataset.themeInitialized ===
            "true"
        ) {
            return;
        }

        themeToggle.dataset.themeInitialized =
            "true";


        themeToggle.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                const newDarkMode =
                    !document.documentElement.classList.contains(
                        "dark-mode"
                    );

                applyTheme(
                    newDarkMode
                );

                if (isLoggedIn) {

                    localStorage.setItem(
                        themeStorageKey,
                        newDarkMode
                            ? "dark"
                            : "light"
                    );
                }
            }
        );
    }
);


// ============================================================
// NOTIFICATIONS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        document.querySelectorAll(
            ".mark-read"
        ).forEach(button => {

            button.addEventListener(
                "click",
                async function () {

                    const notificationId =
                        button.dataset.notificationId;

                    try {

                        const data =
                            await djFetch(
                                `/notifications/${notificationId}/read`,
                                {
                                    method: "POST"
                                }
                            );

                        if (
                            !data.success
                        ) {
                            return;
                        }

                        const notification =
                            document.querySelector(
                                `.notification-item[data-notification-id="${notificationId}"]`
                            );

                        if (notification) {

                            notification.classList.remove(
                                "unread"
                            );
                        }

                        button.remove();

                    } catch (error) {

                        showToast(
                            error.message ||
                            "Unable to mark notification as read.",
                            "error"
                        );
                    }
                }
            );
        });


        const markAllButton =
            document.getElementById(
                "mark-all-read"
            );

        if (!markAllButton) {
            return;
        }

        markAllButton.addEventListener(
            "click",
            async function () {

                try {

                    const data =
                        await djFetch(
                            "/notifications/read-all",
                            {
                                method: "POST"
                            }
                        );

                    if (
                        !data.success
                    ) {
                        return;
                    }

                    document.querySelectorAll(
                        ".notification-item.unread"
                    ).forEach(notification => {

                        notification.classList.remove(
                            "unread"
                        );
                    });

                    document.querySelectorAll(
                        ".mark-read"
                    ).forEach(button => {

                        button.remove();
                    });

                    markAllButton.remove();

                } catch (error) {

                    showToast(
                        error.message ||
                        "Unable to mark notifications as read.",
                        "error"
                    );
                }
            }
        );
    }
);


// ============================================================
// LIVE NOTIFICATION COUNT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const notificationLink =
            document.querySelector(
                ".notification-link"
            );

        if (!notificationLink) {
            return;
        }


        async function updateNotificationCount() {

            try {

                const response =
                    await fetch(
                        "/notifications/count"
                    );

                if (!response.ok) {
                    return;
                }

                const data =
                    await response.json();

                let badge =
                    notificationLink.querySelector(
                        ".notification-badge"
                    );

                if (
                    data.count > 0
                ) {

                    if (!badge) {

                        badge =
                            document.createElement(
                                "span"
                            );

                        badge.className =
                            "notification-badge";

                        notificationLink.appendChild(
                            badge
                        );
                    }

                    badge.textContent =
                        data.count;

                } else if (badge) {

                    badge.remove();
                }

            } catch (error) {

                // Intentionally silent.
            }
        }

        updateNotificationCount();

        setInterval(
            updateNotificationCount,
            10000
        );
    }
);


// ============================================================
// NAVIGATION MENU
// Uses .open to match your existing CSS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const menuToggle =
            document.getElementById(
                "menu-toggle"
            );

        const navMenu =
            document.getElementById(
                "nav-menu"
            );

        if (
            !menuToggle ||
            !navMenu
        ) {
            return;
        }


        function openMenu() {

            navMenu.classList.add(
                "open"
            );

            navMenu.setAttribute(
                "aria-hidden",
                "false"
            );

            menuToggle.classList.add(
                "active"
            );

            menuToggle.setAttribute(
                "aria-expanded",
                "true"
            );

            menuToggle.setAttribute(
                "aria-label",
                "Close menu"
            );
        }


        function closeMenu() {

            navMenu.classList.remove(
                "open"
            );

            navMenu.setAttribute(
                "aria-hidden",
                "true"
            );

            menuToggle.classList.remove(
                "active"
            );

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            menuToggle.setAttribute(
                "aria-label",
                "Open menu"
            );
        }


        menuToggle.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                if (
                    navMenu.classList.contains(
                        "open"
                    )
                ) {

                    closeMenu();

                } else {

                    openMenu();
                }
            }
        );


        document.addEventListener(
            "click",
            function (event) {

                if (
                    navMenu.classList.contains(
                        "open"
                    ) &&
                    !navMenu.contains(
                        event.target
                    ) &&
                    !menuToggle.contains(
                        event.target
                    )
                ) {

                    closeMenu();
                }
            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    closeMenu();
                }
            }
        );


        navMenu.querySelectorAll(
            ".menu-item[href]"
        ).forEach(item => {

            item.addEventListener(
                "click",
                function () {

                    closeMenu();
                }
            );
        });
    }
);

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeLikeSystem();
        initializeSaveSystem();
        initializeReadingProgress();
        initializeNavbarElevation();
        initializeLogoutConfirm();
    }
);