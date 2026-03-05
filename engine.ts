import { TITLES, PERSONALITY_PHRASES } from './config';

// --- 1. TYPES ---
export type PetBody = 'slime' | 'cube' | 'wisp' | 'mecha-spider' | 'orb' | 'crystal' | 'pyramid' | 'cloud';
export type PetAura = 'none' | 'fire' | 'digital-glitch' | 'shadow' | 'rainbow' | 'stars' | 'rain' | 'plasma' | 'leaves';
export type PetMutation = 'horns' | 'halo' | 'bat-wings' | 'spikes' | 'tail' | 'fins' | 'antenna' | 'shield' | 'sword' | 'magic-wand';
export type PetAccessory = 'none' | 'hat' | 'scarf' | 'glasses' | 'tie' | 'cape' | 'crown' | 'monocle' | 'headphones' | 'backpack';
export type PetPattern = 'solid' | 'stripes' | 'dots' | 'gradient-shift' | 'circuit' | 'honeycomb' | 'star-field' | 'waves';
export type PetPersonality = keyof typeof PERSONALITY_PHRASES;

export interface PetState {
    body: PetBody;
    color: string;
    aura: PetAura;
    mutations: PetMutation[];
    accessory: PetAccessory;
    pattern: PetPattern;
    complexity: number;
    personality: PetPersonality;
    title: string;
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
    bodies: ['slime', 'cube', 'wisp', 'mecha-spider', 'orb', 'crystal', 'pyramid', 'cloud'],
    colors: [
        '#FF0055', '#00FFCC', '#FFDD00', '#B000FF', 
        '#FF5500', '#55FF00', '#00AAFF', '#FF00FF',
        '#FFFFFF', '#444444', '#FF9900', '#00FF00',
        '#E74C3C', '#3498DB', '#F1C40F', '#9B59B6'
    ],
    auras: ['none', 'fire', 'digital-glitch', 'shadow', 'rainbow', 'stars', 'rain', 'plasma', 'leaves'],
    mutations: ['horns', 'halo', 'bat-wings', 'spikes', 'tail', 'fins', 'antenna', 'shield', 'sword', 'magic-wand'],
    accessories: ['none', 'hat', 'scarf', 'glasses', 'tie', 'cape', 'crown', 'monocle', 'headphones', 'backpack'],
    patterns: ['solid', 'stripes', 'dots', 'gradient-shift', 'circuit', 'honeycomb', 'star-field', 'waves']
};

const PERSONALITIES = Object.keys(PERSONALITY_PHRASES) as PetPersonality[];

export function generateProceduralPet(hexString: string, salt: string = ""): PetState {
    const dna = hexString;
    
    // Final seed incorporates DNA + Salt for high uniqueness
    const finalSeed = hashString(dna + salt);
    const rng = seededRandom(finalSeed); 

    let totalCommits = 0;
    for (const char of dna) {
        const val = parseInt(char, 16);
        if (!isNaN(val)) totalCommits += val;
    }
    
    // Complexity 0-5 based on actual activity
    const complexity = Math.min(5, Math.floor(totalCommits / 15));

    const title = `${pickRandom(TITLES.prefixes, rng)} ${pickRandom(TITLES.suffixes, rng)}`;
    const personality = pickRandom(PERSONALITIES, rng);

    let petVisuals: PetState = {
        body: pickRandom(PET_PARTS.bodies, rng),
        color: pickRandom(PET_PARTS.colors, rng),
        aura: 'none',
        mutations: [],
        accessory: 'none',
        pattern: pickRandom(PET_PARTS.patterns, rng),
        complexity,
        personality,
        title
    };

    // Evolution only based on ACTUAL available hex chars
    for (let i = 0; i < dna.length; i++) {
        const commitLevel = parseInt(dna[i], 16); 
        if (isNaN(commitLevel)) continue;

        // Higher commit days trigger modifications
        if (commitLevel >= 13) {
            const mRng = seededRandom(finalSeed + i + 1);
            const newMutation = pickRandom(PET_PARTS.mutations, mRng);
            if (!petVisuals.mutations.includes(newMutation)) {
                petVisuals.mutations.push(newMutation);
            }
        }

        if (commitLevel === 11 && petVisuals.accessory === 'none') {
            const aRng = seededRandom(finalSeed + i + 2);
            petVisuals.accessory = pickRandom(PET_PARTS.accessories, aRng);
        }

        if (commitLevel === 15 && petVisuals.aura === 'none') {
            const auRng = seededRandom(finalSeed + i + 3);
            petVisuals.aura = pickRandom(PET_PARTS.auras, auRng);
        }
    }

    // High complexity grants a guaranteed aura if missing
    if (complexity >= 4 && petVisuals.aura === 'none') {
        petVisuals.aura = pickRandom(PET_PARTS.auras.filter(a => a !== 'none'), rng);
    }

    return petVisuals;
}
