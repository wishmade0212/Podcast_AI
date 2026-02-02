// Summary Card component class
class SummaryCard extends Component {
    constructor(summaryData, options = {}) {
        super();
        
        this.summary = summaryData;
        this.options = {
            showActions: options.showActions !== false,
            onCopy: options.onCopy || (() => {}),
            onDelete: options.onDelete || (() => {}),
            onView: options.onView || (() => {}),
            onCreatePodcast: options.onCreatePodcast || (() => {}),
            onViewDocument: options.onViewDocument || (() => {}),
            ...options
        };
        
        // Create the element immediately
        const tempDiv = window.document.createElement('div');
        tempDiv.innerHTML = this.render();
        this.element = tempDiv.firstElementChild;
    }
    
    // Calculate time saved from reading full document vs reading summary
    calculateTimeSaved() {
        const { summary } = this;
        if (!summary.document || !summary.document.wordCount) return 0;
        
        // Average reading speed: 200 words per minute
        const originalReadingTime = Math.ceil(summary.document.wordCount / 200);
        const summaryReadingTime = summary.readingTime || Math.ceil(summary.wordCount / 200);
        
        return Math.max(0, originalReadingTime - summaryReadingTime);
    }
    
    render() {
        const { summary } = this;
        const statusClass = getStatusClass(summary.processingStatus);
        const fileIcon = summary.document ? getFileIcon(summary.document.fileType) : 'fa-file';
        const formattedDate = formatDate(summary.createdAt);
        const compressionPercentage = formatPercentage(summary.compressionRatio);
        const timeSaved = this.calculateTimeSaved();
        
        return `
            <div class="summary-card" data-id="${summary._id}">
                <div class="summary-header">
                    <div class="summary-document">
                        <div class="summary-document-title" title="${summary.document ? summary.document.title : 'Unknown Document'}">
                            ${summary.document ? summary.document.title : 'Unknown Document'}
                        </div>
                        <div class="summary-document-meta">
                            <i class="fas ${fileIcon}"></i> ${summary.document ? summary.document.fileType.toUpperCase() : 'Unknown'} • ${formattedDate}
                        </div>
                    </div>
                    <div class="summary-status ${statusClass}">${capitalize(summary.processingStatus)}</div>
                </div>
                <div class="summary-body">
                    <div class="summary-text">
                        ${summary.processingStatus === 'completed' ? 
                            `<div class="summary-content">${truncateText(summary.summaryText, 200)}</div>
                            <button class="btn btn-link expand-btn">Show more</button>` :
                            'Summary is being generated...'
                        }
                    </div>
                    ${summary.processingStatus === 'completed' ? `
                        <div class="summary-stats">
                            <div class="summary-stat">
                                <div class="summary-stat-value">${formatNumber(summary.wordCount)}</div>
                                <div class="summary-stat-label">Words</div>
                            </div>
                            <div class="summary-stat">
                                <div class="summary-stat-value">${summary.readingTime} min</div>
                                <div class="summary-stat-label">Reading Time</div>
                            </div>
                            <div class="summary-stat">
                                <div class="summary-stat-value">${compressionPercentage}</div>
                                <div class="summary-stat-label">Compression</div>
                            </div>
                            <div class="summary-stat">
                                <div class="summary-stat-value">${timeSaved} min</div>
                                <div class="summary-stat-label">Time Saved</div>
                            </div>
                        </div>
                    ` : ''}
                    ${this.options.showActions ? this.renderActions() : ''}
                </div>
            </div>
        `;
    }
    
    renderActions() {
        const { summary } = this;
        
        return `
            <div class="summary-actions">
                ${summary.processingStatus === 'completed' ? `
                    <button class="btn btn-primary btn-sm create-podcast-btn" data-id="${summary._id}">
                        <i class="fas fa-microphone"></i> Create Podcast
                    </button>
                    <button class="btn btn-outline btn-sm copy-btn" data-id="${summary._id}">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="btn btn-outline btn-sm view-btn" data-id="${summary._id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${summary.document && summary.document._id ? `
                        <button class="btn btn-outline btn-sm view-document-btn" data-id="${summary.document._id}">
                            <i class="fas fa-file"></i> Document
                        </button>
                    ` : ''}
                ` : ''}
                <button class="btn btn-danger btn-sm delete-btn" data-id="${summary._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    }
    
    onMount() {
        if (!this.options.showActions) return;
        
        // Add event listeners
        this.on('click', '.create-podcast-btn', (e) => {
            const summaryId = e.currentTarget.getAttribute('data-id');
            this.options.onCreatePodcast(summaryId);
        });
        
        this.on('click', '.copy-btn', (e) => {
            const summaryId = e.currentTarget.getAttribute('data-id');
            this.options.onCopy(summaryId);
        });
        
        this.on('click', '.view-btn', (e) => {
            const summaryId = e.currentTarget.getAttribute('data-id');
            this.options.onView(summaryId);
        });
        
        this.on('click', '.view-document-btn', (e) => {
            const documentId = e.currentTarget.getAttribute('data-id');
            this.options.onViewDocument(documentId);
        });
        
        this.on('click', '.delete-btn', (e) => {
            const summaryId = e.currentTarget.getAttribute('data-id');
            this.options.onDelete(summaryId);
        });
        
        // Expand/collapse summary text
        this.on('click', '.expand-btn', (e) => {
            const contentElement = this.find('.summary-content');
            const buttonElement = e.currentTarget;
            
            if (contentElement.classList.contains('expanded')) {
                contentElement.classList.remove('expanded');
                contentElement.textContent = truncateText(this.summary.summaryText, 200);
                buttonElement.textContent = 'Show more';
            } else {
                contentElement.classList.add('expanded');
                contentElement.textContent = this.summary.summaryText;
                buttonElement.textContent = 'Show less';
            }
        });
    }
    
    updateStatus(status) {
        this.summary.processingStatus = status;
        
        const statusElement = this.find('.summary-status');
        if (statusElement) {
            statusElement.className = `summary-status ${getStatusClass(status)}`;
            statusElement.textContent = capitalize(status);
        }
        
        // Update content if status changed to completed
        if (status === 'completed') {
            const textElement = this.find('.summary-text');
            if (textElement) {
                textElement.innerHTML = `
                    <div class="summary-content">${truncateText(this.summary.summaryText, 200)}</div>
                    <button class="btn btn-link expand-btn">Show more</button>
                `;
            }
            
            // Add stats
            const bodyElement = this.find('.summary-body');
            if (bodyElement) {
                const timeSaved = this.calculateTimeSaved();
                const statsElement = document.createElement('div');
                statsElement.className = 'summary-stats';
                statsElement.innerHTML = `
                    <div class="summary-stat">
                        <div class="summary-stat-value">${formatNumber(this.summary.wordCount)}</div>
                        <div class="summary-stat-label">Words</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-stat-value">${this.summary.readingTime} min</div>
                        <div class="summary-stat-label">Reading Time</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-stat-value">${formatPercentage(this.summary.compressionRatio)}</div>
                        <div class="summary-stat-label">Compression</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-stat-value">${timeSaved} min</div>
                        <div class="summary-stat-label">Time Saved</div>
                    </div>
                `;
                
                const actionsElement = bodyElement.querySelector('.summary-actions');
                if (actionsElement) {
                    bodyElement.insertBefore(statsElement, actionsElement);
                } else {
                    bodyElement.appendChild(statsElement);
                }
            }
            
            // Update actions
            if (this.options.showActions) {
                const actionsElement = bodyElement.querySelector('.summary-actions');
                if (actionsElement) {
                    actionsElement.innerHTML = this.renderActions();
                    this.onMount(); // Re-attach event listeners
                }
            }
            
            // Re-attach event listeners for expand button
            this.onMount();
        }
    }
}

// Export the SummaryCard class
window.SummaryCard = SummaryCard;