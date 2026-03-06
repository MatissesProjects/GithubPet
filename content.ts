import { generateProceduralPet, PetState, CollectionPet } from './engine';
import { monthNames } from './config';
import { 
    extractSignatureChars, 
    forceOverflowVisible, 
    getActiveUsername, 
    getCurrentViewedYear, 
    parseDateParts,
    getCommitCount
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

    // Get ALL days in the graph for full month analysis
    const allDays = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')) as HTMLElement[];
    if (allDays.length === 0) return;

    // 1. Calculate REAL monthly stats from the entire calendar graph
    const monthlyStats: Record<string, { totalCommits: number, dayCount: number, year: string, month: string }> = {};
    for (const dayEl of allDays) {
        const dateStr = dayEl.getAttribute('data-date');
        if (!dateStr) continue;

        const { month, year } = parseDateParts(dateStr);
        const monthName = monthNames[month];
        const yearStr = year.toString();
        const key = `${monthName}-${yearStr}`;

        if (!monthlyStats[key]) monthlyStats[key] = { totalCommits: 0, dayCount: 0, year: yearStr, month: monthName };
        
        const commits = getCommitCount(dayEl);
        monthlyStats[key].totalCommits += commits;
        if (commits > 0) monthlyStats[key].dayCount += 1;
    }

    // 2. Identify the pulse signature parts (if available)
    const daySigs = cleanSigs.length >= 4 ? cleanSigs.slice(0, -4) : [];
    const genesisBlock = cleanSigs.length >= 4 ? cleanSigs.slice(-4) : ['0', '0', '0', '0'];

    const viewedYear = getCurrentViewedYear();
    const yearDays = allDays.filter(day => day.getAttribute('data-date')?.startsWith(viewedYear));
    
    // Map signature characters to months based on newest-to-oldest sequence
    const sigByMonth: Record<string, string> = {};
    if (daySigs.length > 0) {
        for (let i = 0; i < daySigs.length; i++) {
            const dayIndex = yearDays.length - 1 - i;
            if (dayIndex < 0) break;

            const dateStr = yearDays[dayIndex].getAttribute('data-date');
            if (dateStr) {
                const { month, year } = parseDateParts(dateStr);
                const key = `${monthNames[month]}-${year}`;
                if (!sigByMonth[key]) sigByMonth[key] = "";
                sigByMonth[key] += daySigs[i];
            }
        }
    }

    // 3. Update the pet collection for every month in the graph
    const { petCollection = {} } = await chrome.storage.local.get(['petCollection']);
    let collectionChanged = false;

    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentYearStr = now.getFullYear().toString();

    for (const key in monthlyStats) {
        const { totalCommits, dayCount, year, month } = monthlyStats[key];
        const monthIndex = monthNames.indexOf(month);

        // Don't create pets for future months in current year
        if (year === currentYearStr && monthIndex > currentMonthIndex) continue;
        
        // Use signature if we have it, otherwise fallback to zeros
        // We always append the genesisBlock so the seed is consistent
        const rawSig = sigByMonth[key] || "0".repeat(30);
        const finalSig = rawSig + genesisBlock.join('');
        const petId = `${username}-${year}-${month}`;

        const existing = petCollection[petId];
        const needsUpdate = !existing || existing.signature !== finalSig || existing.totalCommits !== totalCommits || existing.dnaLength !== dayCount;

        if (needsUpdate) {
            petCollection[petId] = {
                signature: finalSig,
                username,
                year,
                month,
                enabled: true,
                addedAt: existing?.addedAt || Date.now(),
                totalCommits,
                dnaLength: dayCount
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

        // Calculate Efficiencies for all pets in the collection to determine ranking
        const now = new Date();
        const currentMonthName = monthNames[now.getMonth()];
        const currentYearStr = now.getFullYear().toString();

        const efficiencies: { id: string, eff: number }[] = [];
        for (const petId in collection) {
            const petData: CollectionPet = collection[petId];
            if (petData.username === username) {
                const monthIndex = monthNames.indexOf(petData.month);
                const daysInMonth = new Date(parseInt(petData.year), monthIndex + 1, 0).getDate();
                const daysPassed = (petData.month === currentMonthName && petData.year === currentYearStr) ? now.getDate() : daysInMonth;
                const eff = (petData.totalCommits || 0) / Math.max(1, daysPassed);
                efficiencies.push({ id: petId, eff });
            }
        }
        efficiencies.sort((a, b) => b.eff - a.eff);

        for (const petId in collection) {
            const petData: CollectionPet = collection[petId];
            if (petData.username === username && petData.enabled && petData.year === viewedYear) {
                const rankIdx = efficiencies.findIndex(e => e.id === petId);
                let efficiencyRank = "";
                if (rankIdx === 0 && efficiencies.length > 1) efficiencyRank = "🏆 Year Record Holder";
                else if (rankIdx === efficiencies.length - 1 && efficiencies.length > 1) efficiencyRank = "😴 Slowest Month";
                else if (rankIdx !== -1) efficiencyRank = `#${rankIdx + 1} most active`;

                const petState = generateProceduralPet(petData.signature, petId, petData.totalCommits, petData.dnaLength);
                petState.efficiencyRank = efficiencyRank;
                spawnPet(petState, petId);
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
