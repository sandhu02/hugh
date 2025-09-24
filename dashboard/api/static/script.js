// Dropdown functionality
    function toggleDropdown() {
        dropdown.classList.toggle("active");
        // Clear search when opening dropdown
        if (dropdown.classList.contains("active")) {
            categorySearch.value = '';
            filterCategorySearch();
        }
    }

    // Rest of the existing functions with some updates...
    function setLoadingState(isLoading) {
        if (isLoading) {
            refreshBtn.disabled = true;
            refreshBtn.classList.add("btn-loading");
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        } else {
            refreshBtn.disabled = false;
            refreshBtn.classList.remove("btn-loading");
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Fetch New Results';
        }
    }

    function showLoadingOverlay(show) {
        if (show) {
            loadingOverlay.classList.add("active");
        } else {
            loadingOverlay.classList.remove("active");
        }
    }

    function updateStatus(message, type = "default") {
        status.textContent = message;
        
        // Remove existing status classes
        status.classList.remove("loading", "success", "error");
        
        // Add new status class
        if (type !== "default") {
            status.classList.add(type);
        }

        // Auto-clear status after 5 seconds for success/error
        if (type === "success" || type === "error") {
            setTimeout(() => {
                status.textContent = "Ready to fetch new results";
                status.classList.remove("loading", "success", "error");
            }, 5000);
        }
    }

    function updateTable(data) {
        // Clear existing table body
        tableBody.innerHTML = "";
        
        // Check if data exists and is an array
        if (!data || !Array.isArray(data)) {
            const noDataRow = tableBody.insertRow();
            noDataRow.innerHTML = `
                <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                    No data available
                </td>
            `;
            return;
        }

        // Add new rows with animation
        data.forEach((rowData, index) => {
            setTimeout(() => {
                const row = tableBody.insertRow();
                row.style.opacity = "0";
                row.style.transform = "translateY(20px)";
                
                // Create table cell content
                row.innerHTML = `
                    <td>${escapeHtml(rowData.site || '')}</td>
                    <td>${escapeHtml(rowData.keywords || rowData.keyword || '')}</td>
                    <td>${escapeHtml(rowData.title || '')}</td>
                    <td>
                        ${rowData.url ? 
                            `<a href="${escapeHtml(rowData.url)}" target="_blank">View Link</a>` : 
                            '<span class="no-link">No URL</span>'
                        }
                    </td>
                    <td>${escapeHtml(rowData.snippet || '')}</td>
                    <td>${escapeHtml(rowData.date || '')}</td>
                    <td>
                        ${rowData.image ? 
                            `<img src="${escapeHtml(rowData.image)}" width="80" alt="Article Image" onerror="this.style.display='none'">` : 
                            '<span class="no-image">No Image</span>'
                        }
                    </td>
                    <td>${escapeHtml(rowData.section || '')}</td>
                `;

                // Animate row entrance
                setTimeout(() => {
                    row.style.transition = "all 0.5s ease";
                    row.style.opacity = "1";
                    row.style.transform = "translateY(0)";
                }, 50);

            }, index * 100);
        });

        // Update categories after table update
        setTimeout(() => {
            populateCategoriesFromExistingData();
        }, data.length * 100 + 500);
    }

    // Utility function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Animation functions
    function addEntranceAnimations() {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            setTimeout(() => {
                row.style.transition = 'all 0.5s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    function showSuccessAnimation() {
        // Add a subtle success animation to the table
        const tableContainer = document.querySelector('.table-container');
        tableContainer.style.transform = 'scale(1.02)';
        setTimeout(() => {
            tableContainer.style.transition = 'transform 0.3s ease';
            tableContainer.style.transform = 'scale(1)';
        }, 200);
    }

    function showErrorAnimation() {
        // Add a subtle shake animation for errors
        const tableContainer = document.querySelector('.table-container');
        tableContainer.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            tableContainer.style.animation = '';
        }, 500);
    }

    // Scroll to top functionality
    function createScrollToTopButton() {
        const scrollBtn = document.createElement('button');
        scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollBtn.className = 'scroll-top';
        scrollBtn.setAttribute('aria-label', 'Scroll to top');
        
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        document.body.appendChild(scrollBtn);
    }

    function handleScroll() {
        const scrollBtn = document.querySelector('.scroll-top');
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + R for refresh (prevent default browser refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (!refreshBtn.disabled) {
                handleRefresh();
            }
        }

        // Escape to close dropdown
        if (e.key === 'Escape') {
            dropdown.classList.remove('active');
        }

        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f' && dropdown.classList.contains('active')) {
            e.preventDefault();
            categorySearch.focus();
        }
    });

    // Add CSS for shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
        }
    `;
    document.head.appendChild(style);

    // Auto-refresh functionality (optional)
    let autoRefreshInterval;
    
    function startAutoRefresh(minutes = 5) {
        stopAutoRefresh(); // Clear any existing interval
        autoRefreshInterval = setInterval(() => {
            if (!refreshBtn.disabled) {
                console.log('Auto-refreshing data...');
                handleRefresh();
            }
        }, minutes * 60 * 1000);
    }

    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }

    // Uncomment the line below to enable auto-refresh every 5 minutes
    // startAutoRefresh(5);

    // Table search functionality
    function addSearchFunctionality() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" id="tableSearch" placeholder="Search in table..." class="search-input">
            <i class="fas fa-search search-icon"></i>
        `;

        const tableContainer = document.querySelector('.table-container');
        tableContainer.parentNode.insertBefore(searchContainer, tableContainer);

        const searchInput = document.getElementById('tableSearch');
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = tableBody.querySelectorAll('tr');
            let visibleCount = 0;

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                let found = false;

                cells.forEach(cell => {
                    if (cell.textContent.toLowerCase().includes(searchTerm)) {
                        found = true;
                    }
                });

                if (found || searchTerm === '') {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            // Update status with search results
            if (searchTerm) {
                updateStatus(`Search results: ${visibleCount} items found`);
            } else {
                updateStatus('Ready to fetch new results');
            }
        });
    }

    // Add search functionality (uncomment to enable)
    // addSearchFunctionality();

    // Export/download functionality
    function downloadTableAsCSV() {
        const rows = [];
        const headers = [];
        
        // Get headers
        const headerCells = document.querySelectorAll('#table-head th');
        headerCells.forEach(cell => {
            headers.push(cell.textContent.replace(/\s+/g, ' ').trim());
        });
        rows.push(headers);

        // Get visible data rows
        const dataRows = tableBody.querySelectorAll('tr:not([style*="display: none"]):not(.hidden)');
        dataRows.forEach(row => {
            const rowData = [];
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                // Handle links and images
                let cellText = cell.textContent.trim();
                const link = cell.querySelector('a');
                if (link) {
                    cellText = link.href;
                }
                rowData.push(cellText);
            });
            rows.push(rowData);
        });

        // Convert to CSV
        const csvContent = rows.map(row => 
            row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scraper-results-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        updateStatus('Table exported as CSV successfully!', 'success');
    }

    // Add export button to navbar (optional)
    function addExportButton() {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-secondary';
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Export CSV';
        exportBtn.addEventListener('click', downloadTableAsCSV);

        const navbarButtons = document.querySelector('.navbar-buttons');
        navbarButtons.appendChild(exportBtn);
    }

    // Uncomment to add export functionality
    // addExportButton();

    // Error handling improvements
    window.addEventListener('error', function(e) {
        console.error('JavaScript Error:', e.error);
        updateStatus('An unexpected error occurred. Please refresh the page.', 'error');
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled Promise Rejection:', e.reason);
        updateStatus('Network error occurred. Please check your connection.', 'error');
    });

    // Network status monitoring
    window.addEventListener('online', function() {
        updateStatus('Connection restored', 'success');
    });

    window.addEventListener('offline', function() {
        updateStatus('No internet connection', 'error');
    });

    // Initialize tooltips for truncated content
    function addTooltips() {
        const cells = document.querySelectorAll('#table-body td');
        cells.forEach(cell => {
            if (cell.scrollWidth > cell.clientWidth) {
                cell.title = cell.textContent.trim();
            }
        });
    }

    // Call addTooltips after table updates
    const originalUpdateTable = updateTable;
    updateTable = function(data) {
        originalUpdateTable(data);
        setTimeout(addTooltips, 100);
    };

    console.log('Dynamic Category Scraper Dashboard initialized successfully!');
    document.addEventListener("DOMContentLoaded", function() {
    // Get DOM elements
    const refreshBtn = document.getElementById("refreshBtn");
    const status = document.getElementById("status");
    const table = document.getElementById("resultsTable");
    const tableBody = document.getElementById("table-body");
    const dropdownToggle = document.getElementById("dropdownToggle");
    const dropdown = document.querySelector('.dropdown');
    const loadingOverlay = document.getElementById("loadingOverlay");
    
    // New elements for dynamic categories
    const filterButtonText = document.getElementById("filterButtonText");
    const categoryDropdown = document.getElementById("categoryDropdown");
    const dropdownItemsContainer = document.getElementById("dropdownItemsContainer");
    const selectAllBtn = document.getElementById("selectAllBtn");
    const clearAllBtn = document.getElementById("clearAllBtn");
    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    const categorySearch = document.getElementById("categorySearch");

    // State management
    let allCategories = new Set();
    let selectedCategories = new Set(['all']);
    let categoryData = new Map(); // Store category -> count mapping

    // Initialize the page
    init();

    function init() {
        setupEventListeners();
        addEntranceAnimations();
        createScrollToTopButton();
        populateCategoriesFromExistingData();
    }

    function setupEventListeners() {
        // Refresh button click event
        refreshBtn.addEventListener("click", handleRefresh);

        // Dropdown toggle
        dropdownToggle.addEventListener("click", toggleDropdown);

        // Category filter controls
        selectAllBtn.addEventListener("click", selectAllCategories);
        clearAllBtn.addEventListener("click", clearAllCategories);
        applyFiltersBtn.addEventListener("click", applySelectedFilters);
        categorySearch.addEventListener("input", filterCategorySearch);

        // Close dropdown when clicking outside
        document.addEventListener("click", function(event) {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove("active");
            }
        });

        // Scroll to top functionality
        window.addEventListener("scroll", handleScroll);
    }

    // Populate categories from existing table data
    function populateCategoriesFromExistingData() {
        const rows = tableBody.querySelectorAll('tr');
        const categories = new Set();
        const categoryCounts = new Map();

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 1) {
                const keyword = cells[1].textContent.trim().toLowerCase();
                const section = cells[7] ? cells[7].textContent.trim().toLowerCase() : '';
                
                if (keyword) {
                    categories.add(keyword);
                    categoryCounts.set(keyword, (categoryCounts.get(keyword) || 0) + 1);
                }
                if (section && section !== keyword) {
                    categories.add(section);
                    categoryCounts.set(section, (categoryCounts.get(section) || 0) + 1);
                }
            }
        });

        allCategories = categories;
        categoryData = categoryCounts;
        renderCategoryDropdown();
    }

    // Render the category dropdown with checkboxes
    function renderCategoryDropdown() {
        // Keep the "Show All" option
        const allOption = dropdownItemsContainer.querySelector('.dropdown-item-checkbox');
        dropdownItemsContainer.innerHTML = '';
        dropdownItemsContainer.appendChild(allOption);

        if (allCategories.size === 0) {
            const noCategories = document.createElement('div');
            noCategories.className = 'no-categories';
            noCategories.textContent = 'No categories found';
            dropdownItemsContainer.appendChild(noCategories);
            return;
        }

        // Sort categories alphabetically
        const sortedCategories = Array.from(allCategories).sort();

        sortedCategories.forEach(category => {
            const categoryItem = createCategoryCheckbox(category, categoryData.get(category) || 0);
            dropdownItemsContainer.appendChild(categoryItem);
        });

        updateFilterButtonText();
    }

    // Create a checkbox item for a category
    function createCategoryCheckbox(category, count) {
        const item = document.createElement('div');
        item.className = 'dropdown-item-checkbox';
        
        const checkboxId = `filter-${category.replace(/\s+/g, '-')}`;
        const isChecked = selectedCategories.has(category) ? 'checked' : '';
        
        item.innerHTML = `
            <input type="checkbox" id="${checkboxId}" value="${category}" ${isChecked}>
            <label for="${checkboxId}">
                <i class="fas ${getCategoryIcon(category)}"></i>
                <span>${capitalizeFirst(category)}</span>
                <span class="category-count">${count}</span>
            </label>
        `;

        // Add event listener for checkbox change
        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            handleCategorySelection(category, this.checked);
        });

        return item;
    }

    // Get appropriate icon for category
    function getCategoryIcon(category) {
        const iconMap = {
            'lawsuit': 'fa-gavel',
            'court': 'fa-university',
            'closure': 'fa-times-circle',
            'legal': 'fa-balance-scale',
            'business': 'fa-briefcase',
            'politics': 'fa-flag',
            'finance': 'fa-dollar-sign',
            'technology': 'fa-laptop',
            'health': 'fa-heartbeat',
            'education': 'fa-graduation-cap',
            'default': 'fa-tag'
        };
        
        return iconMap[category.toLowerCase()] || iconMap['default'];
    }

    // Capitalize first letter
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Handle category selection/deselection
    function handleCategorySelection(category, isSelected) {
        if (category === 'all') {
            if (isSelected) {
                selectedCategories.clear();
                selectedCategories.add('all');
                // Uncheck all other categories
                const otherCheckboxes = dropdownItemsContainer.querySelectorAll('input[type="checkbox"]:not([value="all"])');
                otherCheckboxes.forEach(cb => cb.checked = false);
            }
        } else {
            if (isSelected) {
                selectedCategories.delete('all');
                selectedCategories.add(category);
                // Uncheck "Show All"
                const allCheckbox = dropdownItemsContainer.querySelector('input[value="all"]');
                if (allCheckbox) allCheckbox.checked = false;
            } else {
                selectedCategories.delete(category);
                // If no categories selected, check "Show All"
                if (selectedCategories.size === 0) {
                    selectedCategories.add('all');
                    const allCheckbox = dropdownItemsContainer.querySelector('input[value="all"]');
                    if (allCheckbox) allCheckbox.checked = true;
                }
            }
        }

        updateFilterButtonText();
        updateApplyButtonState();
    }

    // Select all categories
    function selectAllCategories() {
        const checkboxes = dropdownItemsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            selectedCategories.add(checkbox.value);
        });
        updateFilterButtonText();
        updateApplyButtonState();
    }

    // Clear all categories
    function clearAllCategories() {
        const checkboxes = dropdownItemsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        selectedCategories.clear();
        selectedCategories.add('all');
        
        // Check only "Show All"
        const allCheckbox = dropdownItemsContainer.querySelector('input[value="all"]');
        if (allCheckbox) allCheckbox.checked = true;
        
        updateFilterButtonText();
        updateApplyButtonState();
    }

    // Apply selected filters
    function applySelectedFilters() {
        const rows = tableBody.querySelectorAll('tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) return;

            let shouldShow = false;

            if (selectedCategories.has('all')) {
                shouldShow = true;
            } else {
                const keyword = cells[1] ? cells[1].textContent.trim().toLowerCase() : '';
                const section = cells[7] ? cells[7].textContent.trim().toLowerCase() : '';

                // Check if any selected category matches
                for (const category of selectedCategories) {
                    if (keyword.includes(category.toLowerCase()) || 
                        section.includes(category.toLowerCase())) {
                        shouldShow = true;
                        break;
                    }
                }
            }

            if (shouldShow) {
                row.classList.remove('hidden');
                visibleCount++;
            } else {
                row.classList.add('hidden');
            }
        });

        // Update status message
        const selectedCount = selectedCategories.has('all') ? 'all' : selectedCategories.size;
        const statusMessage = selectedCategories.has('all') 
            ? `Showing all results (${visibleCount} items)`
            : `Filtered by ${selectedCount} categories (${visibleCount} items)`;
        
        updateStatus(statusMessage);
        dropdown.classList.remove('active');
    }

    // Filter category search
    function filterCategorySearch() {
        const searchTerm = categorySearch.value.toLowerCase();
        const categoryItems = dropdownItemsContainer.querySelectorAll('.dropdown-item-checkbox:not(:first-child)');

        categoryItems.forEach(item => {
            const label = item.querySelector('label span').textContent.toLowerCase();
            if (label.includes(searchTerm)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    // Update filter button text
    function updateFilterButtonText() {
        let text = 'Categories';
        
        if (selectedCategories.has('all')) {
            text += ' (All)';
        } else if (selectedCategories.size === 1) {
            const category = Array.from(selectedCategories)[0];
            text = `Category (${capitalizeFirst(category)})`;
        } else if (selectedCategories.size > 1) {
            text += ` (${selectedCategories.size} selected)`;
        } else {
            text += ' (None)';
        }

        filterButtonText.textContent = text;

        // Add/remove filter indicator
        let indicator = dropdown.querySelector('.filter-indicator');
        if (selectedCategories.size > 0 && !selectedCategories.has('all')) {
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.className = 'filter-indicator';
                dropdown.querySelector('.dropdown-toggle').appendChild(indicator);
            }
            indicator.textContent = selectedCategories.size;
        } else if (indicator) {
            indicator.remove();
        }
    }

    // Update apply button state
    function updateApplyButtonState() {
        // Button is always enabled, but could add logic here if needed
        applyFiltersBtn.disabled = false;
    }

    // Extract unique categories from new data
    function extractCategoriesFromData(data) {
        const categories = new Set();
        const categoryCounts = new Map();

        data.forEach(item => {
            const keyword = (item.keywords || item.keyword || '').toString().trim().toLowerCase();
            const section = (item.section || '').toString().trim().toLowerCase();

            if (keyword) {
                categories.add(keyword);
                categoryCounts.set(keyword, (categoryCounts.get(keyword) || 0) + 1);
            }
            if (section && section !== keyword) {
                categories.add(section);
                categoryCounts.set(section, (categoryCounts.get(section) || 0) + 1);
            }
        });

        return { categories, categoryCounts };
    }

    // Main refresh functionality (updated)
    async function handleRefresh() {
        try {
            setLoadingState(true);
            showLoadingOverlay(true);
            
            const response = await fetch("/refresh-scraper");
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Extract categories from new data
            const { categories, categoryCounts } = extractCategoriesFromData(result.data || []);
            allCategories = categories;
            categoryData = categoryCounts;
            
            // Update table with new data
            updateTable(result.data);
            
            // Re-render category dropdown
            renderCategoryDropdown();
            
            // Update status message
            updateStatus(result.message, "success");
            
            // Show success animation
            showSuccessAnimation();
            
        } catch (error) {
            console.error("Error fetching data:", error);
            updateStatus("Error fetching data. Please try again.", "error");
            showErrorAnimation();
        } finally {
            setLoadingState(false);
            showLoadingOverlay(false);
        }
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            refreshBtn.disabled = true;
            refreshBtn.classList.add("btn-loading");
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        } else {
            refreshBtn.disabled = false;
            refreshBtn.classList.remove("btn-loading");
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Fetch New Results';
        }
    }

    function showLoadingOverlay(show) {
        if (show) {
            loadingOverlay.classList.add("active");
        } else {
            loadingOverlay.classList.remove("active");
        }
    }

    function updateStatus(message, type = "default") {
        status.textContent = message;
        
        // Remove existing status classes
        status.classList.remove("loading", "success", "error");
        
        // Add new status class
        if (type !== "default") {
            status.classList.add(type);
        }

        // Auto-clear status after 5 seconds for success/error
        if (type === "success" || type === "error") {
            setTimeout(() => {
                status.textContent = "Ready to fetch new results";
                status.classList.remove("loading", "success", "error");
            }, 5000);
        }
    }

    function updateTable(data) {
        // Clear existing table body
        tableBody.innerHTML = "";
        
        // Check if data exists and is an array
        if (!data || !Array.isArray(data)) {
            const noDataRow = tableBody.insertRow();
            noDataRow.innerHTML = `
                <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                    No data available
                </td>
            `;
            return;
        }

        // Add new rows with animation
        data.forEach((rowData, index) => {
            setTimeout(() => {
                const row = tableBody.insertRow();
                row.style.opacity = "0";
                row.style.transform = "translateY(20px)";
                
                // Create table cell content
                // row.innerHTML = `
                //     <td>${escapeHtml(rowData.site || '')}</td>
                //     <td>${escapeHtml(rowData.keywords || rowData.keyword || '')}</td>
                //     <td>${escapeHtml(rowData.title || '')}</td>
                //     <td>
                //         ${rowData.url ? 
                //             `<a href="${escapeHtml(rowData.url)}" target="_blank">View Link</a>` : 
                //             '<span class="no-link">No URL</span>'
                //         }
                //     </td>
                //     <td>${escapeHtml(rowData.snippet || '')}</td>
                //     <td>${escapeHtml(rowData.date || '')}</td>
                //     <td>
                //         ${rowData.image ? 
                //             `<img src="${escapeHtml(rowData.image)}" width="80" alt="Article Image" onerror="this.style.display='none'">` : 
                //             '<span class="no-image">No Image</span>'
                //         }
                //     </td>
                //     <td>${escapeHtml(rowData.section || '')}</td>
                // `;
                row.innerHTML = `
                    <td>${escapeHtml(rowData.site || '')}</td>
                    <td>${escapeHtml(rowData.keywords || rowData.keyword || '')}</td>
                    <td>${escapeHtml(rowData.title || '')}</td>
                    <td>
                        ${rowData.url ? 
                            `<a href="${escapeHtml(rowData.url)}" target="_blank">View Link</a>` : 
                            '<span class="no-link">No URL</span>'
                        }
                    </td>
                    <td>${escapeHtml(rowData.section || '')}</td>
                `;

                // Animate row entrance
                setTimeout(() => {
                    row.style.transition = "all 0.5s ease";
                    row.style.opacity = "1";
                    row.style.transform = "translateY(0)";
                }, 50);

            }, index * 100);
        });
    }

    // Utility function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Dropdown functionality
    function toggleDropdown() {
        dropdown.classList.toggle("active");
    }

    // Filter functionality
    // function filterResults(category) {
    //     const rows = tableBody.querySelectorAll('tr');
    //     let visibleCount = 0;
        
        // rows.forEach(row => {
        //     const cells = row.querySelectorAll('td');
        //     if (cells.length === 0) return; // Skip if no cells (shouldn't happen)
            
        //     if (category === 'all') {
        //         row.classList.remove('hidden');
        //         visibleCount++;
        //     } else {
        //         const keyword = cells[1] ? cells[1].textContent.toLowerCase() : '';
        //         const section = cells[7] ? cells[7].textContent.toLowerCase() : '';
                
        //         if (keyword.includes(category.toLowerCase()) || 
        //             section.includes(category.toLowerCase())) {
        //             row.classList.remove('hidden');
        //             visibleCount++;
        //         } else {
        //             row.classList.add('hidden');
        //         }
        //     }
        // });

        // Update status
    //     const statusMessage = category === 'all' ? 
    //         `Showing all results (${visibleCount} items)` : 
    //         `Filtered by: ${category} (${visibleCount} items)`;
        
    //     updateStatus(statusMessage);
    //     dropdown.classList.remove('active');
    // }

    // function setActiveFilter(activeItem) {
    //     // Remove active class from all items
    //     dropdownItems.forEach(item => item.classList.remove('filter-active'));
    //     // Add active class to clicked item
    //     activeItem.classList.add('filter-active');
    // }

    // Animation functions
    function addEntranceAnimations() {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            setTimeout(() => {
                row.style.transition = 'all 0.5s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    function showSuccessAnimation() {
        // Add a subtle success animation to the table
        const tableContainer = document.querySelector('.table-container');
        tableContainer.style.transform = 'scale(1.02)';
        setTimeout(() => {
            tableContainer.style.transition = 'transform 0.3s ease';
            tableContainer.style.transform = 'scale(1)';
        }, 200);
    }

    function showErrorAnimation() {
        // Add a subtle shake animation for errors
        const tableContainer = document.querySelector('.table-container');
        tableContainer.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            tableContainer.style.animation = '';
        }, 500);
    }

    // Scroll to top functionality
    function createScrollToTopButton() {
        const scrollBtn = document.createElement('button');
        scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollBtn.className = 'scroll-top';
        scrollBtn.setAttribute('aria-label', 'Scroll to top');
        
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        document.body.appendChild(scrollBtn);
    }

    function handleScroll() {
        const scrollBtn = document.querySelector('.scroll-top');
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + R for refresh (prevent default browser refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (!refreshBtn.disabled) {
                handleRefresh();
            }
        }

        // Escape to close dropdown
        if (e.key === 'Escape') {
            dropdown.classList.remove('active');
        }
    });

    // Add CSS for shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
        }
    `;
    document.head.appendChild(style);

    // Auto-refresh functionality (optional)
    // let autoRefreshInterval;
    
    // function startAutoRefresh(minutes = 5) {
    //     stopAutoRefresh(); // Clear any existing interval
    //     autoRefreshInterval = setInterval(() => {
    //         if (!refreshBtn.disabled) {
    //             console.log('Auto-refreshing data...');
    //             handleRefresh();
    //         }
    //     }, minutes * 60 * 1000);
    // }

    // function stopAutoRefresh() {
    //     if (autoRefreshInterval) {
    //         clearInterval(autoRefreshInterval);
    //         autoRefreshInterval = null;
    //     }
    // }

    // Uncomment the line below to enable auto-refresh every 5 minutes
    // startAutoRefresh(5);

    // Table search functionality
    // function addSearchFunctionality() {
    //     const searchContainer = document.createElement('div');
    //     searchContainer.className = 'search-container';
    //     searchContainer.innerHTML = `
    //         <input type="text" id="tableSearch" placeholder="Search in table..." class="search-input">
    //         <i class="fas fa-search search-icon"></i>
    //     `;

    //     const tableContainer = document.querySelector('.table-container');
    //     tableContainer.parentNode.insertBefore(searchContainer, tableContainer);

    //     const searchInput = document.getElementById('tableSearch');
    //     searchInput.addEventListener('input', function() {
    //         const searchTerm = this.value.toLowerCase();
    //         const rows = tableBody.querySelectorAll('tr');
    //         let visibleCount = 0;

    //         rows.forEach(row => {
    //             const cells = row.querySelectorAll('td');
    //             let found = false;

    //             cells.forEach(cell => {
    //                 if (cell.textContent.toLowerCase().includes(searchTerm)) {
    //                     found = true;
    //                 }
    //             });

    //             if (found || searchTerm === '') {
    //                 row.style.display = '';
    //                 visibleCount++;
    //             } else {
    //                 row.style.display = 'none';
    //             }
    //         });

    //         // Update status with search results
    //         if (searchTerm) {
    //             updateStatus(`Search results: ${visibleCount} items found`);
    //         } else {
    //             updateStatus('Ready to fetch new results');
    //         }
    //     });
    // }

    // Add search functionality (uncomment to enable)
    // addSearchFunctionality();

    // Export/download functionality
    // function downloadTableAsCSV() {
    //     const rows = [];
    //     const headers = [];
        
    //     // Get headers
    //     const headerCells = document.querySelectorAll('#table-head th');
    //     headerCells.forEach(cell => {
    //         headers.push(cell.textContent.replace(/\s+/g, ' ').trim());
    //     });
    //     rows.push(headers);

    //     // Get visible data rows
    //     const dataRows = tableBody.querySelectorAll('tr:not([style*="display: none"])');
    //     dataRows.forEach(row => {
    //         const rowData = [];
    //         const cells = row.querySelectorAll('td');
    //         cells.forEach(cell => {
    //             // Handle links and images
    //             let cellText = cell.textContent.trim();
    //             const link = cell.querySelector('a');
    //             if (link) {
    //                 cellText = link.href;
    //             }
    //             rowData.push(cellText);
    //         });
    //         rows.push(rowData);
    //     });

    //     // Convert to CSV
    //     const csvContent = rows.map(row => 
    //         row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    //     ).join('\n');

    //     // Download
    //     const blob = new Blob([csvContent], { type: 'text/csv' });
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = `scraper-results-${new Date().toISOString().split('T')[0]}.csv`;
    //     document.body.appendChild(a);
    //     a.click();
    //     document.body.removeChild(a);
    //     window.URL.revokeObjectURL(url);

    //     updateStatus('Table exported as CSV successfully!', 'success');
    // }

    // Add export button to navbar (optional)
    // function addExportButton() {
    //     const exportBtn = document.createElement('button');
    //     exportBtn.className = 'btn btn-secondary';
    //     exportBtn.innerHTML = '<i class="fas fa-download"></i> Export CSV';
    //     exportBtn.addEventListener('click', downloadTableAsCSV);

    //     const navbarButtons = document.querySelector('.navbar-buttons');
    //     navbarButtons.appendChild(exportBtn);
    // }

    // Uncomment to add export functionality
    // addExportButton();

    // Performance monitoring
    // let lastRefreshTime = null;
    
    // function trackPerformance() {
    //     if (lastRefreshTime) {
    //         const timeDiff = Date.now() - lastRefreshTime;
    //         console.log(`Time since last refresh: ${timeDiff / 1000}s`);
    //     }
    //     lastRefreshTime = Date.now();
    // }

    // Error handling improvements
    window.addEventListener('error', function(e) {
        console.error('JavaScript Error:', e.error);
        updateStatus('An unexpected error occurred. Please refresh the page.', 'error');
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled Promise Rejection:', e.reason);
        updateStatus('Network error occurred. Please check your connection.', 'error');
    });

    // Network status monitoring
    window.addEventListener('online', function() {
        updateStatus('Connection restored', 'success');
    });

    window.addEventListener('offline', function() {
        updateStatus('No internet connection', 'error');
    });

    // Table utilities
    // function sortTableByColumn(columnIndex, ascending = true) {
    //     const rows = Array.from(tableBody.querySelectorAll('tr'));
        
    //     rows.sort((a, b) => {
    //         const aVal = a.cells[columnIndex].textContent.trim();
    //         const bVal = b.cells[columnIndex].textContent.trim();
            
    //         if (ascending) {
    //             return aVal.localeCompare(bVal);
    //         } else {
    //             return bVal.localeCompare(aVal);
    //         }
    //     });

    //     // Clear table body and re-add sorted rows
    //     tableBody.innerHTML = '';
    //     rows.forEach(row => tableBody.appendChild(row));
    // }

    // Add sorting functionality to headers (optional)
    // function addSortingToHeaders() {
    //     const headers = document.querySelectorAll('#table-head th');
    //     headers.forEach((header, index) => {
    //         header.style.cursor = 'pointer';
    //         header.style.userSelect = 'none';
            
    //         let ascending = true;
    //         header.addEventListener('click', () => {
    //             // Remove sort indicators from other headers
    //             headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
                
    //             // Add sort indicator to current header
    //             header.classList.add(ascending ? 'sort-asc' : 'sort-desc');
                
    //             sortTableByColumn(index, ascending);
    //             ascending = !ascending;
                
    //             updateStatus(`Table sorted by ${header.textContent.trim()}`, 'success');
    //         });
    //     });
    // }

    // Uncomment to enable column sorting
    // addSortingToHeaders();

    // Initialize tooltips for truncated content
    function addTooltips() {
        const cells = document.querySelectorAll('#table-body td');
        cells.forEach(cell => {
            if (cell.scrollWidth > cell.clientWidth) {
                cell.title = cell.textContent.trim();
            }
        });
    }

    // Call addTooltips after table updates
    const originalUpdateTable = updateTable;
    updateTable = function(data) {
        originalUpdateTable(data);
        setTimeout(addTooltips, 100);
    };

    console.log('Scraper Dashboard initialized successfully!');
});