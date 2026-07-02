const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing Dashboard targets to use SET TARGET (manual input)...');

// Remove the auto-fill logic we added in Phase 1
const autoFillPattern = /function calculateDashboardTargets\(\) \{[\s\S]*?setTimeout\(calculateDashboardTargets, 100\);[\s\S]*?\};/;
content = content.replace(autoFillPattern, '');

// Remove the hook from render()
const renderHookPattern = /const originalRender = window\.render;[\s\S]*?setTimeout\(calculateDashboardTargets, 100\);[\s\S]*?\};[\s\S]*?window\.render = function\(\) \{[\s\S]*?setTimeout\(calculateDashboardTargets, 100\);[\s\S]*?\};/;
content = content.replace(renderHookPattern, '');

// Restore original target management that uses SET TARGET
const correctTargetLogic = `
    function updateMonthlyTargetDisplay(targetValue) {
        // Display the SET TARGET value (from user input), not actual omset
        if (targetValue > 0) {
            els.monthlyTargetDisplay.textContent = currency(targetValue);
            els.weeklyTargetDisplay.textContent = currency(targetValue / 4); // Weekly = Monthly ÷ 4
        } else {
            els.monthlyTargetDisplay.textContent = 'Rp0';
            els.weeklyTargetDisplay.textContent = 'Rp0';
        }
    }

    function updateDashboardTargetProgress() {
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

        // Update monthly progress
        const monthlyAchievedEl = document.getElementById('monthlyRevenueAchieved');
        const monthlyProgressPercent = document.getElementById('monthlyProgressPercent');
        const monthlyProgressFill = document.getElementById('monthlyProgressFill');

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

        // Update weekly progress
        const weeklyAchievedEl = document.getElementById('weeklyRevenueAchieved');
        const weeklyProgressPercent = document.getElementById('weeklyProgressPercent');
        const weeklyProgressFill = document.getElementById('weeklyProgressFill');

        if (weeklyAchievedEl) weeklyAchievedEl.textContent = currency(weeklyRevenue);
        if (weeklyProgressPercent) weeklyProgressPercent.textContent = weeklyPercent + '%';
        if (weeklyProgressFill) weeklyProgressFill.style.width = weeklyPercent + '%';
    }
`;

// Find where to insert corrected logic
const setupTargetIndex = content.indexOf('function setupTargetManagement()');
if (setupTargetIndex !== -1) {
    content = content.slice(0, setupTargetIndex) + correctTargetLogic + '\n\n    ' + content.slice(setupTargetIndex);
    console.log('Inserted corrected target display logic');
}

// Hook into render to update progress
const originalRenderHook = `
    // Hook into render to update dashboard targets
    const originalRender = window.render;
    if (typeof originalRender === 'function') {
        window.render = function() {
            originalRender();
            if (typeof updateDashboardTargetProgress === 'function') {
                setTimeout(updateDashboardTargetProgress, 100);
            }
        };
    }
`;

const scriptEnd = content.lastIndexOf('</script>');
if (scriptEnd !== -1) {
    content = content.slice(0, scriptEnd) + '    ' + originalRenderHook + '\n  ' + content.slice(scriptEnd);
    console.log('Added render hook for progress update');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Dashboard target fix complete!');
