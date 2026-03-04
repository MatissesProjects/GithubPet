// --- 1. TYPES ---
export type PetBody = 'slime' | 'cube' | 'wisp' | 'mecha-spider';
export type PetAura = 'none' | 'fire' | 'digital-glitch' | 'shadow';
export type PetMutation = 'horns' | 'halo' | 'bat-wings' | 'spikes';
export type PetAccessory = 'none' | 'hat' | 'scarf' | 'glasses';

export interface PetState {
    body: PetBody;
    color: string;
    aura: PetAura;
    mutations: PetMutation[];
    accessory: PetAccessory;
}

export interface CollectionPet {
    signature: string;
    username: string;
    year: string;
    month: string;
    enabled: boolean;
    addedAt: number;
}

export interface PetParts {
    bodies: PetBody[];
    colors: string[];
    auras: PetAura[];
    mutations: PetMutation[];
    accessories: PetAccessory[];
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
    colors: ['#FF0055', '#00FFCC', '#FFDD00', '#B000FF', '#FF5500', '#55FF00'],
    auras: ['none', 'fire', 'digital-glitch', 'shadow'],
    mutations: ['horns', 'halo', 'bat-wings', 'spikes'],
    accessories: ['none', 'hat', 'scarf', 'glasses']
};

export function generateProceduralPet(hexString: string): PetState {
    // Ensure we have at least 4 chars for a stable seed by padding if necessary
    let dna = hexString;
    while (dna.length < 4) dna += (dna.length % 2 === 0 ? "F" : "0"); 

    // Genesis Block is the FIRST 4 chars of the month's DNA
    const genesisHex = dna.slice(0, 4);
    let seed = parseInt(genesisHex, 16); 
    const rng = seededRandom(seed); 

    let petVisuals: PetState = {
        body: pickRandom(PET_PARTS.bodies, rng),
        color: pickRandom(PET_PARTS.colors, rng),
        aura: 'none',
        mutations: [],
        accessory: 'none'
    };

    const evolutionChain = dna.slice(4);
    
    for (let i = 0; i < evolutionChain.length; i++) {
        const commitLevel = parseInt(evolutionChain[i], 16); 
        
        if (commitLevel >= 13) {
            const mutationRng = seededRandom(seed + i + commitLevel);
            const newMutation = pickRandom(PET_PARTS.mutations, mutationRng);
            if (!petVisuals.mutations.includes(newMutation)) {
                petVisuals.mutations.push(newMutation);
            }
        }

        if (commitLevel === 10 && petVisuals.accessory === 'none') {
            const accRng = seededRandom(seed * (i + 1));
            petVisuals.accessory = pickRandom(PET_PARTS.accessories, accRng);
        }
    }
    return petVisuals;
}
