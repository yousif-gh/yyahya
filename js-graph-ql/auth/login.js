import { storeToken } from '../api/jwt.js';

// Function to build the login form
export const buildLoginForm = () => {
    // Create the login container
    const loginContainer = document.createElement('div');
    loginContainer.classList.add('login-container');

    // Add title to the login form
    const loginTitle = document.createElement('h2');
    loginTitle.textContent = 'Student Dashboard Login';
    loginTitle.classList.add('login-title');

    // Create the form container
    const loginForm = document.createElement('form');
    loginForm.classList.add('login-form');

    // Email/Username input field
    const identifierField = document.createElement('input');
    identifierField.setAttribute('type', 'text');
    identifierField.setAttribute('placeholder', 'Username or Email');
    identifierField.setAttribute('required', '');
    identifierField.setAttribute('autocomplete', 'username');
    identifierField.id = 'identifier';

    // Password input container
    const passwordContainer = document.createElement('div');
    passwordContainer.className = 'password-container';

    // Password input field
    const passwordField = document.createElement('input');
    passwordField.setAttribute('type', 'password');
    passwordField.setAttribute('placeholder', 'Password');
    passwordField.setAttribute('required', '');
    passwordField.setAttribute('autocomplete', 'current-password');
    passwordField.id = 'password';

    // Show/hide password button
    const togglePasswordButton = document.createElement('button');
    togglePasswordButton.type = 'button'; // Prevent form submission
    togglePasswordButton.className = 'toggle-password';
    togglePasswordButton.innerHTML = '<i class="bi bi-eye"></i>'; // Eye icon
    togglePasswordButton.title = 'Show password';

    // Add event listener to toggle password visibility
    togglePasswordButton.addEventListener('click', () => {
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            togglePasswordButton.innerHTML = '<i class="bi bi-eye-slash"></i>';
        } else {
            passwordField.type = 'password';
            togglePasswordButton.innerHTML = '<i class="bi bi-eye"></i>';
        }
    });

    // Assemble password container
    passwordContainer.appendChild(passwordField);
    passwordContainer.appendChild(togglePasswordButton);

    // Error message display
    const errorMessage = document.createElement('div');
    errorMessage.classList.add('error-message');
    errorMessage.hidden = true;

    // Submit button
    const loginButton = document.createElement('button');
    loginButton.setAttribute('type', 'submit');
    loginButton.textContent = 'Sign In';

    // Assemble the form
    loginForm.append(identifierField, passwordContainer, errorMessage, loginButton);

    // Assemble the login container
    loginContainer.append(loginTitle, loginForm);

    // Attach submission handler
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.hidden = true;

        try {
            console.log('Form submitted'); // Debug log

            const identifier = identifierField.value;
            const password = passwordField.value;

            console.log('Credentials prepared:', { identifier: identifier, hasPassword: !!password }); // Debug log

            const credentials = `${identifier}:${password}`;
            const authHeader = `Basic ${btoa(credentials)}`;
            const apiUrl = 'https://learn.reboot01.com/api/auth/signin';

            console.log('Making fetch request to:', apiUrl); // Debug log

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            });

            console.log('Response received:', {
                status: response.status,
                statusText: response.statusText,
                headers: [...response.headers.entries()]
            }); // Debug log

            if (!response.ok) {
                throw new Error(`username or password incorrect.`);
            }

            const responseText = await response.text(); // Get response as text first
            console.log('Raw response:', responseText); // Debug log

            let responseData;
            try {
                responseData = JSON.parse(responseText);
                console.log('Parsed response data:', responseData); // Debug log
            } catch (e) {
                console.log('Response is not JSON, using as raw token');
                responseData = responseText;
            }

            if (!responseData) {
                throw new Error('No response data received');
            }

            // Store the token
            let token;
            if (typeof responseData === 'string') {
                token = responseData;
                localStorage.setItem('jwt_token', token);
                console.log('Stored raw token');
            } else if (responseData.token) {
                token = responseData.token;
                localStorage.setItem('jwt_token', token);
                console.log('Stored token from object');
            } else {
                throw new Error('Invalid token format received');
            }

            // Immediately fetch the user ID after login
            try {
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
                    console.warn('Failed to fetch user ID after login');
                } else {
                    const userIdResult = await userIdResponse.json();
                    if (userIdResult.data && userIdResult.data.user && userIdResult.data.user.length) {
                        const userId = userIdResult.data.user[0].id;
                        localStorage.setItem('current_user_id', userId);
                        console.log('Successfully stored user ID after login:', userId);
                    }
                }
            } catch (idError) {
                console.warn('Error fetching user ID after login:', idError);
                // Continue with login process even if this fails
            }

            console.log('Login successful, redirecting...'); // Debug log

            // Store a flag to indicate we need to fetch level data on initial load
            localStorage.setItem('fetch_level_data', 'true');

            // Clear the logged_out flag if it exists
            sessionStorage.removeItem('logged_out');

            window.location.href = '/';

        } catch (err) {
            console.error('Login error:', err);
            errorMessage.textContent = `Login failed: ${err.message}`;
            errorMessage.hidden = false;
        }
    });

    return loginContainer;
};

// Export the function to be used in main.js
export const createLoginForm = buildLoginForm;