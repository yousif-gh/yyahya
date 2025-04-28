import { createDashboard } from '../pages/dashboard.js';
import { createXPPage } from '../pages/xp.js';
import { createGradesPage } from '../pages/grades.js';
import { createAuditsPage } from '../pages/audits.js';
import { createSkillsPage } from '../pages/skills.js';
import { createProfilePage } from '../pages/profile.js';
import { isAuthenticated } from '../api/jwt.js';

const routes = {
    '/': createDashboard,
    '/dashboard': createDashboard,
    '/profile': createProfilePage,
    '/xp': createXPPage,
    '/grades': createGradesPage,
    '/audits': createAuditsPage,
    '/skills': createSkillsPage,
};

export const handleRoute = async () => {
    console.log('Handling route:', window.location.pathname);

    // Check if user is authenticated
    const isUserAuthenticated = isAuthenticated();

    // Check if user has been logged out
    const wasLoggedOut = sessionStorage.getItem('logged_out') === 'true';

    // If user is not authenticated or was logged out, redirect to login
    if (!isUserAuthenticated || wasLoggedOut) {
        window.location.replace('/');
        return;
    }

    // Check if user just logged in
    const justLoggedIn = localStorage.getItem('just_logged_in') === 'true';
    if (justLoggedIn) {
        console.log('Just logged in, ensuring fresh data load');
        // localStorage.removeItem('just_logged_in');
    }

    const path = window.location.pathname;

    // Get the root container for content
    const rootContainer = document.getElementById('root');
    if (!rootContainer) {
        console.error('Root container not found');
        return;
    }

    // Clear previous content
    rootContainer.innerHTML = '';

    try {
        // Create main content container
        const mainContent = document.createElement('main');
        mainContent.className = 'main-content';

        // Render the page content
        const createPage = routes[path] || routes['/'];
        console.log('Creating page for route:', path);
        const page = await createPage();

        // Append the page to the main content
        mainContent.appendChild(page);

        // Append main content to the root container
        rootContainer.appendChild(mainContent);

        // Update the active item in the sidebar
        updateSidebarActiveItem(path);
    } catch (error) {
        console.error('Error loading page:', error);
        rootContainer.innerHTML = `
            <div class="error-message">
                Failed to load page content.
                <br>
                <small>${error.message}</small>
            </div>
        `;
    }
};

// Function to update the active item in the sidebar
const updateSidebarActiveItem = (path) => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const sidebarItems = sidebar.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        if (item.dataset.route === path) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
};

// Handle browser back/forward buttons
window.addEventListener('popstate', handleRoute);