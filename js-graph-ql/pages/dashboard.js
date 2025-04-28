
import { getAuthenticatedUser } from '../auth/user.js';
import { queries } from '../api/graphql.js';
// State management for dashboard

export const createDashboard = async () => {
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard-page';

    try {
        // Always ensure fresh data fetch

        // Check if we need to force a fresh data fetch (after login)
        const fetchLevelData = localStorage.getItem('fetch_level_data') === 'true';
        if (fetchLevelData) {
            // Clear the flag
            // localStorage.removeItem('fetch_level_data');
            console.log('Fetching fresh level data after login');
        }

        // Fetch user data with level information
        // console.log('Fetching user data for dashboard...');
        const userData = await getAuthenticatedUser(queries.getUserProfile);
        // console.log("User data structure:", userData);

        // Create user profile section
        const profileSection = document.createElement('div');
        profileSection.className = 'profile-section';


        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'profile-image-container';

        // Create and setup profile image
        if (userData.attrs && userData.attrs['pro-picUploadId']) {
            const img = document.createElement('img');
            img.src = `https://learn.reboot01.com/api/storage?token=${localStorage.getItem("jwt_token")}&fileId=${userData.attrs['pro-picUploadId']}`;
            img.alt = "Profile Image";
            img.className = 'profile-image';
            imageContainer.appendChild(img);
        } else {
            // Default avatar if no image
            const defaultAvatar = document.createElement('div');
            defaultAvatar.className = 'default-avatar';
            defaultAvatar.textContent = userData.login ? userData.login[0].toUpperCase() : '?';
            imageContainer.appendChild(defaultAvatar);
        }

        // Create user info container
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';

        // Add username
        const userName = document.createElement('h2');
        userName.className = 'user-name';
        // userName.textContent = userData.login;

        // Add full name if available
        if (userData.firstName || userData.lastName) {
            const fullName = document.createElement('div');
            fullName.className = 'user-full-name';
            fullName.textContent = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            userInfo.appendChild(fullName);
        }

        // Always add user level element
        const userLevel = document.createElement('div');
        userLevel.className = 'user-level';
        userLevel.id = 'user-level-display';
        userLevel.textContent = userData.level !== undefined ? `Level: ${userData.level}` : 'Level: Loading...';
        userInfo.appendChild(userLevel);

        // If level is not available yet, try to fetch it directly
        if (userData.level === undefined) {
            // Attempt to fetch level data directly
            const userId = localStorage.getItem('current_user_id');
            if (userId) {
                const token = localStorage.getItem('jwt_token');
                if (token) {
                    console.log('Fetching level data directly for dashboard display');
                    fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            query: `query GetUserLevel($userId: Int!) {
                                event_user(where: { userId: { _eq: $userId }, eventId: { _in: [20, 72, 250] } }) {
                                    level
                                }
                            }`,
                            variables: { userId: parseInt(userId) }
                        })
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.data && result.data.event_user && result.data.event_user.length > 0) {
                            const level = result.data.event_user[0].level;
                            console.log('Updated level display with:', level);
                            userLevel.textContent = `Level: ${level}`;
                        } else {
                            userLevel.textContent = 'Level:';
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching level:', error);
                        userLevel.textContent = 'Level: 0';
                    });
                }
            }
        }

        // Assemble user info
        userInfo.appendChild(userName);

        // Assemble profile section
        profileSection.appendChild(imageContainer);
        profileSection.appendChild(userInfo);

        // Create widgets container
        const widgetsContainer = document.createElement('div');
        widgetsContainer.className = 'widgets-container';

        // Define widgets
        const widgets = [
            { title: 'XP Amount', route: '/xp', id: 'xp-widget' },
            { title: 'Grades', route: '/grades', id: 'grades-widget' },
            { title: 'Audits', route: '/audits', id: 'audits-widget' },
            { title: 'Skills', route: '/skills', id: 'skills-widget' }
        ];

        // Create widgets
        widgets.forEach(widget => {
            const widgetElement = createWidget(widget);
            widgetsContainer.appendChild(widgetElement);
        });




        // document.getElementById('audits-widget-content').textContent = userData.auditRatio ? (userData.auditRatio).toFixed(1) : 'N/A';

        // Assemble dashboard
        dashboard.appendChild(profileSection);
        dashboard.appendChild(widgetsContainer);

        return dashboard;
    } catch (error) {
        console.error('Error creating dashboard:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Error loading dashboard';
        return errorDiv;
    }
};



const createWidget = ({ title, route, id }) => {
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.id = id;

    const widgetTitle = document.createElement('h2');
    widgetTitle.textContent = title;

    const widgetContent = document.createElement('div');
    widgetContent.className = 'widget-content';
    widgetContent.id = `${id}-content`;

    // Create a mini-graph container
    const miniGraphContainer = document.createElement('div');
    miniGraphContainer.className = 'mini-graph-container';
    miniGraphContainer.innerHTML = '<div class="loading-spinner"></div>';

    // Load the mini-graph based on the widget type
    loadMiniGraph(id, miniGraphContainer);

    widgetContent.appendChild(miniGraphContainer);
    widget.appendChild(widgetTitle);
    widget.appendChild(widgetContent);

    widget.addEventListener('click', () => {
        window.location.href = route;
    });

    return widget;
};

// Function to load mini-graphs for each widget
const loadMiniGraph = (widgetId, container) => {
    // Different loading logic based on widget type
    switch (widgetId) {
        case 'xp-widget':
            // Create a simplified XP graph
            fetchSimplifiedData('xp')
                .then(data => createMiniGraph(container, data, '#3498db'))
                .catch(error => {
                    console.error(`Error loading XP graph: ${error}`);
                    container.textContent = 'Error loading data';
                });
            break;
        case 'grades-widget':
            // Create a simplified grades graph
            fetchSimplifiedData('grades')
                .then(data => createMiniGraph(container, data, '#2ecc71'))
                .catch(error => {
                    console.error(`Error loading grades graph: ${error}`);
                    container.textContent = 'Error loading data';
                });
            break;
        case 'audits-widget':
            // Create a simplified audits graph
            fetchSimplifiedData('audits')
                .then(data => createMiniGraph(container, data, '#e74c3c'))
                .catch(error => {
                    console.error(`Error loading audits graph: ${error}`);
                    container.textContent = 'Error loading data';
                });
            break;
        case 'skills-widget':
            // Create a simplified skills visualization
            fetchSimplifiedData('skills')
                .then(data => createMiniSkillsGraph(container, data))
                .catch(error => {
                    console.error(`Error loading skills graph: ${error}`);
                    container.textContent = 'Error loading data';
                });
            break;
        default:
            container.textContent = 'No data available';
    }
};

// Function to fetch simplified data for mini-graphs
const fetchSimplifiedData = async () => {
    // This would normally fetch real data from the API
    // For now, we'll return mock data for demonstration
    return Array.from({ length: 5 }, (_, i) => ({
        value: Math.random() * 100,
        label: `Data ${i+1}`
    }));
};

// Function to create a mini line graph
const createMiniGraph = (container, data, color) => {
    container.innerHTML = '';

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 100 50');
    svg.setAttribute('preserveAspectRatio', 'none');

    // Calculate points for the path
    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 50 - (item.value / 100 * 50);
        return `${x},${y}`;
    }).join(' ');

    // Create path element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', points);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');

    svg.appendChild(path);
    container.appendChild(svg);
};

// Function to create a mini skills visualization
const createMiniSkillsGraph = (container) => {
    container.innerHTML = '';

    // Create a simple bar chart for skills
    const skillsContainer = document.createElement('div');
    skillsContainer.className = 'mini-skills-container';

    // Create 3 skill bars
    for (let i = 0; i < 3; i++) {
        const skillBar = document.createElement('div');
        skillBar.className = 'mini-skill-bar';

        const skillLevel = document.createElement('div');
        skillLevel.className = 'mini-skill-level';
        skillLevel.style.width = `${Math.random() * 100}%`;

        skillBar.appendChild(skillLevel);
        skillsContainer.appendChild(skillBar);
    }

    container.appendChild(skillsContainer);
};

// Add cleanup function
export const cleanupDashboard = () => {
    // Clean up any resources if needed
};