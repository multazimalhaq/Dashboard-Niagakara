const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Starting comprehensive implementation...');

// 1. Add multi-month target history functionality
const monthlyTargetHistoryLogic = `
    // ========== MULTI-MONTH TARGET HISTORY ==========
    const MONTHLY_TARGETS_KEY = 'ngkr_monthly_targets_history'; // Stores { "2026-07": 500000000, "2026-06": 400000000 }

    function getMonthKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return year + '-' + month;
    }

    function getActiveMonthKeyFromDashboard() {
        // Get month from dashboard filter start date
        const startDateVal = els.startDate ? els.startDate.value : '';
        if (startDateVal) {
            return startDateVal.substring(0, 7); // "2026-07"
        }
        return getMonthKey();
    }

    function loadAllMonthlyTargets() {
        try {
            const saved = localStorage.getItem(MONTHLY_TARGETS_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (_) {
            return {};
        }
    }

    function loadMonthlyTargetByMonth(monthKey = null) {
        const key = monthKey || getActiveMonthKeyFromDashboard();
        const targets = loadAllMonthlyTargets();
        return targets[key] || 0;
    }

    function saveMonthlyTargetByMonth(value, monthKey = null) {
        try {
            const key = monthKey || getActiveMonthKeyFromDashboard();
            const targets = loadAllMonthlyTargets();
            targets[key] = value > 0 ? value : 0;
            localStorage.setItem(MONTHLY_TARGETS_KEY, JSON.stringify(targets));
            return true;
        } catch (_) {
            return false;
        }
    }

    // Override original functions to use monthly history
    function loadMonthlyTarget() {
        return loadMonthlyTargetByMonth();
    }

    function saveMonthlyTarget(value) {
        return saveMonthlyTargetByMonth(value);
    }

    // ========== PARETO SHARE CALCULATIONS ==========
    function calculateParetoShares(monthlyTarget) {
        return {
            shopee: (monthlyTarget * 45) / 100,
            soscom: (monthlyTarget * 20) / 100,
            crm: (monthlyTarget * 25) / 100,
            tiktokshop: (monthlyTarget * 10) / 100
        };
    }

    function getChannelTarget(monthlyTarget, channel) {
        const shares = calculateParetoShares(monthlyTarget);
        const channelLower = (channel || '').toLowerCase();
        if (channelLower.includes('shopee')) return shares.shopee;
        if (channelLower.includes('tiktok')) return shares.tiktokshop;
        if (channelLower.includes('crm')) return shares.crm;
        if (channelLower.includes('soscom') || channelLower.includes('meta') || channelLower.includes('advertiser') || channelLower.includes('cs')) {
            return shares.soscom;
        }
        return 0;
    }

    // ========== CHANNEL TARGET DISPLAY BANNER ==========
    function updateChannelTargetBanner(pageType, monthlyTarget, activeRevenue) {
        const target = getChannelTarget(monthlyTarget, pageType);
        if (target <= 0) return;

        const percent = activeRevenue > 0 ? Math.round((activeRevenue / target) * 100) : 0;
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

        if (targetEl) targetEl.textContent = currency(target);
        if (actualEl) actualEl.textContent = currency(activeRevenue);
        if (fillEl) fillEl.style.width = safePercent + '%';
        if (percentEl) percentEl.textContent = percent + '%';
    }

    // ========== BUDGETING PROPOSAL TABLE RENDERING ==========
    function getBudgetingProposalsByChannel(channel) {
        const saved = localStorage.getItem('ngkr_budgeting_proposal');
        if (!saved) return [];

        try {
            const rows = JSON.parse(saved);
            const channelLower = (channel || '').toLowerCase();

            return rows.filter(row => {
                const platform = (row.platform || '').toLowerCase();
                if (channelLower === 'shopee') return platform.includes('shopee');
                if (channelLower === 'tiktok') return platform.includes('tiktokshop');
                if (channelLower === 'crm') return platform.includes('crm') || !platform.includes('shopee') && !platform.includes('tiktokshop') && !platform.includes('meta');
                if (channelLower === 'advertiser' || channelLower === 'cs') {
                    return platform.includes('meta') || platform.includes('facebook') || platform.includes('instagram') || platform.includes('google') || (platform.includes('tiktok') && !platform.includes('tiktokshop'));
                }
                return false;
            });
        } catch (_) {
            return [];
        }
    }

    function renderBudgetingProposalTable(channel, tableBodySelector) {
        const proposals = getBudgetingProposalsByChannel(channel);
        if (!proposals.length) return;

        const tbody = document.querySelector(tableBodySelector);
        if (!tbody) return;

        let totalBudget = 0;
        let totalRevenue = 0;

        const rows = proposals.map(row => {
            const budget = parseFloat(row.manualBudget) || parseFloat(row.recommendationBudget) || 0;
            const cac = parseFloat(row.manualTargetCac) || parseFloat(row.recommendationTargetCac) || 0;
            const revenue = cac > 0 ? budget / (cac / 100) : 0;

            totalBudget += budget;
            totalRevenue += revenue;

            return \`
                <tr>
                    <td>\${escapeHtml(row.advertiser || '-')}</td>
                    <td>\${escapeHtml(row.product || '-')}</td>
                    <td>\${currency(budget)}</td>
                    <td>\${currency(revenue)}</td>
                    <td>\${cac > 0 ? cac.toFixed(1) + '%' : '-'}</td>
                </tr>
            \`;
        });

        const avgCac = totalBudget > 0 ? ((totalBudget / totalRevenue) * 100).toFixed(1) : 0;

        tbody.innerHTML = rows.join('') + \`
            <tr class="total-row" style="font-weight: bold; background: var(--soft);">
                <td>Total Proposal</td>
                <td>-</td>
                <td>\${currency(totalBudget)}</td>
                <td>\${currency(totalRevenue)}</td>
                <td>\${avgCac}%</td>
            </tr>
        \`;
    }
`;

// Find insertion point (before setupTargetManagement or at beginning of functions)
const targetMgmtIndex = content.indexOf('function setupTargetManagement()');
if (targetMgmtIndex === -1) {
    console.error('Could not find setupTargetManagement');
    process.exit(1);
}

content = content.slice(0, targetMgmtIndex) +
          monthlyTargetHistoryLogic + '\n\n    ' +
          content.slice(targetMgmtIndex);

console.log('Added multi-month target history and Pareto logic');

// 2. Add target banner HTML to each page (Shopee, Tiktok, Advertiser, CS, CRM)
const targetBannerHTML = (pageLabel, pageType) => \`
        <!-- Target & Budgeting Summary Banner -->
        <section class="card panel" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <span style="font-size: 13px; color: var(--muted); font-weight: 500;">Target Bulanan (\${pageLabel}) - Pareto Share:</span>
              <strong id="\${pageType}TargetDisplay" style="font-size: 18px; color: var(--ink); margin-left: 8px;">Rp0</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; flex: 2;">
              <span style="font-size: 13px; color: var(--muted);">Pencapaian:</span>
              <strong id="\${pageType}ActualDisplay" style="font-size: 14px;">Rp0</strong>
              <div style="flex-grow: 1; background: var(--soft); height: 10px; border-radius: 5px; overflow: hidden; position: relative;">
                <div id="\${pageType}ProgressFill" style="background: var(--teal); width: 0%; height: 100%; transition: width 0.3s;"></div>
              </div>
              <span id="\${pageType}ProgressPercent" style="font-size: 13px; font-weight: bold; color: var(--teal); min-width: 45px;">0%</span>
            </div>
          </div>
        </section>
\`;

// 3. Add target banner to Shopee page
const shopeePageIndex = content.indexOf('<section id="shopee-page"');
if (shopeePageIndex !== -1) {
    const quickFiltersEndShopee = content.indexOf('</section>', shopeePageIndex + 500);
    content = content.slice(0, quickFiltersEndShopee + 10) +
              targetBannerHTML('Shopee 45%', 'shopee') +
              content.slice(quickFiltersEndShopee + 10);
    console.log('Added target banner to Shopee page');
}

// 4. Add target banner to Tiktok page
const tiktokPageIndex = content.indexOf('<section id="tiktok-page"');
if (tiktokPageIndex !== -1) {
    const quickFiltersEndTiktok = content.indexOf('</section>', tiktokPageIndex + 500);
    content = content.slice(0, quickFiltersEndTiktok + 10) +
              targetBannerHTML('Tiktokshop 10%', 'tiktok') +
              content.slice(quickFiltersEndTiktok + 10);
    console.log('Added target banner to Tiktok page');
}

// 5. Add target banner to Advertiser page
const advPageIndex = content.indexOf('<section id="advertiser-page"');
if (advPageIndex !== -1) {
    const quickFiltersEndAdv = content.indexOf('</section>', advPageIndex + 500);
    content = content.slice(0, quickFiltersEndAdv + 10) +
              targetBannerHTML('Soscom 20%', 'adv') +
              content.slice(quickFiltersEndAdv + 10);
    console.log('Added target banner to Advertiser page');
}

// 6. Add target banner to CS page
const csPageIndex = content.indexOf('<section id="cs-page"');
if (csPageIndex !== -1) {
    const quickFiltersEndCS = content.indexOf('</section>', csPageIndex + 500);
    content = content.slice(0, quickFiltersEndCS + 10) +
              targetBannerHTML('Soscom (CS) 20%', 'cs') +
              content.slice(quickFiltersEndCS + 10);
    console.log('Added target banner to CS page');
}

// 7. Add target banner to CRM page
const crmPageIndex = content.indexOf('<section id="crm-page"');
if (crmPageIndex !== -1) {
    const quickFiltersEndCRM = content.indexOf('</section>', crmPageIndex + 500);
    content = content.slice(0, quickFiltersEndCRM + 10) +
              targetBannerHTML('CRM 25%', 'crm') +
              content.slice(quickFiltersEndCRM + 10);
    console.log('Added target banner to CRM page');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Implementation complete!');
