// Documents JavaScript
// This file contains functionality specific to the documents tab

// Function to filter documents
function filterDocuments(status) {
    const documentCards = document.querySelectorAll('.document-card');
    
    documentCards.forEach(card => {
        const statusElement = card.querySelector('.document-status');
        const documentStatus = statusElement.textContent.toLowerCase();
        
        if (status === 'all' || documentStatus === status) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Function to sort documents
function sortDocuments(sortBy) {
    const documentsGrid = document.getElementById('documents-grid');
    const documentCards = Array.from(documentsGrid.querySelectorAll('.document-card'));
    
    documentCards.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                const dateA = new Date(a.querySelector('.document-meta').textContent.split(' • ')[1]);
                const dateB = new Date(b.querySelector('.document-meta').textContent.split(' • ')[1]);
                return dateB - dateA;
            case 'oldest':
                const dateC = new Date(a.querySelector('.document-meta').textContent.split(' • ')[1]);
                const dateD = new Date(b.querySelector('.document-meta').textContent.split(' • ')[1]);
                return dateC - dateD;
            case 'name':
                const nameA = a.querySelector('.document-title').textContent;
                const nameB = b.querySelector('.document-title').textContent;
                return nameA.localeCompare(nameB);
            case 'size':
                const sizeA = a.querySelector('.document-meta').textContent.split(' • ')[0];
                const sizeB = b.querySelector('.document-meta').textContent.split(' • ')[0];
                return parseFileSize(sizeB) - parseFileSize(sizeA);
            default:
                return 0;
        }
    });
    
    // Re-append sorted cards
    documentCards.forEach(card => {
        documentsGrid.appendChild(card);
    });
}

// Helper function to parse file size string to bytes
function parseFileSize(sizeStr) {
    const units = {
        'Bytes': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024
    };
    
    const parts = sizeStr.split(' ');
    const size = parseFloat(parts[0]);
    const unit = parts[1];
    
    return size * (units[unit] || 1);
}

// Initialize document filters and sorting
document.addEventListener('DOMContentLoaded', function() {
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterDocuments(this.value);
        });
    }
    
    // Sort filter
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            sortDocuments(this.value);
        });
    }
});