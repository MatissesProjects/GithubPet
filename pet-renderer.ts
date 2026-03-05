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

    // Speech Bubble
    const speech = document.createElement('div');
    speech.id = 'pet-speech';
    speech.style.cssText = "position:absolute; bottom:140%; left:50%; transform:translateX(-50%); background:#0d1117; color:#c9d1d9; border:1px solid #30363d; padding:4px 8px; border-radius:10px; font-size:10px; white-space:nowrap; display:none; pointer-events:none; z-index:100000001; box-shadow: 0 4px 12px rgba(0,0,0,0.5);";
    container.appendChild(speech);

    return container;
}
