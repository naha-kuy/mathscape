// app.js - Main Application Controller (SPA Router)
window.app = {
    currentPage: null,

    init: function() {
        // Hide all pages initially
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show default page (menu)
        this.showPage('menu');

        // Setup navigation after DOM is ready
        this.setupNavigation();
    },

    setupNavigation: function() {
        // Use event delegation for better performance and to handle dynamically added elements
        document.addEventListener('click', (e) => {
            // Handle navigation buttons
            if (e.target.closest('.nav-btn')) {
                const btn = e.target.closest('.nav-btn');
                const pageId = btn.getAttribute('data-page');
                if (pageId) {
                    this.showPage(pageId);
                }
            }

            // Handle back buttons
            if (e.target.closest('.back-btn')) {
                const btn = e.target.closest('.back-btn');
                const pageId = btn.getAttribute('data-page');
                if (pageId) {
                    this.showPage(pageId);
                }
            }

            // Handle next buttons
            if (e.target.closest('.next-btn')) {
                const btn = e.target.closest('.next-btn');
                const pageId = btn.getAttribute('data-page');
                if (pageId) {
                    this.showPage(pageId);
                }
            }

            // Handle start button
            if (e.target.closest('#start-construction-btn')) {
                this.showPage('level-selection');
            }
        });
    },

    showPage: function(pageId) {
        // Clean up current page
        if (this.currentPage) {
            this.cleanupPage(this.currentPage);
        }

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show new page
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Initialize new page
        this.currentPage = pageId;
        this.initPage(pageId);
    },

    initPage: function(pageId) {
        // Call the appropriate page controller init function
        const controllerName = pageId.replace(/-/g, '') + 'Page'; // Convert kebab-case to camelCase
        if (window[controllerName] && typeof window[controllerName].init === 'function') {
            window[controllerName].init();
        }
    },

    cleanupPage: function(pageId) {
        // Call the appropriate page controller cleanup function
        const controllerName = pageId.replace(/-/g, '') + 'Page'; // Convert kebab-case to camelCase
        if (window[controllerName] && typeof window[controllerName].cleanup === 'function') {
            window[controllerName].cleanup();
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});