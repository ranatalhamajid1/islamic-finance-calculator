// Export functionality for Islamic Finance Calculator

function exportSavingsCalculation(format) {
    const data = {
        type: 'Savings Calculator',
        calculationType: window.calculatorApp.savingsType,
        inputs: {
            initialAmount: document.getElementById('savingsAmount').value,
            monthlyDeposit: document.getElementById('monthlyDeposit').value,
            rate: document.getElementById('savingsRate').value,
            timePeriod: document.getElementById('savingsTime').value
        },
        results: {
            totalInvestment: document.getElementById('totalInvestment').textContent,
            totalProfit: document.getElementById('totalProfit').textContent,
            finalAmount: document.getElementById('finalAmount').textContent,
            effectiveRate: document.getElementById('effectiveRate').textContent
        }
    };
    
    if (format === 'pdf') {
        exportToPDF(data);
    } else if (format === 'excel') {
        exportToExcel(data);
    }
}

function exportMutualFundsCalculation(format) {
    const data = {
        type: 'Mutual Funds Calculator',
        inputs: {
            investmentAmount: document.getElementById('investmentAmount').value,
            currentNAV: document.getElementById('currentNAV').value,
            expectedReturn: document.getElementById('expectedReturn').value,
            period: document.getElementById('investmentPeriod').value
        },
        results: {
            unitsPurchased: document.getElementById('unitsPurchased').textContent,
            projectedNAV: document.getElementById('projectedNAV').textContent,
            totalInvestment: document.getElementById('totalInvestmentMF').textContent,
            projectedValue: document.getElementById('projectedValue').textContent
        }
    };
    
    if (format === 'pdf') {
        exportToPDF(data);
    } else if (format === 'excel') {
        exportToExcel(data);
    }
}

function exportGoldSilverCalculation(format) {
    const data = {
        type: 'Gold & Silver Calculator',
        metal: window.calculatorApp.selectedMetal,
        inputs: {
            quantity: document.getElementById('metalQuantity').value,
            unit: document.getElementById('weightUnit').value,
            purchasePrice: document.getElementById('purchasePrice').value,
            purity: document.getElementById('metalPurity').value
        },
        results: {
            totalInvestment: document.getElementById('totalInvestmentGS').textContent,
            currentValue: document.getElementById('currentValueGS').textContent,
            profitLoss: document.getElementById('profitLossGS').textContent,
            returnPercent: document.getElementById('returnPercentGS').textContent
        }
    };
    
    if (format === 'pdf') {
        exportToPDF(data);
    } else if (format === 'excel') {
        exportToExcel(data);
    }
}

function exportCurrencyCalculation(format) {
    const data = {
        type: 'Currency Investment Calculator',
        inputs: {
            investmentAmount: document.getElementById('currencyInvestmentAmount').value,
            currency: document.getElementById('investmentCurrency').value,
            purchaseRate: document.getElementById('purchaseRate').value,
            currentRate: document.getElementById('currentRate').value
        },
        results: {
            totalInvestment: document.getElementById('totalInvestmentCurrency').textContent,
            currentValue: document.getElementById('currentValueCurrency').textContent,
            gainLoss: document.getElementById('gainLossCurrency').textContent,
            returnPercent: document.getElementById('returnPercentCurrency').textContent
        }
    };
    
    if (format === 'pdf') {
        exportToPDF(data);
    } else if (format === 'excel') {
        exportToExcel(data);
    }
}

function exportToPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(22, 160, 133);
    doc.text('Islamic Finance Calculator', 20, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(data.type, 20, 35);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45);
    
    // Inputs Section
    doc.setFontSize(14);
    doc.setTextColor(22, 160, 133);
    doc.text('Input Parameters', 20, 60);
    
    let yPosition = 70;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    Object.entries(data.inputs).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.text(`${label}: ${value}`, 20, yPosition);
        yPosition += 10;
    });
    
    // Results Section
    yPosition += 10;
    doc.setFontSize(14);
    doc.setTextColor(22, 160, 133);
    doc.text('Results', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    Object.entries(data.results).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.text(`${label}: ${value}`, 20, yPosition);
        yPosition += 10;
    });
    
    // Islamic Finance Disclaimer
    yPosition += 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Note: Islamic calculations are based on Mudarabah principles without compound interest.', 20, yPosition);
    doc.text('Conventional calculations include compound interest as per standard financial practices.', 20, yPosition + 10);
    
    // Save PDF
    const filename = `${data.type.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}

function exportToExcel(data) {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = [
        ['Islamic Finance Calculator - ' + data.type],
        ['Generated on:', new Date().toLocaleString()],
        [''],
        ['Input Parameters'],
        ...Object.entries(data.inputs).map(([key, value]) => [
            key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value
        ]),
        [''],
        ['Results'],
        ...Object.entries(data.results).map(([key, value]) => [
            key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value
        ]),
        [''],
        ['Note:', 'Islamic calculations are based on Mudarabah principles without compound interest.'],
        ['', 'Conventional calculations include compound interest as per standard financial practices.']
    ];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Calculation Results');
    
    // Save file
    const filename = `${data.type.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Chart creation functions
IslamicFinanceCalculator.prototype.createSavingsChart = function(principal, monthlyDeposit, rate, years) {
    const ctx = document.getElementById('savingsChartCanvas').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.savingsChart) {
        this.savingsChart.destroy();
    }
    
    // Generate data points for chart
    const labels = [];
    const principalData = [];
    const profitData = [];
    
    for (let year = 0; year <= years; year++) {
        labels.push(`Year ${year}`);
        
        const totalInvestment = principal + (monthlyDeposit * year * 12);
        let totalProfit;
        
        if (this.savingsType === 'islamic') {
            totalProfit = this.calculateMudarabahProfit(principal, rate, year * 12);
            // Add monthly deposits profit
            for (let month = 1; month <= year * 12; month++) {
                const remainingMonths = (year * 12) - month + 1;
                totalProfit += this.calculateMudarabahProfit(monthlyDeposit, rate, remainingMonths);
            }
        } else {
            const monthlyRate = rate / (12 * 100);
            const months = year * 12;
            
            if (months > 0) {
                const initialFinal = principal * Math.pow(1 + monthlyRate, months);
                const monthlyFinal = monthlyDeposit * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
                totalProfit = (initialFinal + monthlyFinal) - totalInvestment;
            } else {
                totalProfit = 0;
            }
        }
        
        principalData.push(totalInvestment);
        profitData.push(totalProfit);
    }
    
    this.savingsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Investment',
                data: principalData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }, {
                label: 'Total Profit',
                data: profitData,
                borderColor: 'rgb(22, 160, 133)',
                backgroundColor: 'rgba(22, 160, 133, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₨' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `${this.savingsType === 'islamic' ? 'Islamic' : 'Conventional'} Savings Growth`
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
};

IslamicFinanceCalculator.prototype.updateCurrentPrices = function() {
    if (this.selectedMetal === 'gold') {
        document.getElementById('purchasePrice').value = this.apiData.goldSilver.gold?.price_tola_24k || 180000;
    } else {
        document.getElementById('purchasePrice').value = this.apiData.goldSilver.silver?.price_tola || 2150;
    }
};

IslamicFinanceCalculator.prototype.populateExchangeRates = function() {
    const grid = document.getElementById('exchangeRatesGrid');
    const rates = this.apiData.currencies;
    
    const majorCurrencies = ['PKR', 'EUR', 'GBP', 'SAR', 'AED', 'JPY'];
    
    grid.innerHTML = '';
    majorCurrencies.forEach(currency => {
        if (rates[currency]) {
            const div = document.createElement('div');
            div.className = 'text-center p-2 bg-white dark:bg-gray-800 rounded';
            div.innerHTML = `
                <div class="font-medium">${currency}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">${rates[currency].toFixed(4)}</div>
            `;
            grid.appendChild(div);
        }
    });
};

IslamicFinanceCalculator.prototype.convertCurrency = function() {
    convertCurrency();
};