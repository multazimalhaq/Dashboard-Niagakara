const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Phase 2: Make Advertiser target = CS target...');

// Replace the getChannelTarget function to make Advertiser & CS equal
const oldGetChannelTarget = `function getChannelTarget(monthlyTarget, channel) {
        const shares = calculateParetoShares(monthlyTarget);
        const channelLower = (channel || '').toLowerCase();
        if (channelLower.includes('shopee')) return shares.shopee;
        if (channelLower.includes('tiktok')) return shares.tiktokshop;
        if (channelLower.includes('crm')) return shares.crm;
        if (channelLower.includes('soscom') || channelLower.includes('meta') || channelLower.includes('advertiser') || channelLower.includes('cs')) {
            return shares.soscom;
        }
        return 0;
    }`;

const newGetChannelTarget = `function getChannelTarget(monthlyTarget, channel) {
        const shares = calculateParetoShares(monthlyTarget);
        const channelLower = (channel || '').toLowerCase();
        if (channelLower.includes('shopee')) return shares.shopee;
        if (channelLower.includes('tiktok')) return shares.tiktokshop;
        if (channelLower.includes('crm')) return shares.crm;
        if (channelLower.includes('soscom') || channelLower.includes('meta') || channelLower.includes('advertiser') || channelLower.includes('cs')) {
            return shares.soscom; // Advertiser & CS both get 20%
        }
        return 0;
    }`;

content = content.replace(oldGetChannelTarget, newGetChannelTarget);
console.log('Updated getChannelTarget to ensure Advertiser & CS are equal');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Phase 2 complete!');
