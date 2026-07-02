const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Starting Phase 4: Hooking report render functions...');

// Hook patterns for each report function
const hooks = [
    {
        name: 'renderShopeeReport',
        endPattern: 'renderShopeeBudgetInputs();',
        hookCode: `renderShopeeBudgetInputs();
      if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('shopee', loadMonthlyTargetByMonth(), gross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('shopee', '#shopeeProposalTableBody');
      }`
    },
    {
        name: 'renderTiktokReport',
        endPattern: 'renderTiktokBudgetInputs();',
        hookCode: `renderTiktokBudgetInputs();
      if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('tiktok', loadMonthlyTargetByMonth(), gross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('tiktok', '#tiktokProposalTableBody');
      }`
    },
    {
        name: 'renderAdvertiserReport',
        endPattern: 'renderAdvertiserBudgetingInputs();',
        hookCode: `renderAdvertiserBudgetingInputs();
      if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('advertiser', loadMonthlyTargetByMonth(), gross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('advertiser', '#advertiserProposalTableBody');
      }`
    },
    {
        name: 'renderCsReport',
        endPattern: 'renderCsReportInputs();',
        hookCode: `renderCsReportInputs();
      if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('cs', loadMonthlyTargetByMonth(), gross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('cs', '#csProposalTableBody');
      }`
    },
    {
        name: 'renderCrmReport',
        endPattern: 'renderCrmDailyReport(dailyRows);',
        hookCode: `renderCrmDailyReport(dailyRows);
      if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('crm', loadMonthlyTargetByMonth(), totalGross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('crm', '#crmProposalTableBody');
      }`
    }
];

// Apply hooks to each function
hooks.forEach(hook => {
    const index = content.indexOf(hook.endPattern);
    if (index !== -1) {
        content = content.replace(hook.endPattern, hook.hookCode);
        console.log(`  Hooked ${hook.name}`);
    } else {
        console.log(`  WARNING: Could not find ${hook.endPattern} for ${hook.name}`);
    }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Phase 4 complete! Report render functions hooked.');
