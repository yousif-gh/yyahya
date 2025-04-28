import { handleLogout } from '../auth/logout.js';
// import { getAuthenticatedUser } from '../auth/user.js';
// import { queries } from '../api/graphql.js';

export const renderHeader = () => {
    const header = document.createElement('header');
    header.className = 'app-header';

    // Add menu toggle button for mobile
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '☰';
    menuToggle.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
    });

    // Logo/App Name
    const logo = document.createElement('div');
    logo.className = 'logo';
    logo.textContent = 'Student Dashboard';
    logo.addEventListener('click', () => {
        window.location.href = '/dashboard';
    });

    // User Section
    const userSection = document.createElement('div');
    userSection.className = 'user-section';

    const logoutButton = document.createElement('button');
    logoutButton.className = 'logout-button';
    logoutButton.textContent = 'Logout';
    logoutButton.addEventListener('click', handleLogout);

    userSection.appendChild(logoutButton);
    header.append(menuToggle, logo, userSection);
    
    return header;
};