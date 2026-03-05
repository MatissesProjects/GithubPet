import { generateProceduralPet, PetState, CollectionPet } from './engine';
import { monthNames } from './config';
import { 
    extractSignatureChars, 
    forceOverflowVisible, 
    getActiveUsername, 
    getCurrentViewedYear, 
    parseDateParts 
} from './dom-utils';
import { createPetElement } from './pet-renderer';
import { startPatrol } from './patrol-engine';

// --- 3. EXTRACTION & OBSERVER ---
let isInitializing = false;

function isContextValid(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
}

function spawnPet(petState: PetState, petId: string): void {
    if (document.getElementById(`pet-${petId}`)) return;

    const petElement = createPetElement(petState, petId);
    const graphContainer = document.querySelector('.js-calendar-graph') as HTMLElement;
    
    if (graphContainer) {
        graphContainer.style.position = 'relative'; 
        graphContainer.appendChild(petElement);
        forceOverflowVisible(petElement);
        startPatrol(petElement, petState);
    }
}

async function syncMonthlyPets(username: string, sigChars: string[]) {
    if (!isContextValid()) return;
    
    let hexStart = 0;
    if (sigChars[0] === '0' && (sigChars[1] === 'x' || sigChars[1] === 'X')) {
        hexStart = 2;
    }
    const cleanSigs = sigChars.slice(hexStart);

    const allDays = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')) as HTMLElement[];
    if (allDays.length === 0 || cleanSigs.length === 0) return;

    const now = new Date();
    const viewedYear = getCurrentViewedYear();
    const currentMonthIndex = now.getMonth();
    const currentYearStr = now.getFullYear().toString();
    
    const yearDays = allDays.filter(day => {
        const dateStr = day.getAttribute('data-date');
        if (!dateStr) return false;
        return dateStr.startsWith(viewedYear);
    });

    const { petCollection = {} } = await chrome.storage.local.get(['petCollection']);
    let collectionChanged = false;

    // Repair collection
    for (const id in petCollection) {
        if (id.includes('undefined') || id.includes('Unknown') || id.split('-').length < 3) {
            delete petCollection[id];
            collectionChanged = true;
        }
    }

    const monthlySigs: Record<string, { sig: string, year: string }> = {};
    const offset = yearDays.length - cleanSigs.length;
    
    for (let i = 0; i < cleanSigs.length; i++) {
        const dayIndex = i + offset;
        if (dayIndex < 0 || dayIndex >= yearDays.length) continue;

        const dateStr = yearDays[dayIndex].getAttribute('data-date');
        if (dateStr) {
            const { month, year } = parseDateParts(dateStr);
            const monthName = monthNames[month];
            if (!monthName) continue;

            const yearStr = year.toString();
            const key = `${monthName}-${yearStr}`;
            
            if (!monthlySigs[key]) monthlySigs[key] = { sig: "", year: yearStr };
            monthlySigs[key].sig += cleanSigs[i];
        }
    }

    for (const key in monthlySigs) {
        const { sig, year } = monthlySigs[key];
        const monthName = key.split('-')[0];
        const monthIndex = monthNames.indexOf(monthName);
        
        if (year === currentYearStr && monthIndex > currentMonthIndex) continue;

        if (sig.length < 2) continue; 

        const petId = `${username}-${year}-${monthName}`;
        if (!petCollection[petId] || petCollection[petId].signature !== sig) {
            petCollection[petId] = {
                signature: sig,
                username,
                year,
                month: monthName,
                enabled: true,
                addedAt: Date.now()
            };
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
        let collectionRepaired = false;

        const currentMonthIndex = new Date().getMonth();
        const currentYearStr = new Date().getFullYear().toString();

        for (const id in collection) {
            const parts = id.split('-');
            const year = parts[1];
            const monthName = parts[2];
            const monthIndex = monthNames.indexOf(monthName);

            const isMalformed = id.includes('undefined') || id.includes('Unknown') || parts.length < 3 || monthIndex === -1;
            const isFuture = (year === currentYearStr && monthIndex > currentMonthIndex);

            if (isMalformed || isFuture) {
                delete collection[id];
                collectionRepaired = true;
            }
        }
        if (collectionRepaired) {
            await chrome.storage.local.set({ petCollection: collection });
        }
        
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
    } finally {
        isInitializing = false;
    }
}

if (isContextValid()) {
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.petCollection) trySpawnCollection();
    });
    const observer = new MutationObserver(() => trySpawnCollection());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    setInterval(trySpawnCollection, 3000);
    trySpawnCollection();
}
