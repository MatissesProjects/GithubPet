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
    
    // Get ALL days in the graph for full month analysis
    const allDays = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')) as HTMLElement[];
    if (allDays.length === 0) return;

    let hexStart = 0;
    if (sigChars.length > 1 && sigChars[0] === '0' && (sigChars[1] === 'x' || sigChars[1] === 'X')) {
        hexStart = 2;
    }
    const cleanSigs = sigChars.slice(hexStart);

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
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        let lastPastDayIdx = yearDays.length - 1;
        while (lastPastDayIdx >= 0) {
            const date = yearDays[lastPastDayIdx].getAttribute('data-date');
            if (date && date <= todayStr) break;
            lastPastDayIdx--;
        }

        if (lastPastDayIdx >= 0) {
            for (let i = 0; i < daySigs.length; i++) {
                const dayIndex = lastPastDayIdx - i;
                if (dayIndex < 0) break;

                const dayEl = yearDays[dayIndex];
                const dateStr = dayEl.getAttribute('data-date');
                if (dateStr) {
                    const { month, year } = parseDateParts(dateStr);
                    const key = `${monthNames[month]}-${year}`;
                    if (!sigByMonth[key]) sigByMonth[key] = "";
                    sigByMonth[key] += daySigs[i];
                }
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

        if (year === currentYearStr && monthIndex > currentMonthIndex) continue;
        
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

    const graphContainer = document.querySelector('.js-calendar-graph');
    if (!graphContainer) return; 

    isInitializing = true;
    try {
        const username = getActiveUsername();
        const viewedYear = getCurrentViewedYear();
        if (!username) return;

        chrome.storage.local.set({ viewedYear });

        // Helper to check if we actually found any commits
        const checkTotalCommits = async () => {
            const sigElement = document.getElementById('gh-pulse-signature');
            const sigChars = sigElement ? extractSignatureChars(sigElement) : [];
            await syncMonthlyPets(username, sigChars);
            
            const { petCollection = {} } = await chrome.storage.local.get(['petCollection']);
            let total = 0;
            for (const id in petCollection) {
                if (petCollection[id].username === username) total += (petCollection[id].totalCommits || 0);
            }
            return total;
        };

        // Initial delay for GitHub async rendering
        await new Promise(r => setTimeout(r, 800));
        let foundCommits = await checkTotalCommits();

        // If we found 0 commits, retry once after another delay (GitHub can be slow)
        if (foundCommits === 0) {
            await new Promise(r => setTimeout(r, 1500));
            await checkTotalCommits();
        }

        const result = await chrome.storage.local.get(['petCollection']);
        let collection = result.petCollection || {};
        let collectionRepaired = false;
// ... (rest of repaired loop)

        const now = new Date();
        const currentMonthIndex = now.getMonth();
        const currentYearStr = now.getFullYear().toString();
        const currentMonthName = monthNames[currentMonthIndex];

        for (const id in collection) {
            const parts = id.split('-');
            if (parts.length < 3) {
                delete collection[id];
                collectionRepaired = true;
                continue;
            }
            
            // Extract from the end to handle usernames with hyphens
            const monthName = parts[parts.length - 1];
            const year = parts[parts.length - 2];
            const monthIndex = monthNames.indexOf(monthName);

            const isMalformed = monthIndex === -1;
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
        if (isContextValid() && changes.petCollection) trySpawnCollection();
    });
    
    const observer = new MutationObserver(() => {
        if (isContextValid()) trySpawnCollection();
    });
    
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    
    const collectionInterval = setInterval(() => {
        if (!isContextValid()) {
            clearInterval(collectionInterval);
            return;
        }
        trySpawnCollection();
    }, 3000);
    
    trySpawnCollection();
}
