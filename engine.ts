// --- 1. TYPES ---
export type PetBody = 'slime' | 'cube' | 'wisp' | 'mecha-spider';
export type PetAura = 'none' | 'fire' | 'digital-glitch' | 'shadow';
export type PetMutation = 'horns' | 'halo' | 'bat-wings' | 'spikes';

export interface PetState {
    body: PetBody;
    color: string;
    aura: PetAura;
    mutations: PetMutation[];
}

export interface PetParts {
    bodies: PetBody[];
    colors: string[];
    auras: PetAura[];
    mutations: PetMutation[];
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

// --- 3. PROCEDURAL ENGINE ---
export const PET_PARTS: PetParts = {
    bodies: ['slime', 'cube', 'wisp', 'mecha-spider'],
    colors: ['#FF0055', '#00FFCC', '#FFDD00', '#B000FF'],
    auras: ['none', 'fire', 'digital-glitch', 'shadow'],
    mutations: ['horns', 'halo', 'bat-wings', 'spikes']
};

export function generateProceduralPet(hexString: string): PetState {
    const genesisHex = hexString.slice(-4);
    let seed = parseInt(genesisHex, 16); 
    const rng = seededRandom(seed); 

    let petVisuals: PetState = {
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
