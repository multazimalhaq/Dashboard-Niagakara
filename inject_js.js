const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('File size:', content.length, 'chars');

const jsLogic = `
    // ==========================================
    // NEW FEATURES IMPLEMENTATION FOR DASHBOARD
    // ==========================================

    const AUTO_SAVE_INTERVAL = 10000; // 10 seconds
    const BUDGETING_STORAGE_KEY = 'ngkr_budgeting_proposal';
    let autoSaveTimer = null;
    let myTrendChart = null;

    // Load and Setup Auto-save
    function setupAutoSave() {
        console.log('Setting up auto-save...');
        
        // Load saved proposal rows
        const saved = localStorage.getItem(BUDGETING_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    weeklyProposalRows = parsed;
                    console.log('Loaded', parsed.length, 'saved proposal rows');
                    if (typeof renderWeeklyBudgetingPage === 'function') {
                        renderWeeklyBudgetingPage();
                    }
                }
            } catch (e) {
                console.warn('Failed to load saved proposals:', e);
            }
        }

        // Setup auto-save interval
        if (autoSaveTimer) clearInterval(autoSaveTimer);
        autoSaveTimer = setInterval(() => {
            saveBudgetingData();
        }, AUTO_SAVE_INTERVAL);

        updateLastSaveTime();
    }

    function saveBudgetingData() {
        try {
            localStorage.setItem(BUDGETING_STORAGE_KEY, JSON.stringify(weeklyProposalRows));
            updateLastSaveTime();
            return true;
        } catch (e) {
            console.warn('Auto-save failed:', e);
            return false;
        }
    }

    function updateLastSaveTime() {
        const timeEl = document.getElementById('lastSaveTime');
        if (timeEl) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            timeEl.textContent = 'Terakhir: ' + timeStr;
        }
    }

    // Bulk Import Setup & Logic
    function setupBulkImport() {
        const btnToggle = document.getElementById('bulkImportToggle');
        const area = document.getElementById('bulkImportArea');
        const btnParse = document.getElementById('parseBulkCSV');
        const btnCancel = document.getElementById('cancelBulkImport');
        const btnFile = document.getElementById('bulkImportFile');

        if (!btnToggle) return;

        btnToggle.addEventListener('click', () => {
            area.style.display = area.style.display === 'none' ? 'block' : 'none';
            if (area.style.display === 'block') {
                document.getElementById('bulkImportTextarea').focus();
            }
        });

        btnCancel.addEventListener('click', () => {
            area.style.display = 'none';
            document.getElementById('bulkImportTextarea').value = '';
            document.getElementById('bulkImportPreview').innerHTML = '';
        });

        btnParse.addEventListener('click', () => {
            const text = document.getElementById('bulkImportTextarea').value.trim();
            if (!text) {
                alert('Masukkan data CSV terlebih dahulu');
                return;
            }
            parseBulkTextData(text);
        });

        // Add file upload support
        const fileInputContainer = document.createElement('div');
        fileInputContainer.style.marginTop = '12px';
        fileInputContainer.innerHTML = \`
            <label class="panel-action" style="cursor: pointer; display: inline-block;">
                Upload CSV / Excel
                <input type="file" id="fileUploadInput" accept=".csv,.txt,.xlsx,.xls" style="display: none;">
            </label>
        \`;
        area.insertBefore(fileInputContainer, area.firstChild);

        document.getElementById('fileUploadInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                const data = evt.target.result;
                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    // Excel Parsing using SheetJS
                    try {
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const csv = XLSX.utils.sheet_to_csv(worksheet);
                        document.getElementById('bulkImportTextarea').value = csv;
                        parseBulkTextData(csv);
                    } catch (err) {
                        alert('Gagal membaca file Excel: ' + err.message);
                    }
                } else {
                    // Plain CSV text
                    document.getElementById('bulkImportTextarea').value = data;
                    parseBulkTextData(data);
                }
            };

            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                reader.readAsBinaryString(file);
            } else {
                reader.readAsText(file, 'UTF-8');
            }
        });
    }

    function parseBulkTextData(text) {
        const lines = text.split('\\n').filter(line => line.trim());
        const rows = [];
        let successCount = 0;
        let errorCount = 0;

        lines.forEach((line, index) => {
            // Support comma or tab separators
            const delimiter = line.includes('\\t') ? '\\t' : ',';
            const columns = line.split(delimiter).map(col => col.trim().replace(/^"|"$/g, ''));
            
            if (columns.length >= 4) {
                const advertiser = columns[0];
                const platform = columns[1];
                const product = columns[2];
                const budgetStr = columns[3];
                const cacStr = columns[4] || '0';

                const budget = parseFloat(budgetStr.replace(/[^0-9.-]+/g, '')) || 0;
                const cac = parseFloat(cacStr.replace(/[^0-9.-]+/g, '')) || 0;

                if (advertiser && platform && product) {
                    rows.push({
                        id: 'bulk-' + Date.now() + '-' + index + '-' + Math.random().toString(36).substr(2, 5),
                        advertiser: advertiser,
                        platform: platform,
                        product: product,
                        mode: 'manual',
                        manualBudget: String(budget),
                        manualTargetCac: cac,
                        recommendationBudget: budget,
                        recommendationTargetCac: cac,
                        adminRate: platform.toLowerCase().includes('shopee') ? 18 : 
                                  platform.toLowerCase().includes('tiktok') ? 16 : 0
                    });
                    successCount++;
                } else {
                    errorCount++;
                }
            } else {
                errorCount++;
            }
        });

        if (rows.length > 0) {
            weeklyProposalRows = weeklyProposalRows.concat(rows);
            document.getElementById('bulkImportPreview').innerHTML = \`
                <div style="color: #15803d; font-weight: bold; margin-top: 8px;">
                    ✅ Berhasil mengimpor \${successCount} baris!
                </div>
            \`;
            if (typeof renderWeeklyBudgetingPage === 'function') {
                renderWeeklyBudgetingPage();
            }
            saveBudgetingData();
        } else {
            document.getElementById('bulkImportPreview').innerHTML = \`
                <div style="color: #b91c1c; font-weight: bold; margin-top: 8px;">
                    ❌ Gagal mengimpor data. Periksa format kolom.
                </div>
            \`;
        }
    }

    // Export to Excel / CSV
    function setupExportFunctions() {
        const btnExport = document.getElementById('exportBudgetProposal');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                if (weeklyProposalRows.length === 0) {
                    alert('Tidak ada data budgeting untuk diexport');
                    return;
                }

                // Generate sheet using SheetJS
                try {
                    const data = weeklyProposalRows.map(row => {
                        const budget = row.mode === 'manual' ? parseFloat(row.manualBudget) : (row.recommendationBudget || 0);
                        const cac = row.mode === 'manual' ? parseFloat(row.manualTargetCac) : (row.recommendationTargetCac || 0);
                        const revenue = cac > 0 ? (budget / (cac / 100)) : 0;
                        return {
                            'Nama ADV': row.advertiser,
                            'Platform/Kanal': row.platform,
                            'Produk': row.product,
                            'Mode': row.mode || 'recommendation',
                            'Budget': budget,
                            'Target Revenue': revenue,
                            'Target CAC (%)': cac,
                            'Admin Rate (%)': row.adminRate || 0
                        };
                    });

                    const worksheet = XLSX.utils.json_to_sheet(data);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget Proposal');
                    XLSX.writeFile(workbook, 'Weekly_Budget_Proposal_' + new Date().toISOString().split('T')[0] + '.xlsx');
                } catch (err) {
                    // Fallback to CSV if SheetJS fails
                    console.error('SheetJS export failed, falling back to CSV', err);
                    let csv = 'Nama ADV,Platform/Kanal,Produk,Mode,Budget,Target Revenue,Target CAC (%),Admin Rate (%)\\n';
                    weeklyProposalRows.forEach(row => {
                        const budget = row.mode === 'manual' ? parseFloat(row.manualBudget) : (row.recommendationBudget || 0);
                        const cac = row.mode === 'manual' ? parseFloat(row.manualTargetCac) : (row.recommendationTargetCac || 0);
                        const revenue = cac > 0 ? (budget / (cac / 100)) : 0;
                        csv += \`"\${row.advertiser}","\${row.platform}","\${row.product}","\${row.mode}",\${budget},\${revenue},\${cac},\${row.adminRate || 0}\\n\`;
                    });

                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute('download', 'Weekly_Budget_Proposal_' + new Date().toISOString().split('T')[0] + '.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            });
        }

        const btnExportChart = document.getElementById('exportChartData');
        if (btnExportChart) {
            btnExportChart.addEventListener('click', () => {
                alert('Mengekspor data chart tren...');
                // Logic to export chart data
            });
        }
    }

    // Save Recommendation Action
    function setupSaveRecommendation() {
        const btnSave = document.getElementById('saveRecommendationBtn');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                if (weeklyProposalRows.length === 0) {
                    alert('Tidak ada data budgeting untuk disimpan');
                    return;
                }
                
                if (confirm('Simpan semua rekomendasi budgeting sekarang? Data ini akan langsung disinkronkan ke dashboard.')) {
                    saveBudgetingData();
                    alert('Rekomendasi budgeting berhasil disimpan secara permanen!');
                }
            });
        }
    }

    // Pareto 60% Warnings Check
    function checkParetoWarnings() {
        const warningDiv = document.getElementById('revenueDistributionWarning');
        const warningMsg = document.getElementById('warningMessage');
        if (!warningDiv || !warningMsg) return;

        let totalRevenue = 0;
        let shopeeRevenue = 0;
        let tiktokRevenue = 0;

        weeklyProposalRows.forEach(row => {
            const budget = row.mode === 'manual' ? parseFloat(row.manualBudget) : (row.recommendationBudget || 0);
            const cac = row.mode === 'manual' ? parseFloat(row.manualTargetCac) : (row.recommendationTargetCac || 0);
            const revenue = cac > 0 ? (budget / (cac / 100)) : 0;

            totalRevenue += revenue;
            const platformLower = (row.platform || '').toLowerCase();
            if (platformLower.includes('shopee')) {
                shopeeRevenue += revenue;
            } else if (platformLower.includes('tiktok')) {
                tiktokRevenue += revenue;
            }
        });

        if (totalRevenue > 0) {
            const shopeePercent = (shopeeRevenue / totalRevenue) * 100;
            const tiktokPercent = (tiktokRevenue / totalRevenue) * 100;

            let warnings = [];
            if (shopeePercent > 60) {
                warnings.push(\`Shopee (\${shopeePercent.toFixed(1)}%)\`);
            }
            if (tiktokPercent > 60) {
                warnings.push(\`TikTokShop (\${tiktokPercent.toFixed(1)}%)\`);
            }

            if (warnings.length > 0) {
                warningDiv.style.display = 'block';
                warningMsg.innerHTML = \`Revenue share <strong>\${warnings.join(' & ')}</strong> melebihi batas pareto 60% dari total target revenue!\`;
                
                // Add red highlights to proposal inputs
                document.querySelectorAll('#budgetRecommendationBody tr').forEach(tr => {
                    const platformCell = tr.querySelector('td:nth-child(2) input');
                    if (platformCell) {
                        const val = platformCell.value.toLowerCase();
                        if ((val.includes('shopee') && shopeePercent > 60) || (val.includes('tiktok') && tiktokPercent > 60)) {
                            tr.style.backgroundColor = '#fef2f2';
                            tr.style.border = '1px solid #fca5a5';
                        } else {
                            tr.style.backgroundColor = '';
                            tr.style.border = '';
                        }
                    }
                });
            } else {
                warningDiv.style.display = 'none';
                document.querySelectorAll('#budgetRecommendationBody tr').forEach(tr => {
                    tr.style.backgroundColor = '';
                    tr.style.border = '';
                });
            }
        } else {
            warningDiv.style.display = 'none';
        }
    }

    // Week-over-Week Comparison Render
    function renderWoWComparison() {
        const grid = document.getElementById('wowComparisonGrid');
        if (!grid) return;

        const [start, end] = getSelectedWeekRange();
        const [prevStart, prevEnd] = [new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000), new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)];

        const currentWeekRows = weeklyRowsInRange(start, end).detailRows;
        const prevWeekRows = weeklyRowsInRange(prevStart, prevEnd).detailRows;

        // Calculate metrics
        const curBudget = currentWeekRows.reduce((sum, r) => sum + (r.budget || 0), 0);
        const curRevenue = currentWeekRows.reduce((sum, r) => sum + (r.revenue || 0), 0);
        const curCac = curRevenue > 0 ? (curBudget / curRevenue) * 100 : 0;
        
        const prevBudget = prevWeekRows.reduce((sum, r) => sum + (r.budget || 0), 0);
        const prevRevenue = prevWeekRows.reduce((sum, r) => sum + (r.revenue || 0), 0);
        const prevCac = prevRevenue > 0 ? (prevBudget / prevRevenue) * 100 : 0;

        const formatPercentChange = (cur, prev) => {
            if (prev === 0) return cur > 0 ? '+100%' : '0%';
            const change = ((cur - prev) / prev) * 100;
            return (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
        };

        const getDirectionClass = (cur, prev, lowerIsBetter = false) => {
            if (cur === prev) return 'neutral';
            const better = lowerIsBetter ? cur < prev : cur > prev;
            return better ? 'delta-up' : 'delta-down';
        };

        const getArrow = (direction) => {
            return direction === 'delta-up' ? '▲' : direction === 'delta-down' ? '▼' : '●';
        };

        const budgetDir = getDirectionClass(curBudget, prevBudget, true);
        const revenueDir = getDirectionClass(curRevenue, prevRevenue);
        const cacDir = getDirectionClass(curCac, prevCac, true);

        grid.innerHTML = \`
            <div class="card kpi" style="margin: 0; border: 1px solid var(--line);">
                <span>Budget WoW</span>
                <strong>\${currency(curBudget)}</strong>
                <small class="\${budgetDir}" style="font-weight: bold; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                    \${getArrow(budgetDir)} \${formatPercentChange(curBudget, prevBudget)} dibanding minggu lalu
                </small>
            </div>
            <div class="card kpi" style="margin: 0; border: 1px solid var(--line);">
                <span>Gross Revenue WoW</span>
                <strong>\${currency(curRevenue)}</strong>
                <small class="\${revenueDir}" style="font-weight: bold; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                    \${getArrow(revenueDir)} \${formatPercentChange(curRevenue, prevRevenue)} dibanding minggu lalu
                </small>
            </div>
            <div class="card kpi" style="margin: 0; border: 1px solid var(--line);">
                <span>CAC WoW</span>
                <strong>\${curCac.toFixed(1)}%</strong>
                <small class="\${cacDir}" style="font-weight: bold; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                    \${getArrow(cacDir)} \${formatPercentChange(curCac, prevCac)} dibanding minggu lalu
                </small>
            </div>
            <div class="card kpi" style="margin: 0; border: 1px solid var(--line);">
                <span>Omset Margin WoW</span>
                <strong>\${currency(curRevenue - curBudget)}</strong>
                <small class="\${getDirectionClass(curRevenue - curBudget, prevRevenue - prevBudget)}" style="font-weight: bold; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                    \${getArrow(getDirectionClass(curRevenue - curBudget, prevRevenue - prevBudget))} \${formatPercentChange(curRevenue - curBudget, prevRevenue - prevBudget)} dibanding minggu lalu
                </small>
            </div>
        \`;
    }

    // Chart.js Trend Chart Implementation
    function renderTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        const [start, end] = getSelectedWeekRange();
        
        // Generate last 4 weeks data points
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
            const wStart = new Date(start.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            const wEnd = new Date(end.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            weeks.push({ start: wStart, end: wEnd, label: compactPeriodLabel(wStart, wEnd) });
        }

        const labels = weeks.map(w => w.label);
        const budgets = [];
        const revenues = [];
        const cacs = [];

        weeks.forEach(w => {
            const data = weeklyRowsInRange(w.start, w.end).detailRows;
            const b = data.reduce((sum, r) => sum + (r.budget || 0), 0);
            const r = data.reduce((sum, r) => sum + (r.revenue || 0), 0);
            const c = r > 0 ? (b / r) * 100 : 0;

            budgets.push(b);
            revenues.push(r);
            cacs.push(c.toFixed(1));
        });

        if (myTrendChart) {
            myTrendChart.destroy();
        }

        myTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Budget Iklan',
                        data: budgets,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        yAxisID: 'y',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Gross Revenue',
                        data: revenues,
                        borderColor: '#0f766e',
                        backgroundColor: 'rgba(15, 118, 110, 0.1)',
                        yAxisID: 'y',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'CAC (%)',
                        data: cacs,
                        borderColor: '#b7791f',
                        backgroundColor: 'transparent',
                        yAxisID: 'y1',
                        tension: 0.1,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Rupiah (IDR)'
                        },
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + (value / 1000000).toFixed(0) + 'jt';
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'CAC %'
                        },
                        grid: {
                            drawOnChartArea: false, // only want the grid lines for one axis to show up
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Hook in target monthly calculation progress
    function updateMonthlyAndWeeklyTargetProgress() {
        const savedTarget = loadMonthlyTarget();
        if (savedTarget > 0) {
            const monthlyRevenue = calculateMonthlyRevenue();
            const weeklyRevenue = calculateWeeklyRevenueForSelectedRange();

            const monthlyPercent = Math.min(100, Math.round((monthlyRevenue / savedTarget) * 100));
            const weeklyTarget = savedTarget / 4;
            const weeklyPercent = Math.min(100, Math.round((weeklyRevenue / weeklyTarget) * 100));

            // Update UI elements
            const monAch = document.getElementById('monthlyRevenueAchieved');
            const monPct = document.getElementById('monthlyProgressPercent');
            const monFill = document.getElementById('monthlyProgressFill');
            const monDisp = document.getElementById('monthlyTargetDisplay');

            const wkAch = document.getElementById('weeklyRevenueAchieved');
            const wkPct = document.getElementById('weeklyProgressPercent');
            const wkFill = document.getElementById('weeklyProgressFill');
            const wkDisp = document.getElementById('weeklyTargetDisplay');

            if (monAch) monAch.textContent = currency(monthlyRevenue);
            if (monPct) monPct.textContent = monthlyPercent + '%';
            if (monFill) monFill.style.width = monthlyPercent + '%';
            if (monDisp) monDisp.textContent = currency(savedTarget);

            if (wkAch) wkAch.textContent = currency(weeklyRevenue);
            if (wkPct) wkPct.textContent = weeklyPercent + '%';
            if (wkFill) wkFill.style.width = weeklyPercent + '%';
            if (wkDisp) wkDisp.textContent = currency(weeklyTarget);
        }
    }

    function calculateWeeklyRevenueForSelectedRange() {
        const [start, end] = getSelectedWeekRange();
        const currentWeekRows = weeklyRowsInRange(start, end).detailRows;
        return currentWeekRows.reduce((sum, r) => sum + (r.revenue || 0), 0);
    }

    // Init All Custom Setup
    function setupAllNewFeatures() {
        console.log('setupAllNewFeatures started');
        setupAutoSave();
        setupBulkImport();
        setupExportFunctions();
        setupSaveRecommendation();

        // Hook on update chart button
        const btnUpdateTrend = document.getElementById('updateTrendChart');
        if (btnUpdateTrend) {
            btnUpdateTrend.addEventListener('click', () => {
                renderTrendChart();
                alert('Trend Chart Updated!');
            });
        }

        // Run updates on initial load
        setTimeout(() => {
            renderWoWComparison();
            renderTrendChart();
            updateMonthlyAndWeeklyTargetProgress();
            checkParetoWarnings();
        }, 1000);
    }
`;

// Insert the jsLogic block before setupTargetManagement definition
if (!content.includes('const AUTO_SAVE_INTERVAL')) {
    const targetManagementPos = content.indexOf('function setupTargetManagement()');
    if (targetManagementPos !== -1) {
        content = content.slice(0, targetManagementPos) + jsLogic + '\n\n    ' + content.slice(targetManagementPos);
        console.log('Successfully injected javascript logic!');
    } else {
        console.error('Could not find setupTargetManagement function!');
    }
}

// Hook setupAllNewFeatures inside init() or target management
if (!content.includes('setupAllNewFeatures();')) {
    content = content.replace(
        'setupTargetManagement(); // Setup target management',
        'setupTargetManagement(); // Setup target management\n      setupAllNewFeatures();'
    );
    console.log('Added setupAllNewFeatures to init() flow');
}

// Hook renderWeeklyBudgetingPage to also call target progress update, WoW comparison, and Pareto checks
const hookCode = `
      // Update target progress, WoW comparison and Pareto checks on page render
      if (typeof updateMonthlyAndWeeklyTargetProgress === 'function') {
          updateMonthlyAndWeeklyTargetProgress();
      }
      if (typeof renderWoWComparison === 'function') {
          renderWoWComparison();
      }
      if (typeof renderTrendChart === 'function') {
          renderTrendChart();
      }
      if (typeof checkParetoWarnings === 'function') {
          checkParetoWarnings();
      }
`;
if (!content.includes('updateMonthlyAndWeeklyTargetProgress()')) {
    content = content.replace(
        'renderBudgetAfterCrm(settings, nextStart, nextEnd, weeklyCrmRevenue);',
        'renderBudgetAfterCrm(settings, nextStart, nextEnd, weeklyCrmRevenue);' + hookCode
    );
    console.log('Added hooks to renderWeeklyBudgetingPage');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Script injection complete.');
