// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initDashboard();
    
    // Tab navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Sidebar toggle
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Upload button
    const uploadBtn = document.getElementById('upload-btn');
    const emptyUploadBtn = document.getElementById('empty-upload-btn');
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', openUploadModal);
    }
    
    if (emptyUploadBtn) {
        emptyUploadBtn.addEventListener('click', openUploadModal);
    }
    
    // Create podcast button
    const createPodcastBtn = document.getElementById('create-podcast-btn');
    const emptyCreateBtn = document.getElementById('empty-create-btn');
    
    if (createPodcastBtn) {
        createPodcastBtn.addEventListener('click', openPodcastModal);
    }
    
    if (emptyCreateBtn) {
        emptyCreateBtn.addEventListener('click', openPodcastModal);
    }
    
    // Bulk generate button
    const bulkGenerateBtn = document.getElementById('bulk-generate-btn');
    const emptyGenerateBtn = document.getElementById('empty-generate-btn');
    
    if (bulkGenerateBtn) {
        bulkGenerateBtn.addEventListener('click', openBulkGenerateModal);
    }
    
    if (emptyGenerateBtn) {
        emptyGenerateBtn.addEventListener('click', openBulkGenerateModal);
    }
    
    // Initialize modals
    initModals();
    
    // User menu toggle
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    const userMenu = document.getElementById('user-menu');
    
    console.log('🔍 User menu elements:', {
        toggle: userMenuToggle,
        menu: userMenu
    });
    
    if (userMenuToggle && userMenu) {
        userMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            console.log('👆 User menu toggle clicked');
            userMenu.classList.toggle('show');
            console.log('📋 Menu classes:', userMenu.className);
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuToggle.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.remove('show');
            }
        });
    }
    
    // Initialize profile and notifications
    console.log('🔧 Initializing profile and notifications...');
    initProfileModal();
    initNotificationSystem();
    console.log('✅ Profile and notifications initialized');
    
    // Initialize voice cloning
    console.log('🔧 Initializing voice cloning...');
    initVoiceCloning();
    console.log('✅ Voice cloning initialized');
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Load initial data
    loadDocuments();
    loadSummaries();
    loadPodcasts();
    loadCustomVoices();
    
    // Global search
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('input', handleGlobalSearch);
    }
    
    // Apply saved theme
    applySavedTheme();
});

// Initialize dashboard
function initDashboard() {
    // Check if user is authenticated
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load user info
    loadUserInfo();
    
    // Set up periodic refresh for processing items
    setInterval(refreshProcessingItems, 5000);
}

// Switch between tabs
function switchTab(tabName) {
    // Update nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update tab panes
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
        if (pane.id === `${tabName}-tab`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });
    
    // Update page title and breadcrumb
    const pageTitle = document.getElementById('page-title');
    const breadcrumbActive = document.getElementById('breadcrumb-active');
    
    if (pageTitle) {
        pageTitle.textContent = capitalize(tabName);
    }
    
    if (breadcrumbActive) {
        breadcrumbActive.textContent = capitalize(tabName);
    }
    
    // Load data for the active tab
    switch (tabName) {
        case 'documents':
            loadDocuments();
            break;
        case 'summaries':
            loadSummaries();
            break;
        case 'podcasts':
            loadPodcasts();
            break;
        case 'voice-cloning':
            window.location.href = 'voice-cloning.html';
            break;
    }
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (newTheme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
}

// Load user info
async function loadUserInfo() {
    try {
        const response = await apiRequest('/api/auth/verify');
        
        if (response.success) {
            // Update sidebar user info
            const userNameElement = document.getElementById('user-name');
            const userEmailElement = document.getElementById('user-email');
            
            if (userNameElement) {
                userNameElement.textContent = response.user.name;
            }
            
            if (userEmailElement) {
                userEmailElement.textContent = response.user.email;
            }
            
            // Update settings page user info
            const userNameSetting = document.getElementById('user-name-setting');
            const userEmailSetting = document.getElementById('user-email-setting');
            
            if (userNameSetting) {
                userNameSetting.value = response.user.name || 'Not available';
            }
            
            if (userEmailSetting) {
                userEmailSetting.value = response.user.email || 'Not available';
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        
        // Set fallback values in settings if error occurs
        const userNameSetting = document.getElementById('user-name-setting');
        const userEmailSetting = document.getElementById('user-email-setting');
        
        if (userNameSetting) {
            userNameSetting.value = 'Unable to load';
        }
        
        if (userEmailSetting) {
            userEmailSetting.value = 'Unable to load';
        }
    }
}

// Handle logout
async function handleLogout(e) {
    e.preventDefault();
    
    try {
        // Call logout endpoint
        const response = await apiRequest('/api/auth/logout', 'GET');
        
        if (response.success) {
            // Clear auth token
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            
            // Show success message
            showToast('Logged out successfully', 'success');
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 500);
        } else {
            throw new Error(response.message || 'Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        
        // Even if API call fails, clear local storage and redirect
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        window.location.href = '/login.html';
    }
}

// Load documents
async function loadDocuments() {
    try {
        const response = await apiRequest('/api/documents');
        
        if (response.success) {
            allDocuments = response.documents; // Store for search
            renderDocuments(response.documents);
            updateDocumentCount(response.documents.length);
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        showToast('Failed to load documents', 'error');
    }
}

// Render documents
function renderDocuments(documents) {
    const documentsGrid = document.getElementById('documents-grid');
    
    if (!documentsGrid) return;
    
    if (documents.length === 0) {
        documentsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-upload"></i>
                <h3>No documents yet</h3>
                <p>Upload your first document to get started</p>
                <button class="btn btn-primary" id="empty-upload-btn">
                    <i class="fas fa-upload"></i>
                    Upload Document
                </button>
            </div>
        `;
        
        // Add event listener to the new button
        const emptyUploadBtn = document.getElementById('empty-upload-btn');
        if (emptyUploadBtn) {
            emptyUploadBtn.addEventListener('click', openUploadModal);
        }
        
        return;
    }
    
    documentsGrid.innerHTML = '';
    
    documents.forEach(document => {
        const card = new DocumentCard(document, {
            onSummarize: handleSummarizeDocument,
            onDelete: handleDeleteDocument,
            onView: handleViewDocument,
            onCreatePodcast: handleCreatePodcastFromDocument
        });
        
        documentsGrid.appendChild(card.element);
        card.mount();
    });
}

// Update document count
function updateDocumentCount(count) {
    const documentsCount = document.getElementById('documents-count');
    if (documentsCount) {
        documentsCount.textContent = count;
    }
}

// Load summaries
async function loadSummaries() {
    try {
        const response = await apiRequest('/api/summaries');
        
        if (response.success) {
            allSummaries = response.summaries; // Store for search
            renderSummaries(response.summaries);
            updateSummaryCount(response.summaries.length);
            updateSummaryStats(response.summaries);
        }
    } catch (error) {
        console.error('Error loading summaries:', error);
        showToast('Failed to load summaries', 'error');
    }
}

// Render summaries
function renderSummaries(summaries) {
    const summariesGrid = document.getElementById('summaries-grid');
    
    if (!summariesGrid) return;
    
    if (summaries.length === 0) {
        summariesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No summaries yet</h3>
                <p>Generate summaries from your documents</p>
                <button class="btn btn-primary" id="empty-generate-btn">
                    <i class="fas fa-magic"></i>
                    Generate Summary
                </button>
            </div>
        `;
        
        // Add event listener to the new button
        const emptyGenerateBtn = document.getElementById('empty-generate-btn');
        if (emptyGenerateBtn) {
            emptyGenerateBtn.addEventListener('click', openBulkGenerateModal);
        }
        
        return;
    }
    
    summariesGrid.innerHTML = '';
    
    summaries.forEach(summary => {
        const card = new SummaryCard(summary, {
            onCopy: handleCopySummary,
            onDelete: handleDeleteSummary,
            onView: handleViewSummary,
            onCreatePodcast: handleCreatePodcastFromSummary,
            onViewDocument: handleViewDocument
        });
        
        summariesGrid.appendChild(card.element);
        card.mount();
    });
}

// Update summary count
function updateSummaryCount(count) {
    const summariesCount = document.getElementById('summaries-count');
    if (summariesCount) {
        summariesCount.textContent = count;
    }
}

// Update summary stats
function updateSummaryStats(summaries) {
    const totalDocuments = document.getElementById('total-documents');
    const completionRate = document.getElementById('completion-rate');
    const avgCompression = document.getElementById('avg-compression');
    const timeSaved = document.getElementById('time-saved');
    
    if (totalDocuments) {
        totalDocuments.textContent = summaries.length;
    }
    
    if (completionRate) {
        const completedCount = summaries.filter(s => s.processingStatus === 'completed').length;
        const rate = summaries.length > 0 ? Math.round((completedCount / summaries.length) * 100) : 0;
        completionRate.textContent = `${rate}%`;
    }
    
    if (avgCompression) {
        const completedSummaries = summaries.filter(s => s.processingStatus === 'completed');
        if (completedSummaries.length > 0) {
            const totalCompression = completedSummaries.reduce((sum, s) => sum + parseFloat(s.compressionRatio), 0);
            const avgCompressionValue = (totalCompression / completedSummaries.length) * 100;
            avgCompression.textContent = `${Math.round(avgCompressionValue)}%`;
        } else {
            avgCompression.textContent = '0%';
        }
    }
    
    if (timeSaved) {
        const completedSummaries = summaries.filter(s => s.processingStatus === 'completed' && s.document && s.document.wordCount);
        if (completedSummaries.length > 0) {
            const totalTimeSaved = completedSummaries.reduce((sum, s) => {
                const originalReadingTime = Math.ceil(s.document.wordCount / 200);
                const summaryReadingTime = s.readingTime || Math.ceil(s.wordCount / 200);
                return sum + Math.max(0, originalReadingTime - summaryReadingTime);
            }, 0);
            timeSaved.textContent = `${totalTimeSaved} min`;
        } else {
            timeSaved.textContent = '0 min';
        }
    }
}

// Load podcasts
async function loadPodcasts() {
    try {
        const response = await apiRequest('/api/podcasts');
        
        if (response.success) {
            allPodcasts = response.podcasts; // Store for search
            renderPodcasts(response.podcasts);
            updatePodcastCount(response.podcasts.length);
        }
    } catch (error) {
        console.error('Error loading podcasts:', error);
        showToast('Failed to load podcasts', 'error');
    }
}

// Render podcasts
function renderPodcasts(podcasts) {
    const podcastsGrid = document.getElementById('podcasts-grid');
    
    if (!podcastsGrid) return;
    
    if (podcasts.length === 0) {
        podcastsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-microphone"></i>
                <h3>No podcasts yet</h3>
                <p>Create your first podcast from a document or summary</p>
                <button class="btn btn-primary" id="empty-create-btn">
                    <i class="fas fa-plus"></i>
                    Create Podcast
                </button>
            </div>
        `;
        
        // Add event listener to the new button
        const emptyCreateBtn = document.getElementById('empty-create-btn');
        if (emptyCreateBtn) {
            emptyCreateBtn.addEventListener('click', openPodcastModal);
        }
        
        return;
    }
    
    podcastsGrid.innerHTML = '';
    
    podcasts.forEach(podcast => {
        const card = new PodcastCard(podcast, {
            onPlay: handlePlayPodcast,
            onDownload: handleDownloadPodcast,
            onDelete: handleDeletePodcast,
            onShare: handleSharePodcast
        });
        
        podcastsGrid.appendChild(card.element);
        card.mount();
        
        // If podcast is still generating, set up progress tracking
        if (podcast.processingStatus === 'generating') {
            trackPodcastProgress(podcast._id, card);
        }
    });
}

// Update podcast count
function updatePodcastCount(count) {
    const podcastsCount = document.getElementById('podcasts-count');
    if (podcastsCount) {
        podcastsCount.textContent = count;
    }
}

// Track podcast progress
function trackPodcastProgress(podcastId, card) {
    const interval = setInterval(async () => {
        try {
            const response = await apiRequest(`/api/podcasts/${podcastId}`);
            
            if (response.success) {
                const podcast = response.podcast;
                
                if (podcast.processingStatus === 'completed') {
                    card.updateStatus('completed');
                    clearInterval(interval);
                } else if (podcast.processingStatus === 'failed') {
                    card.updateStatus('failed');
                    clearInterval(interval);
                }
            }
        } catch (error) {
            console.error('Error tracking podcast progress:', error);
            clearInterval(interval);
        }
    }, 3000);
    
    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
        clearInterval(interval);
    }, 300000);
}

// Refresh processing items
function refreshProcessingItems() {
    // Check for processing documents
    const processingDocuments = document.querySelectorAll('.document-card .status-processing');
    if (processingDocuments.length > 0) {
        loadDocuments();
    }
    
    // Check for processing summaries
    const processingSummaries = document.querySelectorAll('.summary-card .status-processing');
    if (processingSummaries.length > 0) {
        loadSummaries();
    }
    
    // Check for generating podcasts
    const generatingPodcasts = document.querySelectorAll('.podcast-card .status-generating');
    if (generatingPodcasts.length > 0) {
        loadPodcasts();
    }
}

// Event handlers
// Track ongoing summarization requests to prevent duplicates
const ongoingSummarizations = new Set();

async function handleSummarizeDocument(documentId) {
    // Prevent duplicate submissions
    if (ongoingSummarizations.has(documentId)) {
        console.log('Summary generation already in progress for document:', documentId);
        return;
    }
    
    ongoingSummarizations.add(documentId);
    
    try {
        showToast('Generating summary...', 'info');
        
        const response = await apiRequest('/api/summaries', 'POST', {
            documentId
        });
        
        if (response.success) {
            showToast('Summary generation started', 'success');
            loadSummaries();
        } else {
            showToast(response.message || 'Failed to generate summary', 'error');
        }
    } catch (error) {
        console.error('Error generating summary:', error);
        showToast(error.message || 'Failed to generate summary', 'error');
    } finally {
        // Remove from tracking after completion
        ongoingSummarizations.delete(documentId);
    }
}

async function handleDeleteDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/api/documents/${documentId}`, 'DELETE');
        
        if (response.success) {
            showToast('Document deleted successfully', 'success');
            loadDocuments();
        } else {
            showToast(response.message || 'Failed to delete document', 'error');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        showToast(error.message || 'Failed to delete document', 'error');
    }
}

async function handleViewDocument(documentId) {
    try {
        const response = await apiRequest(`/api/documents/${documentId}`);
        
        if (response.success) {
            const doc = response.document;
            
            // Populate modal with document data
            document.getElementById('view-document-title').textContent = doc.title;
            document.getElementById('view-doc-filename').textContent = doc.originalName;
            document.getElementById('view-doc-filetype').textContent = doc.fileType.toUpperCase();
            document.getElementById('view-doc-wordcount').textContent = doc.wordCount + ' words';
            document.getElementById('view-document-content').textContent = doc.extractedText;
            
            // Show modal
            document.getElementById('view-document-modal').classList.add('show');
        } else {
            showToast(response.message || 'Failed to load document', 'error');
        }
    } catch (error) {
        console.error('Error viewing document:', error);
        showToast(error.message || 'Failed to load document', 'error');
    }
}

async function handleCreatePodcastFromDocument(documentId) {
    openPodcastModal(documentId);
}

async function handleCopySummary(summaryId) {
    try {
        const response = await apiRequest(`/api/summaries/${summaryId}`);
        
        if (response.success) {
            await copyToClipboard(response.summary.summaryText);
            showToast('Summary copied to clipboard', 'success');
        } else {
            showToast(response.message || 'Failed to copy summary', 'error');
        }
    } catch (error) {
        console.error('Error copying summary:', error);
        showToast(error.message || 'Failed to copy summary', 'error');
    }
}

async function handleDeleteSummary(summaryId) {
    if (!confirm('Are you sure you want to delete this summary?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/api/summaries/${summaryId}`, 'DELETE');
        
        if (response.success) {
            showToast('Summary deleted successfully', 'success');
            loadSummaries();
        } else {
            showToast(response.message || 'Failed to delete summary', 'error');
        }
    } catch (error) {
        console.error('Error deleting summary:', error);
        showToast(error.message || 'Failed to delete summary', 'error');
    }
}

async function handleViewSummary(summaryId) {
    try {
        const response = await apiRequest(`/api/summaries/${summaryId}`);
        
        if (response.success) {
            const summary = response.summary;
            
            // Populate summary info
            document.getElementById('view-summary-wordcount').textContent = summary.wordCount + ' words';
            document.getElementById('view-summary-compression').textContent = (summary.compressionRatio * 100).toFixed(0) + '%';
            document.getElementById('view-summary-readtime').textContent = summary.readingTime + ' min';
            document.getElementById('view-summary-content').textContent = summary.summaryText;
            
            // Fetch and display original document
            if (summary.document && summary.document._id) {
                const docResponse = await apiRequest(`/api/documents/${summary.document._id}`);
                
                if (docResponse.success) {
                    const doc = docResponse.document;
                    document.getElementById('view-summary-doc-filename').textContent = doc.originalName;
                    document.getElementById('view-summary-doc-wordcount').textContent = doc.wordCount + ' words';
                    document.getElementById('view-summary-doc-content').textContent = doc.extractedText;
                } else {
                    document.getElementById('view-summary-doc-content').textContent = 'Original document not available';
                }
            } else {
                document.getElementById('view-summary-doc-content').textContent = 'Original document not available';
            }
            
            // Show modal
            document.getElementById('view-summary-modal').classList.add('show');
        } else {
            showToast(response.message || 'Failed to load summary', 'error');
        }
    } catch (error) {
        console.error('Error viewing summary:', error);
        showToast(error.message || 'Failed to load summary', 'error');
    }
}

async function handleCreatePodcastFromSummary(summaryId) {
    openPodcastModal(null, summaryId);
}

async function handlePlayPodcast(podcastId, audioUrl) {
    try {
        console.log('🎵 handlePlayPodcast called');
        console.log('   Podcast ID:', podcastId);
        console.log('   Audio URL:', audioUrl);
        
        // Check if this podcast is already playing
        if (currentPlayingPodcastId === podcastId && currentAudio) {
            // Toggle play/pause
            if (currentAudio.paused) {
                currentAudio.play();
                updatePlayButtonState(podcastId, 'playing');
                console.log('▶️ Resuming playback');
            } else {
                currentAudio.pause();
                updatePlayButtonState(podcastId, 'paused');
                console.log('⏸️ Pausing playback');
            }
            return;
        }
        
        // Stop any currently playing audio
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            if (currentPlayingPodcastId) {
                updatePlayButtonState(currentPlayingPodcastId, 'paused');
            }
        }
        
        // Fetch podcast details
        const response = await apiRequest(`/api/podcasts/${podcastId}`);
        
        if (!response.success) {
            showToast('Failed to load podcast details', 'error');
            return;
        }
        
        const podcast = response.podcast;
        console.log('📦 Podcast data:', {
            id: podcast._id,
            title: podcast.title,
            audioUrl: podcast.audioUrl,
            storageType: podcast.storageType,
            hasAudioText: !!podcast.audioText,
            audioTextLength: podcast.audioText?.length || 0
        });
        
        // Check if this is a browser TTS podcast
        if (podcast.storageType === 'browser' || podcast.audioUrl === 'browser-tts') {
            console.log('✅ Detected Browser TTS podcast, using browser synthesis');
            // Use browser TTS to play
            playWithBrowserTTS(podcast);
            return;
        }
        
        console.log('✅ Regular audio podcast, using audio player');
        // Open audio player modal for regular audio
        currentPlayingPodcastId = podcastId;
        openAudioPlayer(podcast, audioUrl);
    } catch (error) {
        console.error('❌ Error playing podcast:', error);
        showToast('Failed to play podcast', 'error');
    }
}

// Audio Player functionality
let audioPlayerInitialized = false;
let currentAudio = null;
let currentPodcast = null;
let currentPlayingPodcastId = null; // Track currently playing podcast

function openAudioPlayer(podcast, audioUrl) {
    currentPodcast = podcast;
    const modal = document.getElementById('audio-player-modal');
    const audioElement = document.getElementById('audio-element');
    const playPauseBtn = document.getElementById('audio-play-pause');
    const title = document.getElementById('audio-player-title');
    const meta = document.getElementById('audio-player-meta');
    
    // Validate audio URL - check for null, empty, undefined, or example.com
    if (!audioUrl || audioUrl === '' || audioUrl === 'undefined' || audioUrl === 'null' || audioUrl.includes('example.com')) {
        showToast('This podcast has no audio file. Please regenerate the podcast.', 'warning');
        return;
    }
    
    // Set podcast info
    title.textContent = podcast.title;
    meta.textContent = `Document: ${podcast.document ? podcast.document.title : 'Unknown'}`;
    
    // Build full audio URL - handle both relative and absolute paths
    let fullAudioUrl = audioUrl;
    if (audioUrl.startsWith('/')) {
        // Relative path - use API base URL
        const apiBaseUrl = window.ENV ? window.ENV.getApiUrl() : window.location.origin;
        fullAudioUrl = `${apiBaseUrl}${audioUrl}`;
    } else if (!audioUrl.startsWith('http')) {
        // No protocol, assume relative
        const apiBaseUrl = window.ENV ? window.ENV.getApiUrl() : window.location.origin;
        fullAudioUrl = `${apiBaseUrl}/${audioUrl}`;
    }
    
    console.log('🎵 Loading audio from:', fullAudioUrl);
    console.log('   Original URL:', audioUrl);
    console.log('   API Base:', window.ENV ? window.ENV.getApiUrl() : window.location.origin);
    
    // Set audio source with error handling
    audioElement.src = fullAudioUrl;
    currentAudio = audioElement;
    
    // Add error handler
    audioElement.onerror = function(e) {
        console.error('❌ Audio load error:', {
            fullUrl: fullAudioUrl,
            originalUrl: audioUrl,
            error: e
        });
        showToast('Failed to load audio file. Please check if the file exists.', 'error');
    };
    
    // Add loaded handler
    audioElement.onloadeddata = function() {
        console.log('✅ Audio loaded successfully:', fullAudioUrl);
    };
    
    // Add play/pause event listeners to update button states
    audioElement.onplay = function() {
        console.log('▶️ Audio started playing');
        updatePlayButtonState(currentPlayingPodcastId, 'playing');
    };
    
    audioElement.onpause = function() {
        console.log('⏸️ Audio paused');
        updatePlayButtonState(currentPlayingPodcastId, 'paused');
    };
    
    audioElement.onended = function() {
        console.log('🏁 Audio ended');
        updatePlayButtonState(currentPlayingPodcastId, 'paused');
        currentPlayingPodcastId = null;
    };
    
    // Reset play button
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    
    // Check if we should use Browser TTS instead (for mock audio files)
    checkAndOfferBrowserTTS(podcast, audioUrl);
    
    // Show modal
    modal.classList.add('show');
    
    // Initialize audio player controls if not already done
    if (!audioPlayerInitialized) {
        initAudioPlayer();
        audioPlayerInitialized = true;
    }
}

/**
 * Check if audio is mock/silent and offer Browser TTS alternative
 */
function checkAndOfferBrowserTTS(podcast, audioUrl) {
    // If audio file is very small (mock file), offer browser TTS
    if (podcast.audioSize && podcast.audioSize < 50000) { // Less than 50KB suggests mock file
        const meta = document.getElementById('audio-player-meta');
        const existingBrowserTTSBtn = document.getElementById('use-browser-tts-btn');
        
        if (!existingBrowserTTSBtn && window.browserTTS && window.browserTTS.isInitialized) {
            const browserTTSInfo = document.createElement('div');
            browserTTSInfo.style.cssText = 'margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 5px; text-align: center;';
            browserTTSInfo.innerHTML = `
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #2e7d32;">
                    <i class="fas fa-info-circle"></i> This audio is silent (mock file)
                </p>
                <button id="use-browser-tts-btn" class="btn btn-primary btn-sm" style="font-size: 12px;">
                    <i class="fas fa-volume-up"></i> Use Browser TTS (FREE - Real Audio!)
                </button>
            `;
            meta.parentElement.appendChild(browserTTSInfo);
            
            // Add click handler
            document.getElementById('use-browser-tts-btn').addEventListener('click', () => {
                playWithBrowserTTS(podcast);
            });
        }
    }
}

/**
 * Play podcast text using Browser TTS
 */
async function playWithBrowserTTS(podcast) {
    if (!window.browserTTS || !window.browserTTS.isInitialized) {
        showToast('Browser TTS not available. Please use Chrome, Edge, or Safari.', 'error');
        return;
    }
    
    // Get the text to speak (from audioText field, summary, or document)
    let textToSpeak = '';
    
    if (podcast.audioText) {
        // Use the stored audioText field
        textToSpeak = podcast.audioText;
    } else if (podcast.summary && podcast.summary.summaryText) {
        textToSpeak = podcast.summary.summaryText;
    } else if (podcast.document && podcast.document.extractedText) {
        // Use first 1000 characters if full document
        textToSpeak = podcast.document.extractedText.substring(0, 1000);
        if (podcast.document.extractedText.length > 1000) {
            textToSpeak += '...';
        }
    } else {
        showToast('No text available for TTS', 'error');
        return;
    }
    
    console.log('🎙️ Speaking with Browser TTS...');
    console.log('📝 Text length:', textToSpeak.length, 'characters');
    showToast('Playing with Browser TTS (FREE!)', 'success');
    
    // Get voice selection from podcast settings or use default
    const voiceName = podcast.voiceSettings?.voice || null;
    
    try {
        await window.browserTTS.speak(textToSpeak, {
            voice: voiceName,
            rate: podcast.voiceSettings?.speed || 1.0,
            pitch: podcast.voiceSettings?.pitch || 1.0,
            volume: podcast.voiceSettings?.volume || 1.0,
            language: 'en-US',
            onStart: () => {
                console.log('🔊 Browser TTS started');
                const btn = document.getElementById('use-browser-tts-btn');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-stop"></i> Stop Speaking';
                    btn.onclick = () => {
                        window.browserTTS.stop();
                        btn.innerHTML = '<i class="fas fa-volume-up"></i> Use Browser TTS (FREE - Real Audio!)';
                        btn.onclick = () => playWithBrowserTTS(podcast);
                    };
                }
            },
            onEnd: () => {
                console.log('✅ Browser TTS finished');
                showToast('Finished speaking', 'success');
                const btn = document.getElementById('use-browser-tts-btn');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-volume-up"></i> Use Browser TTS (FREE - Real Audio!)';
                    btn.onclick = () => playWithBrowserTTS(podcast);
                }
            },
            onError: (error) => {
                console.error('❌ Browser TTS error:', error);
                showToast('TTS error: ' + error, 'error');
            }
        });
    } catch (error) {
        console.error('Browser TTS error:', error);
        showToast('Failed to speak text', 'error');
    }
}

/**
 * Update play button state for a specific podcast card
 */
function updatePlayButtonState(podcastId, state) {
    if (!podcastId) return;
    
    // Find all play buttons for this podcast
    const playButtons = document.querySelectorAll(`.play-btn[data-id="${podcastId}"]`);
    
    playButtons.forEach(button => {
        if (state === 'playing') {
            button.innerHTML = '<i class="fas fa-pause"></i> Pause';
            button.classList.add('playing');
        } else {
            button.innerHTML = '<i class="fas fa-play"></i> Play';
            button.classList.remove('playing');
        }
    });
}

function initAudioPlayer() {
    const audioElement = document.getElementById('audio-element');
    const playPauseBtn = document.getElementById('audio-play-pause');
    const progressBar = document.getElementById('audio-progress-bar');
    const progressFill = document.getElementById('audio-progress-fill');
    const progressHandle = document.getElementById('audio-progress-handle');
    const currentTimeSpan = document.getElementById('audio-current-time');
    const totalTimeSpan = document.getElementById('audio-total-time');
    const volumeBtn = document.getElementById('audio-volume-btn');
    const volumeSlider = document.getElementById('audio-volume-slider');
    const speedBtn = document.getElementById('audio-speed-btn');
    const downloadBtn = document.getElementById('audio-download-btn');
    const shareBtn = document.getElementById('audio-share-btn');
    const closeBtn = document.getElementById('close-audio-player');
    
    // Play/Pause functionality
    playPauseBtn.addEventListener('click', () => {
        if (audioElement.paused) {
            audioElement.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            audioElement.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });
    
    // Update progress bar
    audioElement.addEventListener('timeupdate', () => {
        if (audioElement.duration) {
            const progress = (audioElement.currentTime / audioElement.duration) * 100;
            progressFill.style.width = `${progress}%`;
            progressHandle.style.left = `${progress}%`;
            currentTimeSpan.textContent = formatTime(audioElement.currentTime);
        }
    });
    
    // Set total time when metadata loads
    audioElement.addEventListener('loadedmetadata', () => {
        totalTimeSpan.textContent = formatTime(audioElement.duration);
    });
    
    // Seek functionality
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioElement.currentTime = percent * audioElement.duration;
    });
    
    // Draggable progress handle
    let isDragging = false;
    
    progressHandle.addEventListener('mousedown', () => {
        isDragging = true;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = progressBar.getBoundingClientRect();
            let percent = (e.clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent));
            audioElement.currentTime = percent * audioElement.duration;
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Volume control
    volumeSlider.addEventListener('input', () => {
        const volume = volumeSlider.value / 100;
        audioElement.volume = volume;
        updateVolumeIcon(volume);
    });
    
    volumeBtn.addEventListener('click', () => {
        if (audioElement.volume > 0) {
            audioElement.volume = 0;
            volumeSlider.value = 0;
            updateVolumeIcon(0);
        } else {
            audioElement.volume = 1;
            volumeSlider.value = 100;
            updateVolumeIcon(1);
        }
    });
    
    // Speed control
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    let speedIndex = 2; // Start at 1.0x
    
    speedBtn.addEventListener('click', () => {
        speedIndex = (speedIndex + 1) % speeds.length;
        const speed = speeds[speedIndex];
        audioElement.playbackRate = speed;
        speedBtn.textContent = `${speed}x`;
    });
    
    // Share button
    shareBtn.addEventListener('click', () => {
        if (currentPodcast) {
            handleSharePodcast(currentPodcast._id);
        }
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        audioElement.pause();
        audioElement.currentTime = 0;
        document.getElementById('audio-player-modal').classList.remove('show');
    });
    
    // Reset on audio end
    audioElement.addEventListener('ended', () => {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        audioElement.currentTime = 0;
    });
}

function updateVolumeIcon(volume) {
    const volumeBtn = document.getElementById('audio-volume-btn');
    if (volume === 0) {
        volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (volume < 0.5) {
        volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
        volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function handleDownloadPodcast(podcastId, audioUrl, title) {
    // Quick check - if audioUrl is 'browser-tts', don't download
    if (audioUrl === 'browser-tts') {
        showToast('Browser TTS podcasts cannot be downloaded. They are synthesized in real-time.', 'info');
        return;
    }
    
    // Use the backend download route
    const token = getAuthToken();
    const downloadUrl = `${API_BASE_URL}/api/podcasts/${podcastId}/download`;
    
    // Fetch and download
    fetch(downloadUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Download failed');
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('Download started', 'success');
    })
    .catch(error => {
        console.error('Download error:', error);
        showToast('Failed to download podcast', 'error');
    });
}

async function handleDeletePodcast(podcastId) {
    if (!confirm('Are you sure you want to delete this podcast?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/api/podcasts/${podcastId}`, 'DELETE');
        
        if (response.success) {
            showToast('Podcast deleted successfully', 'success');
            loadPodcasts();
        } else {
            showToast(response.message || 'Failed to delete podcast', 'error');
        }
    } catch (error) {
        console.error('Error deleting podcast:', error);
        showToast(error.message || 'Failed to delete podcast', 'error');
    }
}

function handleSharePodcast(podcastId) {
    // In a real implementation, this would open a share dialog
    showToast('Share functionality would be implemented here', 'info');
}

// Modal functions
function openUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.classList.add('show');
        initUploadModal();
    }
}

function openPodcastModal(documentId = null, summaryId = null) {
    const modal = document.getElementById('podcast-modal');
    if (modal) {
        modal.classList.add('show');
        initPodcastModal(documentId, summaryId);
    }
}

function openBulkGenerateModal() {
    const modal = document.getElementById('bulk-generate-modal');
    if (modal) {
        modal.classList.add('show');
        initBulkGenerateModal();
    }
}

// Initialize modals
function initModals() {
    // Upload modal
    const uploadModal = document.getElementById('upload-modal');
    const uploadModalClose = document.getElementById('upload-modal-close');
    const cancelUpload = document.getElementById('cancel-upload');
    
    if (uploadModalClose) {
        uploadModalClose.addEventListener('click', () => {
            uploadModal.classList.remove('show');
        });
    }
    
    if (cancelUpload) {
        cancelUpload.addEventListener('click', () => {
            uploadModal.classList.remove('show');
        });
    }
    
    // Podcast modal
    const podcastModal = document.getElementById('podcast-modal');
    const podcastModalClose = document.getElementById('podcast-modal-close');
    const cancelPodcast = document.getElementById('cancel-podcast');
    
    if (podcastModalClose) {
        podcastModalClose.addEventListener('click', () => {
            podcastModal.classList.remove('show');
        });
    }
    
    if (cancelPodcast) {
        cancelPodcast.addEventListener('click', () => {
            podcastModal.classList.remove('show');
        });
    }
    
    // Bulk generate modal
    const bulkGenerateModal = document.getElementById('bulk-generate-modal');
    const bulkModalClose = document.getElementById('bulk-modal-close');
    const cancelBulk = document.getElementById('cancel-bulk');
    
    if (bulkModalClose) {
        bulkModalClose.addEventListener('click', () => {
            bulkGenerateModal.classList.remove('show');
        });
    }
    
    if (cancelBulk) {
        cancelBulk.addEventListener('click', () => {
            bulkGenerateModal.classList.remove('show');
        });
    }
    
    // Close modals when clicking outside
    [uploadModal, podcastModal, bulkGenerateModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }
    });
    
    // View Document modal
    const viewDocumentModal = document.getElementById('view-document-modal');
    const viewDocumentClose = document.getElementById('view-document-close');
    const closeViewDocument = document.getElementById('close-view-document');
    const copyDocumentContent = document.getElementById('copy-document-content');
    
    if (viewDocumentClose) {
        viewDocumentClose.addEventListener('click', () => {
            viewDocumentModal.classList.remove('show');
        });
    }
    
    if (closeViewDocument) {
        closeViewDocument.addEventListener('click', () => {
            viewDocumentModal.classList.remove('show');
        });
    }
    
    if (copyDocumentContent) {
        copyDocumentContent.addEventListener('click', async () => {
            const content = document.getElementById('view-document-content').textContent;
            await copyToClipboard(content);
            showToast('Document content copied to clipboard', 'success');
        });
    }
    
    if (viewDocumentModal) {
        viewDocumentModal.addEventListener('click', (e) => {
            if (e.target === viewDocumentModal) {
                viewDocumentModal.classList.remove('show');
            }
        });
    }
    
    // View Summary modal
    const viewSummaryModal = document.getElementById('view-summary-modal');
    const viewSummaryClose = document.getElementById('view-summary-close');
    const closeViewSummary = document.getElementById('close-view-summary');
    const copySummaryContent = document.getElementById('copy-summary-content');
    
    if (viewSummaryClose) {
        viewSummaryClose.addEventListener('click', () => {
            viewSummaryModal.classList.remove('show');
        });
    }
    
    if (closeViewSummary) {
        closeViewSummary.addEventListener('click', () => {
            viewSummaryModal.classList.remove('show');
        });
    }
    
    if (copySummaryContent) {
        copySummaryContent.addEventListener('click', async () => {
            const content = document.getElementById('view-summary-content').textContent;
            await copyToClipboard(content);
            showToast('Summary content copied to clipboard', 'success');
        });
    }
    
    if (viewSummaryModal) {
        viewSummaryModal.addEventListener('click', (e) => {
            if (e.target === viewSummaryModal) {
                viewSummaryModal.classList.remove('show');
            }
        });
    }
}

// Initialize upload modal
function initUploadModal() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const filePreview = document.getElementById('file-preview');
    const removeFile = document.getElementById('remove-file');
    const confirmUpload = document.getElementById('confirm-upload');
    
    if (!uploadZone || !fileInput || !browseBtn || !filePreview || !removeFile || !confirmUpload) {
        return;
    }
    
    // Reset modal state
    fileInput.value = '';
    filePreview.style.display = 'none';
    confirmUpload.disabled = true;
    
    // Browse button
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            showFilePreview(file);
        }
    });
    
    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            fileInput.files = e.dataTransfer.files;
            showFilePreview(file);
        }
    });
    
    // Remove file
    removeFile.addEventListener('click', () => {
        fileInput.value = '';
        filePreview.style.display = 'none';
        confirmUpload.disabled = true;
    });
    
    // Confirm upload
    confirmUpload.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (file && !confirmUpload.disabled) {
            // Disable button to prevent double submission
            confirmUpload.disabled = true;
            confirmUpload.textContent = 'Uploading...';
            
            try {
                await handleFileUpload(file);
            } finally {
                // Re-enable button after upload completes or fails
                confirmUpload.disabled = false;
                confirmUpload.textContent = 'Upload';
            }
        }
    });
    
    // Show file preview
    function showFilePreview(file) {
        const fileIcon = document.getElementById('file-icon');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        
        if (fileIcon && fileName && fileSize) {
            // Update icon based on file type
            const fileType = getFileExtension(file.name);
            fileIcon.className = `fas ${getFileIcon(fileType)}`;
            
            // Update file name and size
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            
            // Show preview
            filePreview.style.display = 'block';
            confirmUpload.disabled = false;
        }
    }
    
    // Upload file
    async function handleFileUpload(file) {
        const uploadProgress = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (!uploadProgress || !progressFill || !progressText) {
            return;
        }
        
        // Show progress
        uploadProgress.style.display = 'block';
        
        try {
            const token = getAuthToken();
            const response = await uploadFile(file, token, (percent) => {
                progressFill.style.width = `${percent}%`;
                progressText.textContent = `Uploading... ${Math.round(percent)}%`;
            });
            
            // Check if response exists
            if (!response) {
                throw new Error('No response received from server');
            }
            
            if (response.success) {
                showToast('Document uploaded successfully', 'success');
                
                // Close modal
                document.getElementById('upload-modal').classList.remove('show');
                
                // Reload documents
                loadDocuments();
                
                // Auto-summarize if checked
                const autoSummarize = document.getElementById('auto-summarize-upload');
                if (autoSummarize && autoSummarize.checked) {
                    handleSummarizeDocument(response.document._id);
                }
            } else {
                showToast(response.message || 'Failed to upload document', 'error');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            showToast(error.message || 'Failed to upload document', 'error');
        } finally {
            // Hide progress
            uploadProgress.style.display = 'none';
        }
    }
}

// Initialize podcast modal
let podcastModalInitialized = false;
let createPodcastHandler = null;

async function initPodcastModal(documentId = null, summaryId = null) {
    const podcastDocument = document.getElementById('podcast-document');
    const contentSourceRadios = document.querySelectorAll('input[name="content-source"]');
    const podcastTitle = document.getElementById('podcast-title');
    const podcastDescription = document.getElementById('podcast-description');
    const voiceProvider = document.getElementById('voice-provider');
    const voiceSelection = document.getElementById('voice-selection');
    const voiceSpeed = document.getElementById('voice-speed');
    const voicePitch = document.getElementById('voice-pitch');
    const voiceVolume = document.getElementById('voice-volume');
    const speedValue = document.getElementById('speed-value');
    const pitchValue = document.getElementById('pitch-value');
    const volumeValue = document.getElementById('volume-value');
    const createPodcast = document.getElementById('create-podcast');
    
    if (!podcastDocument || !contentSourceRadios.length || !podcastTitle || 
        !voiceProvider || !voiceSelection || !voiceSpeed || !voicePitch || 
        !voiceVolume || !speedValue || !pitchValue || !volumeValue || !createPodcast) {
        return;
    }
    
    // Load documents
    try {
        const response = await apiRequest('/api/documents');
        
        if (response.success) {
            // Clear existing options
            podcastDocument.innerHTML = '<option value="">Choose a document</option>';
            
            // Add document options
            response.documents.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc._id;
                option.textContent = doc.title;
                podcastDocument.appendChild(option);
            });
            
            // Select document if provided
            if (documentId) {
                podcastDocument.value = documentId;
            }
            
            // Load available voices
            await loadAvailableVoices(voiceProvider.value);
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        showToast('Failed to load documents', 'error');
    }
    
    // Only attach event listeners once
    if (!podcastModalInitialized) {
        // Voice provider change
        voiceProvider.addEventListener('change', () => {
            loadAvailableVoices(voiceProvider.value);
        });
        
        // Voice speed change
        voiceSpeed.addEventListener('input', () => {
            speedValue.textContent = `${voiceSpeed.value}x`;
        });
        
        // Voice pitch change
        voicePitch.addEventListener('input', () => {
            pitchValue.textContent = voicePitch.value;
        });
        
        // Voice volume change
        voiceVolume.addEventListener('input', () => {
            volumeValue.textContent = `${Math.round(voiceVolume.value * 100)}%`;
        });
        
        // Create podcast handler
        createPodcastHandler = async () => {
            // Prevent multiple submissions
            if (createPodcast.disabled) return;
            createPodcast.disabled = true;
            
            const selectedDocumentId = podcastDocument.value;
            const sourceType = document.querySelector('input[name="content-source"]:checked').value;
            const title = podcastTitle.value;
            const description = podcastDescription.value;
            const provider = voiceProvider.value;
            const voice = voiceSelection.value;
            const speed = parseFloat(voiceSpeed.value);
            const pitch = parseFloat(voicePitch.value);
            const volume = parseFloat(voiceVolume.value);
            
            // Validation
            if (!selectedDocumentId) {
                showToast('Please select a document', 'error');
                createPodcast.disabled = false;
                return;
            }
            
            if (!title) {
                showToast('Please enter a title', 'error');
                createPodcast.disabled = false;
                return;
            }
            
            // Create podcast
            try {
                showToast('Creating podcast...', 'info');
                
                const response = await apiRequest('/api/podcasts', 'POST', {
                    documentId: selectedDocumentId,
                    title,
                    description,
                    sourceType,
                    voiceProvider: provider,
                    voiceSettings: {
                        voice,
                        speed,
                        pitch,
                        volume
                    }
                });
                
                if (response.success) {
                    showToast('Podcast creation started', 'success');
                    
                    // Close modal
                    document.getElementById('podcast-modal').classList.remove('show');
                    
                    // Reload podcasts
                    loadPodcasts();
                } else {
                    showToast(response.message || 'Failed to create podcast', 'error');
                }
            } catch (error) {
                console.error('Error creating podcast:', error);
                showToast(error.message || 'Failed to create podcast', 'error');
            } finally {
                createPodcast.disabled = false;
            }
        };
        
        // Attach the click listener
        createPodcast.addEventListener('click', createPodcastHandler);
        
        podcastModalInitialized = true;
    }
    
    // Load available voices (nested function)
    async function loadAvailableVoices(provider) {
        const voiceSelection = document.getElementById('voice-selection');
        if (!voiceSelection) return;
        
        try {
            const response = await apiRequest(`/api/voices/available?provider=${provider}`);
            
            if (response.success) {
                // Clear existing options
                voiceSelection.innerHTML = '';
                
                // Add voice options
                response.voices.forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.id;
                    option.textContent = `${voice.name} (${voice.language})`;
                    voiceSelection.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading voices:', error);
        }
    }
}

// Initialize bulk generate modal
async function initBulkGenerateModal() {
    const documentList = document.getElementById('document-list');
    const confirmBulk = document.getElementById('confirm-bulk');
    
    if (!documentList || !confirmBulk) {
        return;
    }
    
    // Load documents
    try {
        const response = await apiRequest('/api/documents');
        
        if (response.success) {
            // Clear existing list
            documentList.innerHTML = '';
            
            // Add document checkboxes
            response.documents.forEach(doc => {
                const documentItem = document.createElement('div');
                documentItem.className = 'document-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `doc-${doc._id}`;
                checkbox.value = doc._id;
                
                const label = document.createElement('label');
                label.htmlFor = `doc-${doc._id}`;
                label.textContent = doc.title;
                
                documentItem.appendChild(checkbox);
                documentItem.appendChild(label);
                documentList.appendChild(documentItem);
            });
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        showToast('Failed to load documents', 'error');
    }
    
    // Confirm bulk generate
    confirmBulk.addEventListener('click', async () => {
        const checkboxes = documentList.querySelectorAll('input[type="checkbox"]:checked');
        
        if (checkboxes.length === 0) {
            showToast('Please select at least one document', 'error');
            return;
        }
        
        const documentIds = Array.from(checkboxes).map(cb => cb.value);
        
        try {
            showToast('Generating summaries...', 'info');
            
            const response = await apiRequest('/api/summaries/bulk-generate', 'POST', {
                documentIds
            });
            
            if (response.success) {
                showToast('Summary generation started', 'success');
                
                // Close modal
                document.getElementById('bulk-generate-modal').classList.remove('show');
                
                // Reload summaries
                loadSummaries();
            } else {
                showToast(response.message || 'Failed to generate summaries', 'error');
            }
        } catch (error) {
            console.error('Error generating summaries:', error);
            showToast(error.message || 'Failed to generate summaries', 'error');
        }
    });
}

// ==================== PROFILE MODAL ====================

// Initialize profile modal
function initProfileModal() {
    console.log('🔧 initProfileModal called');
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeProfileBtn = document.getElementById('close-profile-modal');
    const cancelProfileBtn = document.getElementById('cancel-profile-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    
    console.log('🔍 Profile elements:', {
        menuBtn: profileMenuBtn,
        modal: profileModal,
        closeBtn: closeProfileBtn
    });
    
    if (profileMenuBtn) {
        profileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('👤 Profile menu clicked');
            // Close user menu
            const userMenu = document.getElementById('user-menu');
            if (userMenu) {
                userMenu.classList.remove('show');
            }
            openProfileModal();
        });
    }
    
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => {
            profileModal.classList.remove('show');
        });
    }
    
    if (cancelProfileBtn) {
        cancelProfileBtn.addEventListener('click', () => {
            profileModal.classList.remove('show');
        });
    }
    
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }
    
    // Dark mode preference
    const darkModeCheckbox = document.getElementById('pref-dark-mode');
    if (darkModeCheckbox) {
        // Check current theme
        const currentTheme = localStorage.getItem('theme') || 'light';
        darkModeCheckbox.checked = currentTheme === 'dark';
        
        darkModeCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// Open profile modal
async function openProfileModal() {
    console.log('🚀 openProfileModal called');
    const modal = document.getElementById('profile-modal');
    
    if (!modal) {
        console.error('❌ Profile modal not found!');
        return;
    }
    
    console.log('📋 Profile modal found:', modal);
    
    // Load user info
    try {
        const response = await apiRequest('/api/auth/verify');
        
        if (response.success) {
            const user = response.user;
            
            // Update profile display
            document.getElementById('profile-display-name').textContent = user.name;
            document.getElementById('profile-display-email').textContent = user.email;
            
            // Update input fields
            document.getElementById('profile-name-input').value = user.name || '';
            document.getElementById('profile-email-input').value = user.email || '';
            
            // Load preferences from localStorage
            const prefs = JSON.parse(localStorage.getItem('userPreferences') || '{}');
            document.getElementById('pref-email-notifications').checked = prefs.emailNotifications !== false;
            document.getElementById('pref-auto-save').checked = prefs.autoSave !== false;
            
            // Load statistics
            const docsResponse = await apiRequest('/api/documents');
            const summariesResponse = await apiRequest('/api/summaries');
            const podcastsResponse = await apiRequest('/api/podcasts');
            
            if (docsResponse.success) {
                document.getElementById('profile-stat-documents').textContent = docsResponse.documents.length;
            }
            
            if (summariesResponse.success) {
                document.getElementById('profile-stat-summaries').textContent = summariesResponse.summaries.length;
            }
            
            if (podcastsResponse.success) {
                document.getElementById('profile-stat-podcasts').textContent = podcastsResponse.podcasts.length;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile', 'error');
    }
    
    // Show modal
    modal.classList.add('show');
}

// Save profile
async function saveProfile() {
    const nameInput = document.getElementById('profile-name-input');
    const emailNotifications = document.getElementById('pref-email-notifications').checked;
    const autoSave = document.getElementById('pref-auto-save').checked;
    
    // Save preferences to localStorage
    const prefs = {
        emailNotifications,
        autoSave
    };
    
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
    
    // Update display name if changed
    const newName = nameInput.value.trim();
    if (newName) {
        // Update sidebar
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = newName;
        }
        
        // Update settings page
        const userNameSetting = document.getElementById('user-name-setting');
        if (userNameSetting) {
            userNameSetting.value = newName;
        }
    }
    
    showToast('Profile updated successfully', 'success');
    
    // Close modal
    document.getElementById('profile-modal').classList.remove('show');
}

// ==================== NOTIFICATION SYSTEM ====================

// Notification storage
let notifications = [];

// Initialize notification system
function initNotificationSystem() {
    console.log('🔧 initNotificationSystem called');
    const notificationsMenuBtn = document.getElementById('notifications-menu-btn');
    const notificationsModal = document.getElementById('notifications-modal');
    const closeNotificationsBtn = document.getElementById('close-notifications-modal');
    const markAllReadBtn = document.getElementById('mark-all-read-btn');
    
    console.log('🔍 Notification elements:', {
        menuBtn: notificationsMenuBtn,
        modal: notificationsModal,
        closeBtn: closeNotificationsBtn
    });
    
    // Load notifications from localStorage
    loadNotificationsFromStorage();
    
    if (notificationsMenuBtn) {
        notificationsMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔔 Notifications menu clicked');
            // Close user menu
            const userMenu = document.getElementById('user-menu');
            if (userMenu) {
                userMenu.classList.remove('show');
            }
            openNotificationsModal();
        });
    }
    
    if (closeNotificationsBtn) {
        closeNotificationsBtn.addEventListener('click', () => {
            notificationsModal.classList.remove('show');
        });
    }
    
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    }
    
    // Update badge count
    updateNotificationBadge();
}

// Load notifications from localStorage
function loadNotificationsFromStorage() {
    const stored = localStorage.getItem('notifications');
    if (stored) {
        try {
            notifications = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading notifications:', error);
            notifications = [];
        }
    }
}

// Save notifications to localStorage
function saveNotificationsToStorage() {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Add notification
function addNotification(type, title, message) {
    const notification = {
        id: Date.now(),
        type: type, // 'success', 'error', 'info', 'warning'
        title: title,
        message: message,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
    }
    
    saveNotificationsToStorage();
    updateNotificationBadge();
}

// Open notifications modal
function openNotificationsModal() {
    const modal = document.getElementById('notifications-modal');
    const notificationsList = document.getElementById('notifications-list');
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-state" style="padding: 40px;">
                <i class="fas fa-bell-slash"></i>
                <h3>No notifications</h3>
                <p>You're all caught up!</p>
            </div>
        `;
    } else {
        notificationsList.innerHTML = '';
        
        notifications.forEach(notif => {
            const notifItem = document.createElement('div');
            notifItem.className = `notification-item ${notif.read ? 'read' : 'unread'} notification-${notif.type}`;
            
            const iconMap = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                info: 'fa-info-circle',
                warning: 'fa-exclamation-triangle'
            };
            
            const icon = iconMap[notif.type] || 'fa-bell';
            
            notifItem.innerHTML = `
                <div class="notification-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="notification-content">
                    <h5>${notif.title}</h5>
                    <p>${notif.message}</p>
                    <small>${formatNotificationTime(notif.timestamp)}</small>
                </div>
                <div class="notification-actions">
                    ${!notif.read ? `<button class="btn-icon" onclick="markNotificationAsRead('${notif.id}')" title="Mark as read">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
                    <button class="btn-icon" onclick="deleteNotification('${notif.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            notificationsList.appendChild(notifItem);
        });
    }
    
    // Show modal
    modal.classList.add('show');
}

// Mark notification as read
function markNotificationAsRead(notifId) {
    const notification = notifications.find(n => n.id === parseInt(notifId));
    if (notification) {
        notification.read = true;
        saveNotificationsToStorage();
        updateNotificationBadge();
        openNotificationsModal(); // Refresh the list
    }
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    notifications.forEach(n => n.read = true);
    saveNotificationsToStorage();
    updateNotificationBadge();
    openNotificationsModal(); // Refresh the list
    showToast('All notifications marked as read', 'success');
}

// Delete notification
function deleteNotification(notifId) {
    notifications = notifications.filter(n => n.id !== parseInt(notifId));
    saveNotificationsToStorage();
    updateNotificationBadge();
    openNotificationsModal(); // Refresh the list
}

// Update notification badge
function updateNotificationBadge() {
    const badge = document.querySelector('#notifications .notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Format notification timestamp
function formatNotificationTime(timestamp) {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return notifTime.toLocaleDateString();
}

// Hook notifications into existing functions
// Override the existing showToast to also add notifications
const originalShowToast = window.showToast || function() {};
window.showToast = function(message, type = 'info') {
    // Call original toast
    originalShowToast.call(this, message, type);
    
    // Add notification for important messages
    if (type === 'success' || type === 'error') {
        const title = type === 'success' ? 'Success' : 'Error';
        addNotification(type, title, message);
    }
};

// ==================== GLOBAL SEARCH ====================

let allDocuments = [];
let allSummaries = [];
let allPodcasts = [];

// Handle global search
function handleGlobalSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        // Reset all views
        renderDocuments(allDocuments);
        renderSummaries(allSummaries);
        renderPodcasts(allPodcasts);
        return;
    }
    
    // Get current active tab
    const activeTab = document.querySelector('.nav-item.active');
    const currentTab = activeTab ? activeTab.getAttribute('data-tab') : 'documents';
    
    switch (currentTab) {
        case 'documents':
            const filteredDocs = allDocuments.filter(doc => 
                doc.title.toLowerCase().includes(searchTerm) ||
                (doc.extractedText && doc.extractedText.toLowerCase().includes(searchTerm))
            );
            renderDocuments(filteredDocs);
            showToast(`Found ${filteredDocs.length} document(s)`, 'info');
            break;
            
        case 'summaries':
            const filteredSummaries = allSummaries.filter(summary =>
                summary.document?.title.toLowerCase().includes(searchTerm) ||
                summary.summaryText.toLowerCase().includes(searchTerm)
            );
            renderSummaries(filteredSummaries);
            showToast(`Found ${filteredSummaries.length} summar${filteredSummaries.length === 1 ? 'y' : 'ies'}`, 'info');
            break;
            
        case 'podcasts':
            const filteredPodcasts = allPodcasts.filter(podcast =>
                podcast.title.toLowerCase().includes(searchTerm) ||
                (podcast.audioText && podcast.audioText.toLowerCase().includes(searchTerm)) ||
                podcast.document?.title.toLowerCase().includes(searchTerm)
            );
            renderPodcasts(filteredPodcasts);
            showToast(`Found ${filteredPodcasts.length} podcast(s)`, 'info');
            break;
    }
}

// ==================== THEME TOGGLE ====================

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Update theme
    document.body.classList.toggle('dark-theme', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
    
    // Update icon
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'success');
}

// Apply saved theme on load
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeToggle = document.getElementById('theme-toggle');
        const icon = themeToggle?.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-sun';
        }
    }
}

// Call on page load
applySavedTheme();

// ==================== SHARE FUNCTIONALITY ====================

async function handleSharePodcast(podcastId) {
    try {
        const podcast = allPodcasts.find(p => p._id === podcastId);
        if (!podcast) {
            showToast('Podcast not found', 'error');
            return;
        }
        
        const shareData = {
            title: podcast.title,
            text: `Listen to my podcast: ${podcast.title}`,
            url: window.location.origin + `/podcast/${podcastId}`
        };
        
        // Check if Web Share API is supported
        if (navigator.share) {
            await navigator.share(shareData);
            showToast('Podcast shared successfully', 'success');
        } else {
            // Fallback: copy link to clipboard
            const shareUrl = shareData.url;
            await navigator.clipboard.writeText(shareUrl);
            showToast('Link copied to clipboard!', 'success');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Share error:', error);
            showToast('Failed to share podcast', 'error');
        }
    }
}

// =======================
// Voice Cloning Functions
// =======================

let allCustomVoices = [];
let selectedVoiceFile = null;

// Load custom voices
async function loadCustomVoices() {
    try {
        const response = await apiRequest('/api/custom-voices');
        
        if (response.success) {
            allCustomVoices = response.voices;
            renderCustomVoices(response.voices);
            updateVoicesCount(response.voices.length);
        }
    } catch (error) {
        console.error('Error loading custom voices:', error);
        showToast('Failed to load custom voices', 'error');
    }
}

// Render custom voices
function renderCustomVoices(voices) {
    const voicesGrid = document.getElementById('voices-grid');
    
    if (!voicesGrid) return;
    
    if (voices.length === 0) {
        voicesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-microphone-alt"></i>
                <h3>No custom voices yet</h3>
                <p>Upload a voice sample to get started</p>
                <button class="btn btn-primary" id="empty-upload-voice-btn">
                    <i class="fas fa-upload"></i>
                    Upload Voice Sample
                </button>
            </div>
        `;
        
        const emptyUploadBtn = document.getElementById('empty-upload-voice-btn');
        if (emptyUploadBtn) {
            emptyUploadBtn.addEventListener('click', openUploadVoiceModal);
        }
        
        return;
    }
    
    voicesGrid.innerHTML = '';
    
    voices.forEach(voice => {
        const card = new VoiceCloneCard(voice, {
            onPlay: handlePlayVoice,
            onEdit: handleEditVoice,
            onDelete: handleDeleteVoice,
            onSetDefault: handleSetDefaultVoice
        });
        
        voicesGrid.appendChild(card.element);
        card.mount();
    });
}

// Update voices count
function updateVoicesCount(count) {
    const voicesCount = document.getElementById('voices-count');
    if (voicesCount) {
        voicesCount.textContent = count;
    }
}

// Open upload voice modal
function openUploadVoiceModal() {
    console.log('🎭 Opening upload voice modal...');
    const modal = document.getElementById('upload-voice-modal');
    console.log('Modal found:', !!modal);
    if (modal) {
        modal.classList.add('show'); // Changed from 'active' to 'show'
        resetUploadVoiceForm();
        console.log('✅ Modal opened and form reset');
        console.log('Modal classes:', modal.className);
        console.log('Modal display:', window.getComputedStyle(modal).display);
        
        // Log drop zone after modal opens
        setTimeout(() => {
            const dropZone = document.getElementById('voice-drop-zone');
            if (dropZone) {
                console.log('📍 Drop zone after modal open:');
                console.log('  - Element:', dropZone);
                console.log('  - Visible:', dropZone.offsetParent !== null);
                console.log('  - Display:', window.getComputedStyle(dropZone).display);
                console.log('  - Position:', dropZone.getBoundingClientRect());
            }
        }, 100);
    }
}

// Reset upload voice form
function resetUploadVoiceForm() {
    const form = document.getElementById('upload-voice-form');
    if (form) {
        form.reset();
    }
    
    selectedVoiceFile = null;
    
    const filePreview = document.getElementById('voice-file-preview');
    if (filePreview) {
        filePreview.hidden = true;
    }
}

// Handle voice file selection
function handleVoiceFileSelect(file) {
    console.log('📎 File selected:', file ? file.name : 'null');
    if (!file) return;
    
    console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
    });
    
    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
        console.error('❌ Invalid file type:', file.type);
        showToast('Invalid file type. Please upload MP3, WAV, OGG, or M4A files.', 'error');
        return;
    }
    
    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        console.error('❌ File too large:', file.size);
        showToast('File size exceeds 50MB limit', 'error');
        return;
    }
    
    selectedVoiceFile = file;
    console.log('✅ File validation passed, stored in selectedVoiceFile');
    
    // Show file preview
    const filePreview = document.getElementById('voice-file-preview');
    const fileName = document.getElementById('voice-file-name');
    const fileSize = document.getElementById('voice-file-size');
    
    if (filePreview && fileName && fileSize) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        filePreview.hidden = false;
        console.log('✅ File preview displayed');
    }
}

// Handle voice upload
async function handleVoiceUpload(e) {
    e.preventDefault();
    
    console.log('🎤 Starting voice upload...');
    console.log('Selected file:', selectedVoiceFile);
    
    if (!selectedVoiceFile) {
        showToast('Please select an audio file', 'error');
        console.error('❌ No file selected');
        return;
    }
    
    const name = document.getElementById('voice-name').value.trim();
    const description = document.getElementById('voice-description').value.trim();
    const gender = document.getElementById('voice-gender').value;
    const language = document.getElementById('voice-language').value;
    const accent = document.getElementById('voice-accent').value.trim();
    const tags = document.getElementById('voice-tags').value.trim();
    
    if (!name) {
        showToast('Please enter a voice name', 'error');
        console.error('❌ No voice name');
        return;
    }
    
    console.log('📝 Voice details:', { name, gender, language, fileSize: selectedVoiceFile.size });
    
    // Create FormData
    const formData = new FormData();
    formData.append('voiceAudio', selectedVoiceFile);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('gender', gender);
    formData.append('language', language);
    formData.append('accent', accent);
    formData.append('tags', tags);
    
    try {
        showToast('Uploading voice sample...', 'info');
        
        const submitBtn = document.getElementById('voice-upload-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        }
        
        console.log('📤 Sending upload request...');
        
        const response = await fetch('/api/custom-voices/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Upload failed:', errorText);
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Upload response:', data);
        
        if (data.success) {
            showToast('Voice sample uploaded successfully! Training will begin shortly.', 'success');
            
            // Reset form
            resetUploadVoiceForm();
            
            // Close modal
            const modal = document.getElementById('upload-voice-modal');
            if (modal) {
                modal.classList.remove('show'); // Changed from 'active' to 'show'
            }
            
            // Reload voices
            console.log('🔄 Reloading voices...');
            await loadCustomVoices();
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('❌ Upload error:', error);
        showToast(error.message || 'Failed to upload voice sample. Please try again.', 'error');
    } finally {
        const submitBtn = document.getElementById('voice-upload-submit');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Voice';
        }
    }
}

// Handle edit voice
function handleEditVoice(voice) {
    const modal = document.getElementById('edit-voice-modal');
    if (!modal) return;
    
    // Fill form with voice data
    document.getElementById('edit-voice-id').value = voice._id;
    document.getElementById('edit-voice-name').value = voice.name;
    document.getElementById('edit-voice-description').value = voice.description || '';
    document.getElementById('edit-voice-gender').value = voice.gender;
    document.getElementById('edit-voice-language').value = voice.language;
    document.getElementById('edit-voice-accent').value = voice.accent || '';
    document.getElementById('edit-voice-tags').value = voice.tags ? voice.tags.join(', ') : '';
    
    modal.classList.add('show'); // Changed from 'active' to 'show'
}

// Handle save edited voice
async function handleSaveEditedVoice(e) {
    e.preventDefault();
    
    const voiceId = document.getElementById('edit-voice-id').value;
    const name = document.getElementById('edit-voice-name').value.trim();
    const description = document.getElementById('edit-voice-description').value.trim();
    const gender = document.getElementById('edit-voice-gender').value;
    const language = document.getElementById('edit-voice-language').value;
    const accent = document.getElementById('edit-voice-accent').value.trim();
    const tags = document.getElementById('edit-voice-tags').value.trim();
    
    if (!name) {
        showToast('Please enter a voice name', 'error');
        return;
    }
    
    try {
        const response = await apiRequest(
            `/api/custom-voices/${voiceId}`,
            'PUT',
            {
                name,
                description,
                gender,
                language,
                accent,
                tags
            }
        );
        
        if (response.success) {
            showToast('Voice updated successfully', 'success');
            
            // Close modal
            const modal = document.getElementById('edit-voice-modal');
            if (modal) {
                modal.classList.remove('show'); // Changed from 'active' to 'show'
            }
            
            // Reload voices
            await loadCustomVoices();
        }
    } catch (error) {
        console.error('Update error:', error);
        showToast('Failed to update voice', 'error');
    }
}

// Handle delete voice
async function handleDeleteVoice(voice) {
    if (!confirm(`Are you sure you want to delete "${voice.name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await apiRequest(
            `/api/custom-voices/${voice._id}`,
            'DELETE'
        );
        
        if (response.success) {
            showToast('Voice deleted successfully', 'success');
            await loadCustomVoices();
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete voice', 'error');
    }
}

// Handle set default voice
async function handleSetDefaultVoice(voice) {
    try {
        const response = await apiRequest(
            `/api/custom-voices/${voice._id}`,
            'PUT',
            {
                isDefault: true
            }
        );
        
        if (response.success) {
            showToast(`"${voice.name}" set as default voice`, 'success');
            await loadCustomVoices();
        }
    } catch (error) {
        console.error('Set default error:', error);
        showToast('Failed to set default voice', 'error');
    }
}

// Handle play voice
function handlePlayVoice(voice) {
    console.log('Playing voice:', voice.name);
    // Audio playback is handled within the VoiceCloneCard component
}

// Initialize voice cloning events
function initVoiceCloning() {
    console.log('🎬 Initializing voice cloning module...');
    
    // Upload voice button
    const uploadVoiceBtn = document.getElementById('upload-voice-btn');
    console.log('Upload button found:', !!uploadVoiceBtn);
    if (uploadVoiceBtn) {
        uploadVoiceBtn.addEventListener('click', openUploadVoiceModal);
    }
    
    // Upload form
    const uploadForm = document.getElementById('upload-voice-form');
    console.log('Upload form found:', !!uploadForm);
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleVoiceUpload);
        console.log('✅ Upload form event listener attached');
    }
    
    // Edit form
    const editForm = document.getElementById('edit-voice-form');
    if (editForm) {
        editForm.addEventListener('submit', handleSaveEditedVoice);
    }
    
    // File input
    const fileInput = document.getElementById('voice-audio-file');
    console.log('File input found:', !!fileInput);
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            console.log('📁 File input changed, files:', e.target.files.length);
            if (e.target.files.length > 0) {
                handleVoiceFileSelect(e.target.files[0]);
            }
        });
    }
    
    // Drop zone
    const dropZone = document.getElementById('voice-drop-zone');
    console.log('Drop zone found:', !!dropZone);
    if (dropZone) {
        console.log('Drop zone element:', dropZone);
        console.log('Drop zone visible:', dropZone.offsetParent !== null);
        
        dropZone.addEventListener('click', () => {
            console.log('🖱️ Drop zone clicked, triggering file input');
            console.log('File input element:', fileInput);
            fileInput?.click();
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                handleVoiceFileSelect(e.dataTransfer.files[0]);
            }
        });
    }
    
    // File remove button
    const fileRemoveBtn = document.getElementById('voice-file-remove');
    if (fileRemoveBtn) {
        fileRemoveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedVoiceFile = null;
            fileInput.value = '';
            document.getElementById('voice-file-preview').hidden = true;
        });
    }
    
    console.log('✅ Voice cloning initialized');
}

// Format file size helper
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

