import { generateProceduralPet, PetState } from './engine';

// --- 3. EXTRACTION & OBSERVER ---
let isInitializing = false;

function isContextValid(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
}

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
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p.length > 0);
    if (parts.length > 0) {
        const firstPart = parts[0];
        const reserved = ['settings', 'orgs', 'organizations', 'notifications', 'search', 'explore', 'marketplace', 'trending', 'account'];
        if (!reserved.includes(firstPart)) {
            return firstPart;
        }
    }
    return null;
}

function getL2Threshold(): number {
    const threshEl = document.querySelector('.gh-thresh-3');
    if (threshEl && threshEl.textContent) {
        const match = threshEl.textContent.match(/L2:\s*(\d+)/i);
        if (match) return parseInt(match[1], 10);
    }
    return 2;
}

function getCommitCount(day: HTMLElement): number {
    const label = day.getAttribute('aria-label');
    if (label) {
        const match = label.match(/^(\d+)/);
        if (match) return parseInt(match[1], 10);
        if (label.toLowerCase().includes('no contribution')) return 0;
    }
    return parseInt(day.getAttribute('data-level') || '0', 10);
}

function spawnPet(petState: PetState): void {
    const existingPet = document.getElementById('dna-pet-instance');
    if (existingPet) {
        if (existingPet.parentElement?.contains(document.querySelector('.js-calendar-graph'))) {
            return;
        }
        existingPet.remove();
    }

    const graphContainer = document.querySelector('.js-calendar-graph') as HTMLElement;
    if (!graphContainer) return;

    const container = document.createElement('div');
    container.id = 'dna-pet-instance';
    container.className = `dna-pet`;

    const shadow = document.createElement('div');
    shadow.className = 'pet-shadow';
    container.appendChild(shadow);

    const visual = document.createElement('div');
    visual.className = `pet-visual body-${petState.body}`;
    visual.style.setProperty('--pet-color', petState.color);
    
    if (petState.aura !== 'none') visual.classList.add(`aura-${petState.aura}`);
    petState.mutations.forEach(mut => {
        const mutEl = document.createElement('div');
        mutEl.className = `pet-mutation mut-${mut}`;
        visual.appendChild(mutEl);
    });
    if (petState.accessory !== 'none') {
        const accEl = document.createElement('div');
        accEl.className = `pet-accessory acc-${petState.accessory}`;
        visual.appendChild(accEl);
    }

    const face = document.createElement('div');
    face.className = 'pet-face';
    const eyes = document.createElement('div');
    eyes.className = 'pet-eyes';
    face.appendChild(eyes);
    visual.appendChild(face);
    container.appendChild(visual);
    
    const tooltip = document.createElement('div');
    tooltip.className = 'dna-pet-tooltip';
    tooltip.innerHTML = `<strong>DNA Pet</strong><br>Type: ${petState.body}<br>${petState.accessory !== 'none' ? `Accessory: ${petState.accessory}<br>` : ''}Mutations: ${petState.mutations.join(', ') || 'None'}`;
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

    const phrases: Record<string, string[]> = {
        scared: ["It's so empty here...", "Where are the commits?", "*shiver*", "So dark...", "I'm lonely..."],
        happy: ["Found a commit!", "Shiny squares!", "Exploring!", "*happy chirps*", "Nom nom..."],
        ecstatic: ["WOW! SO MANY COMMITS!", "This is the BEST square!", "POWER OVERWHELMING!", "*party noises*", "I love this day!"]
    };

    function moveToRandomDay() {
        if (!petElement.parentElement) return;
        
        const now = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + 4);
        
        const patrolPool = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')).filter(day => {
            const dateStr = day.getAttribute('data-date');
            return !dateStr || new Date(dateStr) <= futureLimit;
        }) as HTMLElement[];

        if (patrolPool.length === 0) return;

        const targetDay = patrolPool[Math.floor(Math.random() * patrolPool.length)];
        const rect = targetDay.getBoundingClientRect();
        const containerRect = (petElement.parentElement as HTMLElement).getBoundingClientRect();

        const count = getCommitCount(targetDay);
        const l2Threshold = getL2Threshold();
        const level = parseInt(targetDay.getAttribute('data-level') || '0', 10);
        
        petElement.classList.remove('mood-scared', 'mood-happy', 'mood-ecstatic');
        let currentMood = 'happy';
        if (count === 0) {
            petElement.classList.add('mood-scared');
            currentMood = 'scared';
        } else if (level >= 3) {
            petElement.classList.add('mood-ecstatic');
            currentMood = 'ecstatic';
        } else if (count >= l2Threshold) {
            petElement.classList.add('mood-happy');
            currentMood = 'happy';
        }

        petElement.classList.add('is-moving');
        petElement.style.left = `${rect.left - containerRect.left + (rect.width / 2) - 12}px`;
        petElement.style.top = `${rect.top - containerRect.top + (rect.height / 2) - 12}px`;

        if (Math.random() > 0.7) {
            const speech = petElement.querySelector('#pet-speech') as HTMLElement;
            if (speech) {
                const moodPhrasesArray = phrases[currentMood];
                speech.textContent = moodPhrasesArray[Math.floor(Math.random() * moodPhrasesArray.length)];
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

async function trySpawn() {
    if (!isContextValid()) return;
    if (isInitializing) return;
    
    const sigElement = document.getElementById('gh-pulse-signature');
    const graphContainer = document.querySelector('.js-calendar-graph');
    if (!sigElement || !graphContainer) return;

    const signature = extractSignatureString(sigElement);
    if (signature.length < 4) return;

    const username = getActiveUsername();
    if (!username) return;

    isInitializing = true;
    try {
        const result = await chrome.storage.local.get(['blacklist']);
        if (!isContextValid()) return; // Re-check after async
        const blacklist = result.blacklist || [];
        if (blacklist.includes(username)) {
            const existing = document.getElementById('dna-pet-instance');
            if (existing) existing.remove();
            return;
        }
        spawnPet(generateProceduralPet(signature));
    } catch (e) {
        // Silent fail for expected extension context issues
        if (e instanceof Error && !e.message.includes('Extension context invalidated')) {
            console.error("DNA Pet Spawn Error", e);
        }
    } finally {
        isInitializing = false;
    }
}

if (isContextValid()) {
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.blacklist) trySpawn();
    });

    const observer = new MutationObserver(() => trySpawn());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    setInterval(trySpawn, 1000);
    trySpawn();
}
