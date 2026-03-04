// --- 1. SEEDED PRNG ---
function seededRandom(seed) {
    return function() {
        var t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function pickRandom(array, randomFunc) {
    return array[Math.floor(randomFunc() * array.length)];
}

// --- 2. PROCEDURAL ENGINE ---
const PET_PARTS = {
    bodies: ['slime', 'cube', 'wisp', 'mecha-spider'],
    colors: ['#FF0055', '#00FFCC', '#FFDD00', '#B000FF'],
    auras: ['none', 'fire', 'digital-glitch', 'shadow'],
    mutations: ['horns', 'halo', 'bat-wings', 'spikes']
};

function generateProceduralPet(hexString) {
    const genesisHex = hexString.slice(-4);
    let seed = parseInt(genesisHex, 16); 
    const rng = seededRandom(seed); 

    let petVisuals = {
        body: pickRandom(PET_PARTS.bodies, rng),
        color: pickRandom(PET_PARTS.colors, rng),
        aura: 'none',
        mutations: []
    };

    const evolutionChain = hexString.slice(0, -4);
    
    // Read right-to-left (oldest to newest)
    for (let i = evolutionChain.length - 1; i >= 0; i--) {
        const commitLevel = parseInt(evolutionChain[i], 16); 
        
        // High commit day = Mutation Event
        if (commitLevel >= 13) {
            const mutationRng = seededRandom(seed + i + commitLevel);
            const newMutation = pickRandom(PET_PARTS.mutations, mutationRng);
            if (!petVisuals.mutations.includes(newMutation)) {
                petVisuals.mutations.push(newMutation);
            }
        }
    }
    return petVisuals;
}

// Export for Node if needed (for tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateProceduralPet, seededRandom, pickRandom, PET_PARTS };
}
