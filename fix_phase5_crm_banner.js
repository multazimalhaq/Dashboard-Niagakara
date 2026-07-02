const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Phase 5: Update CRM page target banner with saved CRM target...');

// Update renderCrmReport to use saved CRM target
const oldRenderCrmReport = `function renderCrmReport() {
        const [start, end] = getCrmRange();
        if (!start || !end) return;
        const crmRows = crmRowsInRange(start, end);
        const newCustomerRows = crmNewCustomerRowsInRange(start, end);
        const grossRows = grossAdvertiserRows(crmRows);
        const newRows = grossAdvertiserRows(newCustomerRows);
        const combinedRows = grossRows.concat(newRows);
        const allStatusRows = crmRows.concat(newCustomerRows);
        const gross = sumRows(grossRows);
        const newGross = sumRows(newRows);
        const totalGross = gross + newGross;`;

const newRenderCrmReport = `function renderCrmReport() {
        const [start, end] = getCrmRange();
        if (!start || !end) return;
        const crmRows = crmRowsInRange(start, end);
        const newCustomerRows = crmNewCustomerRowsInRange(start, end);
        const grossRows = grossAdvertiserRows(crmRows);
        const newRows = grossAdvertiserRows(newCustomerRows);
        const combinedRows = grossRows.concat(newRows);
        const allStatusRows = crmRows.concat(newCustomerRows);
        const gross = sumRows(grossRows);
        const newGross = sumRows(newRows);
        const totalGross = gross + newGross;
        
        // Get saved CRM target
        const crmTarget = loadCrmTargetByMonth();`;

content = content.replace(oldRenderCrmReport, newRenderCrmReport);
console.log('Updated renderCrmReport to load CRM target');

// Update the hook at the end of renderCrmReport to use crmTarget
const oldCrmHook = `if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('crm', loadMonthlyTargetByMonth(), totalGross);
      }`;

const newCrmHook = `if (typeof updateChannelTargetBanner === 'function') {
        // If CRM target is set, use it; otherwise use Pareto share
        const crmTarget = loadCrmTargetByMonth();
        const targetToUse = crmTarget > 0 ? crmTarget : getChannelTarget(loadMonthlyTargetByMonth(), 'crm');
        updateChannelTargetBanner('crm', targetToUse, totalGross);
      }`;

content = content.replace(oldCrmHook, newCrmHook);
console.log('Updated CRM target banner hook to use saved CRM target');

// Add function to update target banner with custom target value
const updateBannerWithCustomTarget = `
    function updateChannelTargetBannerWithCustom(pageType, customTarget, activeRevenue) {
        if (customTarget <= 0) return;

        const percent = activeRevenue > 0 ? Math.round((activeRevenue / customTarget) * 100) : 0;
        const safePercent = Math.min(100, percent);

        const displayElements = {
            'shopee': { target: 'shopeeTargetDisplay', actual: 'shopeeActualDisplay', fill: 'shopeeProgressFill', percent: 'shopeeProgressPercent' },
            'tiktok': { target: 'tiktokTargetDisplay', actual: 'tiktokActualDisplay', fill: 'tiktokProgressFill', percent: 'tiktokProgressPercent' },
            'advertiser': { target: 'advTargetDisplay', actual: 'advActualDisplay', fill: 'advProgressFill', percent: 'advProgressPercent' },
            'cs': { target: 'csTargetDisplay', actual: 'csActualDisplay', fill: 'csProgressFill', percent: 'csProgressPercent' },
            'crm': { target: 'crmTargetDisplay', actual: 'crmActualDisplay', fill: 'crmProgressFill', percent: 'crmProgressPercent' }
        };

        const els = displayElements[pageType.toLowerCase()];
        if (!els) return;

        const targetEl = document.getElementById(els.target);
        const actualEl = document.getElementById(els.actual);
        const fillEl = document.getElementById(els.fill);
        const percentEl = document.getElementById(els.percent);

        if (targetEl) targetEl.textContent = currency(customTarget);
        if (actualEl) actualEl.textContent = currency(activeRevenue);
        if (fillEl) fillEl.style.width = safePercent + '%';
        if (percentEl) percentEl.textContent = percent + '%';
    }
`;

// Insert before setupCrmTargetInput
const setupCrmTargetIndex = content.indexOf('function setupCrmTargetInput()');
if (setupCrmTargetIndex !== -1) {
    content = content.slice(0, setupCrmTargetIndex) + 
              updateBannerWithCustomTarget + '\n\n    ' + 
              content.slice(setupCrmTargetIndex);
    console.log('Added updateChannelTargetBannerWithCustom function');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Phase 5 complete!');
