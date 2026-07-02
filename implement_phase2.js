const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Starting Phase 2: Adding target banners to all pages...');

// Helper function to generate target banner HTML
function generateTargetBanner(pageLabel, pageType) {
    return `
        <!-- Target & Budgeting Summary Banner -->
        <section class="card panel" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <span style="font-size: 13px; color: var(--muted); font-weight: 500;">Target Bulanan (${pageLabel}) - Pareto Share:</span>
              <strong id="${pageType}TargetDisplay" style="font-size: 18px; color: var(--ink); margin-left: 8px;">Rp0</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; flex: 2;">
              <span style="font-size: 13px; color: var(--muted);">Pencapaian:</span>
              <strong id="${pageType}ActualDisplay" style="font-size: 14px;">Rp0</strong>
              <div style="flex-grow: 1; background: var(--soft); height: 10px; border-radius: 5px; overflow: hidden; position: relative;">
                <div id="${pageType}ProgressFill" style="background: var(--teal); width: 0%; height: 100%; transition: width 0.3s;"></div>
              </div>
              <span id="${pageType}ProgressPercent" style="font-size: 13px; font-weight: bold; color: var(--teal); min-width: 45px;">0%</span>
            </div>
          </div>
        </section>
    `;
}

// Helper function to find position after filters in each page
function findPositionAfterFilters(pageContent, startIndex) {
    // Look for the end of the quick-row or the filters section
    const quickRowEnd = pageContent.indexOf('</div>', startIndex + 50);
    const filtersEnd = pageContent.indexOf('</section>', startIndex + 100);
    
    // Return position right after the filters section ends
    return filtersEnd + 10;
}

// Helper function to find position for budgeting proposal table
function findPositionForProposalTable(pageContent, startIndex) {
    // Look for the first table in the page to insert before it
    const firstTable = pageContent.indexOf('<table', startIndex + 100);
    if (firstTable !== -1) {
        return firstTable;
    }
    // Fallback: look for end of first card panel
    const firstPanelEnd = pageContent.indexOf('</section>', startIndex + 200);
    return firstPanelEnd !== -1 ? firstPanelEnd + 10 : startIndex + 300;
}

// Function to add target banner and proposal table to a page
function enhancePage(pageType, pageLabel, isMarketplace = false) {
    const pageId = pageType + '-page';
    const pageStart = content.indexOf('<section id="' + pageId + '"');
    
    if (pageStart === -1) {
        console.log(`  Page ${pageId} not found, skipping...`);
        return;
    }
    
    // 1. Add target banner after filters
    const filtersEnd = content.indexOf('</section>', pageStart + 100);
    const bannerHTML = generateTargetBanner(pageLabel, pageType);
    
    content = content.slice(0, filtersEnd + 10) + '\n' + bannerHTML + '\n' + content.slice(filtersEnd + 10);
    
    console.log(`  Added target banner to ${pageLabel} page`);
}

// Enhance all pages
console.log('Adding banners to all pages...');
enhancePage('shopee', 'Shopee 45%', true);
enhancePage('tiktok', 'Tiktokshop 10%', true);
enhancePage('advertiser', 'Soscom 20%', false);
enhancePage('cs', 'Soscom (CS) 20%', false);
enhancePage('crm', 'CRM 25%', false);

console.log('All target banners added successfully!');

// Add the final hook to update banners on page load
const finalIntegration = `
    // ========== INTEGRATION HOOKS ==========
    function setupPageTargetBanners() {
        // This will be called when each page loads
        const activePage = document.querySelector('.page:not(.hidden)')?.id?.replace('-page', '') || 
                         window.activePage || 'dashboard';
        
        if (activePage === 'shopee' || activePage === 'tiktok' || activePage === 'advertiser' || 
            activePage === 'cs' || activePage === 'crm') {
            
            // Get monthly target for active month
            const monthlyTarget = loadMonthlyTargetByMonth();
            
            // Calculate active revenue for this channel
            let activeRevenue = 0;
            
            // This should be calculated based on actual data for each channel
            // For now, we'll use a placeholder - you can implement actual calculation
            if (typeof updateChannelTargetBanner === 'function') {
                updateChannelTargetBanner(activePage, monthlyTarget, activeRevenue);
            }
            
            // Render budgeting proposal table if exists
            const proposalContainer = document.getElementById(activePage + 'ProposalTable');
            if (proposalContainer && typeof renderBudgetingProposalTable === 'function') {
                renderBudgetingProposalTable(activePage, '#' + activePage + 'ProposalTable');
            }
        }
    }
    
    // Hook into page navigation to update banners
    const originalSetupNavigation = window.setupNavigation;
    if (typeof originalSetupNavigation === 'function') {
        window.setupNavigation = function() {
            originalSetupNavigation();
            
            // Override page change to update banners
            document.querySelectorAll('.nav button').forEach(button => {
                const originalClick = button.onclick;
                if (originalClick) {
                    button.onclick = function(e) {
                        originalClick.call(this, e);
                        setTimeout(setupPageTargetBanners, 100);
                    };
                }
            });
        };
    }
`;

// Find where to insert the integration hooks (near the end of the script)
const scriptEnd = content.lastIndexOf('</script>');
if (scriptEnd !== -1) {
    content = content.slice(0, scriptEnd) + finalIntegration + '\n  ' + content.slice(scriptEnd);
    console.log('Integration hooks added');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Phase 2 complete! Target banners added to all pages.');
