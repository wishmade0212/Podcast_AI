// Helper functions

// Capitalize first letter of a string
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Truncate text to a specified length
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

// Generate a random ID
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Check if a value is empty
function isEmpty(value) {
    return (
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && Object.keys(value).length === 0)
    );
}

// Deep clone an object
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (obj instanceof Date) return new Date(obj.getTime());
    
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// Convert HTML entities to characters
function htmlEntities(str) {
    return String(str)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}

// Convert characters to HTML entities
function escapeHtml(str) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return str.replace(/[&<>"']/g, m => map[m]);
}

// Check if an element is in the viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Scroll to an element
function scrollToElement(element, offset = 0) {
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// Get query parameters from URL
function getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params;
}

// Set query parameter in URL
function setQueryParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
}

// Remove query parameter from URL
function removeQueryParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url);
}

// Copy text to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        return new Promise((resolve, reject) => {
            document.execCommand('copy') ? resolve() : reject();
            textArea.remove();
        });
    }
}

// Download data as a file
function downloadData(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Download file from URL
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.target = '_blank'; // Open in new tab if download fails
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Read file as text
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        
        reader.readAsText(file);
    });
}

// Read file as data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        
        reader.readAsDataURL(file);
    });
}

// Get file extension
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Get file name without extension
function getFileNameWithoutExtension(filename) {
    return filename.replace(/\.[^/.]+$/, '');
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
}

// Validate URL format
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// Get color based on status
function getStatusColor(status) {
    switch (status) {
        case 'pending':
            return '#FFC107';
        case 'processing':
            return '#17A2B8';
        case 'completed':
            return '#28A745';
        case 'failed':
            return '#DC3545';
        case 'generating':
            return '#17A2B8';
        default:
            return '#6C757D';
    }
}

// Get status text
function getStatusText(status) {
    switch (status) {
        case 'pending':
            return 'Pending';
        case 'processing':
            return 'Processing';
        case 'completed':
            return 'Completed';
        case 'failed':
            return 'Failed';
        case 'generating':
            return 'Generating';
        default:
            return 'Unknown';
    }
}

// Format percentage
function formatPercentage(value, decimals = 0) {
    return `${(value * 100).toFixed(decimals)}%`;
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Calculate compression ratio
function calculateCompressionRatio(originalWords, summaryWords) {
    if (originalWords === 0) return 0;
    return (summaryWords / originalWords).toFixed(2);
}

// Export functions
window.capitalize = capitalize;
window.truncateText = truncateText;
window.generateId = generateId;
window.isEmpty = isEmpty;
window.deepClone = deepClone;
window.htmlEntities = htmlEntities;
window.escapeHtml = escapeHtml;
window.isInViewport = isInViewport;
window.scrollToElement = scrollToElement;
window.getQueryParams = getQueryParams;
window.setQueryParam = setQueryParam;
window.removeQueryParam = removeQueryParam;
window.copyToClipboard = copyToClipboard;
window.downloadData = downloadData;
window.downloadFile = downloadFile;
window.readFileAsText = readFileAsText;
window.readFileAsDataURL = readFileAsDataURL;
window.getFileExtension = getFileExtension;
window.getFileNameWithoutExtension = getFileNameWithoutExtension;
window.isValidEmail = isValidEmail;
window.isValidUrl = isValidUrl;
window.getStatusColor = getStatusColor;
window.getStatusText = getStatusText;
window.formatPercentage = formatPercentage;
window.formatNumber = formatNumber;
window.calculateCompressionRatio = calculateCompressionRatio;