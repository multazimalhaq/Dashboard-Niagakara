const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Phase 1: Auto-fill Dashboard targets from actual gross omset...');

// Add new functions to calculate targets from actual omset
const autoFillTargetLogic = `
    // ========== AUTO-FILL DASHBOARD TARGETS FROM OMSET ==========
    function calculateDashboardTargets() {
        const [monthStart, monthEnd] = rangePreset("thisMonth");
        
        // Get gross omset for this month (all channels combined)
        const monthlyRows = allRows.filter(row => {
            const rowDate = row.date ? parseDateValue(row.date) : null;
            return rowDate && rowDate >= startOfDay(monthStart) && rowDate <= startOfDay(monthEnd);
        });
        
        const monthlyGross = monthlyRows.reduce((total, row) => total + (row.revenue || 0), 0);
        
        // Update monthly target display
        const monthlyTargetEl = document.getElementById('monthlyTargetDisplay');
        const monthlyAchievedEl = document.getElementById('monthlyRevenueAchieved');
        if (monthlyTargetEl) monthlyTargetEl.textContent = currency(monthlyGross);
        if (monthlyAchievedEl) monthlyAchievedEl.textContent = currency(monthlyGross);
        
        // Calculate weekly targets based on actual omset per week
        const weeks = [
            { start: monthStart, end: new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(7, new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate())) },
            { start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 8), end: new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(14, new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate())) },
            { start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 15), end: new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(21, new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate())) },
            { start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 22), end: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0) }
        ];
        
        weeks.forEach((week, idx) => {
            const weekRows = monthlyRows.filter(row => {
                const rowDate = parseDateValue(row.date);
                return rowDate >= startOfDay(week.start) && rowDate <= startOfDay(week.end);
            });
            
            const weekGross = weekRows.reduce((total, row) => total + (row.revenue || 0), 0);
            
            // Store weekly targets for reference
            if (idx === 0) {
                const weeklyTargetEl = document.getElementById('weeklyTargetDisplay');
                const weeklyAchievedEl = document.getElementById('weeklyRevenueAchieved');
                if (weeklyTargetEl) weeklyTargetEl.textContent = currency(weekGross);
                if (weeklyAchievedEl) weeklyAchievedEl.textContent = currency(weekGross);
            }
        });
        
        // Update progress bars
        if (monthlyGross > 0) {
            const monthlyProgressPercent = document.getElementById('monthlyProgressPercent');
            const monthlyProgressFill = document.getElementById('monthlyProgressFill');
            if (monthlyProgressPercent) monthlyProgressPercent.textContent = '100%';
            if (monthlyProgressFill) monthlyProgressFill.style.width = '100%';
            
            const weeklyProgressPercent = document.getElementById('weeklyProgressPercent');
            const weeklyProgressFill = document.getElementById('weeklyProgressFill');
            if (weeklyProgressPercent) weeklyProgressPercent.textContent = '100%';
            if (weeklyProgressFill) weeklyProgressFill.style.width = '100%';
        }
    }
    
    // Hook into render() to update targets when data changes
    const originalRender = window.render;
    window.render = function() {
        if (typeof originalRender === 'function') {
            originalRender();
        }
        if (typeof calculateDashboardTargets === 'function') {
            setTimeout(calculateDashboardTargets, 100);
        }
    };
`;

// Find insertion point (before setupTargetManagement)
const setupTargetIndex = content.indexOf('function setupTargetManagement()');
if (setupTargetIndex === -1) {
    console.error('Could not find setupTargetManagement');
    process.exit(1);
}

content = content.slice(0, setupTargetIndex) + 
          autoFillTargetLogic + '\n\n    ' + 
          content.slice(setupTargetIndex);

console.log('Added auto-fill target logic');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Phase 1 complete!');
