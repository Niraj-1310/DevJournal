// ========================================
// DevJournal - Main JavaScript
// ========================================


// ========================================
// LIKE SYSTEM
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".like-form").forEach(form => {

        form.addEventListener("submit", function (e) {

            e.preventDefault();

            fetch(form.action, {
                method: "POST",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            })
            .then(response => response.json())
            .then(data => {

                const heartIcon = form.querySelector(".heart-icon");
                const likeCount = form.querySelector(".like-count");

                if (heartIcon) {
                    heartIcon.textContent =
                        data.liked ? "❤️" : "🤍";
                }

                if (likeCount) {
                    likeCount.textContent = data.likes;
                }

            })
            .catch(error => {
                console.error("Like error:", error);
            });

        });

    });

});


// ========================================
// SAVE SYSTEM
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".save-form").forEach(form => {

        form.addEventListener("submit", function (e) {

            e.preventDefault();

            fetch(form.action, {
                method: "POST",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            })
            .then(response => response.json())
            .then(data => {

                const saveText =
                    form.querySelector(".save-text");

                if (saveText) {
                    saveText.textContent =
                        data.saved ? "🔖 Saved" : "📑 Save";
                }

            })
            .catch(error => {
                console.error("Save error:", error);
            });

        });

    });

});


// ========================================
// TOAST NOTIFICATIONS
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".toast").forEach(toast => {

        setTimeout(() => {

            toast.style.opacity = "0";
            toast.style.transform = "translateX(-10px)";

            setTimeout(() => {
                toast.remove();
            }, 300);

        }, 3000);

    });

});

// ==========================================
// BACK BUTTON
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const backButton =
        document.querySelector(".back-arrow");

    if (!backButton) {
        return;
    }

    backButton.addEventListener("click", function (e) {

        const directBack =
            backButton.dataset.directBack === "1";

        if (directBack) {
            e.preventDefault();
            window.location.href = backButton.href;
            return;
        }

        const editReturnUrl =
            sessionStorage.getItem(
                "devjournal_edit_return_url"
            );

        if (editReturnUrl) {
            e.preventDefault();

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

            window.location.href = editReturnUrl;
            return;
        }

        if (window.history.length > 1) {
            e.preventDefault();
            window.history.back();
        }

    });

});

// ==========================================
// DEVJOURNAL — PAGE-SPECIFIC SCROLL RESTORE
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    const pageKey =
        "devjournal_scroll_" +
        window.location.pathname +
        window.location.search;

    const savedScroll =
        sessionStorage.getItem(pageKey);

    if (window.location.hash === "#comments") {
        return;
    }

    if (savedScroll === null) {
        return;
    }

    const navigationEntry =
        performance.getEntriesByType("navigation")[0];

    const navigationType =
        navigationEntry
            ? navigationEntry.type
            : "navigate";

    // Restore after a page refresh.
    if (navigationType === "reload") {

        setTimeout(function () {

            window.scrollTo({
                top: parseInt(savedScroll, 10),
                behavior: "smooth"
            });

            sessionStorage.removeItem(pageKey);

        }, 150);

        return;
    }

    // Restore after normal Back/Forward navigation.
    setTimeout(function () {

        window.scrollTo({
            top: parseInt(savedScroll, 10),
            behavior: "smooth"
        });

        sessionStorage.removeItem(pageKey);

    }, 150);

});

// ==========================================
// DEVJOURNAL — SAVE SCROLL FOR REFRESH
// ==========================================

window.addEventListener("beforeunload", function () {

    const pageKey =
        "devjournal_scroll_" +
        window.location.pathname +
        window.location.search;

    sessionStorage.setItem(
        pageKey,
        window.scrollY
    );

});

// ==========================================
// DEVJOURNAL — RETURN TO COMMENTS AFTER ACTION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // Comment submission
    const commentForm =
        document.getElementById("comment-form");

    if (commentForm) {

        commentForm.addEventListener("submit", function () {

            sessionStorage.setItem(
                "devjournal_return_comments",
                "true"
            );

        });

    }


    // Edit comment
    document.querySelectorAll(
        ".comment-actions .edit-btn"
    ).forEach(link => {

        link.addEventListener("click", function () {

            sessionStorage.setItem(
                "devjournal_return_comments",
                "true"
            );

        });

    });


    // Delete comment
    document.querySelectorAll(
        ".comment-actions form"
    ).forEach(form => {

        form.addEventListener("submit", function () {

            sessionStorage.setItem(
                "devjournal_return_comments",
                "true"
            );

        });

    });

});

// ==========================================
// RESTORE COMMENTS AFTER COMMENT ACTION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const fromCommentEdit =
        new URLSearchParams(window.location.search)
            .get("from_comment_edit");

    if (fromCommentEdit === "1") {
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
        document.getElementById("comments");

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

});

// ==========================================
// NAVIGATION — HOME PAGINATION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const isHomePage =
        window.location.pathname === "/" ||
        window.location.pathname === "/home";

    if (!isHomePage) {
        return;
    }

    document.querySelectorAll(
        '.pagination a'
    ).forEach(link => {

        link.addEventListener("click", function () {

            sessionStorage.setItem(
                "devjournal_pagination_scroll",
                "posts"
            );

        });

    });

});

// ==========================================
// NAVIGATION — RESTORE AFTER PAGINATION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const shouldRestore =
        sessionStorage.getItem(
            "devjournal_pagination_scroll"
        );

    if (shouldRestore !== "posts") {
        return;
    }

    const postsSection =
        document.querySelector(".posts");

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

});

// ==========================================
// PROFILE PICTURE — SHOW SELECTED FILE
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const fileInput =
        document.querySelector(".profile-file-input");

    const fileLabel =
        document.querySelector(".custom-file-label");

    if (!fileInput || !fileLabel) {
        return;
    }

    fileInput.addEventListener("change", function () {

        if (this.files && this.files.length > 0) {

            const fileName = this.files[0].name;

            fileLabel.textContent =
                "📷 " + fileName;

            fileLabel.classList.add("file-selected");

        } else {

            fileLabel.textContent =
                "📷 Choose Profile Picture";

            fileLabel.classList.remove("file-selected");

        }

    });

});

// ==========================================
// DEVJOURNAL — DARK MODE
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const themeToggle =
        document.getElementById("theme-toggle");

    const themeText =
        document.getElementById("theme-text");

    if (!themeToggle) {
        return;
    }


    // ------------------------------------------
    // Logged-in user detection
    // ------------------------------------------

    const userId =
        document.body.dataset.userId || null;

    const isLoggedIn =
        userId !== null && userId !== "";


    // ------------------------------------------
    // User-specific storage key
    // ------------------------------------------

    const themeStorageKey =
        isLoggedIn
            ? `devjournal_theme_${userId}`
            : null;


    // ------------------------------------------
    // Update theme UI
    // ------------------------------------------

    function updateThemeUI(isDark) {

        if (themeText) {
            themeText.textContent =
                isDark ? "Dark Mode" : "Light Mode";
        }

        themeToggle.setAttribute(
            "aria-label",
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
        );
    }


    // ------------------------------------------
    // Apply theme
    // ------------------------------------------

    function applyTheme(isDark) {

        document.documentElement.classList.toggle(
            "dark-mode",
            isDark
        );

        document.body.classList.toggle(
            "dark-mode",
            isDark
        );

        updateThemeUI(isDark);
    }


    // ------------------------------------------
    // Restore saved theme
    // ------------------------------------------

    let isDark = false;

    if (isLoggedIn) {

        const savedTheme =
            localStorage.getItem(themeStorageKey);

        isDark =
            savedTheme === "dark";
    }

    // Logged-out users ALWAYS start in light mode.
    // Logged-in users get their own saved preference.

    applyTheme(isDark);


    // ------------------------------------------
    // Toggle theme
    // ------------------------------------------

    themeToggle.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();


            const newDarkMode =
                !document.documentElement.classList.contains(
                    "dark-mode"
                );


            // Apply theme

            applyTheme(newDarkMode);


            // Save preference ONLY for logged-in users

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

});

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    // Mark individual notification as read
    document.querySelectorAll(".mark-read").forEach(button => {

        button.addEventListener("click", async () => {

            const notificationId = button.dataset.notificationId;

            try {
                const response = await fetch(
                    `/notifications/${notificationId}/read`,
                    {
                        method: "POST",
                        headers: {
                            "X-Requested-With": "XMLHttpRequest"
                        }
                    }
                );

                const data = await response.json();

                if (!data.success) {
                    return;
                }

                const notification = document.querySelector(
                    `.notification-item[data-notification-id="${notificationId}"]`
                );

                if (notification) {
                    notification.classList.remove("unread");
                }

                button.remove();

            } catch (error) {
                console.error(
                    "Error marking notification as read:",
                    error
                );
            }
        });

    });


    // Mark all notifications as read
    const markAllButton = document.getElementById("mark-all-read");

    if (markAllButton) {

        markAllButton.addEventListener("click", async () => {

            try {
                const response = await fetch(
                    "/notifications/read-all",
                    {
                        method: "POST",
                        headers: {
                            "X-Requested-With": "XMLHttpRequest"
                        }
                    }
                );

                const data = await response.json();

                if (!data.success) {
                    return;
                }

                document
                    .querySelectorAll(".notification-item.unread")
                    .forEach(notification => {
                        notification.classList.remove("unread");
                    });

                document
                    .querySelectorAll(".mark-read")
                    .forEach(button => {
                        button.remove();
                    });

                markAllButton.remove();

            } catch (error) {
                console.error(
                    "Error marking all notifications as read:",
                    error
                );
            }

        });

    }

});

/* =========================================================
   LIVE NOTIFICATION COUNT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const notificationLink =
        document.querySelector(".notification-link");

    if (!notificationLink) {
        return;
    }

    async function updateNotificationCount() {

        try {
            const response = await fetch(
                "/notifications/count"
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            let badge =
                notificationLink.querySelector(
                    ".notification-badge"
                );

            if (data.count > 0) {

                if (!badge) {
                    badge = document.createElement("span");

                    badge.className =
                        "notification-badge";

                    notificationLink.appendChild(badge);
                }

                badge.textContent = data.count;

            } else if (badge) {

                badge.remove();
            }

        } catch (error) {
            console.error(
                "Error updating notification count:",
                error
            );
        }
    }

    updateNotificationCount();

    setInterval(
        updateNotificationCount,
        10000
    );

});

// ==========================================
// DEVJOURNAL — NAVIGATION MENU
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const menuToggle =
        document.getElementById("menu-toggle");

    const navMenu =
        document.getElementById("nav-menu");


    if (!menuToggle || !navMenu) {
        return;
    }


    function openMenu() {

        navMenu.classList.add("open");

        menuToggle.classList.add("active");

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

        navMenu.classList.remove("open");

        menuToggle.classList.remove("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        menuToggle.setAttribute(
            "aria-label",
            "Open menu"
        );
    }


    menuToggle.addEventListener("click", function (event) {

        event.stopPropagation();

        if (navMenu.classList.contains("open")) {
            closeMenu();
        } else {
            openMenu();
        }

    });


    // Close when clicking outside

    document.addEventListener("click", function (event) {

        if (
            navMenu.classList.contains("open") &&
            !navMenu.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {
            closeMenu();
        }

    });


    // Close with Escape

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeMenu();
        }

    });


    // Close after selecting a menu item

    navMenu.querySelectorAll(
        ".menu-item[href]"
    ).forEach(item => {

        item.addEventListener("click", function () {
            closeMenu();
        });

    });

});

// =====================================================
// CSRF PROTECTION FOR AJAX POST REQUESTS
// =====================================================

(function () {

    const csrfToken =
        document.querySelector('meta[name="csrf-token"]')?.content;

    if (!csrfToken) {
        console.warn("DevJournal: CSRF token not found.");
        return;
    }

    const originalFetch = window.fetch;

    window.fetch = function (input, init = {}) {

        const options = {
            ...init
        };

        const method =
            (options.method || "GET").toUpperCase();

        if (method !== "GET" && method !== "HEAD") {

            options.headers = {
                ...(options.headers || {}),
                "X-CSRFToken": csrfToken
            };

        }

        return originalFetch(input, options);
    };

})();