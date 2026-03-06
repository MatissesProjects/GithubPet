import { TITLES, PERSONALITY_PHRASES } from './config.js';

// --- 1. TYPES ---
export type PetBody = 'slime' | 'cube' | 'wisp' | 'mecha-spider' | 'orb' | 'crystal' | 'pyramid' | 'cloud' | 'ghost' | 'dragon-egg';
export type PetAura = 'none' | 'fire' | 'digital-glitch' | 'shadow' | 'rainbow' | 'stars' | 'rain' | 'plasma' | 'leaves' | 'void' | 'nebula';
export type PetMutation = 
    'horns' | 'halo' | 'bat-wings' | 'spikes' | 'tail' | 'fins' | 'antenna' | 
    'shield' | 'sword' | 'magic-wand' | 'wiggle' | 'angel-wings' | 'demon-wings' | 
    'third-eye' | 'hover-bots' | 'leafy-tail' | 'gem-core' | 'beard' | 'mustache';
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
    growthLabel: string;
    colorShift: number; // For hue rotation evolution
    dnaLength: number;
    totalCommits: number;
}

export interface CollectionPet {
    signature: string;
    username: string;
    year: string;
    month: string;
    enabled: boolean;
    addedAt: number;
    totalCommits?: number;
    dnaLength?: number;
}

export interface PetParts {
    bodies: PetBody[];
    colors: string[];
    premiumColors: string[];
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
    bodies: ['slime', 'cube', 'wisp', 'mecha-spider', 'orb', 'crystal', 'pyramid', 'cloud', 'ghost'],
    colors: [
        '#FF3388', '#33FFCC', '#FFDD00', '#CC66FF', 
        '#FF8833', '#88FF33', '#33CCFF', '#FF33FF'
    ],
    premiumColors: [
        '#FFFFFF', '#FFCC66', '#66FF66', '#66CCFF',
        '#FF99AA', '#99FFCC', '#FFEE99', '#CC99FF',
        '#00FF00', '#00FFFF', '#FF00FF', '#FFFF00'
    ],
    auras: ['none', 'fire', 'digital-glitch', 'shadow', 'rainbow', 'stars', 'rain', 'plasma', 'leaves', 'void', 'nebula'],
    mutations: ['horns', 'halo', 'bat-wings', 'spikes', 'tail', 'fins', 'antenna', 'shield', 'sword', 'magic-wand', 'wiggle', 'angel-wings', 'demon-wings', 'third-eye', 'hover-bots', 'leafy-tail', 'gem-core', 'beard', 'mustache'],
    accessories: ['none', 'hat', 'scarf', 'glasses', 'tie', 'cape', 'crown', 'monocle', 'headphones', 'backpack', 'wizard-hat', 'viking-helmet', 'detective-pipe', 'flower', 'cyber-mask'],
    patterns: ['solid', 'stripes', 'dots', 'gradient-shift', 'circuit', 'honeycomb', 'star-field', 'waves', 'lava', 'glitch-static']
};

const PERSONALITIES = Object.keys(PERSONALITY_PHRASES) as PetPersonality[];

export function generateProceduralPet(hexString: string, salt: string = "", totalCommitsOverride?: number, dnaLengthOverride?: number): PetState {
    const dna = hexString;
    // Identity should be stable for the month, using only salt
    const identitySeed = hashString(salt);
    const idRng = seededRandom(identitySeed); 

    // Evolution seed depends on the growth (dna)
    const evolutionSeed = hashString(dna + salt);
    const evRng = seededRandom(evolutionSeed);

    let totalCommits = 0;
    if (totalCommitsOverride !== undefined) {
        totalCommits = totalCommitsOverride;
    } else {
        for (const char of dna) {
            const val = parseInt(char, 16);
            if (!isNaN(val)) totalCommits += val;
        }
    }
    
    const complexity = Math.min(5, Math.floor(totalCommits / 15));

    // New Evolution Logic: Grow from Hatchling to Legendary within the month
    const consistency = dnaLengthOverride !== undefined ? dnaLengthOverride : dna.length;
    let evolutionTier = 0;
    let growthLabel = "Egg Hatchling";

    if (consistency >= 21 || totalCommits >= 100) {
        evolutionTier = 3;
        growthLabel = "Legendary Growth";
    } else if (consistency >= 14 || totalCommits >= 50) {
        evolutionTier = 2;
        growthLabel = "Elite Resident";
    } else if (consistency >= 7 || totalCommits >= 20) {
        evolutionTier = 1;
        growthLabel = "Growing Fledgling";
    }

    // Use idRng for stable traits
    const hatchedBody = pickRandom(PET_PARTS.bodies, idRng);
    const body = evolutionTier === 0 ? 'dragon-egg' : hatchedBody;

    const title = `${pickRandom(TITLES.prefixes, idRng)} ${pickRandom(TITLES.suffixes, idRng)}`;
    const personality = pickRandom(PERSONALITIES, idRng);

    // Color evolution: use premium colors at higher complexity
    const colorPool = complexity >= 3 ? PET_PARTS.premiumColors : PET_PARTS.colors;
    // We use idRng for color so it's stable, or maybe it should evolve?
    // Let's use idRng for base color so it doesn't flip wildly, 
    // but the pool choice still depends on complexity.
    const baseColor = pickRandom(colorPool, idRng);
    
    // Color shift based on DNA length (progression through the month)
    const colorShift = (dna.length * 10) % 360;

    let petVisuals: PetState = {
        body,
        color: baseColor,
        aura: 'none',
        mutations: [],
        accessory: 'none',
        pattern: pickRandom(PET_PARTS.patterns, idRng),
        complexity,
        personality,
        title,
        evolutionTier,
        growthLabel,
        colorShift,
        dnaLength: consistency,
        totalCommits
    };

    // Evolution chain additions (only if hatched)
    if (evolutionTier > 0) {
        const modRng = seededRandom(evolutionSeed + 123);
        if (evolutionTier >= 1) petVisuals.mutations.push(pickRandom(PET_PARTS.mutations, modRng));
        if (evolutionTier >= 2) petVisuals.accessory = pickRandom(PET_PARTS.accessories, modRng);
        if (evolutionTier >= 3) petVisuals.aura = pickRandom(PET_PARTS.auras, modRng);

        for (let i = 0; i < dna.length; i++) {
            const commitLevel = parseInt(dna[i], 16); 
            if (isNaN(commitLevel)) continue;

            if (commitLevel >= 12) {
                const mRng = seededRandom(evolutionSeed + i + 1);
                const newMutation = pickRandom(PET_PARTS.mutations, mRng);
                if (!petVisuals.mutations.includes(newMutation)) {
                    petVisuals.mutations.push(newMutation);
                }
            }

            if (commitLevel === 11 && petVisuals.accessory === 'none') {
                const aRng = seededRandom(evolutionSeed + i + 2);
                petVisuals.accessory = pickRandom(PET_PARTS.accessories, aRng);
            }
        }
    }

    return petVisuals;
}
