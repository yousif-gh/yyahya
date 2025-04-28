import { handleRoute } from '../router/router.js';

export const createSidebar = () => {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';

    // Add touch event handling for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    sidebar.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });

    sidebar.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    });

    sidebar.addEventListener('touchend', () => {
        const swipeDistance = touchStartX - touchEndX;
        if (swipeDistance > 50) {
            sidebar.classList.remove('active');
        }
    });

    const menuItems = [
        { title: 'Dashboard', route: '/dashboard', icon: '🏠' },
        { title: 'Profile', route: '/profile', icon: '👤' },
        { title: 'XP', route: '/xp', icon: '⭐' },
        { title: 'Grades', route: '/grades', icon: '📊' },
        { title: 'Audits', route: '/audits', icon: '📝' },
        { title: 'Skills', route: '/skills', icon: '💡' },
    ];

    menuItems.forEach(item => {
        const menuItem = createMenuItem(item);
        sidebar.appendChild(menuItem);
    });

    window.addEventListener('popstate', () => updateActiveItem(sidebar));

    return sidebar;
};

const createMenuItem = ({ title, route, icon }) => {
    const item = document.createElement('div');
    item.className = 'sidebar-item';
    item.dataset.route = route;

    // Highlight current page
    if (window.location.pathname === route) {
        item.classList.add('active');
    }

    const iconSpan = document.createElement('span');
    iconSpan.className = 'sidebar-icon';
    iconSpan.textContent = icon;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'sidebar-title';
    titleSpan.textContent = title;

    item.appendChild(iconSpan);
    item.appendChild(titleSpan);

    item.addEventListener('click', (e) => {
        e.preventDefault();

        if (window.location.pathname === route) {
            return;
        }

        // Update active state
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Update URL and handle the route change
        console.log('Navigating to:', route);
        history.pushState({}, '', route);
        handleRoute();

        // On mobile, close the sidebar after navigation
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });

    return item;
};

const updateActiveItem = (sidebar) => {
    const currentPath = window.location.pathname;
    sidebar.querySelectorAll('.sidebar-item').forEach(item => {
        if (item.dataset.route === currentPath) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
};