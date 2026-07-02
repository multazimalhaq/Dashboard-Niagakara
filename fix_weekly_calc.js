const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing Weekly revenue calculation (should match monthly if in same week)...');

// Replace updateDashboardTargetProgress to calculate weekly correctly
const oldUpdateProgress = `function updateDashboardTargetProgress() {
        const monthlyTarget = loadMonthlyTarget();
        if (monthlyTarget <= 0) return;

        // Get actual revenue for current month
        const [monthStart, monthEnd] = rangePreset('thisMonth');
        const monthlyRows = allRows.filter(row => {
            const rowDate = row.date ? parseDateValue(row.date) : null;
            return rowDate && rowDate >= startOfDay(monthStart) && rowDate <= startOfDay(monthEnd);
        });

        const monthlyRevenue = monthlyRows.reduce((total, row) => total + (row.revenue || 0), 0);
        const monthlyPercent = Math.min(100, Math.round((monthlyRevenue / monthlyTarget) * 100));

        // Update monthly progress (DISPLAY TARGET, not actual)
        const monthlyTargetDisplay = document.getElementById('monthlyTargetDisplay');
        const monthlyAchievedEl = document.getElementById('monthlyRevenueAchieved');
        const monthlyProgressPercent = document.getElementById('monthlyProgressPercent');
        const monthlyProgressFill = document.getElementById('monthlyProgressFill');

        if (monthlyTargetDisplay) monthlyTargetDisplay.textContent = currency(monthlyTarget);
        if (monthlyAchievedEl) monthlyAchievedEl.textContent = currency(monthlyRevenue);
        if (monthlyProgressPercent) monthlyProgressPercent.textContent = monthlyPercent + '%';
        if (monthlyProgressFill) monthlyProgressFill.style.width = monthlyPercent + '%';

        // Get weekly target and actual revenue
        const [weekStart, weekEnd] = getSelectedWeekRange ? getSelectedWeekRange() : [monthStart, new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(7, new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()))];
        const weeklyTarget = monthlyTarget / 4;

        const weeklyRows = allRows.filter(row => {
            const rowDate = row.date ? parseDateValue(row.date) : null;
            return rowDate && rowDate >= startOfDay(weekStart) && rowDate <= startOfDay(weekEnd);
        });

        const weeklyRevenue = weeklyRows.reduce((total, row) => total + (row.revenue || 0), 0);
        const weeklyPercent = Math.min(100, Math.round((weeklyRevenue / weeklyTarget) * 100));

        // Update weekly progress (DISPLAY TARGET, not actual)
        const weeklyTargetDisplay = document.getElementById('weeklyTargetDisplay');
        const weeklyAchievedEl = document.getElementById('weeklyRevenueAchieved');
        const weeklyProgressPercent = document.getElementById('weeklyProgressPercent');
        const weeklyProgressFill = document.getElementById('weeklyProgressFill');

        if (weeklyTargetDisplay) weeklyTargetDisplay.textContent = currency(weeklyTarget);
        if (weeklyAchievedEl) weeklyAchievedEl.textContent = currency(weeklyRevenue);
        if (weeklyProgressPercent) weeklyProgressPercent.textContent = weeklyPercent + '%';
        if (weeklyProgressFill) weeklyProgressFill.style.width = weeklyPercent + '%';
    }`;

const newUpdateProgress = `function updateDashboardTargetProgress() {
        const monthlyTarget = loadMonthlyTarget();
        if (monthlyTarget <= 0) return;

        // Get actual revenue for current month (from dashboard filter dates)
        const [filterStart, filterEnd] = getSelectedRange ? getSelectedRange() : rangePreset('thisMonth');
        const monthStart = filterStart;
        const monthEnd = filterEnd;
        
        const monthlyRows = allRows.filter(row => {
            const rowDate = row.date ? parseDateValue(row.date) : null;
            return rowDate && rowDate >= startOfDay(monthStart) && rowDate <= startOfDay(monthEnd);
        });

        const monthlyRevenue = monthlyRows.reduce((total, row) => total + (row.revenue || 0), 0);
        const monthlyPercent = Math.min(100, Math.round((monthlyRevenue / monthlyTarget) * 100));

        // Update monthly progress
        const monthlyTargetDisplay = document.getElementById('monthlyTargetDisplay');
        const monthlyAchievedEl = document.getElementById('monthlyRevenueAchieved');
        const monthlyProgressPercent = document.getElementById('monthlyProgressPercent');
        const monthlyProgressFill = document.getElementById('monthlyProgressFill');

        if (monthlyTargetDisplay) monthlyTargetDisplay.textContent = currency(monthlyTarget);
        if (monthlyAchievedEl) monthlyAchievedEl.textContent = currency(monthlyRevenue);
        if (monthlyProgressPercent) monthlyProgressPercent.textContent = monthlyPercent + '%';
        if (monthlyProgressFill) monthlyProgressFill.style.width = monthlyPercent + '%';

        // Calculate weekly revenue from current week's start up to today (or filter end)
        const today = new Date();
        const currentDay = today.getDate();
        
        // Determine which week we're in (1-7, 8-14, 15-21, 22-31)
        let weekStart, weekEnd;
        if (currentDay <= 7) {
            weekStart = new Date(today.getFullYear(), today.getMonth(), 1);
            weekEnd = new Date(today.getFullYear(), today.getMonth(), 7);
        } else if (currentDay <= 14) {
            weekStart = new Date(today.getFullYear(), today.getMonth(), 8);
            weekEnd = new Date(today.getFullYear(), today.getMonth(), 14);
        } else if (currentDay <= 21) {
            weekStart = new Date(today.getFullYear(), today.getMonth(), 15);
            weekEnd = new Date(today.getFullYear(), today.getMonth(), 21);
        } else {
            weekStart = new Date(today.getFullYear(), today.getMonth(), 22);
            weekEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); // last day of month
        }
        
        // But only count up to today or filter end (whichever is earlier)
        const actualWeekEnd = monthEnd < today ? monthEnd : today;
        
        const weeklyTarget = monthlyTarget / 4;

        const weeklyRows = allRows.filter(row => {
            const rowDate = row.date ? parseDateValue(row.date) : null;
            return rowDate && rowDate >= startOfDay(weekStart) && rowDate <= startOfDay(actualWeekEnd);
        });

        const weeklyRevenue = weeklyRows.reduce((total, row) => total + (row.revenue || 0), 0);
        const weeklyPercent = Math.min(100, Math.round((weeklyRevenue / weeklyTarget) * 100));

        // Update weekly progress
        const weeklyTargetDisplay = document.getElementById('weeklyTargetDisplay');
        const weeklyAchievedEl = document.getElementById('weeklyRevenueAchieved');
        const weeklyProgressPercent = document.getElementById('weeklyProgressPercent');
        const weeklyProgressFill = document.getElementById('weeklyProgressFill');

        if (weeklyTargetDisplay) weeklyTargetDisplay.textContent = currency(weeklyTarget);
        if (weeklyAchievedEl) weeklyAchievedEl.textContent = currency(weeklyRevenue);
        if (weeklyProgressPercent) weeklyProgressPercent.textContent = weeklyPercent + '%';
        if (weeklyProgressFill) weeklyProgressFill.style.width = weeklyPercent + '%';
    }`;

content = content.replace(oldUpdateProgress, newUpdateProgress);
console.log('Fixed weekly revenue calculation to use current week up to today');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Weekly calculation fix complete!');
