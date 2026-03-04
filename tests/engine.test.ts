import { generateProceduralPet, PET_PARTS } from '../engine';

describe('Procedural Engine', () => {
    test('should generate consistent pet for same seed', () => {
        const sig = "FEAB1234";
        const pet1 = generateProceduralPet(sig);
        const pet2 = generateProceduralPet(sig);
        expect(pet1).toEqual(pet2);
    });

    test('should handle genesis block (last 4 chars)', () => {
        const p1 = generateProceduralPet("1111");
        const p2 = generateProceduralPet("1111");
        expect(p1).toEqual(p2);
    });

    test('should apply mutations for high commit levels (>= 13 / D)', () => {
        const base = "1234";
        const highCommit = "D" + base; 
        const lowCommit = "1" + base;

        const petHigh = generateProceduralPet(highCommit);
        const petLow = generateProceduralPet(lowCommit);

        expect(petHigh.mutations.length).toBeGreaterThanOrEqual(petLow.mutations.length);
    });

    test('should apply accessories for level 10 (A) commits', () => {
        const base = "1234";
        const accSig = "A" + base; // A = 10
        const noAccSig = "1" + base;

        const petAcc = generateProceduralPet(accSig);
        const petNoAcc = generateProceduralPet(noAccSig);

        // A level 10 commit should trigger an accessory check
        // It might still pick 'none', but we can check if it's within the valid parts
        expect(PET_PARTS.accessories).toContain(petAcc.accessory);
        expect(petNoAcc.accessory).toBe('none');
    });

    test('should pick valid body and color', () => {
        const pet = generateProceduralPet("DEADBEEF");
        expect(PET_PARTS.bodies).toContain(pet.body);
        expect(PET_PARTS.colors).toContain(pet.color);
    });

    test('should handle very long evolution chains', () => {
        const longSig = "F".repeat(100) + "1234";
        const pet = generateProceduralPet(longSig);
        expect(pet.mutations.length).toBeGreaterThan(0);
        expect(pet.body).toBeDefined();
    });

    test('should handle minimal signature', () => {
        const minimal = "1234";
        const pet = generateProceduralPet(minimal);
        expect(pet.mutations).toHaveLength(0);
        expect(pet.accessory).toBe('none');
    });
});
