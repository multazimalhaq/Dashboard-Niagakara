const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('File size:', content.length);

// 1. Locate and extract target cards section
const targetCardsRegex = /<!-- Target Cards -->[\s\S]*?<\/article>\s*<\/section>/;
const targetCardsMatch = content.match(targetCardsRegex);

if (!targetCardsMatch) {
    console.error('ERROR: Could not find target cards section in HTML');
    process.exit(1);
}

let targetCardsHTML = targetCardsMatch[0];
console.log('Target Cards HTML found.');

// Add weekly deficit display element inside the weekly target card
const weeklyDeficitHTML = `
              <small>dari target <span id="weeklyTargetDisplay">Rp0</span></small>
              <div id="weeklyDeficitDisplay" style="font-size: 11px; color: #c2415d; margin-top: 4px; font-weight: 500;"></div>`;

targetCardsHTML = targetCardsHTML.replace(
    '              <small>dari target <span id="weeklyTargetDisplay">Rp0</span></small>',
    weeklyDeficitHTML
);

// 2. Remove target cards from weekly-budgeting-page
content = content.replace(targetCardsRegex, '');
console.log('Removed target cards from weekly-budgeting-page');

// 3. Insert target cards into dashboard-page (before kpi-grid)
const kpiGridIndex = content.indexOf('<section class="kpi-grid">');
if (kpiGridIndex === -1) {
    console.error('ERROR: Could not find kpi-grid in dashboard-page');
    process.exit(1);
}

content = content.slice(0, kpiGridIndex) + 
          targetCardsHTML + '\n\n        ' + 
          content.slice(kpiGridIndex);
console.log('Inserted target cards into dashboard-page.');

// 4. Pareto recommendation engine logic
const paretoLogic = `
    // ========== PARETO ALLOCATION ENGINE ==========
    const PARETO_PLATFORMS = {
        shopee: 45,
        soscom: 20,
        crm: 25,
        tiktokshop: 10
    };

    const PARETO_ADVERTISERS = {
        'multazim': 10,
        'other': 10
    };

    const PARETO_PRODUCTS = {
        'multazim': {
            'you & milk': 5,
            'eyebost pro': 5
        }
    };

    function getPreviousWeekDeficit(currentStart, currentEnd) {
        const savedTarget = loadMonthlyTarget();
        if (!savedTarget || savedTarget <= 0) return 0;
        
        const baseWeeklyTarget = savedTarget / 4;
        
        // Calculate previous week's date range
        const prevStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        const prevEnd = new Date(currentEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Sum revenue of previous week
        const prevRows = weeklyRowsInRange(prevStart, prevEnd).detailRows;
        const prevRevenue = prevRows.reduce((sum, r) => sum + (r.revenue || 0), 0);
        
        // Deficit is target - actual
        return Math.max(0, baseWeeklyTarget - prevRevenue);
    }

    function buildParetoBudgetRecommendations(detailRows, settings, targetCrmRevenue = 0, weeklyTarget = 0) {
        if (weeklyTarget <= 0) {
            return buildBudgetRecommendations(detailRows, settings, targetCrmRevenue);
        }

        // Segment proposal rows by platform
        const shopeeRows = [];
        const tiktokshopRows = [];
        const soscomRows = [];
        const crmRows = [];

        detailRows.forEach(row => {
            const platform = (row.platform || '').toLowerCase();
            if (platform.includes('shopee')) {
                shopeeRows.push(row);
            } else if (platform.includes('tiktokshop')) {
                tiktokshopRows.push(row);
            } else if (platform.includes('meta') || platform.includes('facebook') || platform.includes('instagram') || platform.includes('google') || platform.includes('tiktok')) {
                soscomRows.push(row);
            } else {
                crmRows.push(row);
            }
        });

        // Calculate targets per category based on pareto
        const shopeeTotalTarget = (weeklyTarget * PARETO_PLATFORMS.shopee) / 100;
        const tiktokshopTotalTarget = (weeklyTarget * PARETO_PLATFORMS.tiktokshop) / 100;
        const soscomTotalTarget = (weeklyTarget * PARETO_PLATFORMS.soscom) / 100;
        const crmTotalTarget = (weeklyTarget * PARETO_PLATFORMS.crm) / 100;

        return detailRows.map((row, index) => {
            const platform = (row.platform || '').toLowerCase();
            const advertiser = (row.advertiser || '').toLowerCase();
            const product = (row.product || '').toLowerCase();
            
            let targetRevenue = 0;
            let paretoPercent = 0;

            if (platform.includes('shopee')) {
                targetRevenue = shopeeRows.length > 0 ? shopeeTotalTarget / shopeeRows.length : 0;
                paretoPercent = PARETO_PLATFORMS.shopee / (shopeeRows.length || 1);
            } else if (platform.includes('tiktokshop')) {
                targetRevenue = tiktokshopRows.length > 0 ? tiktokshopTotalTarget / tiktokshopRows.length : 0;
                paretoPercent = PARETO_PLATFORMS.tiktokshop / (tiktokshopRows.length || 1);
            } else if (platform.includes('meta') || platform.includes('facebook') || platform.includes('instagram') || platform.includes('google') || platform.includes('tiktok')) {
                // Soscom/Meta - divided by advertisers and products
                // Count unique soscom advertisers
                const uniqueAdv = [...new Set(soscomRows.map(r => (r.advertiser || '').toLowerCase()))];
                const advCount = uniqueAdv.length || 1;
                
                // Let's check advertiser specific pareto
                let advTarget = soscomTotalTarget / advCount;
                let advPercent = PARETO_PLATFORMS.soscom / advCount;
                
                if (advertiser.includes('multazim')) {
                    advTarget = (weeklyTarget * PARETO_ADVERTISERS.multazim) / 100;
                    advPercent = PARETO_ADVERTISERS.multazim;
                }

                // Count products for this advertiser
                const advProductRows = soscomRows.filter(r => (r.advertiser || '').toLowerCase() === advertiser);
                const uniqueProducts = [...new Set(advProductRows.map(r => (r.product || '').toLowerCase()))];
                const prodCount = uniqueProducts.length || 1;

                targetRevenue = advTarget / prodCount;
                paretoPercent = advPercent / prodCount;
            } else {
                targetRevenue = crmRows.length > 0 ? crmTotalTarget / crmRows.length : 0;
                paretoPercent = PARETO_PLATFORMS.crm / (crmRows.length || 1);
            }

            // Recommended Budget = targetRevenue * (historicalCAC / 100)
            const adminRate = recommendationAdminRate(row.platform, settings.shopeeAdmin, settings.shopeeTax, settings.tiktokAdmin);
            const historicalCac = row.cac || 20; // Default fallback to 20% CAC
            const recommendedBudget = targetRevenue * (historicalCac / 100);
            const adminCost = targetRevenue * adminRate / 100;
            const budgetAdmin = recommendedBudget + adminCost;
            const targetCac = historicalCac;
            const estimatedPamValue = targetRevenue - (targetRevenue * settings.hpp / 100) - budgetAdmin;
            const estimatedPamRate = percentRatio(estimatedPamValue, targetRevenue);

            return {
                ...row,
                recommendedBudget,
                targetCac,
                budgetAdmin,
                estimatedPamRate,
                status: 'Pareto ' + paretoPercent.toFixed(1) + '%',
                targetRevenue,
                safe: true
            };
        });
    }

    function makeProposalRowFromPareto(recommendation, index, settings) {
        return {
            id: 'pareto-' + index + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            advertiser: recommendation.advertiser || '',
            platform: recommendation.platform || '',
            product: recommendation.product || '',
            mode: 'recommendation',
            recommendationBudget: recommendation.recommendedBudget || 0,
            recommendationTargetCac: recommendation.targetCac || 0,
            recommendationTargetRevenue: recommendation.targetRevenue || 0,
            manualBudget: '',
            manualTargetCac: '',
            adminRate: recommendation.adminRate || 0,
            status: recommendation.status || ''
        };
    }
`;

// Insert Pareto allocation logic before buildBudgetRecommendations
const buildRecommendationsIndex = content.indexOf('function buildBudgetRecommendations(');
if (buildRecommendationsIndex === -1) {
    console.error('ERROR: Could not find buildBudgetRecommendations function');
    process.exit(1);
}

content = content.slice(0, buildRecommendationsIndex) + 
          paretoLogic + '\n\n    ' + 
          content.slice(buildRecommendationsIndex);
console.log('Pareto allocation engine code injected.');

// Update ensureBudgetProposalRows definition to include weeklyTarget parameter
content = content.replace(
    'function ensureBudgetProposalRows(recommendations, settings, targetCrmRevenue = 0)',
    'function ensureBudgetProposalRows(recommendations, settings, targetCrmRevenue = 0, weeklyTarget = 0)'
);

// Update ensureBudgetProposalRows body
const oldEnsureBody = `const seed = budgetProposalSeed(recommendations, settings, targetCrmRevenue);
      if (weeklyProposalSeed === seed && weeklyProposalRows.length) return;
      weeklyProposalRows = recommendations.map((row, index) => makeProposalRow(row, index, settings));
      weeklyProposalSeed = seed;`;

const newEnsureBody = `const seed = budgetProposalSeed(recommendations, settings, targetCrmRevenue);
      if (weeklyProposalSeed === seed && weeklyProposalRows.length) return;
      
      if (weeklyTarget > 0) {
          const paretoRecs = buildParetoBudgetRecommendations(recommendations, settings, targetCrmRevenue, weeklyTarget);
          weeklyProposalRows = paretoRecs.map((row, index) => makeProposalRowFromPareto(row, index, settings));
      } else {
          weeklyProposalRows = recommendations.map((row, index) => makeProposalRow(row, index, settings));
      }
      weeklyProposalSeed = seed;`;

content = content.replace(oldEnsureBody, newEnsureBody);
console.log('ensureBudgetProposalRows implementation updated.');

// Hook into renderWeeklyBudgetingPage to pass weeklyTarget & deficit carryover
const buildRecsLine = 'const budgetRecommendations = buildBudgetRecommendations(proposalSourceRows, settings, targetCrmRevenue);';
const newBuildRecsLine = `const [cStart, cEnd] = getSelectedWeekRange();
      const prevDeficit = getPreviousWeekDeficit(cStart, cEnd);
      const baseWeeklyTarget = (loadMonthlyTarget() || 0) / 4;
      const weeklyTarget = baseWeeklyTarget > 0 ? baseWeeklyTarget + prevDeficit : 0;

      // Update deficit display in UI
      const deficitDiv = document.getElementById('weeklyDeficitDisplay');
      if (deficitDiv) {
          if (prevDeficit > 0) {
              deficitDiv.innerHTML = 'Defisit Pekan Lalu: <strong style="color:#c2415d;">' + currency(prevDeficit) + '</strong> (Target baru: ' + currency(weeklyTarget) + ')';
          } else {
              deficitDiv.innerHTML = '';
          }
      }

      const budgetRecommendations = buildBudgetRecommendations(proposalSourceRows, settings, targetCrmRevenue);`;

content = content.replace(buildRecsLine, newBuildRecsLine);

const ensureProposalCall = 'ensureBudgetProposalRows(budgetRecommendations, settings, targetCrmRevenue);';
const newEnsureProposalCall = 'ensureBudgetProposalRows(budgetRecommendations, settings, targetCrmRevenue, weeklyTarget);';

content = content.replace(ensureProposalCall, newEnsureProposalCall);
console.log('renderWeeklyBudgetingPage hook updated.');

// Remove the old target progress display from renderWeeklyBudgetingPage if it exists
// Wait, updateMonthlyAndWeeklyTargetProgress updates both, we should make sure it runs fine when target cards are on the Dashboard page.
fs.writeFileSync(filePath, content, 'utf8');
console.log('File index.html successfully modified!');
