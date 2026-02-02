// Authentication JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Handle browser back/forward buttons
    setupHistoryManagement();
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Tab switching
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    
    if (loginTab && registerTab) {
        loginTab.addEventListener('click', function() {
            switchTab('login');
        });
        
        registerTab.addEventListener('click', function() {
            switchTab('register');
        });
    }
    
    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.input-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', togglePasswordVisibility);
    });
    
    // Google login button
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // User menu toggle
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    const userMenu = document.getElementById('user-menu');
    
    if (userMenuToggle && userMenu) {
        userMenuToggle.addEventListener('click', function() {
            userMenu.classList.toggle('show');
        });
        
        // Close user menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuToggle.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.remove('show');
            }
        });
    }
});

// Check for token in URL (from OAuth callback)
function checkOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (token) {
        // Save token FIRST
        localStorage.setItem('token', token);
        
        // Clean URL without reloading
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Show success message
        showToast('Login successful!', 'success');
        
        // Return true to indicate token was found and saved
        return true;
    } else if (error) {
        showToast('Authentication failed. Please try again.', 'error');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
    
    return false;
}

// Check authentication status
async function checkAuthStatus() {
    // First check if we're returning from OAuth callback
    const currentPath = window.location.pathname;
    if (currentPath === '/dashboard.html' || currentPath.includes('dashboard')) {
        const hasTokenFromOAuth = checkOAuthCallback();
        if (hasTokenFromOAuth) {
            // Token was just saved from OAuth, skip verification for now
            // Just update UI and stay on dashboard
            return;
        }
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Not logged in, redirect to login page if not already there
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    try {
        // Verify token with server
        const response = await apiRequest('/api/auth/verify', 'GET', null, token);
        
        if (response.success) {
            // Token is valid, update user info
            updateUserInfo(response.user);
            
            // If on login page, redirect to dashboard
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Token is invalid, remove it and redirect to login
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Error verifying token:', error);
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Clear previous errors
    clearFormErrors('login');
    
    // Basic validation
    if (!email) {
        showFormError('login-email', 'Email is required');
        return;
    }
    
    if (!isValidEmail(email)) {
        showFormError('login-email', 'Please enter a valid email');
        return;
    }
    
    if (!password) {
        showFormError('login-password', 'Password is required');
        return;
    }
    
    // Show loading state
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnSpinner = loginBtn.querySelector('.btn-spinner');
    
    loginBtn.classList.add('loading');
    btnText.style.opacity = '0';
    btnSpinner.style.display = 'block';
    
    try {
        // Send login request
        const response = await apiRequest('/api/auth/login', 'POST', {
            email,
            password
        });
        
        if (response.success) {
            // Save token
            localStorage.setItem('token', response.token);
            
            if (rememberMe) {
                // In a real implementation, you might use a longer-lived token or refresh token
                localStorage.setItem('rememberMe', 'true');
            }
            
            // Show success message
            showToast('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showToast(response.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        // Hide loading state
        loginBtn.classList.remove('loading');
        btnText.style.opacity = '1';
        btnSpinner.style.display = 'none';
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const agreeTerms = document.getElementById('agree-terms').checked;
    
    // Clear previous errors
    clearFormErrors('register');
    
    // Basic validation
    if (!name) {
        showFormError('register-name', 'Name is required');
        return;
    }
    
    if (!email) {
        showFormError('register-email', 'Email is required');
        return;
    }
    
    if (!isValidEmail(email)) {
        showFormError('register-email', 'Please enter a valid email');
        return;
    }
    
    if (!password) {
        showFormError('register-password', 'Password is required');
        return;
    }
    
    if (password.length < 6) {
        showFormError('register-password', 'Password must be at least 6 characters');
        return;
    }
    
    if (!confirmPassword) {
        showFormError('register-confirm-password', 'Please confirm your password');
        return;
    }
    
    if (password !== confirmPassword) {
        showFormError('register-confirm-password', 'Passwords do not match');
        return;
    }
    
    if (!agreeTerms) {
        showToast('Please agree to the terms and conditions', 'error');
        return;
    }
    
    // Show loading state
    const registerBtn = document.getElementById('register-btn');
    const btnText = registerBtn.querySelector('.btn-text');
    const btnSpinner = registerBtn.querySelector('.btn-spinner');
    
    registerBtn.classList.add('loading');
    btnText.style.opacity = '0';
    btnSpinner.style.display = 'block';
    
    try {
        // Send registration request
        const response = await apiRequest('/api/auth/register', 'POST', {
            name,
            email,
            password
        });
        
        if (response.success) {
            // Show success message
            showToast('Registration successful! Redirecting to login...', 'success');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showToast(response.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        // Hide loading state
        registerBtn.classList.remove('loading');
        btnText.style.opacity = '1';
        btnSpinner.style.display = 'none';
    }
}

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    
    // Remove token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    
    // Show success message
    showToast('Logged out successfully', 'success');
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Switch between login and register tabs
function switchTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

// Toggle password visibility
function togglePasswordVisibility(e) {
    const inputId = this.id.replace('-toggle', '');
    const input = document.getElementById(inputId);
    const icon = this.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Update user info in the UI
function updateUserInfo(user) {
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }
}

// Show form error
function showFormError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (field && errorElement) {
        field.classList.add('error');
        errorElement.textContent = message;
    }
}

// Clear form errors
function clearFormErrors(form) {
    const formElement = document.getElementById(`${form}-form`);
    if (!formElement) return;
    
    const fields = formElement.querySelectorAll('input');
    fields.forEach(field => {
        field.classList.remove('error');
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = '';
        }
    });
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
}

// Handle Google login
function handleGoogleLogin() {
    // Use environment config to get the correct API URL
    const apiUrl = window.ENV ? window.ENV.getEndpoint('/api/auth/google') : '/api/auth/google';
    
    // Redirect to Google OAuth endpoint
    window.location.href = apiUrl;
}

// Check for token in URL (from OAuth callback)
function checkOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (token) {
        // Save token FIRST
        localStorage.setItem('token', token);
        
        // Clean URL without reloading
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Show success message
        showToast('Login successful!', 'success');
        
        // Return true to indicate token was found and saved
        return true;
    } else if (error) {
        showToast('Authentication failed. Please try again.', 'error');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return false;
    }
    
    return false;
}

// Check authentication status
async function checkAuthStatus() {
    // First check if we're returning from OAuth callback
    const currentPath = window.location.pathname;
    if (currentPath === '/dashboard.html' || currentPath.includes('dashboard')) {
        const hasTokenFromOAuth = checkOAuthCallback();
        if (hasTokenFromOAuth) {
            // Token was just saved from OAuth, skip verification for now
            // The page will verify on next load
            return;
        }
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Not logged in, redirect to login page if not already there
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    try {
        // Verify token with server
        const response = await apiRequest('/api/auth/verify', 'GET', null, token);
        
        if (response.success) {
            // Token is valid, update user info
            updateUserInfo(response.user);
            
            // If on login page, redirect to dashboard
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Token is invalid, remove it and redirect to login
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Error verifying token:', error);
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
}
// Setup browser history management
function setupHistoryManagement() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login.html');
    const isDashboard = currentPath.includes('dashboard.html') || currentPath === '/dashboard';
    
    // Add a state marker when user logs in successfully
    if (isDashboard && localStorage.getItem('token')) {
        // Mark this as an authenticated page load
        if (!window.history.state || !window.history.state.authenticated) {
            window.history.replaceState({ authenticated: true, page: 'dashboard' }, document.title);
        }
    } else if (isLoginPage) {
        // Mark login page
        if (!window.history.state || window.history.state.authenticated) {
            window.history.replaceState({ authenticated: false, page: 'login' }, document.title);
        }
    }
    
    // Listen for back/forward button clicks
    window.addEventListener('popstate', function(event) {
        const token = localStorage.getItem('token');
        const currentPath = window.location.pathname;
        const previousState = event.state;
        
        // Only logout if going back FROM authenticated page TO login page
        if (token && currentPath.includes('login.html') && previousState && previousState.page === 'dashboard') {
            console.log('Browser back detected from dashboard to login - logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('rememberMe');
            return;
        }
        
        // Prevent auto-login when using forward button
        // If we're on login page and there's no token, stay here
        if (currentPath.includes('login.html') && !token) {
            // Ensure we don't redirect to dashboard
            return;
        }
    });
}
