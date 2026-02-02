// Document Card component class
class DocumentCard extends Component {
    constructor(documentData, options = {}) {
        super();
        
        this.document = documentData;
        this.options = {
            showActions: options.showActions !== false,
            onSummarize: options.onSummarize || (() => {}),
            onDelete: options.onDelete || (() => {}),
            onView: options.onView || (() => {}),
            onCreatePodcast: options.onCreatePodcast || (() => {}),
            ...options
        };
        
        // Create the element immediately
        const tempDiv = window.document.createElement('div');
        tempDiv.innerHTML = this.render();
        this.element = tempDiv.firstElementChild;
    }
    
    render() {
        const { document } = this;
        const statusClass = getStatusClass(document.processingStatus);
        const fileIcon = getFileIcon(document.fileType);
        const formattedSize = formatFileSize(document.fileSize);
        const formattedDate = formatDate(document.createdAt);
        
        return `
            <div class="document-card" data-id="${document._id}">
                <div class="document-header">
                    <div class="document-icon">
                        <i class="fas ${fileIcon}"></i>
                    </div>
                    <div class="document-info">
                        <div class="document-title" title="${document.title}">${document.title}</div>
                        <div class="document-meta">${formattedSize} • ${formattedDate}</div>
                    </div>
                    <div class="document-status ${statusClass}">${capitalize(document.processingStatus)}</div>
                </div>
                <div class="document-body">
                    <div class="document-stats">
                        <div class="document-stat">
                            <div class="document-stat-value">${formatNumber(document.wordCount)}</div>
                            <div class="document-stat-label">Words</div>
                        </div>
                        <div class="document-stat">
                            <div class="document-stat-value">${calculateReadingTime(document.wordCount)}</div>
                            <div class="document-stat-label">Reading Time</div>
                        </div>
                    </div>
                    ${this.options.showActions ? this.renderActions() : ''}
                </div>
            </div>
        `;
    }
    
    renderActions() {
        const { document } = this;
        
        return `
            <div class="document-actions">
                ${document.processingStatus === 'completed' ? `
                    <button class="btn btn-primary btn-sm create-podcast-btn" data-id="${document._id}">
                        <i class="fas fa-microphone"></i> Create Podcast
                    </button>
                    <button class="btn btn-outline btn-sm summarize-btn" data-id="${document._id}">
                        <i class="fas fa-compress-alt"></i> Summarize
                    </button>
                    <button class="btn btn-outline btn-sm view-btn" data-id="${document._id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                ` : ''}
                <button class="btn btn-danger btn-sm delete-btn" data-id="${document._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    }
    
    onMount() {
        if (!this.options.showActions) return;
        
        // Add event listeners
        this.on('click', '.create-podcast-btn', (e) => {
            const documentId = e.currentTarget.getAttribute('data-id');
            this.options.onCreatePodcast(documentId);
        });
        
        this.on('click', '.summarize-btn', (e) => {
            const documentId = e.currentTarget.getAttribute('data-id');
            this.options.onSummarize(documentId);
        });
        
        this.on('click', '.view-btn', (e) => {
            const documentId = e.currentTarget.getAttribute('data-id');
            this.options.onView(documentId);
        });
        
        this.on('click', '.delete-btn', (e) => {
            const documentId = e.currentTarget.getAttribute('data-id');
            this.options.onDelete(documentId);
        });
    }
    
    updateStatus(status) {
        this.document.processingStatus = status;
        
        const statusElement = this.find('.document-status');
        if (statusElement) {
            statusElement.className = `document-status ${getStatusClass(status)}`;
            statusElement.textContent = capitalize(status);
        }
        
        // Update actions if status changed to completed
        if (status === 'completed' && this.options.showActions) {
            const bodyElement = this.find('.document-body');
            if (bodyElement) {
                const actionsElement = bodyElement.querySelector('.document-actions');
                if (actionsElement) {
                    actionsElement.innerHTML = this.renderActions();
                    this.onMount(); // Re-attach event listeners
                } else {
                    const newActionsElement = document.createElement('div');
                    newActionsElement.className = 'document-actions';
                    newActionsElement.innerHTML = this.renderActions();
                    bodyElement.appendChild(newActionsElement);
                    this.onMount(); // Re-attach event listeners
                }
            }
        }
    }
}

// Export the DocumentCard class
window.DocumentCard = DocumentCard;