const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Adding missing hooks to render functions...');

// 1. Add hook to renderShopeeReport
const shopeeOldEnd = 'renderShopeeBudgetInputs();\n    }';
const shopeeNewEnd = `renderShopeeBudgetInputs();
      if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('shopee', loadMonthlyTargetByMonth(), gross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('shopee', '#shopeeProposalTableBody');
      }
    }`;

content = content.replace('renderShopeeBudgetInputs();\n    }\n\n    function renderShopeeDailyReport', 
                         `renderShopeeBudgetInputs();
      if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('shopee', loadMonthlyTargetByMonth(), gross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('shopee', '#shopeeProposalTableBody');
      }
    }

    function renderShopeeDailyReport`);

console.log('Added hook to renderShopeeReport');

// 2. Add hook to renderTiktokReport
content = content.replace('renderTiktokBudgetInputs();\n    }\n\n    function renderTiktokDailyReport',
                         `renderTiktokBudgetInputs();
      if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('tiktok', loadMonthlyTargetByMonth(), gross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('tiktok', '#tiktokProposalTableBody');
      }
    }

    function renderTiktokDailyReport`);

console.log('Added hook to renderTiktokReport');

// 3. Add hook to renderAdvertiserReport
content = content.replace('renderAdvertiserBudgetingInputs();\n    }\n\n    function drawAdvertiserChart',
                         `renderAdvertiserBudgetingInputs();
      if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('advertiser', loadMonthlyTargetByMonth(), gross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('advertiser', '#advertiserProposalTableBody');
      }
    }

    function drawAdvertiserChart`);

console.log('Added hook to renderAdvertiserReport');

// 4. Add hook to renderCsReport - find the actual end
const csReportMatch = content.match(/function renderCsReport\(\) \{[\s\S]*?renderCsReportInputs\(\);\s*\}/);
if (csReportMatch) {
    const oldCsEnd = csReportMatch[0];
    const newCsEnd = oldCsEnd.replace(
        'renderCsReportInputs();\n    }',
        `renderCsReportInputs();
      if (typeof updateChannelTargetBanner === 'function') {
        updateChannelTargetBanner('cs', loadMonthlyTargetByMonth(), gross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('cs', '#csProposalTableBody');
      }
    }`
    );
    content = content.replace(oldCsEnd, newCsEnd);
    console.log('Added hook to renderCsReport');
}

// 5. Add hook to renderCrmReport - more complex due to totalGross
const crmReportMatch = content.match(/function renderCrmReport\(\) \{[\s\S]*?renderCrmDailyReport\(dailyRows\);\s*\}/);
if (crmReportMatch) {
    const oldCrmEnd = crmReportMatch[0];
    const newCrmEnd = oldCrmEnd.replace(
        'renderCrmDailyReport(dailyRows);\n    }',
        `renderCrmDailyReport(dailyRows);
      if (typeof updateChannelTargetBanner === 'function') {
        const crmTarget = loadCrmTargetByMonth();
        const targetToUse = crmTarget > 0 ? crmTarget : getChannelTarget(loadMonthlyTargetByMonth(), 'crm');
        updateChannelTargetBanner('crm', targetToUse, totalGross);
      }
      if (typeof renderBudgetingProposalTable === 'function') {
        renderBudgetingProposalTable('crm', '#crmProposalTableBody');
      }
    }`
    );
    content = content.replace(oldCrmEnd, newCrmEnd);
    console.log('Added hook to renderCrmReport');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('All hooks added successfully!');
