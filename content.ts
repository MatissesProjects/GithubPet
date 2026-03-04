import { generateProceduralPet, PetState } from './engine';

// --- 3. EXTRACTION & OBSERVER ---
function extractSignatureString(containerElement: HTMLElement): string {
    const charSpans = containerElement.querySelectorAll('.gh-sig-char');
    let hexString = '';
    charSpans.forEach(span => hexString += span.textContent?.trim() || '');
    return hexString;
}

function spawnPet(petState: PetState): void {
    const graphContainer = document.querySelector('.js-calendar-graph') as HTMLElement;
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
    const tooltip = document.createElement('div');
    tooltip.className = 'dna-pet-tooltip';
    tooltip.innerHTML = `
        <strong>DNA Pet</strong><br>
        Type: ${petState.body}<br>
        Mutations: ${petState.mutations.join(', ') || 'None'}
    `;
    pet.appendChild(tooltip);

    // Speech Bubble
    const speech = document.createElement('div');
    speech.id = 'pet-speech';
    speech.style.cssText = "position:absolute; bottom:120%; left:50%; transform:translateX(-50%); background:white; color:black; border:1px solid #ccc; padding:2px 6px; border-radius:10px; font-size:10px; white-space:nowrap; display:none; pointer-events:none; z-index:1002;";
    pet.appendChild(speech);

    graphContainer.style.position = 'relative'; 
    graphContainer.appendChild(pet);
    
    startPatrol(pet);
}

function startPatrol(petElement: HTMLElement): void {
    // Search for any rects in the graph
    const days = document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day');
    if (days.length === 0) {
        console.warn("No contribution days found for patrol.");
        return;
    }

    const phrases = ["*happy chirps*", "Found a commit!", "Nom nom...", "Zzz...", "Exploring!", "Looking for bugs..."];

    function moveToRandomDay() {
        const randomDay = days[Math.floor(Math.random() * days.length)] as HTMLElement;
        const rect = randomDay.getBoundingClientRect();
        const containerRect = (petElement.parentElement as HTMLElement).getBoundingClientRect();

        const x = rect.left - containerRect.left + (rect.width / 2) - 10;
        const y = rect.top - containerRect.top + (rect.height / 2) - 10;

        // Toggle movement state for animation
        petElement.classList.add('is-moving');
        petElement.style.left = `${x}px`;
        petElement.style.top = `${y}px`;

        // Personality: maybe say something
        if (Math.random() > 0.7) {
            const speech = petElement.querySelector('#pet-speech') as HTMLElement;
            if (speech) {
                speech.textContent = phrases[Math.floor(Math.random() * phrases.length)];
                speech.style.display = 'block';
                setTimeout(() => speech.style.display = 'none', 2000);
            }
        }

        setTimeout(() => {
            petElement.classList.remove('is-moving');
        }, 1000); // Match CSS transition duration
    }

    // Initial move
    moveToRandomDay();
    
    // Patrol interval
    setInterval(moveToRandomDay, 5000);
}

async function initEngine(containerElement: HTMLElement): Promise<void> {
    const username = window.location.pathname.split('/')[1];
    const { blacklist = [] } = await (chrome.storage.local.get('blacklist') as any);
    
    if (blacklist.includes(username)) {
        console.log(`Pet disabled for user: ${username}`);
        return;
    }

    const signature = extractSignatureString(containerElement);
    const petState = generateProceduralPet(signature);
    spawnPet(petState);
}

const observer = new MutationObserver((_mutations, obs) => {
    const sigElement = document.getElementById('gh-pulse-signature');
    if (sigElement) {
        obs.disconnect(); 
        initEngine(sigElement);
    }
});

observer.observe(document.body, { childList: true, subtree: true });
