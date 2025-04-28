import { clearToken } from '../api/jwt.js';

export const handleLogout = () => {
    // Clear JWT token
    clearToken();

    // Clear any other stored data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user_id');

    // Clear any session storage items
    sessionStorage.clear();

    // Add a flag to indicate user has been logged out
    sessionStorage.setItem('logged_out', 'true');

    // Clear browser history
    window.history.pushState(null, '', '/login');
    window.history.go(-(window.history.length - 1));

    // Redirect to login page without adding to history
    window.location.replace('/login');
};