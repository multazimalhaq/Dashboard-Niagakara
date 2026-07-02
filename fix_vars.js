const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Replace the duplicate const declaration in our injected block
content = content.replace("const BUDGETING_STORAGE_KEY = 'ngkr_budgeting_proposal';", "const PROPOSAL_STORAGE_KEY = 'ngkr_budgeting_proposal';");
content = content.replace(/BUDGETING_STORAGE_KEY/g, function(match, offset) {
    // Only replace occurrences after our injection marker (e.g. "NEW FEATURES IMPLEMENTATION FOR DASHBOARD")
    if (offset > content.indexOf("NEW FEATURES IMPLEMENTATION FOR DASHBOARD")) {
        return "PROPOSAL_STORAGE_KEY";
    }
    return match;
});

fs.writeFileSync('index.html', content, 'utf8');
console.log('Fixed variable name conflict.');
