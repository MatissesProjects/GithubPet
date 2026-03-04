// Mocking DOM elements for testing logic
const { generateProceduralPet } = require('./engine.js');

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
