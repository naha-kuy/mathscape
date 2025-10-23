// PWA Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Session Management - Removed

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
                    // Special handling for separate HTML files
                    if (pageId === 'peta-konstruksi') {
                        window.location.href = 'peta-konstruksi.html';
                        return;
                    }
                    if (pageId === 'petunjuk-konstruksi') {
                        window.location.href = 'petunjuk-konstruksi.html';
                        return;
                    }
                    if (pageId === 'lahan-syarat') {
                        window.location.href = 'lahan-syarat.html';
                        return;
                    }
                    if (pageId === 'lahan-bermain') {
                        window.location.href = 'lahan-bermain.html';
                        return;
                    }
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

            // Handle logout button - removed
        });
    },

    showPage: function(pageId) {
        // Special handling for pages that redirect to separate HTML files
        if (pageId === 'lahan-syarat') {
            window.location.href = 'lahan-syarat.html';
            return;
        }

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
        } else {
            console.error('Page element not found:', pageId + '-page');
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
        } else {
            console.error('Page controller not found or init function missing:', controllerName);
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