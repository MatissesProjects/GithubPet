// --- 1. TYPES ---
export type PetBody = 'slime' | 'cube' | 'wisp' | 'mecha-spider' | 'orb' | 'crystal';
export type PetAura = 'none' | 'fire' | 'digital-glitch' | 'shadow' | 'rainbow' | 'stars' | 'rain';
export type PetMutation = 'horns' | 'halo' | 'bat-wings' | 'spikes' | 'tail' | 'fins' | 'antenna';
export type PetAccessory = 'none' | 'hat' | 'scarf' | 'glasses' | 'tie' | 'cape';
export type PetPattern = 'solid' | 'stripes' | 'dots' | 'gradient-shift' | 'circuit';

export interface PetState {
    body: PetBody;
    color: string;
    aura: PetAura;
    mutations: PetMutation[];
    accessory: PetAccessory;
    pattern: PetPattern;
    complexity: number; // 0-5 based on commit volume
}

export interface PetParts {
    bodies: PetBody[];
    colors: string[];
    auras: PetAura[];
    mutations: PetMutation[];
    accessories: PetAccessory[];
    patterns: PetPattern[];
}

// --- 2. SEEDED PRNG ---
export function seededRandom(seed: number): () => number {
    return function() {
        var t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function pickRandom<T>(array: T[], randomFunc: () => number): T {
    return array[Math.floor(randomFunc() * array.length)];
}

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

// --- 3. PROCEDURAL ENGINE ---
export const PET_PARTS: PetParts = {
    bodies: ['slime', 'cube', 'wisp', 'mecha-spider', 'orb', 'crystal'],
    colors: [
        '#FF0055', '#00FFCC', '#FFDD00', '#B000FF', 
        '#FF5500', '#55FF00', '#00AAFF', '#FF00FF',
        '#FFFFFF', '#444444', '#FF9900', '#00FF00'
    ],
    auras: ['none', 'fire', 'digital-glitch', 'shadow', 'rainbow', 'stars', 'rain'],
    mutations: ['horns', 'halo', 'bat-wings', 'spikes', 'tail', 'fins', 'antenna'],
    accessories: ['none', 'hat', 'scarf', 'glasses', 'tie', 'cape'],
    patterns: ['solid', 'stripes', 'dots', 'gradient-shift', 'circuit']
};

export function generateProceduralPet(hexString: string, salt: string = ""): PetState {
    let dna = hexString;
    while (dna.length < 4) dna += "0"; 

    const baseSeed = parseInt(dna.slice(0, 4), 16);
    const saltHash = salt ? hashString(salt) : 0;
    const finalSeed = baseSeed ^ saltHash;
    const rng = seededRandom(finalSeed); 

    const evolutionChain = dna.slice(4);
    let totalCommits = 0;
    for (const char of evolutionChain) totalCommits += parseInt(char, 16);
    
    // Complexity level based on total commit volume in that month
    const complexity = Math.min(5, Math.floor(totalCommits / 20));

    let petVisuals: PetState = {
        body: pickRandom(PET_PARTS.bodies, rng),
        color: pickRandom(PET_PARTS.colors, rng),
        aura: 'none',
        mutations: [],
        accessory: 'none',
        pattern: pickRandom(PET_PARTS.patterns, rng),
        complexity
    };

    // Evolution logic
    for (let i = 0; i < evolutionChain.length; i++) {
        const commitLevel = parseInt(evolutionChain[i], 16); 
        
        // High level = Mutation
        if (commitLevel >= 13) {
            const mRng = seededRandom(finalSeed + i + commitLevel);
            const newMutation = pickRandom(PET_PARTS.mutations, mRng);
            if (!petVisuals.mutations.includes(newMutation)) {
                petVisuals.mutations.push(newMutation);
            }
        }

        // Mid level = Accessory
        if (commitLevel === 10 && petVisuals.accessory === 'none') {
            const aRng = seededRandom(finalSeed * (i + 1));
            petVisuals.accessory = pickRandom(PET_PARTS.accessories, aRng);
        }

        // Rare level = Aura
        if (commitLevel === 15 && petVisuals.aura === 'none') {
            const auRng = seededRandom(finalSeed + i);
            petVisuals.aura = pickRandom(PET_PARTS.auras, auRng);
        }
    }

    // Complexity overrides
    if (complexity >= 3 && petVisuals.aura === 'none') {
        petVisuals.aura = pickRandom(PET_PARTS.auras.filter(a => a !== 'none'), rng);
    }

    return petVisuals;
}
