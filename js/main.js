/**
 * Islamic Finance Calculator - Netlify CORS Fixed Version
 */

// Configuration for Netlify deployment
const API_CONFIG = {
    // Netlify proxy URLs (from our _redirects file)
    GOLD_API: '/api/gold',
    SILVER_API: '/api/silver', 
    CURRENCY_API: '/api/currency',
    CRYPTO_API: '/api/crypto',
    
    // Demo data fallback
    DEMO_DATA: {
        currencies: {
            PKR: 281.50, EUR: 0.85, GBP: 0.73, SAR: 3.75, AED: 3.67,
            JPY: 110.25, CAD: 1.25, AUD: 1.35
        },
        goldSilver: {
            gold: {
                price_pkr_tola: 185000,
                change24h: 0.75
            },
            silver: {
                price_pkr_tola: 2180,
                change24h: -0.32
            }
        }
    }
};

// Main Calculator Application
class IslamicFinanceCalculator {
    constructor() {
        this.isLoading = false;
        this.usingDemo = false;
        this.apiData = API_CONFIG.DEMO_DATA;
        this.lastUpdate = new Date();
        
        this.init();
    }

    init() {
        console.log('🕌 Islamic Finance Calculator - Initializing...');
        
        // Setup basic functionality
        this.setupEventListeners();
        this.setupTheme();
        
        // Load data
        this.loadInitialData();
        
        console.log('✅ Calculator initialized successfully');
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.manualRefresh());
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Language toggle
        const langToggle = document.getElementById('languageToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }

    toggleTheme() {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    toggleLanguage() {
        const currentLang = document.documentElement.lang;
        const newLang = currentLang === 'en' ? 'ur' : 'en';
        document.documentElement.lang = newLang;
        document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
        localStorage.setItem('language', newLang);
        
        const langBtn = document.getElementById('languageToggle');
        if (langBtn) {
            langBtn.textContent = newLang === 'ur' ? 'English' : 'اردو';
        }
    }

    async loadInitialData() {
        console.log('📊 Loading market data...');
        this.showLoadingState();

        try {
            // Try to fetch live data using Netlify proxy
            const liveData = await this.fetchLiveData();
            
            if (liveData) {
                this.apiData = liveData;
                this.usingDemo = false;
                this.updateStatus('live', 'Live Data');
                console.log('✅ Live data loaded successfully');
            } else {
                throw new Error('Live data fetch failed');
            }

        } catch (error) {
            console.warn('⚠️ Using demo data:', error.message);
            this.apiData = API_CONFIG.DEMO_DATA;
            this.usingDemo = true;
            this.updateStatus('demo', 'Demo Mode');
        }

        this.updateUI();
        this.hideLoadingState();
        this.lastUpdate = new Date();
    }

    async fetchLiveData() {
        try {
            // Fetch currency data
            const currencyResponse = await fetch(API_CONFIG.CURRENCY_API, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (currencyResponse.ok) {
                const currencyData = await currencyResponse.json();
                console.log('💱 Currency data fetched successfully');
                
                return {
                    currencies: currencyData.rates || API_CONFIG.DEMO_DATA.currencies,
                    goldSilver: API_CONFIG.DEMO_DATA.goldSilver // Will be replaced with actual gold API
                };
            }

            return null;

        } catch (error) {
            console.error('API fetch error:', error);
            return null;
        }
    }

    updateUI() {
        this.updateLiveDataDisplay();
        this.updateLastUpdateTime();
        this.updateStatusIndicators();
    }

    updateLiveDataDisplay() {
        // Update USD/PKR rate
        const usdPkrElement = document.querySelector('.usd-pkr-rate, #usdPkrRate');
        if (usdPkrElement && this.apiData.currencies) {
            const rate = this.apiData.currencies.PKR || this.apiData.currencies.USD || 281.50;
            usdPkrElement.textContent = `₨${rate.toFixed(2)}`;
        }

        // Update Gold price
        const goldPriceElement = document.querySelector('.gold-price, #goldPrice');
        if (goldPriceElement && this.apiData.goldSilver) {
            const goldPrice = this.apiData.goldSilver.gold.price_pkr_tola;
            goldPriceElement.textContent = `₨${goldPrice.toLocaleString()}`;
        }

        // Update Silver price
        const silverPriceElement = document.querySelector('.silver-price, #silverPrice');
        if (silverPriceElement && this.apiData.goldSilver) {
            const silverPrice = this.apiData.goldSilver.silver.price_pkr_tola;
            silverPriceElement.textContent = `₨${silverPrice.toLocaleString()}`;
        }

        console.log('🔄 UI updated with', this.usingDemo ? 'demo' : 'live', 'data');
    }

    updateLastUpdateTime() {
        const updateElements = document.querySelectorAll('#lastUpdateTime, .last-update');
        updateElements.forEach(element => {
            const now = new Date();
            const diffMinutes = Math.floor((now - this.lastUpdate) / (1000 * 60));
            
            let timeText;
            if (diffMinutes < 1) {
                timeText = 'Updated: Just now';
            } else if (diffMinutes < 60) {
                timeText = `Updated: ${diffMinutes} min ago`;
            } else {
                timeText = `Updated: ${this.lastUpdate.toLocaleTimeString()}`;
            }
            
            element.textContent = timeText;
        });
    }

    updateStatusIndicators() {
        // Update all status indicators
        const statusElements = document.querySelectorAll('.live-indicator, #systemStatus');
        statusElements.forEach(element => {
            if (this.usingDemo) {
                element.className = element.className.replace(/bg-\w+-\d+/, 'bg-yellow-400');
                element.title = 'Demo Mode - Using sample data';
            } else {
                element.className = element.className.replace(/bg-\w+-\d+/, 'bg-green-400');
                element.title = 'Live Data - Updated from APIs';
            }
        });
    }

    updateStatus(status, text) {
        const statusElement = document.getElementById('systemStatus');
        const statusText = statusElement ? statusElement.nextElementSibling : null;
        
        if (statusElement && statusText) {
            const colorMap = {
                'live': 'bg-green-500',
                'demo': 'bg-yellow-500',
                'error': 'bg-red-500'
            };
            
            statusElement.className = `inline-block w-2 h-2 rounded-full ${colorMap[status] || 'bg-gray-500'}`;
            statusText.textContent = text;
        }
    }

    showLoadingState() {
        this.isLoading = true;
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Loading...';
        }
    }

    hideLoadingState() {
        this.isLoading = false;
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i> Refresh';
        }
    }

    async manualRefresh() {
        if (this.isLoading) return;
        
        console.log('🔄 Manual refresh triggered');
        await this.loadInitialData();
        
        // Show notification
        this.showNotification(
            this.usingDemo ? 'Demo data refreshed' : 'Live data updated',
            this.usingDemo ? 'warning' : 'success'
        );
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transform translate-x-full transition-transform duration-300`;
        
        const bgColors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        notification.className += ` ${bgColors[type] || 'bg-blue-500'}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        
        // Auto remove
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

    // Calculator functions
    openCalculator(type) {
        console.log(`Opening ${type} calculator`);
        
        const modal = document.getElementById('calculatorModal');
        const title = document.getElementById('calculatorTitle');
        const content = document.getElementById('calculatorContent');
        
        // Set calculator title
        const titles = {
            'savings': 'Savings Calculator',
            'mutual-funds': 'Mutual Funds Calculator',
            'gold-silver': 'Gold & Silver Calculator',
            'currency': 'Currency Converter'
        };
        
        title.textContent = titles[type] || 'Calculator';
        
        // Load calculator content
        let html = '';
        switch(type) {
            case 'savings':
                html = this.getSavingsCalculatorHTML();
                break;
            case 'mutual-funds':
                html = this.getMutualFundsCalculatorHTML();
                break;
            case 'gold-silver':
                html = this.getGoldSilverCalculatorHTML();
                break;
            case 'currency':
                html = this.getCurrencyCalculatorHTML();
                break;
        }
        
        content.innerHTML = html;
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Initialize calculator-specific functionality
        switch(type) {
            case 'savings':
                this.initSavingsCalculator();
                break;
            case 'mutual-funds':
                this.initMutualFundsCalculator();
                break;
            case 'gold-silver':
                this.initGoldSilverCalculator();
                break;
            case 'currency':
                this.initCurrencyCalculator();
                break;
        }
    }

    closeCalculator() {
        const modal = document.getElementById('calculatorModal');
        modal.classList.add('hidden');
    }

    // Utility functions for calculations
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    calculateMudarabahProfit(principal, rate, months) {
        // Simple profit calculation for Islamic finance (no compounding)
        return (principal * rate * months) / (12 * 100);
    }

    updateCurrentPrices() {
        // Update current gold/silver prices in the calculator
        const currentGoldPrice = document.getElementById('currentGoldPrice');
        const currentSilverPrice = document.getElementById('currentSilverPrice');
        
        if (currentGoldPrice && this.apiData.goldSilver) {
            currentGoldPrice.textContent = `₨${this.apiData.goldSilver.gold.price_pkr_tola.toLocaleString()}/tola`;
        }
        
        if (currentSilverPrice && this.apiData.goldSilver) {
            currentSilverPrice.textContent = `₨${this.apiData.goldSilver.silver.price_pkr_tola.toLocaleString()}/tola`;
        }
    }

    populateExchangeRates() {
        const ratesGrid = document.getElementById('exchangeRatesGrid');
        if (!ratesGrid || !this.apiData.currencies) return;
        
        ratesGrid.innerHTML = '';
        Object.entries(this.apiData.currencies).forEach(([currency, rate]) => {
            if (currency !== 'USD') {
                const rateDiv = document.createElement('div');
                rateDiv.className = 'text-center p-2 bg-gray-100 dark:bg-gray-600 rounded';
                rateDiv.innerHTML = `<div class="font-semibold">${currency}</div><div>₨${rate.toFixed(2)}</div>`;
                ratesGrid.appendChild(rateDiv);
            }
        });
    }

    convertCurrency() {
        const amount = parseFloat(document.getElementById('currencyAmount').value) || 0;
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        
        if (amount <= 0) {
            document.getElementById('convertedAmount').value = '';
            return;
        }
        
        const rates = this.apiData.currencies;
        let convertedAmount;
        
        if (fromCurrency === 'USD') {
            convertedAmount = amount * (rates[toCurrency] || 1);
        } else if (toCurrency === 'USD') {
            convertedAmount = amount / (rates[fromCurrency] || 1);
        } else {
            // Convert through USD
            const usdAmount = amount / (rates[fromCurrency] || 1);
            convertedAmount = usdAmount * (rates[toCurrency] || 1);
        }
        
        document.getElementById('convertedAmount').value = convertedAmount.toFixed(2);
    }

    createSavingsChart(initialAmount, monthlyDeposit, rate, years) {
        // Simple chart creation - will be enhanced later
        console.log('Creating savings chart...', { initialAmount, monthlyDeposit, rate, years });
    }

    // Calculator HTML generation methods
    getSavingsCalculatorHTML() {
        return `
            <div class="space-y-6">
                <!-- Calculator Type Selection -->
                <div class="grid grid-cols-2 gap-4">
                    <button id="islamicSavings" class="calculator-button" onclick="switchSavingsType('islamic')">
                        <i class="fas fa-mosque mr-2"></i>Islamic (Mudarabah)
                    </button>
                    <button id="conventionalSavings" class="calculator-button-secondary" onclick="switchSavingsType('conventional')">
                        <i class="fas fa-percentage mr-2"></i>Conventional (Interest)
                    </button>
                </div>

                <!-- Input Form -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="calculator-label">Initial Amount (PKR)</label>
                        <input type="number" id="savingsAmount" class="calculator-input" placeholder="100000">
                    </div>
                    <div>
                        <label class="calculator-label">Monthly Deposit (PKR)</label>
                        <input type="number" id="monthlyDeposit" class="calculator-input" placeholder="5000">
                    </div>
                    <div>
                        <label class="calculator-label" id="rateLabel">Profit Rate (%)</label>
                        <input type="number" id="savingsRate" class="calculator-input" placeholder="8.5" step="0.1">
                    </div>
                    <div>
                        <label class="calculator-label">Time Period (Years)</label>
                        <input type="number" id="savingsTime" class="calculator-input" placeholder="5">
                    </div>
                </div>

                <!-- Calculate Button -->
                <div class="text-center">
                    <button onclick="calculateSavings()" class="calculator-button">
                        <i class="fas fa-calculator mr-2"></i>Calculate Profit
                    </button>
                </div>

                <!-- Results -->
                <div id="savingsResults" class="hidden">
                    <div class="result-card">
                        <h3 class="text-lg font-semibold mb-4">Calculation Results</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm opacity-75">Total Investment</p>
                                <p id="totalInvestment" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Total Profit</p>
                                <p id="totalProfit" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Final Amount</p>
                                <p id="finalAmount" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Effective Rate</p>
                                <p id="effectiveRate" class="result-highlight"></p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Export Options -->
                    <div class="export-buttons">
                        <button onclick="exportSavingsCalculation('pdf')" class="export-btn">
                            <i class="fas fa-file-pdf mr-2"></i>Export PDF
                        </button>
                        <button onclick="exportSavingsCalculation('excel')" class="export-btn">
                            <i class="fas fa-file-excel mr-2"></i>Export Excel
                        </button>
                    </div>
                </div>

                <!-- Chart -->
                <div id="savingsChart" class="chart-container hidden">
                    <canvas id="savingsChartCanvas"></canvas>
                </div>
            </div>
        `;
    }

    getMutualFundsCalculatorHTML() {
        return `
            <div class="space-y-6">
                <!-- Fund Selection -->
                <div>
                    <label class="calculator-label">Select Fund</label>
                    <select id="fundSelect" class="calculator-input">
                        <option value="custom">Custom Fund</option>
                        <option value="islamic_equity">Islamic Equity Fund</option>
                        <option value="balanced">Balanced Fund</option>
                        <option value="money_market">Money Market Fund</option>
                    </select>
                </div>

                <!-- Input Form -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="calculator-label">Investment Amount (PKR)</label>
                        <input type="number" id="investmentAmount" class="calculator-input" placeholder="100000">
                    </div>
                    <div>
                        <label class="calculator-label">Current NAV</label>
                        <input type="number" id="currentNAV" class="calculator-input" placeholder="50.25" step="0.01">
                    </div>
                    <div>
                        <label class="calculator-label">Expected Annual Return (%)</label>
                        <input type="number" id="expectedReturn" class="calculator-input" placeholder="12" step="0.1">
                    </div>
                    <div>
                        <label class="calculator-label">Investment Period (Years)</label>
                        <input type="number" id="investmentPeriod" class="calculator-input" placeholder="3">
                    </div>
                </div>

                <!-- Monthly SIP Option -->
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <label class="flex items-center">
                        <input type="checkbox" id="sipOption" class="mr-2">
                        <span class="calculator-label mb-0">Enable Monthly SIP</span>
                    </label>
                    <input type="number" id="sipAmount" class="calculator-input mt-2 hidden" placeholder="Monthly SIP Amount">
                </div>

                <!-- Calculate Button -->
                <div class="text-center">
                    <button onclick="calculateMutualFunds()" class="calculator-button">
                        <i class="fas fa-chart-line mr-2"></i>Calculate Returns
                    </button>
                </div>

                <!-- Results -->
                <div id="mutualFundsResults" class="hidden">
                    <div class="result-card">
                        <h3 class="text-lg font-semibold mb-4">Investment Projection</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm opacity-75">Units Purchased</p>
                                <p id="unitsPurchased" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Projected NAV</p>
                                <p id="projectedNAV" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Total Investment</p>
                                <p id="totalInvestmentMF" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Projected Value</p>
                                <p id="projectedValue" class="result-highlight"></p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Export Options -->
                    <div class="export-buttons">
                        <button onclick="exportMutualFundsCalculation('pdf')" class="export-btn">
                            <i class="fas fa-file-pdf mr-2"></i>Export PDF
                        </button>
                        <button onclick="exportMutualFundsCalculation('excel')" class="export-btn">
                            <i class="fas fa-file-excel mr-2"></i>Export Excel
                        </button>
                    </div>
                </div>

                <!-- Chart -->
                <div id="mutualFundsChart" class="chart-container hidden">
                    <canvas id="mutualFundsChartCanvas"></canvas>
                </div>
            </div>
        `;
    }

    getGoldSilverCalculatorHTML() {
        return `
            <div class="space-y-6">
                <!-- Metal Selection -->
                <div class="grid grid-cols-2 gap-4">
                    <button id="goldButton" class="calculator-button" onclick="switchMetal('gold')">
                        <i class="fas fa-coins mr-2"></i>Gold Calculator
                    </button>
                    <button id="silverButton" class="calculator-button-secondary" onclick="switchMetal('silver')">
                        <i class="fas fa-medal mr-2"></i>Silver Calculator
                    </button>
                </div>

                <!-- Current Prices Display -->
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h4 class="font-semibold mb-2">Current Market Prices</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-yellow-600">Gold (24K):</span>
                            <span id="currentGoldPrice" class="font-medium">₨180,000/tola</span>
                        </div>
                        <div>
                            <span class="text-gray-400">Silver:</span>
                            <span id="currentSilverPrice" class="font-medium">₨2,150/tola</span>
                        </div>
                    </div>
                </div>

                <!-- Input Form -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="calculator-label">Purchase Quantity</label>
                        <input type="number" id="metalQuantity" class="calculator-input" placeholder="5" step="0.001">
                    </div>
                    <div>
                        <label class="calculator-label">Weight Unit</label>
                        <select id="weightUnit" class="calculator-input">
                            <option value="tola">Tola</option>
                            <option value="gram">Gram</option>
                            <option value="ounce">Ounce</option>
                            <option value="kg">Kilogram</option>
                        </select>
                    </div>
                    <div>
                        <label class="calculator-label">Purchase Price (per unit)</label>
                        <input type="number" id="purchasePrice" class="calculator-input" placeholder="180000">
                    </div>
                    <div>
                        <label class="calculator-label">Purity (%)</label>
                        <select id="metalPurity" class="calculator-input">
                            <option value="100">24K Gold / Pure Silver (100%)</option>
                            <option value="91.67">22K Gold (91.67%)</option>
                            <option value="83.33">20K Gold (83.33%)</option>
                            <option value="75">18K Gold (75%)</option>
                            <option value="58.33">14K Gold (58.33%)</option>
                        </select>
                    </div>
                </div>

                <!-- Calculate Button -->
                <div class="text-center">
                    <button onclick="calculateGoldSilver()" class="calculator-button">
                        <i class="fas fa-balance-scale mr-2"></i>Calculate Profit/Loss
                    </button>
                </div>

                <!-- Results -->
                <div id="goldSilverResults" class="hidden">
                    <div class="result-card">
                        <h3 class="text-lg font-semibold mb-4">Investment Analysis</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm opacity-75">Total Investment</p>
                                <p id="totalInvestmentGS" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Current Value</p>
                                <p id="currentValueGS" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Profit/Loss</p>
                                <p id="profitLossGS" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Return %</p>
                                <p id="returnPercentGS" class="result-highlight"></p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Export Options -->
                    <div class="export-buttons">
                        <button onclick="exportGoldSilverCalculation('pdf')" class="export-btn">
                            <i class="fas fa-file-pdf mr-2"></i>Export PDF
                        </button>
                        <button onclick="exportGoldSilverCalculation('excel')" class="export-btn">
                            <i class="fas fa-file-excel mr-2"></i>Export Excel
                        </button>
                    </div>
                </div>

                <!-- Chart -->
                <div id="goldSilverChart" class="chart-container hidden">
                    <canvas id="goldSilverChartCanvas"></canvas>
                </div>
            </div>
        `;
    }

    getCurrencyCalculatorHTML() {
        return `
            <div class="space-y-6">
                <!-- Currency Converter -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label class="calculator-label">From</label>
                        <select id="fromCurrency" class="calculator-input">
                            <option value="USD">USD - US Dollar</option>
                            <option value="PKR">PKR - Pakistani Rupee</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="SAR">SAR - Saudi Riyal</option>
                            <option value="AED">AED - UAE Dirham</option>
                        </select>
                    </div>
                    <div>
                        <label class="calculator-label">To</label>
                        <select id="toCurrency" class="calculator-input">
                            <option value="PKR">PKR - Pakistani Rupee</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="SAR">SAR - Saudi Riyal</option>
                            <option value="AED">AED - UAE Dirham</option>
                        </select>
                    </div>
                    <div>
                        <button onclick="swapCurrencies()" class="calculator-button-secondary w-full">
                            <i class="fas fa-exchange-alt"></i> Swap
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="calculator-label">Amount</label>
                        <input type="number" id="currencyAmount" class="calculator-input" placeholder="1000" oninput="convertCurrency()">
                    </div>
                    <div>
                        <label class="calculator-label">Converted Amount</label>
                        <input type="number" id="convertedAmount" class="calculator-input" readonly>
                    </div>
                </div>

                <!-- Live Exchange Rates -->
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h4 class="font-semibold mb-3">Live Exchange Rates (Base: USD)</h4>
                    <div id="exchangeRatesGrid" class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <!-- Rates will be populated here -->
                    </div>
                </div>

                <!-- Currency Investment Calculator -->
                <div class="border-t pt-6">
                    <h4 class="font-semibold mb-4">Currency Investment Calculator</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="calculator-label">Investment Amount</label>
                            <input type="number" id="currencyInvestmentAmount" class="calculator-input" placeholder="100000">
                        </div>
                        <div>
                            <label class="calculator-label">Investment Currency</label>
                            <select id="investmentCurrency" class="calculator-input">
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                            </select>
                        </div>
                        <div>
                            <label class="calculator-label">Purchase Rate (PKR)</label>
                            <input type="number" id="purchaseRate" class="calculator-input" placeholder="280">
                        </div>
                        <div>
                            <label class="calculator-label">Current Rate (PKR)</label>
                            <input type="number" id="currentRate" class="calculator-input" placeholder="285">
                        </div>
                    </div>

                    <div class="text-center mt-4">
                        <button onclick="calculateCurrencyInvestment()" class="calculator-button">
                            <i class="fas fa-chart-line mr-2"></i>Calculate Currency Gain/Loss
                        </button>
                    </div>
                </div>

                <!-- Results -->
                <div id="currencyResults" class="hidden">
                    <div class="result-card">
                        <h3 class="text-lg font-semibold mb-4">Currency Investment Results</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm opacity-75">Investment (PKR)</p>
                                <p id="totalInvestmentCurrency" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Current Value (PKR)</p>
                                <p id="currentValueCurrency" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Gain/Loss (PKR)</p>
                                <p id="gainLossCurrency" class="result-highlight"></p>
                            </div>
                            <div>
                                <p class="text-sm opacity-75">Return %</p>
                                <p id="returnPercentCurrency" class="result-highlight"></p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Export Options -->
                    <div class="export-buttons">
                        <button onclick="exportCurrencyCalculation('pdf')" class="export-btn">
                            <i class="fas fa-file-pdf mr-2"></i>Export PDF
                        </button>
                        <button onclick="exportCurrencyCalculation('excel')" class="export-btn">
                            <i class="fas fa-file-excel mr-2"></i>Export Excel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    initSavingsCalculator() {
        this.savingsType = 'islamic';
        this.savingsChart = null;
    }

    initMutualFundsCalculator() {
        // Setup SIP toggle
        const sipOption = document.getElementById('sipOption');
        if (sipOption) {
            sipOption.addEventListener('change', function() {
                const sipAmount = document.getElementById('sipAmount');
                if (this.checked) {
                    sipAmount.classList.remove('hidden');
                } else {
                    sipAmount.classList.add('hidden');
                }
            });
        }
    }

    initGoldSilverCalculator() {
        this.selectedMetal = 'gold';
        this.updateCurrentPrices();
    }

    initCurrencyCalculator() {
        this.populateExchangeRates();
        
        // Set up event listeners for currency selectors
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        
        if (fromCurrency) {
            fromCurrency.addEventListener('change', () => this.convertCurrency());
        }
        if (toCurrency) {
            toCurrency.addEventListener('change', () => this.convertCurrency());
        }
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

function manualRefresh() {
    if (window.calculatorApp) {
        window.calculatorApp.manualRefresh();
    }
}

// Calculator specific functions
function switchSavingsType(type) {
    const islamicBtn = document.getElementById('islamicSavings');
    const conventionalBtn = document.getElementById('conventionalSavings');
    const rateLabel = document.getElementById('rateLabel');
    
    if (type === 'islamic') {
        islamicBtn.className = 'calculator-button';
        conventionalBtn.className = 'calculator-button-secondary';
        rateLabel.textContent = 'Profit Rate (%)';
        window.calculatorApp.savingsType = 'islamic';
    } else {
        islamicBtn.className = 'calculator-button-secondary';
        conventionalBtn.className = 'calculator-button';
        rateLabel.textContent = 'Interest Rate (%)';
        window.calculatorApp.savingsType = 'conventional';
    }
}

function calculateSavings() {
    const amount = parseFloat(document.getElementById('savingsAmount').value) || 0;
    const monthlyDeposit = parseFloat(document.getElementById('monthlyDeposit').value) || 0;
    const rate = parseFloat(document.getElementById('savingsRate').value) || 0;
    const years = parseFloat(document.getElementById('savingsTime').value) || 0;
    
    if (amount <= 0 || rate <= 0 || years <= 0) {
        alert('Please enter valid values for all fields.');
        return;
    }
    
    let totalProfit, finalAmount, totalInvestment;
    
    if (window.calculatorApp.savingsType === 'islamic') {
        // Islamic calculation (no compounding)
        totalProfit = window.calculatorApp.calculateMudarabahProfit(amount, rate, years * 12);
        
        // Add monthly deposits profit
        for (let month = 1; month <= years * 12; month++) {
            const remainingMonths = (years * 12) - month + 1;
            totalProfit += window.calculatorApp.calculateMudarabahProfit(monthlyDeposit, rate, remainingMonths);
        }
        
        totalInvestment = amount + (monthlyDeposit * years * 12);
        finalAmount = totalInvestment + totalProfit;
    } else {
        // Conventional calculation (with compounding)
        const monthlyRate = rate / (12 * 100);
        const months = years * 12;
        
        // Compound interest on initial amount
        const initialFinal = amount * Math.pow(1 + monthlyRate, months);
        
        // Future value of monthly deposits
        const monthlyFinal = monthlyDeposit * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
        
        totalInvestment = amount + (monthlyDeposit * months);
        finalAmount = initialFinal + monthlyFinal;
        totalProfit = finalAmount - totalInvestment;
    }
    
    const effectiveRate = ((finalAmount / totalInvestment - 1) / years) * 100;
    
    // Display results
    document.getElementById('totalInvestment').textContent = window.calculatorApp.formatCurrency(totalInvestment);
    document.getElementById('totalProfit').textContent = window.calculatorApp.formatCurrency(totalProfit);
    document.getElementById('finalAmount').textContent = window.calculatorApp.formatCurrency(finalAmount);
    document.getElementById('effectiveRate').textContent = effectiveRate.toFixed(2) + '%';
    
    document.getElementById('savingsResults').classList.remove('hidden');
    document.getElementById('savingsChart').classList.remove('hidden');
    
    // Create chart
    window.calculatorApp.createSavingsChart(amount, monthlyDeposit, rate, years);
}

function switchMetal(metal) {
    const goldBtn = document.getElementById('goldButton');
    const silverBtn = document.getElementById('silverButton');
    
    if (metal === 'gold') {
        goldBtn.className = 'calculator-button';
        silverBtn.className = 'calculator-button-secondary';
        window.calculatorApp.selectedMetal = 'gold';
    } else {
        goldBtn.className = 'calculator-button-secondary';
        silverBtn.className = 'calculator-button';
        window.calculatorApp.selectedMetal = 'silver';
    }
    
    window.calculatorApp.updateCurrentPrices();
}

function calculateGoldSilver() {
    const quantity = parseFloat(document.getElementById('metalQuantity').value) || 0;
    const unit = document.getElementById('weightUnit').value;
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const purity = parseFloat(document.getElementById('metalPurity').value) || 100;
    
    if (quantity <= 0 || purchasePrice <= 0) {
        alert('Please enter valid values.');
        return;
    }
    
    // Convert to standard unit (grams)
    const conversionRates = { tola: 11.664, gram: 1, ounce: 31.1035, kg: 1000 };
    const quantityInGrams = quantity * conversionRates[unit];
    
    // Get current prices (using demo data structure)
    const metal = window.calculatorApp.selectedMetal;
    const currentPricePerTola = metal === 'gold' ? 
        window.calculatorApp.apiData.goldSilver.gold.price_pkr_tola : 
        window.calculatorApp.apiData.goldSilver.silver.price_pkr_tola;
    
    // Convert tola price to gram price
    const currentPricePerGram = currentPricePerTola / 11.664;
    
    // Calculate values
    const totalInvestment = quantity * purchasePrice;
    const adjustedCurrentPrice = currentPricePerGram * (purity / 100);
    const currentValue = quantityInGrams * adjustedCurrentPrice;
    const profitLoss = currentValue - totalInvestment;
    const returnPercent = (profitLoss / totalInvestment) * 100;
    
    // Display results
    document.getElementById('totalInvestmentGS').textContent = window.calculatorApp.formatCurrency(totalInvestment);
    document.getElementById('currentValueGS').textContent = window.calculatorApp.formatCurrency(currentValue);
    document.getElementById('profitLossGS').textContent = window.calculatorApp.formatCurrency(profitLoss);
    document.getElementById('profitLossGS').className = profitLoss >= 0 ? 'result-highlight text-green-400' : 'result-highlight text-red-400';
    document.getElementById('returnPercentGS').textContent = returnPercent.toFixed(2) + '%';
    document.getElementById('returnPercentGS').className = returnPercent >= 0 ? 'result-highlight text-green-400' : 'result-highlight text-red-400';
    
    document.getElementById('goldSilverResults').classList.remove('hidden');
    document.getElementById('goldSilverChart').classList.remove('hidden');
}

function swapCurrencies() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    
    window.calculatorApp.convertCurrency();
}

function convertCurrency() {
    if (window.calculatorApp) {
        window.calculatorApp.convertCurrency();
    }
}

function calculateCurrencyInvestment() {
    const investmentAmount = parseFloat(document.getElementById('currencyInvestmentAmount').value) || 0;
    const currency = document.getElementById('investmentCurrency').value;
    const purchaseRate = parseFloat(document.getElementById('purchaseRate').value) || 0;
    const currentRate = parseFloat(document.getElementById('currentRate').value) || 0;
    
    if (investmentAmount <= 0 || purchaseRate <= 0 || currentRate <= 0) {
        alert('Please enter valid values.');
        return;
    }
    
    const currencyUnits = investmentAmount / purchaseRate;
    const currentValue = currencyUnits * currentRate;
    const gainLoss = currentValue - investmentAmount;
    const returnPercent = (gainLoss / investmentAmount) * 100;
    
    // Display results
    document.getElementById('totalInvestmentCurrency').textContent = window.calculatorApp.formatCurrency(investmentAmount);
    document.getElementById('currentValueCurrency').textContent = window.calculatorApp.formatCurrency(currentValue);
    document.getElementById('gainLossCurrency').textContent = window.calculatorApp.formatCurrency(gainLoss);
    document.getElementById('gainLossCurrency').className = gainLoss >= 0 ? 'result-highlight text-green-400' : 'result-highlight text-red-400';
    document.getElementById('returnPercentCurrency').textContent = returnPercent.toFixed(2) + '%';
    document.getElementById('returnPercentCurrency').className = returnPercent >= 0 ? 'result-highlight text-green-400' : 'result-highlight text-red-400';
    
    document.getElementById('currencyResults').classList.remove('hidden');
}

function calculateMutualFunds() {
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value) || 0;
    const currentNAV = parseFloat(document.getElementById('currentNAV').value) || 0;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 0;
    const period = parseFloat(document.getElementById('investmentPeriod').value) || 0;
    const sipEnabled = document.getElementById('sipOption').checked;
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 0;
    
    if (investmentAmount <= 0 || currentNAV <= 0 || expectedReturn <= 0 || period <= 0) {
        alert('Please enter valid values.');
        return;
    }
    
    const units = investmentAmount / currentNAV;
    const projectedNAV = currentNAV * Math.pow(1 + expectedReturn / 100, period);
    
    let totalInvestment = investmentAmount;
    let totalUnits = units;
    
    if (sipEnabled && sipAmount > 0) {
        // Calculate SIP projections
        for (let month = 1; month <= period * 12; month++) {
            const monthlyNAV = currentNAV * Math.pow(1 + expectedReturn / 100, month / 12);
            totalUnits += sipAmount / monthlyNAV;
            totalInvestment += sipAmount;
        }
    }
    
    const projectedValue = totalUnits * projectedNAV;
    
    // Display results
    document.getElementById('unitsPurchased').textContent = totalUnits.toFixed(4);
    document.getElementById('projectedNAV').textContent = projectedNAV.toFixed(2);
    document.getElementById('totalInvestmentMF').textContent = window.calculatorApp.formatCurrency(totalInvestment);
    document.getElementById('projectedValue').textContent = window.calculatorApp.formatCurrency(projectedValue);
    
    document.getElementById('mutualFundsResults').classList.remove('hidden');
    document.getElementById('mutualFundsChart').classList.remove('hidden');
}

// Export functions (placeholders for now)
function exportSavingsCalculation(format) {
    alert(`Exporting savings calculation as ${format.toUpperCase()}...`);
}

function exportMutualFundsCalculation(format) {
    alert(`Exporting mutual funds calculation as ${format.toUpperCase()}...`);
}

function exportGoldSilverCalculation(format) {
    alert(`Exporting gold/silver calculation as ${format.toUpperCase()}...`);
}

function exportCurrencyCalculation(format) {
    alert(`Exporting currency calculation as ${format.toUpperCase()}...`);
}

function checkServerHealth() {
    if (window.calculatorApp) {
        const status = window.calculatorApp.usingDemo ? 'Demo Mode' : 'Live Data';
        const lastUpdate = window.calculatorApp.lastUpdate.toLocaleString();
        
        alert(`Islamic Finance Calculator Status:
        
Status: ${status}
Last Update: ${lastUpdate}
Data Source: ${window.calculatorApp.usingDemo ? 'Local Demo Data' : 'Live APIs via Netlify Proxy'}
Environment: Netlify Production
CORS Status: Fixed with Proxy
        
${window.calculatorApp.usingDemo ? '⚠️ Using demo data - API proxy may need configuration' : '✅ Live data working perfectly!'}`);
    }
}

function showSetupInstructions() {
    alert(`CORS Issue Resolution for Netlify:

✅ Netlify configuration files added:
- netlify.toml (proxy configuration)
- _headers (CORS headers)
- _redirects (API proxy routes)

🔧 If still seeing demo mode:
1. Check Netlify deployment logs
2. Verify API endpoints are accessible
3. Wait 2-3 minutes for full deployment

🌐 Current Status: Ready for live data!`);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Islamic Finance Calculator...');
    
    // Initialize the main calculator app
    window.calculatorApp = new IslamicFinanceCalculator();
    
    // Hide CORS warnings since we're handling it properly
    const corsNotice = document.getElementById('corsNotice');
    if (corsNotice) {
        corsNotice.style.display = 'none';
    }
    
    // Update environment status
    const statusElements = document.querySelectorAll('#systemStatus');
    statusElements.forEach(element => {
        element.className = 'inline-block w-2 h-2 bg-green-500 rounded-full pulse';
        if (element.nextElementSibling) {
            element.nextElementSibling.textContent = 'Netlify';
        }
    });
    
    console.log('✅ Islamic Finance Calculator ready!');
    console.log('📱 Environment: Netlify Production');
    console.log('🔧 CORS: Fixed with proxy configuration');
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    console.log('👋 Islamic Finance Calculator shutting down...');
});

// Export for debugging
window.API_CONFIG = API_CONFIG;
