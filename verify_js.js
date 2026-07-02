const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Simple regex to extract <script> tags contents
const regex = /<script>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = regex.exec(html)) !== null) {
    count++;
    const jsCode = match[1];
    try {
        // Evaluate the code using Function constructor to check for syntax errors
        // Note: this won't run it but will parse it. To avoid executing DOM-dependent stuff,
        // we just parse it. The easiest way to check syntax in Node is compiling it as a script.
        const vm = require('vm');
        new vm.Script(jsCode);
        console.log(`Script tag #${count} syntax is valid!`);
    } catch (e) {
        console.error(`Syntax Error in Script tag #${count}:`, e);
        process.exit(1);
    }
}
