export const JWT_KEY = 'auth_token';

export const storeToken = (data) => {
    console.log('Storing token, received data:', data);
    
    if (!data) {
        console.error('No data received for token storage');
        return;
    }
    
    const token = typeof data === 'string' ? data : data.token;
    
    if (!token) {
        console.error('No valid token found in:', data);
        return;
    }
    
    localStorage.setItem('jwt_token', token);
    console.log('Token stored successfully');
};

export const getToken = () => {
    const token = localStorage.getItem('jwt_token');
    return token;
};

export const clearToken = () => {
    console.log('Clearing token'); 
    localStorage.removeItem('jwt_token');
};

export const isAuthenticated = () => {
    const hasToken = !!getToken();
    return hasToken;
};