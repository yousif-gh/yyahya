import { getToken } from '../api/jwt.js';

export const getAuthenticatedUser = async (query) => {
    const token = getToken();
    if (!token) {
        console.error('No authentication token found');
        // Clear any existing auth data to force re-login
        localStorage.removeItem('current_user_id');
        localStorage.removeItem('jwt_token');
        sessionStorage.setItem('logged_out', 'true');
        window.location.replace('/login');
        throw new Error('No authentication token found');
    }

    try {
        // console.log('Starting user data fetch with token:', token ? 'Token exists' : 'No token');

        // Check if we're fetching after login
        const fetchAfterLogin = localStorage.getItem('fetch_level_data') === 'true';

        // Try to get userId from localStorage first
        let userId = localStorage.getItem('current_user_id');

        // If userId is not in localStorage, fetch it from the API
        if (!userId) {
            console.log('User ID not found in localStorage, fetching from API');
            try {
                // First, get the user ID
                const userIdResponse = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `query { user { id } }`
                    }),
                    mode: 'cors'
                });

                if (!userIdResponse.ok) {
                    throw new Error(`Failed to fetch user ID: ${userIdResponse.status} ${userIdResponse.statusText}`);
                }

                const userIdResult = await userIdResponse.json();
                console.log('User ID result:', userIdResult);

                if (!userIdResult.data || !userIdResult.data.user || !userIdResult.data.user.length) {
                    throw new Error('User ID not found in response');
                }

                userId = userIdResult.data.user[0].id;
                console.log('Retrieved user ID from API:', userId);

                // Store userId in localStorage for future use
                localStorage.setItem('current_user_id', userId);
            } catch (idError) {
                console.error('Error fetching user ID:', idError);
                throw new Error('Failed to get user ID. Please try logging in again.');
            }
        } else {
            // console.log('Using user ID from localStorage:', userId);
        }

        // Make sure userId is an integer
        userId = parseInt(userId);
        if (isNaN(userId) || userId <= 0) {
            console.error('Invalid user ID:', userId);
            localStorage.removeItem('current_user_id');
            sessionStorage.setItem('logged_out', 'true');
            window.location.replace('/login');
            throw new Error('Invalid user ID');
        }

        console.log('Fetching full user data with userId:', userId);

        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                variables: { userId: parseInt(userId) }
            }),
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        // console.log('Full user data result:', result);

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error(result.errors[0].message);
        }

        // Get user data - it comes as an array
        let userData;
        if (Array.isArray(result.data.user)) {
            userData = result.data.user[0];
            if (!userData) {
                throw new Error('User data not found in array');
            }
        } else {
            // Handle case where user might be a single object
            userData = result.data.user;
            if (!userData) {
                throw new Error('User data not found');
            }
        }

        // Get user level data
        if (result.data.event_user && result.data.event_user.length > 0) {
            userData.level = result.data.event_user[0].level;
            // console.log('Found user level:', userData.level);
        } else {
            // Always fetch level data directly after login or if not found in the initial query
            try {
                // Get userId from localStorage if not available in userData
                const userId = userData.id || localStorage.getItem('current_user_id');
                if (!userId) {
                    throw new Error('User ID not available for level query');
                }

                console.log('Fetching level data directly with userId:', userId);
                const levelResponse = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `query GetUserLevel($userId: Int!) {
                            event_user(where: { userId: { _eq: $userId }, eventId: { _in: [20, 72, 250] } }) {
                                level
                                userId
                                eventId
                            }
                        }`,
                        variables: { userId: parseInt(userId) }
                    }),
                    mode: 'cors'
                });

                const levelResult = await levelResponse.json();
                console.log('Level query result:', levelResult);

                if (levelResult.data && levelResult.data.event_user && levelResult.data.event_user.length > 0) {
                    userData.level = levelResult.data.event_user[0].level;
                    console.log('Found user level from direct query:', userData.level);
                } else {
                    userData.level = 0; // Default level if not found
                    console.log('No level data found even after direct query, defaulting to 0');
                }
            } catch (levelError) {
                console.error('Error fetching level data:', levelError);
                userData.level = 0; // Default level if error
                console.log('Error fetching level data, defaulting to 0');
            }
        }

        // If we just logged in, make sure to clear the flag after successfully getting the level
        if (fetchAfterLogin) {
            localStorage.removeItem('fetch_level_data');
            console.log('Cleared fetch_level_data flag after successful level fetch');
        }

        // console.log('Processed user data with level:', userData);

        // Parse attributes
        if (userData.attrs) {
            try {
                // Handle both string and object cases
                let attrs = userData.attrs;
                if (typeof attrs === 'string') {
                    // Try to parse if it's a string
                    try {
                        attrs = JSON.parse(attrs);
                    } catch (parseError) {
                        // If parsing fails, try to clean the string first
                        const cleanedString = attrs
                            .replace(/\\"/g, '"')  // Handle escaped quotes
                            .replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes if present
                        try {
                            attrs = JSON.parse(cleanedString);
                        } catch (e) {
                            // If all parsing attempts fail, create a basic object
                            console.warn('Could not parse attrs string:', attrs);
                            attrs = {};
                        }
                    }
                }

                // Ensure attrs is an object at this point
                if (typeof attrs === 'object' && attrs !== null) {
                    userData.campus = attrs.campus || 'N/A';
                    // Store the cleaned attrs back in userData
                    userData.attrs = attrs;
                } else {
                    userData.campus = 'N/A';
                    userData.attrs = {};
                }
            } catch (e) {
                console.warn('Error handling user attributes:', e);
                userData.campus = 'N/A';
                userData.attrs = {};
            }
        } else {
            userData.campus = 'N/A';
            userData.attrs = {};
        }

        return userData;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
};