import { generateProceduralPet, PetState } from './engine';

// --- 3. EXTRACTION & OBSERVER ---
function extractSignatureString(containerElement: HTMLElement): string {
    const charSpans = containerElement.querySelectorAll('.gh-sig-char');
    let hexString = '';
    charSpans.forEach(span => hexString += span.textContent?.trim() || '');
    return hexString;
}

function forceOverflowVisible(element: HTMLElement): void {
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
        parent.style.setProperty('overflow', 'visible', 'important');
        parent.style.setProperty('contain', 'none', 'important');
        parent = parent.parentElement;
    }
}

function spawnPet(petState: PetState): void {
    // Clean up existing pet
    const existingPet = document.getElementById('dna-pet-instance');
    if (existingPet) existingPet.remove();

    const graphContainer = document.querySelector('.js-calendar-graph') as HTMLElement;
    if (!graphContainer) {
        return;
    }

    const container = document.createElement('div');
    container.id = 'dna-pet-instance';
    container.className = `dna-pet`;

    // Visual Body
    const visual = document.createElement('div');
    visual.className = `pet-visual body-${petState.body}`;
    visual.style.backgroundColor = petState.color;
    
    // Applying aura and mutations to visual
    if (petState.aura !== 'none') {
        visual.classList.add(`aura-${petState.aura}`);
    }
    petState.mutations.forEach(mut => {
        visual.classList.add(`mut-${mut}`);
    });

    // Eyes
    const eyes = document.createElement('div');
    eyes.className = 'pet-eyes';
    visual.appendChild(eyes);

    container.appendChild(visual);
    
    // Tooltip for stats (outside visual to stay sharp)
    const tooltip = document.createElement('div');
    tooltip.className = 'dna-pet-tooltip';
    tooltip.innerHTML = `
        <strong>DNA Pet</strong><br>
        Type: ${petState.body}<br>
        Mutations: ${petState.mutations.join(', ') || 'None'}
    `;
    container.appendChild(tooltip);

    // Speech Bubble (outside visual)
    const speech = document.createElement('div');
    speech.id = 'pet-speech';
    speech.style.cssText = "position:absolute; bottom:120%; left:50%; transform:translateX(-50%); background:#0d1117; color:#c9d1d9; border:1px solid #30363d; padding:4px 8px; border-radius:10px; font-size:10px; white-space:nowrap; display:none; pointer-events:none; z-index:100000001; box-shadow: 0 4px 12px rgba(0,0,0,0.5);";
    container.appendChild(speech);

    graphContainer.style.position = 'relative'; 
    graphContainer.appendChild(container);
    
    // Recursive fix for parent clipping
    forceOverflowVisible(container);
    
    startPatrol(container);
}

function startPatrol(petElement: HTMLElement): void {
    const days = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')) as HTMLElement[];
    if (days.length === 0) return;

    const phrases = ["*happy chirps*", "Found a commit!", "Nom nom...", "Zzz...", "Exploring!", "Looking for bugs...", "Shiny squares!", "I like the green ones."];

    function pickWeightedDay(): HTMLElement {
        const weights = days.map(day => {
            const level = parseInt(day.getAttribute('data-level') || '0', 10);
            return level + 1;
        });

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < days.length; i++) {
            if (random < weights[i]) {
                return days[i];
            }
            random -= weights[i];
        }
        return days[Math.floor(Math.random() * days.length)];
    }

    function moveToRandomDay() {
        if (!petElement.parentElement) return;

        const targetDay = pickWeightedDay();
        const rect = targetDay.getBoundingClientRect();
        const containerRect = (petElement.parentElement as HTMLElement).getBoundingClientRect();

        const x = rect.left - containerRect.left + (rect.width / 2) - 10;
        const y = rect.top - containerRect.top + (rect.height / 2) - 10;

        petElement.classList.add('is-moving');
        petElement.style.left = `${x}px`;
        petElement.style.top = `${y}px`;

        if (Math.random() > 0.8) {
            const speech = petElement.querySelector('#pet-speech') as HTMLElement;
            if (speech) {
                speech.textContent = phrases[Math.floor(Math.random() * phrases.length)];
                speech.style.display = 'block';
                setTimeout(() => { if (speech) speech.style.display = 'none'; }, 2500);
            }
        }

        setTimeout(() => {
            petElement.classList.remove('is-moving');
        }, 1000);
    }

    moveToRandomDay();
    const interval = setInterval(() => {
        if (!document.body.contains(petElement)) {
            clearInterval(interval);
            return;
        }
        moveToRandomDay();
    }, 5000);
}

async function initEngine(containerElement: HTMLElement): Promise<void> {
    const username = window.location.pathname.split('/')[1];
    const { blacklist = [] } = await (chrome.storage.local.get('blacklist') as any);
    
    if (blacklist.includes(username)) {
        return;
    }

    const signature = extractSignatureString(containerElement);
    if (!signature || signature.length < 4) return;

    const petState = generateProceduralPet(signature);
    spawnPet(petState);
}

// Persistent observer for year switching and SPA navigation
const observer = new MutationObserver((_mutations) => {
    const sigElement = document.getElementById('gh-pulse-signature');
    const graphContainer = document.querySelector('.js-calendar-graph');
    const petExists = document.getElementById('dna-pet-instance');
    
    if (sigElement && graphContainer && !petExists) {
        initEngine(sigElement);
    }
});

observer.observe(document.body, { childList: true, subtree: true });
