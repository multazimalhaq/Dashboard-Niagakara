const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Starting Phase 3: Adding proposal tables to all pages...');

function generateProposalTable(pageType) {
    return `
        <!-- Rencana Budgeting Proposal Panel -->
        <section class="card panel" style="margin-bottom: 16px;">
          <div class="panel-header">
            <h2>Rencana Budgeting (Rekomendasi Terpilih)</h2>
            <span class="panel-note">Berdasarkan data budgeting yang disimpan terakhir</span>
          </div>
          <div class="daily-table-wrap">
            <table class="daily-table">
              <thead>
                <tr>
                  <th>Nama ADV</th>
                  <th>Produk</th>
                  <th>Budget</th>
                  <th>Target Revenue</th>
                  <th>Target CAC</th>
                </tr>
              </thead>
              <tbody id="${pageType}ProposalTableBody">
                <tr><td colspan="5">Belum ada proposal yang disimpan.</td></tr>
              </tbody>
            </table>
          </div>
        </section>
    `;
}

function addProposalTable(pageType) {
    const bannerTarget = `id="${pageType}TargetDisplay"`;
    const bannerIndex = content.indexOf(bannerTarget);
    if (bannerIndex === -1) {
        console.log(`  Banner for ${pageType} not found, skipping...`);
        return;
    }
    
    // Find the end of this card panel
    const panelEndIndex = content.indexOf('</section>', bannerIndex);
    if (panelEndIndex === -1) {
        console.log(`  End of banner panel for ${pageType} not found, skipping...`);
        return;
    }
    
    const tableHTML = generateProposalTable(pageType);
    content = content.slice(0, panelEndIndex + 10) + '\n' + tableHTML + '\n' + content.slice(panelEndIndex + 10);
    console.log(`  Added proposal table to ${pageType} page`);
}

addProposalTable('shopee');
addProposalTable('tiktok');
addProposalTable('advertiser');
addProposalTable('cs');
addProposalTable('crm');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Phase 3 complete! Proposal tables added.');
