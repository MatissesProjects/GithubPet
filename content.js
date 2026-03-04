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
    const tooltip = document.createElement('div');
    tooltip.className = 'dna-pet-tooltip';
    tooltip.innerHTML = `
        <strong>DNA Pet</strong><br>
        Type: ${petState.body}<br>
        Mutations: ${petState.mutations.join(', ') || 'None'}
    `;
    pet.appendChild(tooltip);

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

async function initEngine(containerElement) {
    const username = window.location.pathname.split('/')[1];
    const { blacklist = [] } = await chrome.storage.local.get('blacklist');
    
    if (blacklist.includes(username)) {
        console.log(`Pet disabled for user: ${username}`);
        return;
    }

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
