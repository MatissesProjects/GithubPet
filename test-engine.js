// Mocking DOM elements for testing logic
const fs = require('fs');
const contentFile = fs.readFileSync('content.js', 'utf8');

// Isolating functions for testing
// We skip the MutationObserver part
const engineCode = contentFile.split('// --- 3. EXTRACTION & OBSERVER ---')[0];
eval(engineCode);

// Test Cases
const signatures = [
    "FEAB1234", // Genesis: 1234, Evolution: FEAB
    "0000FFFF", // Genesis: FFFF, Evolution: 0000
    "DEADBEEFCAFE" // Genesis: CAFE, Evolution: DEADBEEF
];

signatures.forEach(sig => {
    console.log(`\nTesting Signature: ${sig}`);
    const petState = generateProceduralPet(sig);
    console.log("Calculated Pet State:", JSON.stringify(petState, null, 2));
});
