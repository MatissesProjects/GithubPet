import { PetState } from './engine.js';

export function createPetElement(petState: PetState, petId: string): HTMLElement {
    const container = document.createElement('div');
    container.id = `pet-${petId}`;
    container.className = `dna-pet tier-${petState.evolutionTier}`;
    container.style.setProperty('--pet-color', petState.color);
    if (petState.colorShift) {
        container.style.filter = `hue-rotate(${petState.colorShift}deg)`;
    }

    const shadow = document.createElement('div');
    shadow.className = 'pet-shadow';
    container.appendChild(shadow);

    // Visual Body
    const visual = document.createElement('div');
    visual.className = `pet-visual body-${petState.body} pat-${petState.pattern}`;
    if (petState.aura !== 'none') visual.classList.add(`aura-${petState.aura}`);
    
    // Body specific elements
    if (petState.body === 'mecha-spider') {
        for (let i = 1; i <= 4; i++) {
            const leg = document.createElement('div');
            leg.className = `pet-leg leg-${i}`;
            visual.appendChild(leg);
        }
    }
    container.appendChild(visual);

    // Modifications Slot
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

    // Face
    const face = document.createElement('div');
    face.className = 'pet-face';
    const eyes = document.createElement('div');
    eyes.className = 'pet-eyes';
    face.appendChild(eyes);
    container.appendChild(face);
    
    // Tooltip
    const idParts = petId.split('-');
    const month = idParts[2] || "???";
    const year = idParts[1] || "???";
    const label = `${month} ${year}`;

    // Evolution Hint Logic
    const nextTierDna = (petState.evolutionTier + 1) * 10;
    const dnaProgress = Math.min(100, (petState.dnaLength / nextTierDna) * 100);
    const tierHint = petState.evolutionTier < 3 
        ? `Next Tier at ${nextTierDna} days (Current: ${petState.dnaLength})`
        : "Max Evolution Tier Reached!";

    const nextComplexityCommits = (petState.complexity + 1) * 15;
    const complexityHint = petState.complexity < 5
        ? `More complexity at ${nextComplexityCommits} total commits (Current: ${petState.totalCommits})`
        : "Max Complexity Reached!";
    
    const tooltip = document.createElement('div');
    tooltip.className = 'dna-pet-tooltip';
    tooltip.innerHTML = `
        <div style="border-bottom: 1px solid #30363d; margin-bottom: 5px; padding-bottom: 5px;">
            <strong style="color: #58a6ff;">${petState.title}</strong><br>
            <small style="color: #8b949e;">Born: ${label}</small>
        </div>
        <div style="text-align: left; margin-bottom: 8px;">
            <strong>Stats:</strong><br>
            Tier: ${petState.evolutionTier}/3 <span style="font-size: 9px; color: #8b949e;">(${tierHint})</span><br>
            Complexity: ${petState.complexity}/5 <span style="font-size: 9px; color: #8b949e;">(${complexityHint})</span><br>
            Personality: ${petState.personality}
        </div>
        <div style="text-align: left; border-top: 1px solid #30363d; padding-top: 5px;">
            <strong>Traits:</strong><br>
            Type: ${petState.body}<br>
            Pattern: ${petState.pattern}<br>
            ${petState.accessory !== 'none' ? `Accessory: ${petState.accessory}<br>` : ''}
            Mutations: ${petState.mutations.join(', ') || 'None'}
        </div>
    `;
    container.appendChild(tooltip);

    // Speech Bubble
    const speech = document.createElement('div');
    speech.id = 'pet-speech';
    speech.style.cssText = "position:absolute; bottom:140%; left:50%; transform:translateX(-50%); background:#0d1117; color:#c9d1d9; border:1px solid #30363d; padding:4px 8px; border-radius:10px; font-size:10px; white-space:nowrap; display:none; pointer-events:none; z-index:100000001; box-shadow: 0 4px 12px rgba(0,0,0,0.5);";
    container.appendChild(speech);

    return container;
}
