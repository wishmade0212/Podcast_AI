// Summaries JavaScript
// This file contains functionality specific to the summaries tab

// Function to filter summaries
function filterSummaries(status) {
    const summaryCards = document.querySelectorAll('.summary-card');
    
    summaryCards.forEach(card => {
        const statusElement = card.querySelector('.summary-status');
        const summaryStatus = statusElement.textContent.toLowerCase();
        
        if (status === 'all' || summaryStatus === status) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Function to expand/collapse all summaries
function toggleAllSummaries() {
    const summaryCards = document.querySelectorAll('.summary-card');
    const allExpanded = Array.from(summaryCards).every(card => {
        const content = card.querySelector('.summary-content');
        return content && content.classList.contains('expanded');
    });
    
    summaryCards.forEach(card => {
        const content = card.querySelector('.summary-content');
        const button = card.querySelector('.expand-btn');
        
        if (content && button) {
            if (allExpanded) {
                content.classList.remove('expanded');
                content.textContent = truncateText(content.textContent, 200);
                button.textContent = 'Show more';
            } else {
                content.classList.add('expanded');
                // Get the full text from the card's data
                const summaryId = card.getAttribute('data-id');
                // In a real implementation, you would fetch the full text
                button.textContent = 'Show less';
            }
        }
    });
}

// Function to export all summaries
function exportAllSummaries() {
    const summaryCards = document.querySelectorAll('.summary-card');
    const summaries = [];
    
    summaryCards.forEach(card => {
        const title = card.querySelector('.summary-document-title').textContent;
        const content = card.querySelector('.summary-content').textContent;
        
        summaries.push({
            title,
            content
        });
    });
    
    // Create a text file with all summaries
    const textContent = summaries.map(summary => 
        `# ${summary.title}\n\n${summary.content}\n\n---\n\n`
    ).join('');
    
    downloadData(textContent, 'all-summaries.txt');
}

// Initialize summary filters and actions
document.addEventListener('DOMContentLoaded', function() {
    // Status filter
    const summaryStatusFilter = document.getElementById('summary-status-filter');
    if (summaryStatusFilter) {
        summaryStatusFilter.addEventListener('change', function() {
            filterSummaries(this.value);
        });
    }
    
    // Add action buttons to the header
    const contentHeader = document.querySelector('#summaries-tab .content-header');
    if (contentHeader) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'header-actions';
        actionsDiv.innerHTML = `
            <button class="btn btn-outline btn-sm" id="toggle-all-summaries">
                <i class="fas fa-expand-alt"></i> Toggle All
            </button>
            <button class="btn btn-outline btn-sm" id="export-all-summaries">
                <i class="fas fa-download"></i> Export All
            </button>
        `;
        
        contentHeader.appendChild(actionsDiv);
        
        // Add event listeners
        document.getElementById('toggle-all-summaries').addEventListener('click', toggleAllSummaries);
        document.getElementById('export-all-summaries').addEventListener('click', exportAllSummaries);
    }
});