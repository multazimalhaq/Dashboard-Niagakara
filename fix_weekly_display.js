const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing Weekly Target display (target vs actual clarity)...');

// Find and update the weekly target card HTML structure
const oldWeeklyCard = `          <article class="card target-card">
            <div class="target-header">
              <span class="target-label">Target Revenue Mingguan</span>
              <small class="target-note">Auto-calc dari target bulanan ÷ 4</small>
            </div>
            <div class="target-progress">
              <div class="progress-info">
                <strong id="weeklyRevenueAchieved">Rp0</strong>
                <span class="progress-percentage" id="weeklyProgressPercent">0%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" id="weeklyProgressFill" style="width: 0%"></div>
              </div>
              <small>dari target <span id="weeklyTargetDisplay">Rp0</span></small>`;

const newWeeklyCard = `          <article class="card target-card">
            <div class="target-header">
              <span class="target-label">Target Revenue Mingguan</span>
              <small class="target-note">Auto-calc dari target bulanan ÷ 4</small>
            </div>
            <div class="target-progress">
              <div class="progress-info">
                <strong id="weeklyTargetDisplay">Rp0</strong>
                <span class="progress-percentage" id="weeklyProgressPercent">0%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" id="weeklyProgressFill" style="width: 0%"></div>
              </div>
              <small>Pencapaian: <span id="weeklyRevenueAchieved">Rp0</span></small>`;

content = content.replace(oldWeeklyCard, newWeeklyCard);
console.log('Updated weekly target card display structure');

// Update the updateDashboardTargetProgress function to swap values correctly
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
    }`;

const newUpdateProgress = `function updateDashboardTargetProgress() {
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

content = content.replace(oldUpdateProgress, newUpdateProgress);
console.log('Fixed updateDashboardTargetProgress function');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Weekly target display fix complete!');
