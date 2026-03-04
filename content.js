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

// --- 3. EXTRACTION & OBSERVER ---
function extractSignatureString(containerElement) {
    const charSpans = containerElement.querySelectorAll('.gh-sig-char');
    let hexString = '';
    charSpans.forEach(span => hexString += span.textContent.trim());
    return hexString;
}

function spawnPet(petState) {
    const graphContainer = document.querySelector('.js-calendar-graph');
    if (!graphContainer) {
        console.error("Contribution graph not found!");
        return;
    }

    const pet = document.createElement('div');
    pet.id = 'dna-pet-instance';
    pet.className = `dna-pet body-${petState.body}`;
    
    // Applying color
    pet.style.backgroundColor = petState.color;
    
    // Adding aura
    if (petState.aura !== 'none') {
        pet.classList.add(`aura-${petState.aura}`);
    }
    
    // Adding mutations
    petState.mutations.forEach(mut => {
        pet.classList.add(`mut-${mut}`);
    });
    
    // Tooltip for stats
    pet.title = `Pet Type: ${petState.body}\nMutations: ${petState.mutations.join(', ') || 'None'}`;

    graphContainer.style.position = 'relative'; // Ensure container is relative
    graphContainer.appendChild(pet);
    
    console.log("Pet spawned in graph!", petState);
    
    startPatrol(pet);
}

function startPatrol(petElement) {
    const days = document.querySelectorAll('rect.ContributionCalendar-day');
    if (days.length === 0) return;

    function moveToRandomDay() {
        const randomDay = days[Math.floor(Math.random() * days.length)];
        const rect = randomDay.getBoundingClientRect();
        const containerRect = petElement.parentElement.getBoundingClientRect();

        const x = rect.left - containerRect.left + (rect.width / 2) - 10;
        const y = rect.top - containerRect.top + (rect.height / 2) - 10;

        petElement.style.left = `${x}px`;
        petElement.style.top = `${y}px`;
    }

    // Initial move
    moveToRandomDay();
    
    // Patrol interval
    setInterval(moveToRandomDay, 3000);
}

function initEngine(containerElement) {
    const signature = extractSignatureString(containerElement);
    console.log("Extracted DNA:", signature);
    const petState = generateProceduralPet(signature);
    console.log("Calculated Pet State:", petState);
    spawnPet(petState);
}

const observer = new MutationObserver((mutations, obs) => {
    const sigElement = document.getElementById('gh-pulse-signature');
    if (sigElement) {
        obs.disconnect(); 
        initEngine(sigElement);
    }
});

observer.observe(document.body, { childList: true, subtree: true });
