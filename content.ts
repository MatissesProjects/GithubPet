import { generateProceduralPet, PetState, CollectionPet } from './engine';

// --- 3. EXTRACTION & OBSERVER ---
let isInitializing = false;

const PERSONALITY_PHRASES: Record<string, Record<string, string[]>> = {
    stoic: {
        scared: ["Silence.", "Data void.", "..."],
        happy: ["Objective met.", "Analyzing square.", "Proceeding."],
        ecstatic: ["Optimal performance.", "Data peak detected.", "Efficient."]
    },
    energetic: {
        scared: ["WHERE ARE WE?!", "BOOOORING!", "Let's find some green!"],
        happy: ["GO GO GO!", "ZOOM!", "Commit party!", "Wheeeee!"],
        ecstatic: ["ULTRA SPEED!", "BOOM! MAXIMUM POWER!", "PARTY TIME!"]
    },
    grumpy: {
        scared: ["Ugh, typical.", "What a waste of time.", "Don't look at me."],
        happy: ["Fine, a commit.", "Could be greener.", "Whatever."],
        ecstatic: ["Finally, some effort.", "I guess this is okay.", "Stop staring."]
    },
    philosophical: {
        scared: ["Is a graph without color even a graph?", "Void... like my thoughts.", "The absence of being."],
        happy: ["The green represents growth.", "Commits are the heartbeat of time.", "Existence is a recursive loop."],
        ecstatic: ["Total enlightenment.", "The signature is finally whole.", "I see the code in all things."]
    },
    anxious: {
        scared: ["Oh no oh no oh no.", "I don't like this square.", "Hiding now."],
        happy: ["Is this safe?", "Okay, keep it together.", "Did I miss a semi-colon?"],
        ecstatic: ["TOO MUCH PRESSURE!", "Wait, are we ready for this?!", "AHHH! SUCCESS?!"]
    },
    proud: {
        scared: ["Beneath my dignity.", "I deserve better than this.", "Hmph."],
        happy: ["Behold my contributions.", "Magnificent.", "Simply the best."],
        ecstatic: ["KING OF THE GRAPH!", "None can rival my DNA!", "GLORIOUS!"]
    }
};

function extractSignatureChars(containerElement: HTMLElement): string[] {
    const charSpans = containerElement.querySelectorAll('.gh-sig-char');
    return Array.from(charSpans).map(span => span.textContent?.trim() || '');
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
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
        const first = pathParts[0];
        const reserved = ['settings', 'orgs', 'organizations', 'notifications', 'search', 'explore', 'marketplace', 'trending', 'account', 'pulls', 'issues', 'codespaces'];
        if (!reserved.includes(first)) return first;
    }
    return null;
}

function getCurrentViewedYear(): string {
    const yearHeading = document.querySelector('.js-year-link.selected');
    if (yearHeading && yearHeading.textContent) {
        const match = yearHeading.textContent.match(/\d{4}/);
        if (match) return match[0];
    }
    return new Date().getFullYear().toString();
}

function parseDateParts(dateStr: string) {
    const parts = dateStr.split('-').map(Number);
    return { year: parts[0], month: parts[1] - 1, day: parts[2] };
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

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function spawnPet(petState: PetState, petId: string): void {
    const graphContainer = document.querySelector('.js-calendar-graph') as HTMLElement;
    if (!graphContainer) return;

    if (document.getElementById(`pet-${petId}`)) return;

    const container = document.createElement('div');
    container.id = `pet-${petId}`;
    container.className = `dna-pet`;
    container.style.setProperty('--pet-color', petState.color);

    const shadow = document.createElement('div');
    shadow.className = 'pet-shadow';
    container.appendChild(shadow);

    const visual = document.createElement('div');
    visual.className = `pet-visual body-${petState.body} pat-${petState.pattern}`;
    if (petState.aura !== 'none') visual.classList.add(`aura-${petState.aura}`);
    
    if (petState.body === 'mecha-spider') {
        for (let i = 1; i <= 4; i++) {
            const leg = document.createElement('div');
            leg.className = `pet-leg leg-${i}`;
            visual.appendChild(leg);
        }
    }
    container.appendChild(visual);

    petState.mutations.forEach(mut => {
        const mutEl = document.createElement('div');
        mutEl.className = `pet-mutation mut-${mut}`;
        container.appendChild(mutEl);
    });

    if (petState.accessory !== 'none') {
        const accEl = document.createElement('div');
        accEl.className = `pet-accessory acc-${petState.accessory}`;
        container.appendChild(accEl);
    }

    const face = document.createElement('div');
    face.className = 'pet-face';
    const eyes = document.createElement('div');
    eyes.className = 'pet-eyes';
    face.appendChild(eyes);
    container.appendChild(face);
    
    const tooltip = document.createElement('div');
    tooltip.className = 'dna-pet-tooltip';
    tooltip.innerHTML = `
        <strong>${petState.title}</strong><br>
        Personality: ${petState.personality}<br>
        Complexity: ${petState.complexity}/5<br>
        Type: ${petState.body}<br>
        Pattern: ${petState.pattern}<br>
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
    startPatrol(container, petState);
}

function startPatrol(petElement: HTMLElement, petState: PetState): void {
    const idParts = petElement.id.replace('pet-', '').split('-');
    const targetMonthName = idParts[2];

    function moveToRandomDay() {
        if (!petElement.parentElement) return;
        
        const allDays = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')) as HTMLElement[];
        if (allDays.length === 0) return;

        const futureLimit = new Date();
        futureLimit.setDate(new Date().getDate() + 4);
        
        let patrolPool = allDays.filter(day => {
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return false;
            const { month } = parseDateParts(dateStr);
            return monthNames[month] === targetMonthName && new Date(dateStr) <= futureLimit;
        });

        if (patrolPool.length === 0) patrolPool = allDays;

        const targetDay = patrolPool[Math.floor(Math.random() * patrolPool.length)];
        const rect = targetDay.getBoundingClientRect();
        const containerRect = (petElement.parentElement as HTMLElement).getBoundingClientRect();

        const count = getCommitCount(targetDay);
        const level = parseInt(targetDay.getAttribute('data-level') || '0', 10);
        
        petElement.classList.remove('mood-scared', 'mood-happy', 'mood-ecstatic');
        let currentMood = 'happy';
        if (count === 0) {
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

        if (Math.random() > 0.8) {
            const speech = petElement.querySelector('#pet-speech') as HTMLElement;
            if (speech) {
                const phrases = PERSONALITY_PHRASES[petState.personality][currentMood];
                speech.textContent = phrases[Math.floor(Math.random() * phrases.length)];
                speech.style.display = 'block';
                setTimeout(() => { if (speech) speech.style.display = 'none'; }, 2000);
            }
        }
        setTimeout(() => petElement.classList.remove('is-moving'), 1000);
    }

    moveToRandomDay();
    const interval = setInterval(() => {
        if (!document.body.contains(petElement)) { clearInterval(interval); return; }
        moveToRandomDay();
    }, 5000 + Math.random() * 2000);
}

async function syncMonthlyPets(username: string, sigChars: string[]) {
    if (!isContextValid()) return;
    const allDays = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')) as HTMLElement[];
    if (allDays.length === 0 || sigChars.length === 0) return;

    const now = new Date();
    const viewedYear = getCurrentViewedYear();
    const pastAndToday = allDays.filter(day => {
        const dateStr = day.getAttribute('data-date');
        if (!dateStr) return false;
        const { year } = parseDateParts(dateStr);
        return year.toString() === viewedYear && new Date(dateStr) <= now;
    });

    const { petCollection = {} } = await chrome.storage.local.get(['petCollection']);
    let collectionChanged = false;

    // Aggressive Repair
    for (const id in petCollection) {
        if (id.includes('undefined') || id.includes('Unknown') || id.split('-').length < 3) {
            delete petCollection[id];
            collectionChanged = true;
        }
    }

    const monthlySigs: Record<string, { sig: string, year: string }> = {};
    const offset = pastAndToday.length - sigChars.length;
    
    for (let i = 0; i < sigChars.length; i++) {
        const dayIndex = i + offset;
        if (dayIndex < 0 || dayIndex >= pastAndToday.length) continue;
        const dateStr = pastAndToday[dayIndex].getAttribute('data-date');
        if (dateStr) {
            const { month, year } = parseDateParts(dateStr);
            const monthName = monthNames[month];
            if (!monthName) continue;
            const yearStr = year.toString();
            const key = `${monthName}-${yearStr}`;
            if (!monthlySigs[key]) monthlySigs[key] = { sig: "", year: yearStr };
            monthlySigs[key].sig += sigChars[i];
        }
    }

    for (const key in monthlySigs) {
        const { sig, year } = monthlySigs[key];
        const monthName = key.split('-')[0];
        if (sig.length < 4) continue; 
        const petId = `${username}-${year}-${monthName}`;
        if (!petCollection[petId] || petCollection[petId].signature !== sig) {
            petCollection[petId] = { signature: sig, username, year, month: monthName, enabled: true, addedAt: Date.now() };
            collectionChanged = true;
        }
    }
    if (collectionChanged) await chrome.storage.local.set({ petCollection });
}

async function trySpawnCollection() {
    if (!isContextValid()) return;
    if (isInitializing) return;
    const username = getActiveUsername();
    const viewedYear = getCurrentViewedYear();
    if (!username) return;
    chrome.storage.local.set({ viewedYear });

    const sigElement = document.getElementById('gh-pulse-signature');
    if (sigElement) {
        const sigChars = extractSignatureChars(sigElement);
        if (sigChars.length >= 4) await syncMonthlyPets(username, sigChars);
    }

    isInitializing = true;
    try {
        const result = await chrome.storage.local.get(['petCollection']);
        let collection = result.petCollection || {};
        const existingPets = document.querySelectorAll('.dna-pet');
        existingPets.forEach(el => {
            const id = el.id.replace('pet-', '');
            if (!collection[id] || !collection[id].enabled || collection[id].year !== viewedYear || collection[id].username !== username) {
                el.remove();
            }
        });
        for (const petId in collection) {
            const petData: CollectionPet = collection[petId];
            if (petData.username === username && petData.enabled && petData.year === viewedYear) {
                spawnPet(generateProceduralPet(petData.signature, petId), petId);
            }
        }
    } finally { isInitializing = false; }
}

if (isContextValid()) {
    chrome.storage.onChanged.addListener((changes) => { if (changes.petCollection) trySpawnCollection(); });
    const observer = new MutationObserver(() => trySpawnCollection());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    setInterval(trySpawnCollection, 3000);
    trySpawnCollection();
}
