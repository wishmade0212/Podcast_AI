// Modal component class
class Modal extends Component {
    constructor(options = {}) {
        super('#modal-container');
        
        this.options = {
            title: options.title || '',
            content: options.content || '',
            footer: options.footer || '',
            size: options.size || 'medium', // small, medium, large
            closeOnBackdrop: options.closeOnBackdrop !== false,
            closeOnEscape: options.closeOnEscape !== false,
            showCloseButton: options.showCloseButton !== false,
            ...options
        };
        
        this.isOpen = false;
        this.modalElement = null;
        this.backdropElement = null;
        
        this.createModal();
    }
    
    createModal() {
        // Create backdrop
        this.backdropElement = document.createElement('div');
        this.backdropElement.className = 'modal-backdrop';
        
        // Create modal
        this.modalElement = document.createElement('div');
        this.modalElement.className = `modal modal-${this.options.size}`;
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        
        if (this.options.title) {
            const title = document.createElement('h3');
            title.textContent = this.options.title;
            modalHeader.appendChild(title);
        }
        
        if (this.options.showCloseButton) {
            const closeButton = document.createElement('button');
            closeButton.className = 'modal-close';
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            closeButton.addEventListener('click', () => this.close());
            modalHeader.appendChild(closeButton);
        }
        
        // Create modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        if (typeof this.options.content === 'string') {
            modalBody.innerHTML = this.options.content;
        } else if (this.options.content instanceof HTMLElement) {
            modalBody.appendChild(this.options.content);
        }
        
        // Create modal footer
        let modalFooter = null;
        if (this.options.footer) {
            modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            
            if (typeof this.options.footer === 'string') {
                modalFooter.innerHTML = this.options.footer;
            } else if (this.options.footer instanceof HTMLElement) {
                modalFooter.appendChild(this.options.footer);
            }
        }
        
        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        
        if (modalFooter) {
            modalContent.appendChild(modalFooter);
        }
        
        this.modalElement.appendChild(modalContent);
        
        // Add event listeners
        if (this.options.closeOnBackdrop) {
            this.backdropElement.addEventListener('click', () => this.close());
        }
        
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }
    }
    
    open() {
        if (this.isOpen) return;
        
        // Add backdrop and modal to the DOM
        document.body.appendChild(this.backdropElement);
        document.body.appendChild(this.modalElement);
        
        // Trigger reflow for transition
        this.backdropElement.offsetHeight;
        
        // Show modal
        this.backdropElement.classList.add('show');
        this.modalElement.classList.add('show');
        
        this.isOpen = true;
        this.onOpen();
    }
    
    close() {
        if (!this.isOpen) return;
        
        // Hide modal
        this.backdropElement.classList.remove('show');
        this.modalElement.classList.remove('show');
        
        // Wait for transition to complete before removing from DOM
        setTimeout(() => {
            if (this.backdropElement.parentNode) {
                document.body.removeChild(this.backdropElement);
            }
            
            if (this.modalElement.parentNode) {
                document.body.removeChild(this.modalElement);
            }
        }, 300);
        
        this.isOpen = false;
        this.onClose();
    }
    
    setTitle(title) {
        this.options.title = title;
        const titleElement = this.modalElement.querySelector('.modal-header h3');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    setContent(content) {
        this.options.content = content;
        const bodyElement = this.modalElement.querySelector('.modal-body');
        
        if (bodyElement) {
            if (typeof content === 'string') {
                bodyElement.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                bodyElement.innerHTML = '';
                bodyElement.appendChild(content);
            }
        }
    }
    
    setFooter(footer) {
        this.options.footer = footer;
        let footerElement = this.modalElement.querySelector('.modal-footer');
        
        if (footer) {
            if (!footerElement) {
                footerElement = document.createElement('div');
                footerElement.className = 'modal-footer';
                this.modalElement.querySelector('.modal-content').appendChild(footerElement);
            }
            
            if (typeof footer === 'string') {
                footerElement.innerHTML = footer;
            } else if (footer instanceof HTMLElement) {
                footerElement.innerHTML = '';
                footerElement.appendChild(footer);
            }
        } else if (footerElement) {
            footerElement.parentNode.removeChild(footerElement);
        }
    }
    
    // Lifecycle hooks
    onOpen() {
        // Override in subclasses
    }
    
    onClose() {
        // Override in subclasses
    }
}

// Export the Modal class
window.Modal = Modal;