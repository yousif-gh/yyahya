import { createLoginForm } from './auth/login.js';
import { isAuthenticated } from './api/jwt.js';
import { createSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';
import { handleRoute } from './router/router.js';
import { cleanupDashboard } from './pages/dashboard.js';

// Get containers
const loginContainer = document.getElementById('login-container');
const rootContainer = document.getElementById('root');

// Check if required containers exist
if (!rootContainer) {
    console.error('Root container not found. Please add <div id="root"></div> to your HTML.');
    document.body.innerHTML = `
        <div class="error-message">
            <h2>Application Error</h2>
            <p>Required container not found. Please check your HTML structure.</p>
        </div>
    `;
    throw new Error('Root container not found');
}

if (!loginContainer) {
    console.error('Login container not found. Please add <div id="login-container"></div> to your HTML.');
    document.body.innerHTML = `
        <div class="error-message">
            <h2>Application Error</h2>
            <p>Required container not found. Please check your HTML structure.</p>
        </div>
    `;
    throw new Error('Login container not found');
}


const initializeApp = async () => {
    try {
        // Clear any existing content
        // rootContainer.innerHTML = '';

        // Add click outside handler for mobile sidebar
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.querySelector('.menu-toggle');

            if (sidebar && sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });

        // Check if user is authenticated
        const isUserAuthenticated = isAuthenticated();

        // Check if user has been logged out
        const wasLoggedOut = sessionStorage.getItem('logged_out') === 'true';

        // Check if we have a user ID
        const hasUserId = localStorage.getItem('current_user_id') !== null;

        // If user is not authenticated, was logged out, or doesn't have a user ID, show login form
        if (!isUserAuthenticated || wasLoggedOut || !hasUserId) {
            // Remove any existing UI elements that should only be visible when authenticated
            const header = document.querySelector('header');
            if (header) header.remove();

            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.remove();

            // Show login form
            loginContainer.style.display = 'block';
            loginContainer.innerHTML = '';
            loginContainer.appendChild(createLoginForm());
            return;
        }

        // User is authenticated
        loginContainer.style.display = 'none';

        // Add header and sidebar only once
        if (!document.querySelector('header')) {
            const header = renderHeader();
            document.body.insertBefore(header, document.body.firstChild);
        }

        if (!document.querySelector('.sidebar')) {
            document.body.appendChild(createSidebar());
        }

        // Clean up previous dashboard state
        cleanupDashboard();

        // Use the router to handle navigation
        // Check if we're on the root path and redirect to dashboard if needed
        if (window.location.pathname === '/') {
            history.replaceState({}, '', '/dashboard');
        }

        // Handle the current route
        handleRoute();

    } catch (error) {
        console.error('Error initializing app:', error);
        rootContainer.innerHTML = `
            <div class="error-message">
                Failed to initialize application. Please refresh the page.
                <br>
                <small>${error.message}</small>
            </div>
        `;
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Handle navigation
window.addEventListener('popstate', initializeApp);