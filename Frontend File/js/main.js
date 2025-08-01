/**
 * Islamic Finance Calculator - CORS-Fixed Version
 * Works with Node.js development server
 */

class IslamicFinanceCalculator {
    constructor() {
        this.currentLanguage = 'en';
        this.theme = localStorage.getItem('theme') || 'light';
        this.apiData = {
            currencies: {},
            goldSilver: {},
            historicalData: [],
            lastUpdate: null,
            systemStatus: null
        };
        
        // Auto-detect server environment
        this.appsScriptUrl = this.detectAppsScriptUrl();
        this.serverUrl = this.detectServerUrl();
        
        this.charts = {};
        this.updateInterval = null;
        this.debugMode = localStorage.getItem('debugMode') === 'true';
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    detectServerUrl() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port || (protocol === 'https:' ? '443' : '80');
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:${port}`;
        }
        
        return window.location.origin;
    }

    detectAppsScriptUrl() {
        // Check if URL is stored in localStorage or use environment detection
        const stored = localStorage.getItem('appsScriptUrl');
        if (stored) return stored;
        
        // For development, you can set this directly
        // Replace with your actual Google Apps Script URL when ready
        return '';
    }

    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.setupLanguage();
        this.checkEnvironment();
        this.setupErrorHandling();
        this.setupNetworkMonitoring();
        
        // Load initial data
        this.loadInitialData();
        this.startPeriodicUpdates();
        
        if (this.debugMode) {
            this.showDebugPanel();
        }
        
        this.showEnvironmentStatus();
    }

    checkEnvironment() {
        const protocol = window.location.protocol;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isSecure = protocol === 'https:';
        
        console.log('🔍 Environment Check:');
        console.log(`  Protocol: ${protocol}`);
        console.log(`  Localhost: ${isLocalhost}`);
        console.log(`  Secure: ${isSecure}`);
        console.log(`  CORS: ${protocol === 'file:' ? 'BLOCKED' : 'ENABLED'}`);
        
        if (protocol === 'file:') {
            this.showCORSWarning();
        } else {
            this.hideCORSWarning();
        }
    }

    showEnvironmentStatus() {
        const statusElement = document.getElementById('systemStatus');
        const statusText = document.querySelector('#systemStatus + span');
        
        if (!statusElement || !statusText) return;
        
        const protocol = window.location.protocol;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (protocol === 'file:') {
            statusElement.className = 'inline-block w-2 h-2 bg-red-500 rounded-full';
            statusText.textContent = 'CORS Blocked';
            statusElement.title = 'File protocol blocks API requests';
        } else if (isLocalhost) {
            statusElement.className = 'inline-block w-2 h-2 bg-green-500 rounded-full pulse';
            statusText.textContent = 'Development';
            statusElement.title = 'Running on local development server';
        } else {
            statusElement.className = 'inline-block w-2 h-2 bg-blue-500 rounded-full pulse';
            statusText.textContent = 'Production';
            statusElement.title = 'Running on production server';
        }
    }

    showCORSWarning() {
        const warning = document.getElementById('corsWarning');
        if (warning) {
            warning.classList.remove('hidden');
        }
        
        // Show notification
        this.showNotification(
            'CORS Issue: Please run from a local server. Use "npm run dev" to start the development server.',
            'error',
            10000 // 10 seconds
        );
    }

    hideCORSWarning() {
        const warning = document.getElementById('corsWarning');
        if (warning) {
            warning.classList.add('hidden');
        }
    }

    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification('Connection restored. Refreshing data...', 'success');
            this.loadInitialData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('Connection lost. Using cached data.', 'warning');
        });
    }

    async loadInitialData() {
        try {
            this.showLoadingState();
            this.debugLog('Starting data load...', 'info');
            
            // Check server status first
            await this.checkServerStatus();
            
            if (!this.appsScriptUrl) {
                this.debugLog('No Apps Script URL configured, using demo data', 'warning');
                this.loadDemoData();
                return;
            }

            if (!this.isOnline) {
                this.debugLog('Offline mode - using cached data', 'warning');
                this.loadCachedData();
                return;
            }

            this.debugLog(`Calling API: ${this.appsScriptUrl}`, 'info');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(`${this.appsScriptUrl}?action=getCurrentData`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors' // Explicitly enable CORS
            });
            
            clearTimeout(timeoutId);
            
            this.debugLog(`API Response: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response format - expected JSON');
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            this.processApiData(data);
            this.updateUI();
            this.cacheData(data); // Cache successful response
            this.debugLog('Data loaded successfully', 'success');
            
            this.retryCount = 0;
            this.showNotification('Live data loaded successfully!', 'success', 3000);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.debugLog(`Data load failed: ${error.message}`, 'error');
            this.handleApiError(error);
            
            // Implement retry logic
            if (this.retryCount < this.maxRetries && this.isOnline) {
                this.retryCount++;
                this.debugLog(`Retrying... (${this.retryCount}/${this.maxRetries})`, 'warning');
                setTimeout(() => this.loadInitialData(), 5000 * this.retryCount);
            } else {
                this.debugLog('Max retries reached or offline, using fallback data', 'error');
                this.loadFallbackData();
            }
        } finally {
            this.hideLoadingState();
        }
    }

    async checkServerStatus() {
        try {
            const response = await fetch(`${this.serverUrl}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const status = await response.json();
                this.debugLog(`Server status: ${status.status}`, 'success');
                return true;
            }
        } catch (error) {
            this.debugLog(`Server check failed: ${error.message}`, 'warning');
        }
        
        return false;
    }

    cacheData(data) {
        try {
            localStorage.setItem('cachedApiData', JSON.stringify({
                data,
                timestamp: Date.now(),
                version: '1.0'
            }));
            this.debugLog('Data cached successfully', 'info');
        } catch (error) {
            this.debugLog(`Caching failed: ${error.message}`, 'warning');
        }
    }

    loadCachedData() {
        try {
            const cached = localStorage.getItem('cachedApiData');
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;
                const ageHours = age / (1000 * 60 * 60);
                
                if (ageHours < 24) { // Use cache if less than 24 hours old
                    this.processApiData(data);
                    this.updateUI();
                    this.debugLog(`Using cached data (${ageHours.toFixed(1)} hours old)`, 'info');
                    this.showNotification(`Using cached data (${ageHours.toFixed(1)} hours old)`, 'info');
                    return;
                }
            }
        } catch (error) {
            this.debugLog(`Cache loading failed: ${error.message}`, 'warning');
        }
        
        this.loadDemoData();
    }

    loadFallbackData() {
        // Try cached data first, then demo data
        this.loadCachedData();
    }

    processApiData(data) {
        this.debugLog('Processing API data...', 'info');
        
        if (data.currencies) {
            this.apiData.currencies = {};
            Object.entries(data.currencies).forEach(([currency, info]) => {
                this.apiData.currencies[currency] = typeof info === 'object' ? info.rate : info;
            });
            this.debugLog(`Processed ${Object.keys(this.apiData.currencies).length} currencies`, 'success');
        }

        if (data.goldSilver) {
            this.apiData.goldSilver = data.goldSilver;
            this.debugLog('Gold/Silver data processed', 'success');
        }

        if (data.historicalData) {
            this.apiData.historicalData = data.historicalData;
            this.debugLog(`Historical data: ${data.historicalData.length} records`, 'info');
        }

        this.apiData.systemStatus = data.systemStatus;
        this.apiData.lastUpdate = data.lastUpdate || new Date();
        
        this.debugLog('API data processing complete', 'success');
    }

    updateUI() {
        this.updateLiveDataDisplay();
        this.updateSystemStatus();
        this.updateLastUpdateTime();
        this.updateDashboardCards();
        this.debugLog('UI updated', 'info');
    }

    updateLiveDataDisplay() {
        this.debugLog('Updating live data display...', 'info');
        
        // Update USD/PKR rate
        const usdPkrElement = document.getElementById('usdPkrRate');
        if (usdPkrElement && this.apiData.currencies.PKR) {
            const rate = this.apiData.currencies.PKR;
            usdPkrElement.textContent = `₨${rate.toFixed(2)}`;
            usdPkrElement.classList.add('updated');
            setTimeout(() => usdPkrElement.classList.remove('updated'), 2000);
            this.debugLog(`USD/PKR updated: ${rate}`, 'success');
        }

        // Update Gold price
        const goldPriceElement = document.getElementById('goldPrice');
        if (goldPriceElement && this.apiData.goldSilver.gold) {
            const goldPrice = this.apiData.goldSilver.gold.price_pkr_tola;
            goldPriceElement.textContent = `₨${goldPrice.toLocaleString()}`;
            goldPriceElement.classList.add('updated');
            
            const changeElement = document.getElementById('goldPriceChange');
            if (changeElement && this.apiData.goldSilver.gold.change24h !== undefined) {
                const change = this.apiData.goldSilver.gold.change24h;
                changeElement.textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                changeElement.className = change > 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm';
            }
            
            setTimeout(() => goldPriceElement.classList.remove('updated'), 2000);
            this.debugLog(`Gold price updated: ₨${goldPrice}`, 'success');
        }

        // Update Silver price
        const silverPriceElement = document.getElementById('silverPrice');
        if (silverPriceElement && this.apiData.goldSilver.silver) {
            const silverPrice = this.apiData.goldSilver.silver.price_pkr_tola;
            silverPriceElement.textContent = `₨${silverPrice.toLocaleString()}`;
            silverPriceElement.classList.add('updated');
            
            const changeElement = document.getElementById('silverPriceChange');
            if (changeElement && this.apiData.goldSilver.silver.change24h !== undefined) {
                const change = this.apiData.goldSilver.silver.change24h;
                changeElement.textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                changeElement.className = change > 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm';
            }
            
            setTimeout(() => silverPriceElement.classList.remove('updated'), 2000);
            this.debugLog(`Silver price updated: ₨${silverPrice}`, 'success');
        }
    }

    updateLastUpdateTime() {
        const updateTimeElement = document.getElementById('lastUpdateTime');
        if (updateTimeElement && this.apiData.lastUpdate) {
            const updateTime = new Date(this.apiData.lastUpdate);
            const now = new Date();
            const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
            
            let timeText;
            if (diffMinutes < 1) {
                timeText = 'Updated: Just now';
            } else if (diffMinutes < 60) {
                timeText = `Updated: ${diffMinutes} min ago`;
            } else {
                timeText = `Updated: ${updateTime.toLocaleTimeString()}`;
            }
            
            updateTimeElement.textContent = timeText;
            
            const debugUpdate = document.getElementById('debugLastUpdate');
            if (debugUpdate) {
                debugUpdate.textContent = updateTime.toLocaleString();
            }
        } else if (updateTimeElement) {
            updateTimeElement.textContent = 'Updated: Never';
        }
    }

    loadDemoData() {
        this.debugLog('Loading demo data...', 'info');
        
        this.apiData.currencies = {
            PKR: 281.50, EUR: 0.85, GBP: 0.73, SAR: 3.75, AED: 3.67,
            JPY: 110.25, CAD: 1.25, AUD: 1.35
        };

        this.apiData.goldSilver = {
            gold: {
                price_usd_oz: 2010.50,
                price_pkr_tola: 185000,
                price_pkr_gram: 15850,
                change24h: 0.75,
                lastUpdated: new Date()
            },
            silver: {
                price_usd_oz: 24.80,
                price_pkr_tola: 2180,
                price_pkr_gram: 187,
                change24h: -0.32,
                lastUpdated: new Date()
            }
        };

        this.apiData.lastUpdate = new Date();
        this.apiData.systemStatus = {
            status: 'demo',
            lastUpdate: new Date(),
            timeSinceUpdate: 0
        };

        this.updateUI();
        this.debugLog('Demo data loaded successfully', 'success');
        this.showNotification('Using demo data. Configure Apps Script for live data.', 'info', 5000);
    }

    // ... (include all other existing methods from the previous main.js)
    
    setupTheme() {
        if (this.theme === 'dark') {
            document.documentElement.classList.add('dark');
        }
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', this.theme);
        this.updateChartsTheme();
    }

    setupEventListeners() {
        const languageToggle = document.getElementById('languageToggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }

        const modal = document.getElementById('calculatorModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCalculator();
                }
            });
        }

        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.manualRefresh();
            });
        }
    }

    setupLanguage() {
        const savedLang = localStorage.getItem('language');
        if (savedLang) {
            this.currentLanguage = savedLang;
            this.updateLanguage();
        }
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'ur' : 'en';
        localStorage.setItem('language', this.currentLanguage);
        this.updateLanguage();
    }

    updateLanguage() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[this.currentLanguage] && translations[this.currentLanguage][key]) {
                element.textContent = translations[this.currentLanguage][key];
            }
        });

        if (this.currentLanguage === 'ur') {
            document.documentElement.dir = 'rtl';
            const langToggle = document.getElementById('languageToggle');
            if (langToggle) langToggle.textContent = 'English';
        } else {
            document.documentElement.dir = 'ltr';
            const langToggle = document.getElementById('languageToggle');
            if (langToggle) langToggle.textContent = 'اردو';
        }
    }

    async manualRefresh() {
        try {
            const refreshBtn = document.getElementById('refreshData');
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            }

            this.debugLog('Manual refresh triggered', 'info');
            await this.loadInitialData();
            
        } catch (error) {
            console.error('Manual refresh failed:', error);
            this.debugLog(`Manual refresh failed: ${error.message}`, 'error');
            this.showNotification('Failed to update data', 'error');
        } finally {
            const refreshBtn = document.getElementById('refreshData');
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            }
        }
    }

    startPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            if (this.isOnline && window.location.protocol !== 'file:') {
                this.debugLog('Periodic update triggered', 'info');
                this.loadInitialData();
            } else {
                this.debugLog('Skipping periodic update (offline or file protocol)', 'warning');
            }
        }, 5 * 60 * 1000); // 5 minutes
        
        this.debugLog('Periodic updates started (5 min interval)', 'info');
    }

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.debugLog(`Global error: ${event.error.message}`, 'error');
            this.handleGlobalError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.debugLog(`Unhandled rejection: ${event.reason}`, 'error');
            this.handleGlobalError(event.reason);
        });
    }

    handleApiError(error) {
        console.error('API Error:', error);
        
        let errorMsg = 'Unable to connect to data server';
        let suggestion = 'Using cached data.';
        
        if (error.name === 'AbortError') {
            errorMsg = 'Request timed out';
            suggestion = 'Check your internet connection.';
        } else if (error.message.includes('CORS')) {
            errorMsg = 'CORS policy blocking requests';
            suggestion = 'Run from local server using "npm run dev".';
        } else if (error.message.includes('404')) {
            errorMsg = 'Apps Script URL not found';
            suggestion = 'Verify your Apps Script URL is correct.';
        } else if (error.message.includes('403')) {
            errorMsg = 'Access denied';
            suggestion = 'Check Apps Script permissions.';
        }
        
        this.showNotification(`${errorMsg}. ${suggestion}`, 'warning', 8000);
        this.logError('API_ERROR', error);
    }

    handleGlobalError(error) {
        console.error('Global Error:', error);
        this.debugLog(`Global error: ${error.message || error}`, 'error');
        this.logError('GLOBAL_ERROR', error);
    }

    logError(type, error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            type: type,
            message: error.message || error.toString(),
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            appsScriptUrl: this.appsScriptUrl,
            serverUrl: this.serverUrl
        };
        
        const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
        logs.push(errorLog);
        logs.slice(-10);
        localStorage.setItem('errorLogs', JSON.stringify(logs));
    }

    showLoadingState() {
        const loadingElements = document.querySelectorAll('.loading-target');
        loadingElements.forEach(element => {
            element.innerHTML = '<div class="loading-spinner"></div>';
        });
        
        const updateTimeElement = document.getElementById('lastUpdateTime');
        if (updateTimeElement) {
            updateTimeElement.textContent = 'Updated: Loading...';
        }
    }

    hideLoadingState() {
        // Loading state will be hidden when data is updated
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300`;
        
        const bgColor = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        }[type] || 'bg-blue-500';
        
        notification.className += ` ${bgColor} text-white`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${this.getNotificationIcon(type)} mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    updateSystemStatus() {
        const statusElement = document.getElementById('systemStatus');
        if (!statusElement) return;

        const status = this.apiData.systemStatus;
        if (!status) return;

        let statusClass = 'bg-gray-500';
        let statusText = 'Unknown';

        switch (status.status) {
            case 'online':
                statusClass = 'bg-green-500 pulse';
                statusText = 'Live';
                break;
            case 'delayed':
                statusClass = 'bg-yellow-500';
                statusText = 'Delayed';
                break;
            case 'error':
                statusClass = 'bg-red-500';
                statusText = 'Error';
                break;
            case 'demo':
                statusClass = 'bg-blue-500';
                statusText = 'Demo';
                break;
        }

        statusElement.className = `inline-block w-2 h-2 rounded-full ${statusClass}`;
        statusElement.title = `Status: ${statusText} | Last Update: ${status.lastUpdate ? new Date(status.lastUpdate).toLocaleString() : 'Never'}`;
    }

    updateDashboardCards() {
        const cards = document.querySelectorAll('.dashboard-card');
        cards.forEach(card => {
            const indicator = card.querySelector('.live-indicator');
            if (indicator && this.apiData.lastUpdate) {
                const updateTime = new Date(this.apiData.lastUpdate);
                const now = new Date();
                const diff = (now - updateTime) / (1000 * 60);
                
                if (diff < 30) {
                    indicator.className = 'live-indicator absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full pulse';
                    indicator.title = 'Live data';
                } else if (diff < 60) {
                    indicator.className = 'live-indicator absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full';
                    indicator.title = 'Recent data';
                } else {
                    indicator.className = 'live-indicator absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full';
                    indicator.title = 'Stale data';
                }
            }
        });
    }

    updateChartsTheme() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.update) {
                const isDark = this.theme === 'dark';
                if (chart.options.plugins && chart.options.plugins.legend) {
                    chart.options.plugins.legend.labels.color = isDark ? '#f3f4f6' : '#374151';
                }
                if (chart.options.scales && chart.options.scales.x) {
                    chart.options.scales.x.ticks.color = isDark ? '#f3f4f6' : '#374151';
                }
                if (chart.options.scales && chart.options.scales.y) {
                    chart.options.scales.y.ticks.color = isDark ? '#f3f4f6' : '#374151';
                }
                chart.update();
            }
        });
    }

    debugLog(message, type = 'info') {
        if (!this.debugMode) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        
        console.log(`[DEBUG] ${logEntry}`);
        
        // Update debug panel if visible
        const debugLogs = document.getElementById('debugLogs');
        if (debugLogs) {
            const logElement = document.createElement('div');
            logElement.className = `text-${this.getLogColor(type)}-400`;
            logElement.textContent = logEntry;
            debugLogs.appendChild(logElement);
            debugLogs.scrollTop = debugLogs.scrollHeight;
            
            // Keep only last 50 logs
            while (debugLogs.children.length > 50) {
                debugLogs.removeChild(debugLogs.firstChild);
            }
        }
        
        // Store in localStorage for export
        const logs = JSON.parse(localStorage.getItem('debugLogs') || '[]');
        logs.push({ timestamp: new Date().toISOString(), message, type });
        logs.slice(-100);
        localStorage.setItem('debugLogs', JSON.stringify(logs));
    }

    getLogColor(type) {
        const colors = {
            info: 'blue',
            success: 'green',
            warning: 'yellow',
            error: 'red'
        };
        return colors[type] || 'gray';
    }

    showDebugPanel() {
        if (document.getElementById('debugPanel')) return;
        
        const debugHTML = `
            <div id="debugPanel" class="fixed bottom-4 right-4 w-80 bg-gray-900 text-white rounded-lg shadow-lg z-40">
                <div class="bg-gray-800 p-3 rounded-t-lg flex justify-between items-center">
                    <h3 class="font-medium">Debug Panel</h3>
                    <button onclick="this.toggleDebugPanel()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
                <div id="debugContent" class="p-3 max-h-60 overflow-y-auto text-xs font-mono">
                    <div class="space-y-2">
                        <div>Server URL: <span class="text-green-400">${this.serverUrl}</span></div>
                        <div>Apps Script URL: <span class="text-green-400">${this.appsScriptUrl || 'Not configured'}</span></div>
                        <div>Protocol: <span class="text-blue-400">${window.location.protocol}</span></div>
                        <div>Online: <span id="debugOnline" class="text-green-400">${this.isOnline}</span></div>
                        <div>Last Update: <span id="debugLastUpdate" class="text-yellow-400">Never</span></div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-gray-700">
                        <div class="flex space-x-2 mb-2">
                            <button onclick="window.calculatorApp.testConnection()" class="px-2 py-1 bg-blue-600 rounded text-xs">Test API</button>
                            <button onclick="window.calculatorApp.clearLogs()" class="px-2 py-1 bg-red-600 rounded text-xs">Clear</button>
                            <button onclick="window.calculatorApp.exportLogs()" class="px-2 py-1 bg-green-600 rounded text-xs">Export</button>
                        </div>
                        <div id="debugLogs" class="text-xs space-y-1 max-h-32 overflow-y-auto">
                            <!-- Debug logs will appear here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', debugHTML);
    }

    async testConnection() {
        this.debugLog('Testing connection...', 'info');
        
        // Test server first
        try {
            const serverResponse = await fetch(`${this.serverUrl}/health`);
            if (serverResponse.ok) {
                const serverData = await serverResponse.json();
                this.debugLog(`Server: ${serverData.status}`, 'success');
            }
        } catch (error) {
            this.debugLog(`Server test failed: ${error.message}`, 'error');
        }
        
        // Test Apps Script if configured
        if (this.appsScriptUrl) {
            try {
                const apiResponse = await fetch(`${this.appsScriptUrl}?action=getCurrentData`);
                const apiData = await apiResponse.json();
                this.debugLog(`Apps Script: ${apiResponse.status} - Data received`, 'success');
            } catch (error) {
                this.debugLog(`Apps Script test failed: ${error.message}`, 'error');
            }
        } else {
            this.debugLog('Apps Script URL not configured', 'warning');
        }
    }

    clearLogs() {
        localStorage.removeItem('debugLogs');
        const debugLogs = document.getElementById('debugLogs');
        if (debugLogs) {
            debugLogs.innerHTML = '';
        }
        this.debugLog('Debug logs cleared', 'info');
    }

    exportLogs() {
        const logs = JSON.parse(localStorage.getItem('debugLogs') || '[]');
        const logText = logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `islamic-finance-calculator-debug-${new Date().toISOString().split('T')[0]}.log`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.debugLog('Debug logs exported', 'success');
    }

    toggleDebugPanel() {
        const panel = document.getElementById('debugPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Calculator functions
    openCalculator(type) {
        const modal = document.getElementById('calculatorModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');

        const titles = {
            'savings': this.currentLanguage === 'ur' ? 'بچت کیلکولیٹر' : 'Savings Calculator',
            'mutual-funds': this.currentLanguage === 'ur' ? 'میوچوئل فنڈز کیلکولیٹر' : 'Mutual Funds Calculator',
            'gold-silver': this.currentLanguage === 'ur' ? 'سونا چاندی کیلکولیٹر' : 'Gold & Silver Calculator',
            'currency': this.currentLanguage === 'ur' ? 'کرنسی کنورٹر' : 'Currency Converter'
        };

        if (modalTitle) modalTitle.textContent = titles[type] || 'Calculator';
        if (modalContent) modalContent.innerHTML = this.getCalculatorContent(type);
        
        if (modal) {
            modal.classList.remove('hidden');
            const modalBody = modal.querySelector('.bg-white, .dark\\:bg-gray-800');
            if (modalBody) modalBody.classList.add('slide-up');
        }
        
        this.initializeCalculator(type);
    }

    closeCalculator() {
        const modal = document.getElementById('calculatorModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    getCalculatorContent(type) {
        // Placeholder - implement specific calculator HTML
        return `<div class="p-8 text-center">
            <i class="fas fa-calculator text-4xl text-blue-500 mb-4"></i>
            <h3 class="text-xl font-bold mb-2">${type.replace('-', ' & ').replace(/\b\w/g, l => l.toUpperCase())} Calculator</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">Calculator implementation coming soon...</p>
            <button onclick="window.calculatorApp.closeCalculator()" class="calculator-button">Close</button>
        </div>`;
    }

    initializeCalculator(type) {
        // Placeholder - implement specific calculator initialization
        this.debugLog(`Initializing ${type} calculator`, 'info');
    }

    // Utility functions
    formatCurrency(amount, currency = 'PKR') {
        const symbols = { PKR: '₨', USD: '$', EUR: '€', GBP: '£', SAR: 'ر.س', AED: 'د.إ' };
        const symbol = symbols[currency] || currency;
        return `${symbol}${amount.toLocaleString()}`;
    }

    calculateCompoundInterest(principal, rate, time, compoundingFrequency = 12) {
        const amount = principal * Math.pow((1 + rate / (100 * compoundingFrequency)), compoundingFrequency * time);
        return amount - principal;
    }

    calculateMudarabahProfit(principal, profitRate, months) {
        const monthlyProfitRate = profitRate / 12;
        let totalProfit = 0;
        
        for (let month = 1; month <= months; month++) {
            const monthlyProfit = principal * (monthlyProfitRate / 100);
            totalProfit += monthlyProfit;
        }
        
        return totalProfit;
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
    }
}

// Global functions for HTML onclick events
function openCalculator(type) {
    if (window.calculatorApp) {
        window.calculatorApp.openCalculator(type);
    }
}

function closeCalculator() {
    if (window.calculatorApp) {
        window.calculatorApp.closeCalculator();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.calculatorApp = new IslamicFinanceCalculator();
    
    // Enable debug mode by default in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.calculatorApp.debugMode = true;
        localStorage.setItem('debugMode', 'true');
    }
    
    console.log('🚀 Islamic Finance Calculator Initialized');
    console.log('Environment:', window.location.protocol === 'file:' ? 'File System (CORS blocked)' : 'Server (CORS enabled)');
    console.log('Debug mode:', window.calculatorApp.debugMode ? 'Enabled' : 'Disabled');
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.calculatorApp) {
        window.calculatorApp.destroy();
    }
});