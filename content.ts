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

function getActiveUsername(): string | null {
    const parts = window.location.pathname.split('/').filter(p => p.length > 0);
    if (parts.length > 0) {
        const firstPart = parts[0];
        const reserved = ['settings', 'orgs', 'organizations', 'notifications', 'search', 'explore', 'marketplace', 'trending'];
        if (!reserved.includes(firstPart)) {
            return firstPart;
        }
    }
    return null;
}

function spawnPet(petState: PetState): void {
    const existingPet = document.getElementById('dna-pet-instance');
    if (existingPet) existingPet.remove();

    const graphContainer = document.querySelector('.js-calendar-graph') as HTMLElement;
    if (!graphContainer) return;

    const container = document.createElement('div');
    container.id = 'dna-pet-instance';
    container.className = `dna-pet`;

    // Shadow
    const shadow = document.createElement('div');
    shadow.className = 'pet-shadow';
    container.appendChild(shadow);

    // Visual Body
    const visual = document.createElement('div');
    visual.className = `pet-visual body-${petState.body}`;
    visual.style.setProperty('--pet-color', petState.color);
    visual.style.color = petState.color; // For inherit cases
    
    if (petState.aura !== 'none') {
        visual.classList.add(`aura-${petState.aura}`);
    }
    petState.mutations.forEach(mut => {
        visual.classList.add(`mut-${mut}`);
    });
    if (petState.accessory !== 'none') {
        visual.classList.add(`acc-${petState.accessory}`);
    }

    // Eyes
    const eyes = document.createElement('div');
    eyes.className = 'pet-eyes';
    visual.appendChild(eyes);
    container.appendChild(visual);
    
    const tooltip = document.createElement('div');
    tooltip.className = 'dna-pet-tooltip';
    tooltip.innerHTML = `
        <strong>DNA Pet</strong><br>
        Type: ${petState.body}<br>
        ${petState.accessory !== 'none' ? `Accessory: ${petState.accessory}<br>` : ''}
        Mutations: ${petState.mutations.join(', ') || 'None'}
    `;
    container.appendChild(tooltip);

    const speech = document.createElement('div');
    speech.id = 'pet-speech';
    speech.style.cssText = "position:absolute; bottom:140%; left:50%; transform:translateX(-50%); background:#0d1117; color:#c9d1d9; border:1px solid #30363d; padding:4px 8px; border-radius:10px; font-size:10px; white-space:nowrap; display:none; pointer-events:none; z-index:100000001; box-shadow: 0 4px 12px rgba(0,0,0,0.5);";
    container.appendChild(speech);

    graphContainer.style.position = 'relative'; 
    graphContainer.appendChild(container);
    forceOverflowVisible(container);
    startPatrol(container);
}

function startPatrol(petElement: HTMLElement): void {
    const allDays = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')) as HTMLElement[];
    if (allDays.length === 0) return;

    const now = new Date();
    const futureLimit = new Date();
    futureLimit.setMonth(now.getMonth() + 2);

    const patrolPool = allDays.filter(day => {
        const dateStr = day.getAttribute('data-date');
        if (!dateStr) return true;
        return new Date(dateStr) <= futureLimit;
    });

    const moodPhrases: Record<string, string[]> = {
        scared: ["It's so empty here...", "Where are the commits?", "*shiver*", "So dark...", "I'm lonely..."],
        happy: ["Found a commit!", "Shiny squares!", "Exploring!", "*happy chirps*", "Nom nom..."],
        ecstatic: ["WOW! SO MANY COMMITS!", "This is the BEST square!", "POWER OVERWHELMING!", "*party noises*", "I love this day!"]
    };

    function moveToRandomDay() {
        if (!petElement.parentElement) return;
        const targetDay = patrolPool[Math.floor(Math.random() * patrolPool.length)];
        const rect = targetDay.getBoundingClientRect();
        const containerRect = (petElement.parentElement as HTMLElement).getBoundingClientRect();

        const level = parseInt(targetDay.getAttribute('data-level') || '0', 10);
        
        // Update Mood
        petElement.classList.remove('mood-scared', 'mood-happy', 'mood-ecstatic');
        let currentMood = 'happy';
        if (level === 0) {
            petElement.classList.add('mood-scared');
            currentMood = 'scared';
        } else if (level >= 3) {
            petElement.classList.add('mood-ecstatic');
            currentMood = 'ecstatic';
        } else {
            petElement.classList.add('mood-happy');
            currentMood = 'happy';
        }

        petElement.classList.add('is-moving');
        petElement.style.left = `${rect.left - containerRect.left + (rect.width / 2) - 12}px`;
        petElement.style.top = `${rect.top - containerRect.top + (rect.height / 2) - 12}px`;

        if (Math.random() > 0.7) {
            const speech = petElement.querySelector('#pet-speech') as HTMLElement;
            if (speech) {
                const phrases = moodPhrases[currentMood];
                speech.textContent = phrases[Math.floor(Math.random() * phrases.length)];
                speech.style.display = 'block';
                setTimeout(() => { if (speech) speech.style.display = 'none'; }, 2500);
            }
        }
        setTimeout(() => petElement.classList.remove('is-moving'), 1000);
    }

    moveToRandomDay();
    const interval = setInterval(() => {
        if (!document.body.contains(petElement)) { clearInterval(interval); return; }
        moveToRandomDay();
    }, 5000);
}

async function initEngine(sigElement: HTMLElement): Promise<void> {
    const username = getActiveUsername();
    if (!username) return;

    const { blacklist = [] } = await (chrome.storage.local.get('blacklist') as any);
    if (blacklist.includes(username)) {
        const existing = document.getElementById('dna-pet-instance');
        if (existing) existing.remove();
        return;
    }

    const signature = extractSignatureString(sigElement);
    if (!signature || signature.length < 4) return;

    spawnPet(generateProceduralPet(signature));
}

// Watch for storage changes to toggle pet immediately
chrome.storage.onChanged.addListener((changes) => {
    if (changes.blacklist) {
        const sigElement = document.getElementById('gh-pulse-signature');
        if (sigElement) initEngine(sigElement);
    }
});

const observer = new MutationObserver(() => {
    const sigElement = document.getElementById('gh-pulse-signature');
    const graphContainer = document.querySelector('.js-calendar-graph');
    const petExists = document.getElementById('dna-pet-instance');
    if (sigElement && graphContainer && !petExists) {
        initEngine(sigElement);
    }
});

observer.observe(document.body, { childList: true, subtree: true });
