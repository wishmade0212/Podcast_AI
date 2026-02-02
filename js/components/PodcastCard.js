// Podcast Card component class
class PodcastCard extends Component {
    constructor(podcastData, options = {}) {
        super();
        
        this.podcast = podcastData;
        this.options = {
            showActions: options.showActions !== false,
            onPlay: options.onPlay || (() => {}),
            onDownload: options.onDownload || (() => {}),
            onDelete: options.onDelete || (() => {}),
            onShare: options.onShare || (() => {}),
            ...options
        };
        
        // Create the element immediately
        const tempDiv = window.document.createElement('div');
        tempDiv.innerHTML = this.render();
        this.element = tempDiv.firstElementChild;
    }
    
    render() {
        const { podcast } = this;
        const statusClass = getStatusClass(podcast.processingStatus);
        const fileIcon = podcast.document ? getFileIcon(podcast.document.fileType) : 'fa-file';
        const formattedDate = formatDate(podcast.createdAt);
        const formattedDuration = podcast.duration ? formatDuration(podcast.duration) : 'Unknown';
        const formattedSize = podcast.audioSize ? formatFileSize(podcast.audioSize) : 'Unknown';
        
        return `
            <div class="podcast-card" data-id="${podcast._id}">
                <div class="podcast-header">
                    <div class="podcast-info">
                        <div class="podcast-title" title="${podcast.title}">${podcast.title}</div>
                        <div class="podcast-document">
                            <i class="fas ${fileIcon}"></i> ${podcast.document ? podcast.document.title : 'Unknown Document'}
                        </div>
                    </div>
                    <div class="podcast-status ${statusClass}">${capitalize(podcast.processingStatus)}</div>
                </div>
                <div class="podcast-body">
                    ${podcast.processingStatus === 'generating' ? this.renderProgress() : ''}
                    ${podcast.processingStatus === 'completed' ? this.renderWaveform() : ''}
                    ${podcast.processingStatus === 'completed' ? this.renderStats(formattedDuration, formattedSize) : ''}
                    ${this.options.showActions ? this.renderActions() : ''}
                </div>
            </div>
        `;
    }
    
    renderProgress() {
        return `
            <div class="podcast-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">Generating podcast... 0%</div>
            </div>
        `;
    }
    
    renderWaveform() {
        return `
            <div class="podcast-waveform">
                <i class="fas fa-wave-square"></i>
                <span>Audio waveform</span>
            </div>
        `;
    }
    
    renderStats(duration, size) {
        return `
            <div class="podcast-stats">
                <div class="podcast-stat">
                    <div class="podcast-stat-value">${duration}</div>
                    <div class="podcast-stat-label">Duration</div>
                </div>
                <div class="podcast-stat">
                    <div class="podcast-stat-value">${size}</div>
                    <div class="podcast-stat-label">Size</div>
                </div>
            </div>
        `;
    }
    
    renderActions() {
        const { podcast } = this;
        // Check if podcast has valid audio (file or browser TTS)
        const isBrowserTTS = podcast.storageType === 'browser' || podcast.audioUrl === 'browser-tts';
        const hasAudioFile = (podcast.audioUrl && podcast.audioUrl !== '' && podcast.audioUrl !== 'null' && podcast.audioUrl !== 'undefined' && podcast.audioUrl !== 'browser-tts' && !podcast.audioUrl.includes('example.com')) || podcast.gcsPath;
        const hasAudio = isBrowserTTS || hasAudioFile;
        
        return `
            <div class="podcast-actions">
                ${podcast.processingStatus === 'completed' && hasAudio ? `
                    <button class="btn btn-primary btn-sm play-btn" data-id="${podcast._id}" data-url="${podcast.audioUrl || ''}">
                        <i class="fas fa-play"></i> Play
                    </button>
                    ${!isBrowserTTS ? `
                        <button class="btn btn-outline btn-sm download-btn" data-id="${podcast._id}" data-url="${podcast.audioUrl || ''}" data-title="${podcast.title}">
                            <i class="fas fa-download"></i> Download
                        </button>
                    ` : `
                        <span class="text-muted" style="font-size: 0.75rem;">
                            <i class="fas fa-info-circle"></i> Browser TTS (no download)
                        </span>
                    `}
                    <button class="btn btn-outline btn-sm share-btn" data-id="${podcast._id}">
                        <i class="fas fa-share"></i> Share
                    </button>
                ` : podcast.processingStatus === 'completed' && !hasAudio ? `
                    <p class="text-muted" style="font-size: 0.875rem; margin: 0.5rem 0;">
                        <i class="fas fa-info-circle"></i> This podcast was created with an old version. Please regenerate to enable playback.
                    </p>
                ` : ''}
                <button class="btn btn-danger btn-sm delete-btn" data-id="${podcast._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    }
    
    onMount() {
        if (!this.options.showActions) return;
        
        // Add event listeners
        this.on('click', '.play-btn', (e) => {
            const podcastId = e.currentTarget.getAttribute('data-id');
            const audioUrl = e.currentTarget.getAttribute('data-url');
            this.options.onPlay(podcastId, audioUrl);
        });
        
        this.on('click', '.download-btn', (e) => {
            const podcastId = e.currentTarget.getAttribute('data-id');
            const audioUrl = e.currentTarget.getAttribute('data-url');
            const title = e.currentTarget.getAttribute('data-title');
            this.options.onDownload(podcastId, audioUrl, title);
        });
        
        this.on('click', '.share-btn', (e) => {
            const podcastId = e.currentTarget.getAttribute('data-id');
            this.options.onShare(podcastId);
        });
        
        this.on('click', '.delete-btn', (e) => {
            const podcastId = e.currentTarget.getAttribute('data-id');
            this.options.onDelete(podcastId);
        });
    }
    
    updateProgress(percent) {
        const progressFill = this.find('.progress-fill');
        const progressText = this.find('.progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = `Generating podcast... ${percent}%`;
        }
    }
    
    updateStatus(status) {
        this.podcast.processingStatus = status;
        
        const statusElement = this.find('.podcast-status');
        if (statusElement) {
            statusElement.className = `podcast-status ${getStatusClass(status)}`;
            statusElement.textContent = capitalize(status);
        }
        
        // Update content if status changed to completed
        if (status === 'completed') {
            const bodyElement = this.find('.podcast-body');
            if (bodyElement) {
                // Remove progress if it exists
                const progressElement = bodyElement.querySelector('.podcast-progress');
                if (progressElement) {
                    progressElement.remove();
                }
                
                // Add waveform if it doesn't exist
                if (!bodyElement.querySelector('.podcast-waveform')) {
                    const waveformElement = document.createElement('div');
                    waveformElement.className = 'podcast-waveform';
                    waveformElement.innerHTML = `
                        <i class="fas fa-wave-square"></i>
                        <span>Audio waveform</span>
                    `;
                    
                    const actionsElement = bodyElement.querySelector('.podcast-actions');
                    if (actionsElement) {
                        bodyElement.insertBefore(waveformElement, actionsElement);
                    } else {
                        bodyElement.appendChild(waveformElement);
                    }
                }
                
                // Add stats if they don't exist
                if (!bodyElement.querySelector('.podcast-stats')) {
                    const formattedDuration = this.podcast.duration ? formatDuration(this.podcast.duration) : 'Unknown';
                    const formattedSize = this.podcast.audioSize ? formatFileSize(this.podcast.audioSize) : 'Unknown';
                    
                    const statsElement = document.createElement('div');
                    statsElement.className = 'podcast-stats';
                    statsElement.innerHTML = this.renderStats(formattedDuration, formattedSize);
                    
                    const waveformElement = bodyElement.querySelector('.podcast-waveform');
                    const actionsElement = bodyElement.querySelector('.podcast-actions');
                    
                    if (waveformElement && actionsElement) {
                        bodyElement.insertBefore(statsElement, actionsElement);
                    } else if (actionsElement) {
                        bodyElement.insertBefore(statsElement, actionsElement);
                    } else {
                        bodyElement.appendChild(statsElement);
                    }
                }
                
                // Update actions
                if (this.options.showActions) {
                    const actionsElement = bodyElement.querySelector('.podcast-actions');
                    if (actionsElement) {
                        actionsElement.innerHTML = this.renderActions();
                        this.onMount(); // Re-attach event listeners
                    }
                }
            }
        }
    }
}

// Export the PodcastCard class
window.PodcastCard = PodcastCard;