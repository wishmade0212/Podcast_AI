// Podcasts JavaScript
// This file contains functionality specific to the podcasts tab

// Function to filter podcasts
function filterPodcasts(status) {
    const podcastCards = document.querySelectorAll('.podcast-card');
    
    podcastCards.forEach(card => {
        const statusElement = card.querySelector('.podcast-status');
        const podcastStatus = statusElement.textContent.toLowerCase();
        
        if (status === 'all' || podcastStatus === status) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Function to play all podcasts in sequence
function playAllPodcasts() {
    const podcastCards = document.querySelectorAll('.podcast-card');
    const completedPodcasts = Array.from(podcastCards).filter(card => {
        const statusElement = card.querySelector('.podcast-status');
        return statusElement && statusElement.textContent.toLowerCase() === 'completed';
    });
    
    if (completedPodcasts.length === 0) {
        showToast('No completed podcasts to play', 'warning');
        return;
    }
    
    // In a real implementation, this would create a playlist
    showToast('Playlist functionality would be implemented here', 'info');
}

// Function to download all podcasts
function downloadAllPodcasts() {
    const podcastCards = document.querySelectorAll('.podcast-card');
    const completedPodcasts = Array.from(podcastCards).filter(card => {
        const statusElement = card.querySelector('.podcast-status');
        return statusElement && statusElement.textContent.toLowerCase() === 'completed';
    });
    
    if (completedPodcasts.length === 0) {
        showToast('No completed podcasts to download', 'warning');
        return;
    }
    
    // In a real implementation, this would create a zip file with all podcasts
    showToast('Bulk download functionality would be implemented here', 'info');
}

// Function to create a playlist from selected podcasts
function createPlaylist() {
    const selectedCards = document.querySelectorAll('.podcast-card.selected');
    
    if (selectedCards.length === 0) {
        showToast('Please select at least one podcast', 'warning');
        return;
    }
    
    // In a real implementation, this would create a playlist
    showToast('Playlist creation would be implemented here', 'info');
}

// Initialize podcast filters and actions
document.addEventListener('DOMContentLoaded', function() {
    // Status filter
    const podcastStatusFilter = document.getElementById('podcast-status-filter');
    if (podcastStatusFilter) {
        podcastStatusFilter.addEventListener('change', function() {
            filterPodcasts(this.value);
        });
    }
    
    // Add action buttons to the header
    const contentHeader = document.querySelector('#podcasts-tab .content-header');
    if (contentHeader) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'header-actions';
        actionsDiv.innerHTML = `
            <button class="btn btn-outline btn-sm" id="play-all-podcasts">
                <i class="fas fa-play"></i> Play All
            </button>
            <button class="btn btn-outline btn-sm" id="download-all-podcasts">
                <i class="fas fa-download"></i> Download All
            </button>
            <button class="btn btn-outline btn-sm" id="create-playlist">
                <i class="fas fa-list"></i> Create Playlist
            </button>
        `;
        
        contentHeader.appendChild(actionsDiv);
        
        // Add event listeners
        document.getElementById('play-all-podcasts').addEventListener('click', playAllPodcasts);
        document.getElementById('download-all-podcasts').addEventListener('click', downloadAllPodcasts);
        document.getElementById('create-playlist').addEventListener('click', createPlaylist);
    }
    
    // Add selection functionality to podcast cards
    document.addEventListener('click', function(e) {
        if (e.target.closest('.podcast-card') && !e.target.closest('.podcast-actions')) {
            const card = e.target.closest('.podcast-card');
            card.classList.toggle('selected');
        }
    });
});