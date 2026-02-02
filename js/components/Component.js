// Base Component class
class Component {
    constructor(element) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        this.children = [];
        this.parent = null;
        this.isDestroyed = false;
        
        this.init();
    }
    
    // Initialize the component
    init() {
        // Override in subclasses
    }
    
    // Render the component
    render() {
        // Override in subclasses
        return '';
    }
    
    // Mount the component to the DOM
    mount() {
        if (!this.element) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.render();
            this.element = tempDiv.firstChild;
        }
        
        if (this.parent && this.parent.element) {
            this.parent.element.appendChild(this.element);
        }
        
        this.onMount();
    }
    
    // Unmount the component from the DOM
    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.onUnmount();
    }
    
    // Add a child component
    addChild(child) {
        if (child instanceof Component) {
            this.children.push(child);
            child.parent = this;
            
            if (this.element) {
                child.mount();
            }
        }
    }
    
    // Remove a child component
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            child.unmount();
        }
    }
    
    // Destroy the component and all its children
    destroy() {
        if (this.isDestroyed) return;
        
        // Destroy all children
        this.children.forEach(child => child.destroy());
        this.children = [];
        
        // Unmount the component
        this.unmount();
        
        // Clean up event listeners and other resources
        this.onDestroy();
        
        this.isDestroyed = true;
    }
    
    // Add event listener
    on(event, selector, handler) {
        if (typeof selector === 'function') {
            handler = selector;
            selector = null;
        }
        
        if (selector) {
            // Delegate event to child elements
            this.element.addEventListener(event, (e) => {
                if (e.target.matches(selector)) {
                    handler.call(this, e);
                }
            });
        } else {
            // Add event listener to the element itself
            this.element.addEventListener(event, handler.bind(this));
        }
    }
    
    // Find an element within the component
    find(selector) {
        return this.element.querySelector(selector);
    }
    
    // Find all elements within the component
    findAll(selector) {
        return this.element.querySelectorAll(selector);
    }
    
    // Add a class to the element
    addClass(className) {
        this.element.classList.add(className);
    }
    
    // Remove a class from the element
    removeClass(className) {
        this.element.classList.remove(className);
    }
    
    // Toggle a class on the element
    toggleClass(className) {
        this.element.classList.toggle(className);
    }
    
    // Check if the element has a class
    hasClass(className) {
        return this.element.classList.contains(className);
    }
    
    // Set an attribute on the element
    setAttribute(name, value) {
        this.element.setAttribute(name, value);
    }
    
    // Get an attribute from the element
    getAttribute(name) {
        return this.element.getAttribute(name);
    }
    
    // Set a property on the element
    setProperty(name, value) {
        this.element[name] = value;
    }
    
    // Get a property from the element
    getProperty(name) {
        return this.element[name];
    }
    
    // Set the HTML content of the element
    setHTML(html) {
        this.element.innerHTML = html;
    }
    
    // Get the HTML content of the element
    getHTML() {
        return this.element.innerHTML;
    }
    
    // Set the text content of the element
    setText(text) {
        this.element.textContent = text;
    }
    
    // Get the text content of the element
    getText() {
        return this.element.textContent;
    }
    
    // Show the element
    show() {
        this.element.style.display = '';
    }
    
    // Hide the element
    hide() {
        this.element.style.display = 'none';
    }
    
    // Lifecycle hooks
    onMount() {
        // Override in subclasses
    }
    
    onUnmount() {
        // Override in subclasses
    }
    
    onDestroy() {
        // Override in subclasses
    }
}

// Export the Component class
window.Component = Component;