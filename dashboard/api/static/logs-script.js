// // Global variables
// let allLogs = [];
// let filteredLogs = [];
// let sortColumn = -1;
// let sortDirection = 'asc';
// let autoRefreshInterval = null;
// let isAutoRefreshEnabled = false;

// // DOM elements
// const elements = {
//     fetchBtn: document.getElementById('fetchBtn'),
//     dateInput: document.getElementById('dateInput'),
//     clearDateBtn: document.getElementById('clearDateBtn'),
//     logsTableBody: document.getElementById('logsTableBody'),
//     status: document.getElementById('status'),
//     loadingOverlay: document.getElementById('loadingOverlay'),
//     toast: document.getElementById('toast'),
//     exportBtn: document.getElementById('exportBtn'),
//     autoRefreshBtn: document.getElementById('autoRefreshBtn'),
//     totalLogs: document.getElementById('totalLogs'),
//     avgDuration: document.getElementById('avgDuration'),
//     totalResults: document.getElementById('totalResults'),
//     dropdownToggle: document.getElementById('dropdownToggle'),
//     filterDropdown: document.getElementById('filterDropdown'),
//     customDate: document.getElementById('customDate'),
//     applyDateFilter: document.getElementById('applyDateFilter'),
//     filterButtonText: document.getElementById('filterButtonText')
// };

// // Initialize the application
// document.addEventListener('DOMContentLoaded', function() {
//     initializeEventListeners();
//     fetchLogs(); // Load logs on page load
// });

// // Event listeners setup
// function initializeEventListeners() {
//     // Main fetch button
//     elements.fetchBtn.addEventListener('click', fetchLogs);

//     // Date input with Enter key support
//     elements.dateInput.addEventListener('keypress', (e) => {
//         if (e.key === 'Enter') {
//             applyDateFilter();
//         }
//     });

//     // Clear date filter
//     elements.clearDateBtn.addEventListener('click', clearDateFilter);

//     // Export functionality
//     elements.exportBtn.addEventListener('click', exportLogs);

//     // Auto refresh toggle
//     elements.autoRefreshBtn.addEventListener('click', toggleAutoRefresh);

//     // Dropdown functionality
//     elements.dropdownToggle.addEventListener('click', toggleDropdown);
    
//     // Quick filter buttons
//     document.querySelectorAll('.btn-quick-filter').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             const days = parseInt(e.target.dataset.days);
//             applyQuickDateFilter(days);
//         });
//     });

//     // Apply date filter from dropdown
//     elements.applyDateFilter.addEventListener('click', applyCustomDateFilter);

//     // Table sorting
//     document.querySelectorAll('.sortable').forEach(header => {
//         header.addEventListener('click', (e) => {
//             const column = parseInt(e.currentTarget.dataset.column);
//             sortTable(column);
//         });
//     });

//     // Close dropdown when clicking outside
//     document.addEventListener('click', (e) => {
//         if (!elements.dropdownToggle.contains(e.target) && !elements.filterDropdown.contains(e.target)) {
//             elements.filterDropdown.classList.remove('show');
//         }
//     });
// }

// // Fetch logs from server
// async function fetchLogs() {
//     try {
//         showLoading(true);
//         updateStatus('Fetching logs...');

//         const date = elements.dateInput.value.trim();
//         const url = date ? `/get-logs?date=${date}` : '/get-logs';
        
//         const response = await fetch(url);
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
        
//         const data = await response.json();
        
//         allLogs = data.logs || [];
//         filteredLogs = [...allLogs];
        
//         renderTable();
//         updateStatistics();
//         updateStatus(`Successfully loaded ${allLogs.length} logs`);
//         showToast('Logs loaded successfully!', 'success');
        
//     } catch (error) {
//         console.error('Error fetching logs:', error);
//         updateStatus('Error fetching logs');
//         showToast('Failed to load logs. Please try again.', 'error');
        
//         // Clear table on error
//         elements.logsTableBody.innerHTML = '<tr><td colspan="6" class="no-data">Error loading logs</td></tr>';
//     } finally {
//         showLoading(false);
//     }
// }

// // Render the logs table
// function renderTable() {
//     const tbody = elements.logsTableBody;
    
//     if (filteredLogs.length === 0) {
//         tbody.innerHTML = '<tr><td colspan="6" class="no-data">No logs found</td></tr>';
//         return;
//     }

//     tbody.innerHTML = '';
    
//     filteredLogs.forEach(log => {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td>${formatDate(log.scrape_start) || '-'}</td>
//             <td>${formatDate(log.scrape_end) || '-'}</td>
//             <td>${formatDuration(log.duration_seconds) || '-'}</td>
//             <td>${log.sites_scraped || '-'}</td>
//             <td>${log.results_collected || '-'}</td>
//             <td>${formatModes(log.scrape_modes) || '-'}</td>
//         `;
//         tbody.appendChild(row);
//     });
// }

// // Format date string
// function formatDate(isoString) {
//     if (!isoString) return '';

//     try {
//         const clean = isoString.replace('Z', '').split('+')[0];
//         const date = new Date(clean);
        
//         if (isNaN(date.getTime())) return '';
        
//         const yyyy = date.getFullYear();
//         const mm = String(date.getMonth() + 1).padStart(2, '0');
//         const dd = String(date.getDate()).padStart(2, '0');
//         const hh = String(date.getHours()).padStart(2, '0');
//         const min = String(date.getMinutes()).padStart(2, '0');
//         const ss = String(date.getSeconds()).padStart(2, '0');
        
//         return `${yyyy}-${mm}-${dd} - ${hh}:${min}:${ss}`;
//     } catch (error) {
//         return '';
//     }
// }

// // Format duration
// function formatDuration(seconds) {
//     if (!seconds) return '';
//     return `${parseFloat(seconds).toFixed(1)}s`;
// }

// // Format scrape modes
// function formatModes(modes) {
//     if (!modes) return '';
//     if (typeof modes === 'string') return modes;
//     if (Array.isArray(modes)) return modes.join(', ');
//     return JSON.stringify(modes);
// }

// // Update statistics
// function updateStatistics() {
//     const total = filteredLogs.length;
//     elements.totalLogs.textContent = total;
    
//     if (total > 0) {
//         // Calculate average duration
//         const validDurations = filteredLogs
//             .map(log => parseFloat(log.duration_seconds))
//             .filter(d => !isNaN(d));
        
//         const avgDuration = validDurations.length > 0 
//             ? (validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length).toFixed(1)
//             : 0;
        
//         elements.avgDuration.textContent = `${avgDuration}s`;
        
//         // Calculate total results
//         const totalResults = filteredLogs
//             .map(log => parseInt(log.results_collected) || 0)
//             .reduce((sum, r) => sum + r, 0);
        
//         elements.totalResults.textContent = totalResults.toLocaleString();
//     } else {
//         elements.avgDuration.textContent = '0s';
//         elements.totalResults.textContent = '0';
//     }
// }

// // Apply date filter
// function applyDateFilter() {
//     const dateValue = elements.dateInput.value.trim();
    
//     if (!dateValue) {
//         filteredLogs = [...allLogs];
//     } else {
//         // Validate date format
//         if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
//             showToast('Invalid date format. Use YYYY-MM-DD', 'error');
//             return;
//         }
        
//         filteredLogs = allLogs.filter(log => {
//             if (!log.scrape_start) return false;
//             const logDate = log.scrape_start.split('T')[0];
//             return logDate === dateValue;
//         });
//     }
    
//     renderTable();
//     updateStatistics();
//     updateStatus(`Filtered to ${filteredLogs.length} logs`);
// }

// // Clear date filter
// function clearDateFilter() {
//     elements.dateInput.value = '';
//     filteredLogs = [...allLogs];
//     renderTable();
//     updateStatistics();
//     updateStatus(`Showing all ${allLogs.length} logs`);
//     elements.filterButtonText.textContent = 'Date Filters';
// }

// // Quick date filter
// function applyQuickDateFilter(days) {
//     const now = new Date();
//     const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
//     filteredLogs = allLogs.filter(log => {
//         if (!log.scrape_start) return false;
//         const logDate = new Date(log.scrape_start);
//         return logDate >= startDate;
//     });
    
//     renderTable();
//     updateStatistics();
    
//     const filterText = days === 1 ? 'Today' : `Last ${days} Days`;
//     elements.filterButtonText.textContent = filterText;
//     updateStatus(`Filtered to ${filteredLogs.length} logs (${filterText})`);
    
//     // Close dropdown
//     elements.filterDropdown.classList.remove('show');
// }

// // Apply custom date filter from dropdown
// function applyCustomDateFilter() {
//     const customDate = elements.customDate.value;
//     if (customDate) {
//         elements.dateInput.value = customDate;
//         applyDateFilter();
//         elements.filterButtonText.textContent = `Custom: ${customDate}`;
//         elements.filterDropdown.classList.remove('show');
//     }
// }

// // Toggle dropdown
// function toggleDropdown() {
//     elements.filterDropdown.classList.toggle('show');
// }

// // Sort table
// function sortTable(column) {
//     if (sortColumn === column) {
//         sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
//     } else {
//         sortColumn = column;
//         sortDirection = 'asc';
//     }
    
//     // Update sort icons
//     document.querySelectorAll('.sort-icon').forEach(icon => {
//         icon.className = 'fas fa-sort sort-icon';
//     });
    
//     const currentHeader = document.querySelector(`[data-column="${column}"] .sort-icon`);
//     if (currentHeader) {
//         currentHeader.className = `fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
//     }
    
//     // Sort the data
//     filteredLogs.sort((a, b) => {
//         let aVal, bVal;
        
//         switch (column) {
//             case 0: // Scrape Start
//                 aVal = new Date(a.scrape_start || 0);
//                 bVal = new Date(b.scrape_start || 0);
//                 break;
//             case 1: // Scrape End
//                 aVal = new Date(a.scrape_end || 0);
//                 bVal = new Date(b.scrape_end || 0);
//                 break;
//             case 2: // Duration
//                 aVal = parseFloat(a.duration_seconds || 0);
//                 bVal = parseFloat(b.duration_seconds || 0);
//                 break;
//             case 3: // Sites Scraped
//                 aVal = parseInt(a.sites_scraped || 0);
//                 bVal = parseInt(b.sites_scraped || 0);
//                 break;
//             case 4: // Results Collected
//                 aVal = parseInt(a.results_collected || 0);
//                 bVal = parseInt(b.results_collected || 0);
//                 break;
//             default:
//                 return 0;
//         }
        
//         if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
//         if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
//         return 0;
//     });
    
//     renderTable();
// }

// // Export logs
// function exportLogs() {
//     if (filteredLogs.length === 0) {
//         showToast('No logs to export', 'error');
//         return;
//     }
    
//     try {
//         const csvContent = generateCSV(filteredLogs);
//         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
//         const link = document.createElement('a');
//         if (link.download !== undefined) {
//             const url = URL.createObjectURL(blob);
//             link.setAttribute('href', url);
//             link.setAttribute('download', `scrape_logs_${new Date().toISOString().split('T')[0]}.csv`);
//             link.style.visibility = 'hidden';
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
            
//             showToast('Logs exported successfully!', 'success');
//         }
//     } catch (error) {
//         console.error('Export error:', error);
//         showToast('Failed to export logs', 'error');
//     }
// }

// // Generate CSV content
// function generateCSV(logs) {
//     const headers = ['Scrape Start', 'Scrape End', 'Duration (s)', 'Sites Scraped', 'Results Collected', 'Modes'];
//     const csvRows = [headers.join(',')];
    
//     logs.forEach(log => {
//         const row = [
//             `"${formatDate(log.scrape_start) || ''}"`,
//             `"${formatDate(log.scrape_end) || ''}"`,
//             log.duration_seconds || '',
//             log.sites_scraped || '',
//             log.results_collected || '',
//             `"${formatModes(log.scrape_modes) || ''}"`
//         ];
//         csvRows.push(row.join(','));
//     });
    
//     return csvRows.join('\n');
// }

// // Toggle auto refresh
// function toggleAutoRefresh() {
//     isAutoRefreshEnabled = !isAutoRefreshEnabled;
    
//     if (isAutoRefreshEnabled) {
//         autoRefreshInterval = setInterval(fetchLogs, 30000); // Refresh every 30 seconds
//         elements.autoRefreshBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Auto Refresh: ON';
//         elements.autoRefreshBtn.classList.add('active');
//         showToast('Auto refresh enabled (30s interval)', 'success');
//     } else {
//         if (autoRefreshInterval) {
//             clearInterval(autoRefreshInterval);
//             autoRefreshInterval = null;
//         }
//         elements.autoRefreshBtn.innerHTML = '<i class="fas fa-sync"></i> Auto Refresh: OFF';
//         elements.autoRefreshBtn.classList.remove('active');
//         showToast('Auto refresh disabled', 'success');
//     }
// }

// // Show/hide loading overlay
// function showLoading(show) {
//     elements.loadingOverlay.style.display = show ? 'flex' : 'none';
// }

// // Update status message
// function updateStatus(message) {
//     elements.status.textContent = message;
// }

// // Show toast notification
// function showToast(message, type = 'info') {
//     const toast = elements.toast;
//     const icon = toast.querySelector('.toast-icon');
//     const messageEl = toast.querySelector('.toast-message');
    
//     // Set icon based on type
//     const icons = {
//         success: 'fas fa-check-circle',
//         error: 'fas fa-exclamation-circle',
//         info: 'fas fa-info-circle',
//         warning: 'fas fa-exclamation-triangle'
//     };
    
//     icon.className = `toast-icon ${icons[type] || icons.info}`;
//     messageEl.textContent = message;
    
//     // Set toast type class
//     toast.className = `toast toast-${type} show`;
    
//     // Hide after 3 seconds
//     setTimeout(() => {
//         toast.classList.remove('show');
//     }, 3000);
// }

// // Clean up on page unload
// window.addEventListener('beforeunload', () => {
//     if (autoRefreshInterval) {
//         clearInterval(autoRefreshInterval);
//     }
// });


















// // Global variables
// let allLogs = [];
// let filteredLogs = [];
// let sortColumn = -1;
// let sortDirection = 'asc';
// let autoRefreshInterval = null;
// let isAutoRefreshEnabled = false;

// // DOM elements
// const elements = {
//     fetchBtn: document.getElementById('fetchBtn'),
//     dateInput: document.getElementById('dateInput'),
//     clearDateBtn: document.getElementById('clearDateBtn'),
//     logsTableBody: document.getElementById('logsTableBody'),
//     status: document.getElementById('status'),
//     loadingOverlay: document.getElementById('loadingOverlay'),
//     toast: document.getElementById('toast'),
//     exportBtn: document.getElementById('exportBtn'),
//     autoRefreshBtn: document.getElementById('autoRefreshBtn'),
//     totalLogs: document.getElementById('totalLogs'),
//     avgDuration: document.getElementById('avgDuration'),
//     totalResults: document.getElementById('totalResults'),
//     dropdownToggle: document.getElementById('dropdownToggle'),
//     filterDropdown: document.getElementById('filterDropdown'),
//     customDate: document.getElementById('customDate'),
//     applyDateFilter: document.getElementById('applyDateFilter'),
//     filterButtonText: document.getElementById('filterButtonText')
// };

// // Initialize the application
// document.addEventListener('DOMContentLoaded', function() {
//     initializeEventListeners();
//     fetchLogs(); // Load logs on page load
// });

// // Event listeners setup
// function initializeEventListeners() {
//     // Main fetch button
//     elements.fetchBtn.addEventListener('click', fetchLogs);

//     // Date input with Enter key support
//     elements.dateInput.addEventListener('keypress', (e) => {
//         if (e.key === 'Enter') {
//             applyDateFilter();
//         }
//     });

//     // Clear date filter
//     elements.clearDateBtn.addEventListener('click', clearDateFilter);

//     // Export functionality
//     elements.exportBtn.addEventListener('click', exportLogs);

//     // Auto refresh toggle
//     elements.autoRefreshBtn.addEventListener('click', toggleAutoRefresh);

//     // Dropdown functionality
//     elements.dropdownToggle.addEventListener('click', toggleDropdown);
    
//     // Quick filter buttons
//     document.querySelectorAll('.btn-quick-filter').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             const days = parseInt(e.target.dataset.days);
//             applyQuickDateFilter(days);
//         });
//     });

//     // Apply date filter from dropdown
//     elements.applyDateFilter.addEventListener('click', applyCustomDateFilter);

//     // Table sorting
//     document.querySelectorAll('.sortable').forEach(header => {
//         header.addEventListener('click', (e) => {
//             const column = parseInt(e.currentTarget.dataset.column);
//             sortTable(column);
//         });
//     });

//     // Close dropdown when clicking outside
//     document.addEventListener('click', (e) => {
//         if (!elements.dropdownToggle.contains(e.target) && !elements.filterDropdown.contains(e.target)) {
//             elements.filterDropdown.classList.remove('show');
//         }
//     });
// }

// // Fetch logs from server
// async function fetchLogs() {
//     try {
//         showLoading(true);
//         updateStatus('Fetching logs...');

//         const date = elements.dateInput.value.trim();
//         const url = date ? `/get-logs?date=${date}` : '/get-logs';
        
//         const response = await fetch(url);
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
        
//         const data = await response.json();
        
//         allLogs = data.logs || [];
//         filteredLogs = [...allLogs];
        
//         renderTable();
//         updateStatistics();
//         updateStatus(`Successfully loaded ${allLogs.length} logs`);
//         showToast('Logs loaded successfully!', 'success');
        
//     } catch (error) {
//         console.error('Error fetching logs:', error);
//         updateStatus('Error fetching logs');
//         showToast('Failed to load logs. Please try again.', 'error');
        
//         // Clear table on error
//         elements.logsTableBody.innerHTML = '<tr><td colspan="6" class="no-data">Error loading logs</td></tr>';
//     } finally {
//         showLoading(false);
//     }
// }

// // Render the logs table
// function renderTable() {
//     const tbody = elements.logsTableBody;
    
//     if (filteredLogs.length === 0) {
//         tbody.innerHTML = '<tr><td colspan="6" class="no-data">No logs found</td></tr>';
//         return;
//     }

//     tbody.innerHTML = '';
    
//     filteredLogs.forEach(log => {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td>${formatDate(log.scrape_start) || '-'}</td>
//             <td>${formatDate(log.scrape_end) || '-'}</td>
//             <td>${formatDuration(log.duration_seconds) || '-'}</td>
//             <td>${log.sites_scraped || '-'}</td>
//             <td>${log.results_collected || '-'}</td>
//             <td>${formatModes(log.scrape_modes) || '-'}</td>
//         `;
//         tbody.appendChild(row);
//     });
// }

// // Format date string
// function formatDate(isoString) {
//     if (!isoString) return '';

//     try {
//         const clean = isoString.replace('Z', '').split('+')[0];
//         const date = new Date(clean);
        
//         if (isNaN(date.getTime())) return '';
        
//         const yyyy = date.getFullYear();
//         const mm = String(date.getMonth() + 1).padStart(2, '0');
//         const dd = String(date.getDate()).padStart(2, '0');
//         const hh = String(date.getHours()).padStart(2, '0');
//         const min = String(date.getMinutes()).padStart(2, '0');
//         const ss = String(date.getSeconds()).padStart(2, '0');
        
//         return `${yyyy}-${mm}-${dd} - ${hh}:${min}:${ss}`;
//     } catch (error) {
//         return '';
//     }
// }

// // Format duration
// function formatDuration(seconds) {
//     if (!seconds) return '';
//     return `${parseFloat(seconds).toFixed(1)}s`;
// }

// // Format scrape modes
// function formatModes(modes) {
//     if (!modes) return '';
//     if (typeof modes === 'string') return modes;
//     if (Array.isArray(modes)) return modes.join(', ');
//     return JSON.stringify(modes);
// }

// // Update statistics
// function updateStatistics() {
//     const total = filteredLogs.length;
//     elements.totalLogs.textContent = total;
    
//     if (total > 0) {
//         // Calculate average duration
//         const validDurations = filteredLogs
//             .map(log => parseFloat(log.duration_seconds))
//             .filter(d => !isNaN(d));
        
//         const avgDuration = validDurations.length > 0 
//             ? (validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length).toFixed(1)
//             : 0;
        
//         elements.avgDuration.textContent = `${avgDuration}s`;
        
//         // Calculate total results
//         const totalResults = filteredLogs
//             .map(log => parseInt(log.results_collected) || 0)
//             .reduce((sum, r) => sum + r, 0);
        
//         elements.totalResults.textContent = totalResults.toLocaleString();
//     } else {
//         elements.avgDuration.textContent = '0s';
//         elements.totalResults.textContent = '0';
//     }
// }

// // Apply date filter
// function applyDateFilter() {
//     const dateValue = elements.dateInput.value.trim();
    
//     if (!dateValue) {
//         filteredLogs = [...allLogs];
//     } else {
//         // Validate date format
//         if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
//             showToast('Invalid date format. Use YYYY-MM-DD', 'error');
//             return;
//         }
        
//         filteredLogs = allLogs.filter(log => {
//             if (!log.scrape_start) return false;
//             const logDate = log.scrape_start.split('T')[0];
//             return logDate === dateValue;
//         });
//     }
    
//     renderTable();
//     updateStatistics();
//     updateStatus(`Filtered to ${filteredLogs.length} logs`);
// }

// // Clear date filter
// function clearDateFilter() {
//     elements.dateInput.value = '';
//     filteredLogs = [...allLogs];
//     renderTable();
//     updateStatistics();
//     updateStatus(`Showing all ${allLogs.length} logs`);
//     elements.filterButtonText.textContent = 'Date Filters';
// }

// // Quick date filter
// function applyQuickDateFilter(days) {
//     const now = new Date();
//     const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
//     filteredLogs = allLogs.filter(log => {
//         if (!log.scrape_start) return false;
//         const logDate = new Date(log.scrape_start);
//         return logDate >= startDate;
//     });
    
//     renderTable();
//     updateStatistics();
    
//     const filterText = days === 1 ? 'Today' : `Last ${days} Days`;
//     elements.filterButtonText.textContent = filterText;
//     updateStatus(`Filtered to ${filteredLogs.length} logs (${filterText})`);
    
//     // Close dropdown
//     elements.filterDropdown.classList.remove('show');
// }

// // Apply custom date filter from dropdown
// function applyCustomDateFilter() {
//     const customDate = elements.customDate.value;
//     if (customDate) {
//         elements.dateInput.value = customDate;
//         applyDateFilter();
//         elements.filterButtonText.textContent = `Custom: ${customDate}`;
//         elements.filterDropdown.classList.remove('show');
//     }
// }

// // Toggle dropdown
// function toggleDropdown() {
//     elements.filterDropdown.classList.toggle('show');
// }

// // Sort table
// function sortTable(column) {
//     if (sortColumn === column) {
//         sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
//     } else {
//         sortColumn = column;
//         sortDirection = 'asc';
//     }
    
//     // Update sort icons
//     document.querySelectorAll('.sort-icon').forEach(icon => {
//         icon.className = 'fas fa-sort sort-icon';
//     });
    
//     const currentHeader = document.querySelector(`[data-column="${column}"] .sort-icon`);
//     if (currentHeader) {
//         currentHeader.className = `fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
//     }
    
//     // Sort the data
//     filteredLogs.sort((a, b) => {
//         let aVal, bVal;
        
//         switch (column) {
//             case 0: // Scrape Start
//                 aVal = new Date(a.scrape_start || 0);
//                 bVal = new Date(b.scrape_start || 0);
//                 break;
//             case 1: // Scrape End
//                 aVal = new Date(a.scrape_end || 0);
//                 bVal = new Date(b.scrape_end || 0);
//                 break;
//             case 2: // Duration
//                 aVal = parseFloat(a.duration_seconds || 0);
//                 bVal = parseFloat(b.duration_seconds || 0);
//                 break;
//             case 3: // Sites Scraped
//                 aVal = parseInt(a.sites_scraped || 0);
//                 bVal = parseInt(b.sites_scraped || 0);
//                 break;
//             case 4: // Results Collected
//                 aVal = parseInt(a.results_collected || 0);
//                 bVal = parseInt(b.results_collected || 0);
//                 break;
//             default:
//                 return 0;
//         }
        
//         if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
//         if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
//         return 0;
//     });
    
//     renderTable();
// }

// // Export logs
// function exportLogs() {
//     if (filteredLogs.length === 0) {
//         showToast('No logs to export', 'error');
//         return;
//     }
    
//     try {
//         const csvContent = generateCSV(filteredLogs);
//         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
//         const link = document.createElement('a');
//         if (link.download !== undefined) {
//             const url = URL.createObjectURL(blob);
//             link.setAttribute('href', url);
//             link.setAttribute('download', `scrape_logs_${new Date().toISOString().split('T')[0]}.csv`);
//             link.style.visibility = 'hidden';
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
            
//             showToast('Logs exported successfully!', 'success');
//         }
//     } catch (error) {
//         console.error('Export error:', error);
//         showToast('Failed to export logs', 'error');
//     }
// }

// // Generate CSV content
// function generateCSV(logs) {
//     const headers = ['Scrape Start', 'Scrape End', 'Duration (s)', 'Sites Scraped', 'Results Collected', 'Modes'];
//     const csvRows = [headers.join(',')];
    
//     logs.forEach(log => {
//         const row = [
//             `"${formatDate(log.scrape_start) || ''}"`,
//             `"${formatDate(log.scrape_end) || ''}"`,
//             log.duration_seconds || '',
//             log.sites_scraped || '',
//             log.results_collected || '',
//             `"${formatModes(log.scrape_modes) || ''}"`
//         ];
//         csvRows.push(row.join(','));
//     });
    
//     return csvRows.join('\n');
// }

// // Toggle auto refresh
// function toggleAutoRefresh() {
//     isAutoRefreshEnabled = !isAutoRefreshEnabled;
    
//     if (isAutoRefreshEnabled) {
//         autoRefreshInterval = setInterval(fetchLogs, 30000); // Refresh every 30 seconds
//         elements.autoRefreshBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Auto Refresh: ON';
//         elements.autoRefreshBtn.classList.add('active');
//         showToast('Auto refresh enabled (30s interval)', 'success');
//     } else {
//         if (autoRefreshInterval) {
//             clearInterval(autoRefreshInterval);
//             autoRefreshInterval = null;
//         }
//         elements.autoRefreshBtn.innerHTML = '<i class="fas fa-sync"></i> Auto Refresh: OFF';
//         elements.autoRefreshBtn.classList.remove('active');
//         showToast('Auto refresh disabled', 'success');
//     }
// }

// // Show/hide loading overlay
// function showLoading(show) {
//     elements.loadingOverlay.style.display = show ? 'flex' : 'none';
// }

// // Update status message
// function updateStatus(message) {
//     elements.status.textContent = message;
// }

// // Show toast notification
// function showToast(message, type = 'info') {
//     const toast = elements.toast;
//     const icon = toast.querySelector('.toast-icon');
//     const messageEl = toast.querySelector('.toast-message');
    
//     // Set icon based on type
//     const icons = {
//         success: 'fas fa-check-circle',
//         error: 'fas fa-exclamation-circle',
//         info: 'fas fa-info-circle',
//         warning: 'fas fa-exclamation-triangle'
//     };
    
//     icon.className = `toast-icon ${icons[type] || icons.info}`;
//     messageEl.textContent = message;
    
//     // Set toast type class
//     toast.className = `toast toast-${type} show`;
    
//     // Hide after 3 seconds
//     setTimeout(() => {
//         toast.classList.remove('show');
//     }, 3000);
// }

// // Clean up on page unload
// window.addEventListener('beforeunload', () => {
//     if (autoRefreshInterval) {
//         clearInterval(autoRefreshInterval);
//     }
// });















// Global variables
let allLogs = [];
let filteredLogs = [];
let sortColumn = -1;
let sortDirection = 'asc';
let autoRefreshInterval = null;
let isAutoRefreshEnabled = false;

// DOM elements
const elements = {
    fetchBtn: document.getElementById('fetchBtn'),
    dateInput: document.getElementById('dateInput'),
    clearDateBtn: document.getElementById('clearDateBtn'),
    logsTableBody: document.getElementById('logsTableBody'),
    status: document.getElementById('status'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toast'),
    exportBtn: document.getElementById('exportBtn'),
    autoRefreshBtn: document.getElementById('autoRefreshBtn'),
    totalLogs: document.getElementById('totalLogs'),
    avgDuration: document.getElementById('avgDuration'),
    totalResults: document.getElementById('totalResults'),
    dropdownToggle: document.getElementById('dropdownToggle'),
    filterDropdown: document.getElementById('filterDropdown'),
    customDate: document.getElementById('customDate'),
    applyDateFilter: document.getElementById('applyDateFilter'),
    filterButtonText: document.getElementById('filterButtonText')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    fetchLogs(); // Load logs on page load
});

// Event listeners setup
function initializeEventListeners() {
    // Main fetch button
    elements.fetchBtn.addEventListener('click', fetchLogs);

    // Date input with Enter key support
    elements.dateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyDateFilter();
        }
    });

    // Clear date filter
    elements.clearDateBtn.addEventListener('click', clearDateFilter);

    // Export functionality
    elements.exportBtn.addEventListener('click', exportLogs);

    // Auto refresh toggle
    elements.autoRefreshBtn.addEventListener('click', toggleAutoRefresh);

    // Dropdown functionality
    elements.dropdownToggle.addEventListener('click', toggleDropdown);
    
    // Quick filter buttons
    document.querySelectorAll('.btn-quick-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const days = parseInt(e.target.dataset.days);
            applyQuickDateFilter(days);
        });
    });

    // Apply date filter from dropdown
    elements.applyDateFilter.addEventListener('click', applyCustomDateFilter);

    // Table sorting
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', (e) => {
            const column = parseInt(e.currentTarget.dataset.column);
            sortTable(column);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = elements.dropdownToggle.closest('.dropdown');
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
            elements.filterDropdown.classList.remove('show');
        elements.dropdownToggle.closest('.dropdown').classList.remove('show');
        }
    });
}

// Fetch logs from server
async function fetchLogs() {
    try {
        showLoading(true);
        updateStatus('Fetching logs...');

        const date = elements.dateInput.value.trim();
        const url = date ? `/get-logs?date=${date}` : '/get-logs';
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        allLogs = data.logs || [];
        filteredLogs = [...allLogs];
        
        // Debug: Log sample data to understand the structure
        if (allLogs.length > 0) {
            console.log('Sample log data:', allLogs[0]);
            console.log('Date fields:', {
                scrape_start: allLogs[0].scrape_start,
                scrape_end: allLogs[0].scrape_end
            });
        }
        
        renderTable();
        updateStatistics();
        updateStatus(`Successfully loaded ${allLogs.length} logs`);
        showToast('Logs loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error fetching logs:', error);
        updateStatus('Error fetching logs');
        showToast('Failed to load logs. Please try again.', 'error');
        
        // Clear table on error
        elements.logsTableBody.innerHTML = '<tr><td colspan="6" class="no-data">Error loading logs</td></tr>';
    } finally {
        showLoading(false);
    }
}

// Render the logs table
function renderTable() {
    const tbody = elements.logsTableBody;
    
    if (filteredLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No logs found</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    
    filteredLogs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(log.scrape_start) || '-'}</td>
            <td>${formatDate(log.scrape_end) || '-'}</td>
            <td>${formatDuration(log.duration_seconds) || '-'}</td>
            <td>${log.sites_scraped || '-'}</td>
            <td>${log.results_collected || '-'}</td>
            <td>${formatModes(log.scrape_modes) || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Format date string
function formatDate(isoString) {
    if (!isoString) return '';

    try {
        const clean = isoString.replace('Z', '').split('+')[0];
        const date = new Date(clean);
        
        if (isNaN(date.getTime())) return '';
        
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        
        return `${yyyy}-${mm}-${dd} - ${hh}:${min}:${ss}`;
    } catch (error) {
        return '';
    }
}

// Format duration
function formatDuration(seconds) {
    if (!seconds) return '';
    return `${parseFloat(seconds).toFixed(1)}s`;
}

// Format scrape modes
function formatModes(modes) {
    if (!modes) return '';
    if (typeof modes === 'string') return modes;
    if (Array.isArray(modes)) return modes.join(', ');
    return JSON.stringify(modes);
}

// Update statistics
function updateStatistics() {
    const total = filteredLogs.length;
    elements.totalLogs.textContent = total;
    
    if (total > 0) {
        // Calculate average duration
        const validDurations = filteredLogs
            .map(log => parseFloat(log.duration_seconds))
            .filter(d => !isNaN(d));
        
        const avgDuration = validDurations.length > 0 
            ? (validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length).toFixed(1)
            : 0;
        
        elements.avgDuration.textContent = `${avgDuration}s`;
        
        // Calculate total results
        const totalResults = filteredLogs
            .map(log => parseInt(log.results_collected) || 0)
            .reduce((sum, r) => sum + r, 0);
        
        elements.totalResults.textContent = totalResults.toLocaleString();
    } else {
        elements.avgDuration.textContent = '0s';
        elements.totalResults.textContent = '0';
    }
}

// Apply date filter
function applyDateFilter() {
    const dateValue = elements.dateInput.value.trim();
    
    if (!dateValue) {
        filteredLogs = [...allLogs];
    } else {
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            showToast('Invalid date format. Use YYYY-MM-DD', 'error');
            return;
        }
        
        filteredLogs = allLogs.filter(log => {
            if (!log.scrape_start) return false;
            const logDate = log.scrape_start.split('T')[0];
            return logDate === dateValue;
        });
    }
    
    renderTable();
    updateStatistics();
    updateStatus(`Filtered to ${filteredLogs.length} logs`);
}

// Clear date filter
function clearDateFilter() {
    elements.dateInput.value = '';
    filteredLogs = [...allLogs];
    renderTable();
    updateStatistics();
    updateStatus(`Showing all ${allLogs.length} logs`);
    elements.filterButtonText.textContent = 'Date Filters';
}

// Parse date string more robustly
function parseLogDate(dateString) {
    if (!dateString) return null;
    
    try {
        // Try different parsing methods
        let cleanDate = dateString;
        
        // Remove timezone info if present
        if (dateString.includes('Z')) {
            cleanDate = dateString.replace('Z', '');
        }
        if (dateString.includes('+')) {
            cleanDate = dateString.split('+')[0];
        }
        
        // Try parsing with various methods
        let date = new Date(cleanDate);
        
        // If that fails, try with 'T' replaced by space
        if (isNaN(date.getTime()) && cleanDate.includes('T')) {
            date = new Date(cleanDate.replace('T', ' '));
        }
        
        // If still fails, try manual parsing for YYYY-MM-DD HH:MM:SS format
        if (isNaN(date.getTime())) {
            const match = cleanDate.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
            if (match) {
                const [, year, month, day, hour, minute, second] = match;
                date = new Date(year, month - 1, day, hour, minute, second);
            }
        }
        
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        console.error('Date parsing error:', error, dateString);
        return null;
    }
}

// Quick date filter (updated to use better date parsing)
function applyQuickDateFilter(days) {
    const now = new Date();
    let startDate;
    
    if (days === 1) {
        // For "Today", set to start of today in local time
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else {
        // For other periods, go back X days from now
        startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    }
    
    console.log(`Filtering for ${days === 1 ? 'Today' : 'Last ' + days + ' days'}`);
    console.log('Filter range:', startDate.toISOString(), 'to', now.toISOString());
    
    filteredLogs = allLogs.filter(log => {
        const logDate = parseLogDate(log.scrape_start);
        
        if (!logDate) {
            console.log('Could not parse date:', log.scrape_start);
            return false;
        }
        
        const isInRange = logDate >= startDate && logDate <= now;
        
        if (days === 1) {
            // For today, also check if it's the same date
            const logDateStr = logDate.toDateString();
            const todayStr = now.toDateString();
            const isSameDay = logDateStr === todayStr;
            console.log('Log date:', logDate.toISOString(), 'Same day as today:', isSameDay);
            return isSameDay;
        } else {
            console.log('Log date:', logDate.toISOString(), 'In range:', isInRange);
            return isInRange;
        }
    });
    
    console.log('Total logs:', allLogs.length, 'Filtered logs:', filteredLogs.length);
    
    renderTable();
    updateStatistics();
    
    const filterText = days === 1 ? 'Today' : `Last ${days} Days`;
    elements.filterButtonText.textContent = filterText;
    updateStatus(`Filtered to ${filteredLogs.length} logs (${filterText})`);
    
    // Close dropdown
    elements.filterDropdown.classList.remove('show');
    elements.dropdownToggle.closest('.dropdown').classList.remove('show');
}

// Apply custom date filter from dropdown
function applyCustomDateFilter() {
    const customDate = elements.customDate.value;
    if (customDate) {
        elements.dateInput.value = customDate;
        applyDateFilter();
        elements.filterButtonText.textContent = `Custom: ${customDate}`;
        elements.filterDropdown.classList.remove('show');
    }
}

// Toggle dropdown
function toggleDropdown() {
    const dropdown = elements.dropdownToggle.closest('.dropdown');
    const menu = elements.filterDropdown;
    
    dropdown.classList.toggle('show');
    menu.classList.toggle('show');
}

// Sort table
function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // Update sort icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.className = 'fas fa-sort sort-icon';
    });
    
    const currentHeader = document.querySelector(`[data-column="${column}"] .sort-icon`);
    if (currentHeader) {
        currentHeader.className = `fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
    }
    
    // Sort the data
    filteredLogs.sort((a, b) => {
        let aVal, bVal;
        
        switch (column) {
            case 0: // Scrape Start
                aVal = new Date(a.scrape_start || 0);
                bVal = new Date(b.scrape_start || 0);
                break;
            case 1: // Scrape End
                aVal = new Date(a.scrape_end || 0);
                bVal = new Date(b.scrape_end || 0);
                break;
            case 2: // Duration
                aVal = parseFloat(a.duration_seconds || 0);
                bVal = parseFloat(b.duration_seconds || 0);
                break;
            case 3: // Sites Scraped
                aVal = parseInt(a.sites_scraped || 0);
                bVal = parseInt(b.sites_scraped || 0);
                break;
            case 4: // Results Collected
                aVal = parseInt(a.results_collected || 0);
                bVal = parseInt(b.results_collected || 0);
                break;
            default:
                return 0;
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderTable();
}

// Export logs
function exportLogs() {
    if (filteredLogs.length === 0) {
        showToast('No logs to export', 'error');
        return;
    }
    
    try {
        const csvContent = generateCSV(filteredLogs);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `scrape_logs_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Logs exported successfully!', 'success');
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export logs', 'error');
    }
}

// Generate CSV content
function generateCSV(logs) {
    const headers = ['Scrape Start', 'Scrape End', 'Duration (s)', 'Sites Scraped', 'Results Collected', 'Modes'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
        const row = [
            `"${formatDate(log.scrape_start) || ''}"`,
            `"${formatDate(log.scrape_end) || ''}"`,
            log.duration_seconds || '',
            log.sites_scraped || '',
            log.results_collected || '',
            `"${formatModes(log.scrape_modes) || ''}"`
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

// Toggle auto refresh
function toggleAutoRefresh() {
    isAutoRefreshEnabled = !isAutoRefreshEnabled;
    
    if (isAutoRefreshEnabled) {
        autoRefreshInterval = setInterval(fetchLogs, 30000); // Refresh every 30 seconds
        elements.autoRefreshBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Auto Refresh: ON';
        elements.autoRefreshBtn.classList.add('active');
        showToast('Auto refresh enabled (30s interval)', 'success');
    } else {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
        elements.autoRefreshBtn.innerHTML = '<i class="fas fa-sync"></i> Auto Refresh: OFF';
        elements.autoRefreshBtn.classList.remove('active');
        showToast('Auto refresh disabled', 'success');
    }
}

// Show/hide loading overlay
function showLoading(show) {
    elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Update status message
function updateStatus(message) {
    elements.status.textContent = message;
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = elements.toast;
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    
    // Set icon based on type
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    icon.className = `toast-icon ${icons[type] || icons.info}`;
    messageEl.textContent = message;
    
    // Set toast type class
    toast.className = `toast toast-${type} show`;
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});