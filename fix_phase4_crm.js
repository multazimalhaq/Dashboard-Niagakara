const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Phase 4: Add CRM target input & Export/Save buttons...');

// Find the section "Pengajuan Setelah CRM" and add buttons after the table
const crmSectionPattern = /<div class="pam-summary" id="budgetAfterCrmPamBody"><\/div>/;
const crmSectionMatch = content.match(crmSectionPattern);

if (crmSectionMatch) {
    const crmButtons = `
          <div class="pam-summary" id="budgetAfterCrmPamBody"></div>
          
          <!-- CRM Target & Export Buttons -->
          <div style="margin-top: 24px; padding: 16px; border-top: 1px solid var(--line); display: flex; gap: 12px; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 12px; align-items: center; flex: 1;">
              <label style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 500; font-size: 14px;">Target Omset CRM:</span>
                <input type="text" id="saveCrmTargetInput" inputmode="numeric" placeholder="Masukkan target omset CRM" style="padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 14px; width: 200px;">
              </label>
              <button class="panel-action" id="saveCrmTargetBtn" type="button">Simpan Target CRM</button>
            </div>
            <div style="display: flex; gap: 12px;">
              <button class="panel-action" id="exportBudgetingDataBtn" type="button">Export Data</button>
            </div>
          </div>
`;
    
    content = content.replace(crmSectionPattern, crmButtons);
    console.log('Added CRM target input & Export button');
}

// Add CRM target storage & functions
const crmTargetLogic = `
    // ========== CRM TARGET MANAGEMENT ==========
    const CRM_TARGET_STORAGE_KEY = 'ngkr_crm_target_history';
    
    function loadCrmTargetByMonth(monthKey = null) {
        try {
            const key = monthKey || getActiveMonthKeyFromDashboard();
            const saved = localStorage.getItem(CRM_TARGET_STORAGE_KEY);
            if (!saved) return 0;
            const targets = JSON.parse(saved);
            return targets[key] || 0;
        } catch (_) {
            return 0;
        }
    }
    
    function saveCrmTargetByMonth(value, monthKey = null) {
        try {
            const key = monthKey || getActiveMonthKeyFromDashboard();
            const saved = localStorage.getItem(CRM_TARGET_STORAGE_KEY) || '{}';
            const targets = JSON.parse(saved);
            targets[key] = value > 0 ? value : 0;
            localStorage.setItem(CRM_TARGET_STORAGE_KEY, JSON.stringify(targets));
            return true;
        } catch (_) {
            return false;
        }
    }
    
    function setupCrmTargetInput() {
        const btnSave = document.getElementById('saveCrmTargetBtn');
        const inputField = document.getElementById('saveCrmTargetInput');
        
        if (!btnSave || !inputField) return;
        
        // Load saved CRM target
        const savedCrmTarget = loadCrmTargetByMonth();
        if (savedCrmTarget > 0) {
            inputField.value = formatCurrencyInput(savedCrmTarget);
        }
        
        // Save button handler
        btnSave.addEventListener('click', () => {
            const inputValue = inputField.value.trim();
            if (!inputValue) {
                alert('Masukkan target omset CRM terlebih dahulu');
                return;
            }
            
            const numericValue = parseMoney(inputValue);
            if (numericValue <= 0 || isNaN(numericValue)) {
                alert('Target harus berupa angka positif');
                return;
            }
            
            if (saveCrmTargetByMonth(numericValue)) {
                alert('Target CRM berhasil disimpan!');
                if (typeof renderWeeklyBudgetingPage === 'function') {
                    renderWeeklyBudgetingPage();
                }
            }
        });
        
        // Enter key handler
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                btnSave.click();
            }
        });
    }
    
    function setupExportBudgetingData() {
        const btnExport = document.getElementById('exportBudgetingDataBtn');
        if (!btnExport) return;
        
        btnExport.addEventListener('click', () => {
            if (weeklyProposalRows.length === 0) {
                alert('Tidak ada data budgeting untuk diexport');
                return;
            }
            
            try {
                const data = weeklyProposalRows.map(row => {
                    const budget = row.mode === 'manual' ? parseFloat(row.manualBudget) : (row.recommendationBudget || 0);
                    const cac = row.mode === 'manual' ? parseFloat(row.manualTargetCac) : (row.recommendationTargetCac || 0);
                    const revenue = cac > 0 ? (budget / (cac / 100)) : 0;
                    return {
                        'Nama ADV': row.advertiser,
                        'Platform': row.platform,
                        'Produk': row.product,
                        'Budget': budget,
                        'Target Revenue': revenue,
                        'Target CAC (%)': cac
                    };
                });
                
                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Budgeting Data');
                XLSX.writeFile(workbook, 'Budgeting_Data_' + new Date().toISOString().split('T')[0] + '.xlsx');
            } catch (err) {
                console.error('Export failed', err);
                alert('Gagal mengexport data');
            }
        });
    }
`;

// Find insertion point before setupAllNewFeatures
const setupAllNewFeaturesIndex = content.indexOf('function setupAllNewFeatures()');
if (setupAllNewFeaturesIndex === -1) {
    console.error('Could not find setupAllNewFeatures');
    process.exit(1);
}

content = content.slice(0, setupAllNewFeaturesIndex) + 
          crmTargetLogic + '\n\n    ' + 
          content.slice(setupAllNewFeaturesIndex);

console.log('Added CRM target logic');

// Add setup calls to setupAllNewFeatures
const oldSetupAll = 'function setupAllNewFeatures() {';
const newSetupAll = `function setupAllNewFeatures() {
        setupCrmTargetInput();
        setupExportBudgetingData();`;

content = content.replace(oldSetupAll, newSetupAll);
console.log('Added CRM setup calls');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Phase 4 complete!');
