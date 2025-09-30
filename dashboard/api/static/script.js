// API Base URL - Point to your Flask backend
const API_BASE = '/api';

// State management
let currentKeywords = [];
let scrapData = [];
let logsData = [];
let promptsData = [];

// DOM Elements
const navButtons = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingMessage = document.getElementById('loading-message');

// Debug mode
const DEBUG = true;

function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
}

window.onload = function() {
    loadInitialData();
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    debugLog('Initializing application...');
    initializeNavigation();
    initializeDashboard();
    initializeScrapResults();
    initializeLogs();
    loadInitialData();
});

// Navigation
function initializeNavigation() {
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            debugLog(`Navigation clicked: ${targetSection}`);
            
            // Update active nav button
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show target section
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
            
            // Load section-specific data
            if (targetSection === 'scrap-results') {
                loadScrapResults();
            } else if (targetSection === 'logs') {
                loadLogs();
            } else if (targetSection === 'dashboard') {
                loadPrompts();
            }
        });
    });
}

// Dashboard Section
function initializeDashboard() {
    // Custom prompt character counter
    const promptTextarea = document.getElementById('custom-prompt');
    const charCount = document.getElementById('char-count');
    
    promptTextarea.addEventListener('input', function() {
        charCount.textContent = this.value.length;
    });

    
    
    // Prompt management
    document.getElementById('save-prompt').addEventListener('click', saveCustomPrompt);
    document.getElementById('clear-prompt').addEventListener('click', clearActivePrompt);
    
    // Keywords management
    document.getElementById('add-keyword').addEventListener('click', addNewKeyword);
    document.getElementById('save-keywords').addEventListener('click', saveKeywords);
    document.getElementById('reset-keywords').addEventListener('click', resetKeywords);
    
    // Enter key for adding keywords
    document.getElementById('new-keyword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewKeyword();
        }
    });
}

// Scrap Results Section
function initializeScrapResults() {
    // Refresh scraper button
    document.getElementById('refresh-scraper').addEventListener('click', refreshScraper);
    
    // Filter functionality
    document.getElementById('relevance-filter').addEventListener('change', filterScrapResults);
    document.getElementById('site-filter').addEventListener('input', filterScrapResults);
    document.getElementById('keyword-filter').addEventListener('input', filterScrapResults);
    document.getElementById('section-filter').addEventListener('input', filterScrapResults);
    document.getElementById('clear-filters').addEventListener('click', clearScrapFilters);
}

// Logs Section
function initializeLogs() {
    // Logs filter
    document.getElementById('logs-date-filter').addEventListener('change', filterLogs);
    document.getElementById('clear-logs-filters').addEventListener('click', clearLogsFilter);
}

// Load initial data
async function loadInitialData() {
    showLoading('Loading initial data...');
    try {
        // First, check if backend is reachable
        await checkBackendHealth();
        
        // Then load all data
        await Promise.all([
            loadKeywords(),
            loadPrompts(),
            loadScrapResults(),
            loadLogs(),
        ]);
        showNotification('Application loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('Error loading initial data: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Check backend health
async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        if (!response.ok) {
            throw new Error(`Backend not responding: ${response.status}`);
        }
        const data = await response.json();
        debugLog('Backend health check:', data);
        return data;
    } catch (error) {
        debugLog('Backend health check failed:', error);
        throw new Error(`Cannot connect to backend at ${API_BASE}. Make sure your Flask server is running on port 5000.`);
    }
}

// API Functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };
    
    if (options.body) {
        config.body = JSON.stringify(options.body);
    }
    
    debugLog(`API Call: ${url}`, config);
    
    try {
        const response = await fetch(url, config);
        debugLog(`API Response Status: ${response.status} for ${url}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        
        const data = await response.json();
        debugLog(`API Response Data for ${url}:`, data);
        return data;
    } catch (error) {
        console.error(`API call failed for ${url}:`, error);
        throw error;
    }
}

// Dashboard Functions - Keywords
async function loadKeywords() {
    try {
        debugLog('Loading keywords...');
        const data = await apiCall('/get-keywords');
        currentKeywords = data.keywords || [];
        renderKeywords();
        updateKeywordStats();
        debugLog('Keywords loaded:', currentKeywords);
    } catch (error) {
        console.error('Error loading keywords:', error);
        showNotification('Error loading keywords: ' + error.message, 'error');
    }
}

function renderKeywords() {
    const container = document.getElementById('keywords-container');
    container.innerHTML = '';
    
    if (currentKeywords.length === 0) {
        container.innerHTML = '<div class="empty-state">No keywords configured</div>';
        return;
    }
    
    currentKeywords.forEach((keyword, index) => {
        const keywordElement = document.createElement('div');
        keywordElement.className = 'keyword-item';
        keywordElement.innerHTML = `
            <span class="keyword-text">${escapeHtml(keyword)}</span>
            <div class="keyword-actions">
                <button class="keyword-btn-delete" onclick="deleteKeyword(${index})">X</button>
            </div>
        `;
        container.appendChild(keywordElement);
    });
}

function updateKeywordStats() {
    const countElement = document.getElementById('keyword-count');
    countElement.textContent = `${currentKeywords.length} keywords`;
}

function addNewKeyword() {
    const input = document.getElementById('new-keyword');
    const keyword = input.value.trim();
    
    if (keyword) {
        if (!currentKeywords.includes(keyword)) {
            currentKeywords.push(keyword);
            renderKeywords();
            updateKeywordStats();
            input.value = '';
            showNotification('Keyword added', 'success');
        } else {
            showNotification('Keyword already exists', 'error');
        }
    } else {
        showNotification('Please enter a keyword', 'error');
    }
}

function editKeyword(index) {
    const newKeyword = prompt('Edit keyword:', currentKeywords[index]);
    if (newKeyword && newKeyword.trim()) {
        currentKeywords[index] = newKeyword.trim();
        renderKeywords();
        showNotification('Keyword updated', 'success');
    }
}

function deleteKeyword(index) {
    const deletedKeyword = currentKeywords[index];
    currentKeywords.splice(index, 1);
    renderKeywords();
    updateKeywordStats();
    showNotification(`Keyword "${deletedKeyword}" deleted`, 'success');
}

async function saveKeywords() {
    if (currentKeywords.length === 0) {
        showNotification('No keywords to save', 'error');
        return;
    }
    
    showLoading('Saving keywords...');
    try {
        const result = await apiCall('/save-keywords', {
            method: 'POST',
            body: { keywords: currentKeywords }
        });
        showNotification(result.message || 'Keywords saved successfully', 'success');
    } catch (error) {
        showNotification('Error saving keywords: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function resetKeywords() {
    if (confirm('Reset to default keywords? This will replace all current keywords.')) {
        showLoading('Resetting keywords...');
        try {
            // Clear current keywords and reload from server (which has defaults)
            currentKeywords = [];
            await loadKeywords();
            showNotification('Keywords reset to defaults', 'success');
        } catch (error) {
            showNotification('Error resetting keywords: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }
}

// Dashboard Functions - Prompts
async function loadPrompts() {
    try {
        debugLog('Loading prompts...');
        const data = await apiCall('/get-prompts');
        console.log("dddddddd")
        console.log(data);
        promptsData = data.prompts || [];
        renderPrompts(promptsData);
        
        // Check for active prompt
        const activePrompt = promptsData.find(p => p.is_active);
        displayActivePromptInEditWindow(activePrompt);
        updateActivePromptDisplay(activePrompt);
        
        debugLog('Prompts loaded:', promptsData);
    } catch (error) {
        console.error('Error loading prompts:', error);
        // showNotification('Error loading prompts: ' + error.message, 'error');
    }
}

function renderPrompts(prompts) {
    const container = document.getElementById('prompts-list');
    
    if (prompts.length === 0) {
        container.innerHTML = '<div class="empty-state">No saved prompts yet</div>';
        return;
    }
    
    container.innerHTML = prompts.map(prompt => `
        <div class="prompt-item ${prompt.is_active ? 'active' : ''}">
            <div class="prompt-content">
                <div class="prompt-text">${escapeHtml(prompt.prompt)}</div>
                <div class="prompt-meta">
                    Created: ${new Date(prompt.created_at).toLocaleString()}
                    ${prompt.is_active ? ' • <strong>ACTIVE</strong>' : ''}
                </div>
            </div>
            <div class="prompt-actions">
                ${!prompt.is_active ? `
                    <button class="btn-activate" onclick="activatePrompt(${prompt.id})">
                        Activate
                    </button>
                ` : ''}
                <button class="btn-delete" onclick="deletePrompt(${prompt.id})">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function displayActivePromptInEditWindow(prompt) {
    const promptTextarea = document.getElementById('custom-prompt');
    if (prompt) {
        // promptTextarea.value = '';
        promptTextarea.value = prompt.prompt;
        document.getElementById('char-count').textContent = prompt.prompt.length;
    }   
}

function updateActivePromptDisplay(prompt) {
    const display = document.getElementById('active-prompt-display');
    const text = document.getElementById('active-prompt-text');
    const status = document.getElementById('active-prompt-status');
    
    if (prompt) {
        text.textContent = prompt.prompt;
        display.style.display = 'block';
        status.textContent = 'Active prompt configured';
        status.style.color = 'var(--success-color)';
    } else {
        display.style.display = 'none';
        status.textContent = 'No active prompt';
        status.style.color = 'var(--text-muted)';
    }
}

async function saveCustomPrompt() {
    const promptText = document.getElementById('custom-prompt').value.trim();
    
    if (!promptText) {
        showNotification('Please enter a prompt', 'error');
        return;
    }
    
    if (promptText.length < 10) {
        showNotification('Prompt should be at least 10 characters long', 'error');
        return;
    }
    
    showLoading('Saving custom prompt...');
    try {
        const result = await apiCall('/save-prompt', {
            method: 'POST',
            body: { prompt: promptText }
        });
        
        // Clear the textarea
        document.getElementById('custom-prompt').value = '';
        document.getElementById('char-count').textContent = '0';
        
        // Reload prompts to show the new active one
        await loadPrompts();
        showNotification(result.message, 'success');
    } catch (error) {
        showNotification('Error saving prompt: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function activatePrompt(promptId) {
    showLoading('Activating prompt...');
    try {
        // Get the prompt text and save it as active
        const prompt = promptsData.find(p => p.id === promptId);
        
        if (prompt) {
            await apiCall('/save-prompt', {
                method: 'POST',
                body: { prompt: prompt.prompt }
            });
            await loadPrompts();
            showNotification('Prompt activated successfully', 'success');
        } else {
            showNotification('Prompt not found', 'error');
        }
    } catch (error) {
        showNotification('Error activating prompt: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deletePrompt(promptId) {
    if (!confirm('Are you sure you want to delete this prompt?')) {
        return;
    }
    
    showLoading('Deleting prompt...');
    try {
        await apiCall(`/delete-prompt/${promptId}`, {
            method: 'DELETE'
        });
        await loadPrompts();
        showNotification('Prompt deleted successfully', 'success');
    } catch (error) {
        showNotification('Error deleting prompt: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function clearActivePrompt() {
    if (!confirm('Clear the active prompt? This will use the default analysis behavior for future scrapes.')) {
        return;
    }
    
    showLoading('Clearing active prompt...');
    try {
        // To clear active prompt, we need to deactivate all prompts
        // Since our backend only has activate/save, we'll reload to reflect no active prompt
        const prompts = await apiCall('/get-prompts');
        const activePrompt = prompts.prompts.find(p => p.is_active);
        
        if (activePrompt) {
            // Deactivate by updating is_active to false (this would require backend update)
            // For now, we'll just show a message that user needs to activate another prompt or save new one
            showNotification('To clear active prompt, save a new prompt or delete the current one', 'info');
        } else {
            updateActivePromptDisplay(null);
            showNotification('No active prompt to clear', 'info');
        }
    } catch (error) {
        showNotification('Error clearing prompt: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Scrap Results Functions
async function loadScrapResults() {
    const loadingElement = document.getElementById('scrap-loading');
    const emptyElement = document.getElementById('scrap-empty');
    const tableBody = document.getElementById('scrap-results-body');
    
    loadingElement.style.display = 'block';
    emptyElement.style.display = 'none';
    tableBody.innerHTML = '';
    
    try {
        debugLog('Loading scrap results...');
        const data = await apiCall('/scrap-data');
        scrapData = data.data || [];
        debugLog('Scrap results loaded:', scrapData);
        renderScrapResults(scrapData);
        updateScrapResultsStats();
        
        if (scrapData.length === 0) {
            emptyElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading scrap results:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--error-color);">
                    Error loading scrap results: ${error.message}
                </td>
            </tr>
        `;
        showNotification('Error loading scrap results: ' + error.message, 'error');
    } finally {
        loadingElement.style.display = 'none';
    }
}

function renderScrapResults(data) {
    const tableBody = document.getElementById('scrap-results-body');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.site || 'N/A')}</td>
            <td>${escapeHtml(item.keywords || 'N/A')}</td>
            <td title="${escapeHtml(item.title || '')}">
                ${truncateText(item.title || 'N/A', 60)}
            </td>
            <td>
                ${item.url ? `
                    <a href="${item.url}" target="_blank" title="${escapeHtml(item.url)}" style="color: var(--accent-color);">
                        Link
                    </a>
                ` : 'N/A'}
            </td>
            <td>${escapeHtml(item.section || 'N/A')}</td>
            <td>
                <span class="relevance-badge relevance-${item.relevance || 'Low'}">
                    ${item.relevance || 'Low'}
                </span>
            </td>
            <td>${escapeHtml(item.date || 'N/A')}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateScrapResultsStats() {
    const countElement = document.getElementById('results-count');
    const updatedElement = document.getElementById('last-updated');
    
    countElement.textContent = `${scrapData.length} results`;
    updatedElement.textContent = `Last updated: ${new Date().toLocaleString()}`;
}

async function refreshScraper() {
    showLoading('Refreshing scraper... This may take a few minutes.');
    try {
        const result = await apiCall('/refresh-scraper');
        
        let message = result.message;
        if (result.prompt_used) {
            message += ' (Custom prompt was used)';
        }
        
        showNotification(message, 'success');
        await loadScrapResults(); // Reload the updated data
    } catch (error) {
        showNotification('Error refreshing scraper: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function filterScrapResults() {
    const relevanceFilter = document.getElementById('relevance-filter').value;
    const siteFilter = document.getElementById('site-filter').value.toLowerCase();
    const keywordFilter = document.getElementById('keyword-filter').value.toLowerCase();
    const sectionFilter = document.getElementById('section-filter').value.toLowerCase();
    
    const filteredData = scrapData.filter(item => {
        const matchesRelevance = !relevanceFilter || item.relevance === relevanceFilter;
        const matchesSite = !siteFilter || (item.site && item.site.toLowerCase().includes(siteFilter));
        const matchesKeyword = !keywordFilter || (item.keywords && item.keywords.toLowerCase().includes(keywordFilter));
        const matchesSection = !sectionFilter || (item.section && item.section.toLowerCase().includes(sectionFilter));
        
        return matchesRelevance && matchesSite && matchesKeyword && matchesSection;
    });
    
    renderScrapResults(filteredData);
}

function clearScrapFilters() {
    document.getElementById('relevance-filter').value = '';
    document.getElementById('site-filter').value = '';
    document.getElementById('keyword-filter').value = '';
    document.getElementById('section-filter').value = '';
    renderScrapResults(scrapData);
}

async function loadLogs() {
    const loadingElement = document.getElementById('logs-loading');
    const emptyElement = document.getElementById('logs-empty');
    const tableBody = document.getElementById('logs-body');
    
    loadingElement.style.display = 'block';
    emptyElement.style.display = 'none';
    tableBody.innerHTML = '';
    
    try {
        debugLog('Loading logs...');
        const data = await apiCall('/get-logs');
        logsData = data.logs || [];
        debugLog('Logs loaded:', logsData);
        renderLogs(logsData);
        
        if (logsData.length === 0) {
            emptyElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading logs:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--error-color);">
                    Error loading logs: ${error.message}
                </td>
            </tr>
        `;
        showNotification('Error loading logs: ' + error.message, 'error');
    } finally {
        loadingElement.style.display = 'none';
    }
}

function renderLogs(data) {
    const tableBody = document.getElementById('logs-body');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        return;
    }
    
    data.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(log.scrape_start)}</td>
            <td>${formatDateTime(log.scrape_end)}</td>
            <td>${log.duration_seconds || 'N/A'}</td>
            <td>${log.sites_scraped || 'N/A'}</td>
            <td>${log.results_collected || 'N/A'}</td>
            <td>${escapeHtml(log.scrape_modes || 'N/A')}</td>
        `;
        tableBody.appendChild(row);
    });
}






function filterLogs() {
    const dateFilter = document.getElementById('logs-date-filter').value.trim();
    const emptyElement = document.getElementById('logs-empty');
    
    debugLog('Applying date filter:', dateFilter);
    
    if (!dateFilter) {
        // No filter - show all logs
        renderLogs(logsData);
        emptyElement.style.display = logsData.length === 0 ? 'block' : 'none';
        showNotification(`Showing all ${logsData.length} logs`, 'info');
        return;
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
        showNotification('Invalid date format. Please use YYYY-MM-DD', 'error');
        return;
    }
    
    // Filter logs based on date
    const filteredLogs = logsData.filter(log => {
        if (!log.scrape_start) return false;
        
        // Extract YYYY-MM-DD from the original scrape_start format
        // Format: "2025-09-29T12:17:22.846799+00:00Z"
        const logDate = log.scrape_start.split('T')[0];
        return logDate === dateFilter;
    });
    
    debugLog('Filter results:', {
        totalLogs: logsData.length,
        filteredLogs: filteredLogs.length,
        dateFilter: dateFilter
    });
    
    // Render the filtered results
    renderLogs(filteredLogs);
    emptyElement.style.display = filteredLogs.length === 0 ? 'block' : 'none';
    
    // Show filter status
    if (filteredLogs.length === 0) {
        showNotification(`No logs found for date: ${dateFilter}`, 'info');
    } else {
        showNotification(`Showing ${filteredLogs.length} logs for ${dateFilter}`, 'success');
    }
}

function clearLogsFilter() {
    document.getElementById('logs-date-filter').value = '';
    debugLog('Cleared logs filter');
    renderLogs(logsData);
    document.getElementById('logs-empty').style.display = logsData.length === 0 ? 'block' : 'none';
    showNotification(`Showing all ${logsData.length} logs`, 'info');
}

// Utility Functions
function showLoading(message = 'Processing...') {
    loadingMessage.textContent = message;
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function truncateText(text, maxLength) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function formatDateTime(inputDate) {
    if (!inputDate) return 'N/A';
    
    try {
        // Method 1: Try using Date object first (most reliable)
        const date = new Date(inputDate);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return `${year}-${month}-${day} - ${hours}:${minutes}:${seconds}`;
        }
        
        // Method 2: String manipulation for specific format
        // Handle format: 2025-09-29T11:53:47.684588+00:00Z
        let cleaned = inputDate;
        
        // Remove Z if present
        if (cleaned.endsWith('Z')) {
            cleaned = cleaned.slice(0, -1);
        }
        
        // Remove timezone offset (anything after + or -)
        const timezoneIndex = Math.max(cleaned.lastIndexOf('+'), cleaned.lastIndexOf('-'));
        if (timezoneIndex > 10) { // Ensure it's not part of the date
            cleaned = cleaned.substring(0, timezoneIndex);
        }
        
        // Remove milliseconds (anything after .)
        const dotIndex = cleaned.indexOf('.');
        if (dotIndex > 0) {
            cleaned = cleaned.substring(0, dotIndex);
        }
        
        // Replace T with ' - '
        if (cleaned.includes('T')) {
            return cleaned.replace('T', ' - ');
        }
        
        return cleaned; // Return as is if no T found
        
    } catch (error) {
        console.error('Error formatting date:', error, 'Input:', inputDate);
        return 'Invalid Date';
    }
}

// Make functions available globally for onclick handlers
window.editKeyword = editKeyword;
window.deleteKeyword = deleteKeyword;
window.activatePrompt = activatePrompt;
window.deletePrompt = deletePrompt;