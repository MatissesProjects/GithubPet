import { TITLES, PERSONALITY_PHRASES } from './config.js';

// --- 1. TYPES ---
export type PetBody = 'slime' | 'cube' | 'wisp' | 'mecha-spider' | 'orb' | 'crystal' | 'pyramid' | 'cloud' | 'ghost' | 'dragon-egg';
export type PetAura = 'none' | 'fire' | 'digital-glitch' | 'shadow' | 'rainbow' | 'stars' | 'rain' | 'plasma' | 'leaves' | 'void' | 'nebula';
export type PetMutation = 
    'horns' | 'halo' | 'bat-wings' | 'spikes' | 'tail' | 'fins' | 'antenna' | 
    'shield' | 'sword' | 'magic-wand' | 'wiggle' | 'angel-wings' | 'demon-wings' | 
    'third-eye' | 'hover-bots' | 'leafy-tail' | 'gem-core';
export type PetAccessory = 
    'none' | 'hat' | 'scarf' | 'glasses' | 'tie' | 'cape' | 'crown' | 
    'monocle' | 'headphones' | 'backpack' | 'wizard-hat' | 'viking-helmet' | 
    'detective-pipe' | 'flower' | 'cyber-mask';
export type PetPattern = 'solid' | 'stripes' | 'dots' | 'gradient-shift' | 'circuit' | 'honeycomb' | 'star-field' | 'waves' | 'lava' | 'glitch-static';
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
    evolutionTier: number;
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
    bodies: ['slime', 'cube', 'wisp', 'mecha-spider', 'orb', 'crystal', 'pyramid', 'cloud', 'ghost', 'dragon-egg'],
    // UPDATED: Bright, vibrant palette (removed dark grays/blacks)
    colors: [
        '#FF3388', '#33FFCC', '#FFDD00', '#CC66FF', 
        '#FF8833', '#88FF33', '#33CCFF', '#FF33FF',
        '#FFFFFF', '#FFCC66', '#66FF66', '#66CCFF',
        '#FF99AA', '#99FFCC', '#FFEE99', '#CC99FF'
    ],
    auras: ['none', 'fire', 'digital-glitch', 'shadow', 'rainbow', 'stars', 'rain', 'plasma', 'leaves', 'void', 'nebula'],
    mutations: ['horns', 'halo', 'bat-wings', 'spikes', 'tail', 'fins', 'antenna', 'shield', 'sword', 'magic-wand', 'wiggle', 'angel-wings', 'demon-wings', 'third-eye', 'hover-bots', 'leafy-tail', 'gem-core'],
    accessories: ['none', 'hat', 'scarf', 'glasses', 'tie', 'cape', 'crown', 'monocle', 'headphones', 'backpack', 'wizard-hat', 'viking-helmet', 'detective-pipe', 'flower', 'cyber-mask'],
    patterns: ['solid', 'stripes', 'dots', 'gradient-shift', 'circuit', 'honeycomb', 'star-field', 'waves', 'lava', 'glitch-static']
};

const PERSONALITIES = Object.keys(PERSONALITY_PHRASES) as PetPersonality[];

export function generateProceduralPet(hexString: string, salt: string = ""): PetState {
    const dna = hexString;
    const finalSeed = hashString(dna + salt);
    const rng = seededRandom(finalSeed); 

    let totalCommits = 0;
    for (const char of dna) {
        const val = parseInt(char, 16);
        if (!isNaN(val)) totalCommits += val;
    }
    
    const complexity = Math.min(5, Math.floor(totalCommits / 15));
    const evolutionTier = Math.min(3, Math.floor(dna.length / 10));

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
        title,
        evolutionTier
    };

    // Evolution logic (guaranteed complexity traits)
    const activeDNA = dna.length > 0 ? dna : "0000";
    
    for (let i = 0; i < activeDNA.length; i++) {
        const commitLevel = parseInt(activeDNA[i], 16); 
        if (isNaN(commitLevel)) continue;

        // More mutations based on complexity
        if (commitLevel >= 12 || (i < complexity)) {
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

    if (complexity >= 3 && petVisuals.accessory === 'none') {
        petVisuals.accessory = pickRandom(PET_PARTS.accessories.filter(a => a !== 'none'), rng);
    }

    if (complexity >= 4 && petVisuals.aura === 'none') {
        petVisuals.aura = pickRandom(PET_PARTS.auras.filter(a => a !== 'none'), rng);
    }

    return petVisuals;
}
