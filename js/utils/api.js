// API utility functions
// Automatically use the correct base URL based on environment
const API_BASE_URL = window.ENV ? window.ENV.getApiUrl() : window.location.origin;

// Make API request
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
    const baseUrl = window.ENV ? window.ENV.getApiUrl() : API_BASE_URL;
    const url = `${baseUrl}${endpoint}`;
    
    // If no token provided, try to get it from localStorage
    if (!token) {
        token = getAuthToken();
    }
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (token) {
        options.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.message || 'Something went wrong');
        }
        
        return responseData;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Get authentication token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Set authentication token
function setAuthToken(token) {
    localStorage.setItem('token', token);
}

// Remove authentication token
function removeAuthToken() {
    localStorage.removeItem('token');
}

// Upload file
async function uploadFile(file, token, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    // If no token provided, try to get it from localStorage
    if (!token) {
        token = getAuthToken();
    }
    
    const baseUrl = window.ENV ? window.ENV.getApiUrl() : API_BASE_URL;
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
        xhr.open('POST', `${baseUrl}/api/documents/upload`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable && onProgress) {
                const percentComplete = (e.loaded / e.total) * 100;
                onProgress(percentComplete);
            }
        };
        
        xhr.onload = function() {
            if (xhr.status === 200 || xhr.status === 201) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (error) {
                    reject(new Error('Invalid response from server'));
                }
            } else {
                try {
                    const response = JSON.parse(xhr.responseText);
                    reject(new Error(response.message || 'Upload failed'));
                } catch (error) {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Network error'));
        };
        
        xhr.send(formData);
    });
}

// Download file
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    let result = '';
    
    if (hours > 0) {
        result += `${hours}:`;
    }
    
    result += `${minutes.toString().padStart(2, '0')}:`;
    result += remainingSeconds.toString().padStart(2, '0');
    
    return result;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString(undefined, options);
}

// Calculate reading time
function calculateReadingTime(wordCount) {
    const wordsPerMinute = 200; // Average reading speed
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    
    return function() {
        const args = arguments;
        const context = this;
        
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Get file icon based on file type
function getFileIcon(fileType) {
    switch (fileType) {
        case 'pdf':
            return 'fa-file-pdf';
        case 'docx':
            return 'fa-file-word';
        case 'txt':
            return 'fa-file-alt';
        default:
            return 'fa-file';
    }
}

// Get status color class
function getStatusClass(status) {
    switch (status) {
        case 'pending':
            return 'status-pending';
        case 'processing':
            return 'status-processing';
        case 'completed':
            return 'status-completed';
        case 'failed':
            return 'status-failed';
        case 'generating':
            return 'status-generating';
        default:
            return '';
    }
}

// Show toast notification
function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        console.error('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
        default:
            icon = 'fa-info-circle';
    }
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Close toast when close button is clicked
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function() {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto close after specified duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Export functions
window.apiRequest = apiRequest;
window.getAuthToken = getAuthToken;
window.setAuthToken = setAuthToken;
window.removeAuthToken = removeAuthToken;
window.uploadFile = uploadFile;
window.downloadFile = downloadFile;
window.formatFileSize = formatFileSize;
window.formatDuration = formatDuration;
window.formatDate = formatDate;
window.calculateReadingTime = calculateReadingTime;
window.debounce = debounce;
window.throttle = throttle;
window.getFileIcon = getFileIcon;
window.getStatusClass = getStatusClass;
window.showToast = showToast;