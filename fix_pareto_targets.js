const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing Pareto target calculation for Advertiser & CRM pages...');

// Find and replace getChannelTarget function
const oldGetChannelTarget = `function getChannelTarget(monthlyTarget, channel) {
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

const newGetChannelTarget = `function getChannelTarget(monthlyTarget, channel) {
        if (!monthlyTarget || monthlyTarget <= 0) return 0;
        
        const channelLower = (channel || '').toLowerCase();
        
        // Calculate shares based on monthly target
        const shopeeShare = (monthlyTarget * 45) / 100;
        const soscomShare = (monthlyTarget * 20) / 100;
        const crmShare = (monthlyTarget * 25) / 100;
        const tiktokShare = (monthlyTarget * 10) / 100;
        
        if (channelLower.includes('shopee')) return shopeeShare;
        if (channelLower.includes('tiktok')) return tiktokShare;
        if (channelLower.includes('crm')) return crmShare;
        if (channelLower.includes('soscom') || channelLower.includes('meta') || channelLower.includes('advertiser') || channelLower.includes('cs')) {
            return soscomShare; // Advertiser & CS both get 20%
        }
        return 0;
    }`;

content = content.replace(oldGetChannelTarget, newGetChannelTarget);
console.log('Updated getChannelTarget function');

// Also ensure calculateParetoShares is correct
const oldCalcParetoShares = `function calculateParetoShares(monthlyTarget) {
        return {
            shopee: (monthlyTarget * 45) / 100,
            soscom: (monthlyTarget * 20) / 100,
            crm: (monthlyTarget * 25) / 100,
            tiktokshop: (monthlyTarget * 10) / 100
        };
    }`;

const newCalcParetoShares = `function calculateParetoShares(monthlyTarget) {
        if (!monthlyTarget || monthlyTarget <= 0) {
            return { shopee: 0, soscom: 0, crm: 0, tiktokshop: 0 };
        }
        return {
            shopee: (monthlyTarget * 45) / 100,
            soscom: (monthlyTarget * 20) / 100,
            crm: (monthlyTarget * 25) / 100,
            tiktokshop: (monthlyTarget * 10) / 100
        };
    }`;

content = content.replace(oldCalcParetoShares, newCalcParetoShares);
console.log('Updated calculateParetoShares function');

// Fix updateChannelTargetBanner to properly get monthly target
const oldUpdateBanner = `function updateChannelTargetBanner(pageType, monthlyTarget, activeRevenue) {
        const target = getChannelTarget(monthlyTarget, pageType);
        if (target <= 0) return;`;

const newUpdateBanner = `function updateChannelTargetBanner(pageType, monthlyTarget, activeRevenue) {
        // Ensure we have a valid monthly target
        if (!monthlyTarget || monthlyTarget <= 0) {
            monthlyTarget = loadMonthlyTargetByMonth() || 0;
        }
        
        const target = getChannelTarget(monthlyTarget, pageType);
        if (target <= 0) return;`;

content = content.replace(oldUpdateBanner, newUpdateBanner);
console.log('Updated updateChannelTargetBanner to load target if needed');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Pareto target calculation fix complete!');
