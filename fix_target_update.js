const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

const oldSaveLogic = `if (els.weeklyBudgetingPage && !els.weeklyBudgetingPage.classList.contains("hidden")) {
              renderWeeklyBudgetingPage();
            }`;

const newSaveLogic = `if (typeof updateMonthlyAndWeeklyTargetProgress === 'function') {
              updateMonthlyAndWeeklyTargetProgress();
            }
            if (els.weeklyBudgetingPage && !els.weeklyBudgetingPage.classList.contains("hidden")) {
              renderWeeklyBudgetingPage();
            }`;

content = content.replace(oldSaveLogic, newSaveLogic);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Target management updated successfully!');
