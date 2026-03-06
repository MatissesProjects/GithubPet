import { PetState } from './engine.js';
import { monthNames } from './config.js';

export function createPetElement(petState: PetState, petId: string): HTMLElement {
    const container = document.createElement('div');
    container.id = `pet-${petId}`;
    container.className = `dna-pet tier-${petState.evolutionTier}`;
    container.style.setProperty('--pet-color', petState.color);
    
    // Growth Scaling (Removed as requested)
    const scale = 1.0;
    let filterStr = "";
    if (petState.colorShift) {
        filterStr += `hue-rotate(${petState.colorShift}deg) `;
    }
    
    if (filterStr) container.style.filter = filterStr;

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
    const monthName = idParts[2] || "???";
    const yearStr = idParts[1] || "???";
    const label = `${monthName} ${yearStr}`;

    const now = new Date();
    const currentMonthName = monthNames[now.getMonth()];
    const currentYearStr = now.getFullYear().toString();
    const isCurrentMonth = (monthName === currentMonthName && yearStr === currentYearStr);

    let statContent = "";
    if (isCurrentMonth) {
        const nextConsistency = petState.evolutionTier === 0 ? 7 : (petState.evolutionTier === 1 ? 14 : 21);
        const nextCommits = petState.evolutionTier === 0 ? 20 : (petState.evolutionTier === 1 ? 50 : 100);
        
        const tierHint = petState.evolutionTier < 3 
            ? `Next Stage at ${nextConsistency} days (Current: ${petState.dnaLength}) OR ${nextCommits} commits (Current: ${petState.totalCommits})`
            : "Maximum Growth Reached!";

        const nextComplexityCommits = (petState.complexity + 1) * 15;
        const complexityHint = petState.complexity < 5
            ? `More complexity at ${nextComplexityCommits} total commits`
            : "Max Complexity Reached!";

        statContent = `
            <div style="color: #f1e05a; font-size: 10px; margin-bottom: 2px;">🌱 ${petState.growthLabel}</div>
            Tier: ${petState.evolutionTier}/3 <span style="font-size: 9px; color: #8b949e;">(${tierHint})</span><br>
            Complexity: ${petState.complexity}/5 <span style="font-size: 9px; color: #8b949e;">(${complexityHint})</span>
        `;
    } else {
        // Achievements for past pets
        const achievement = petState.evolutionTier >= 3 ? `🏆 ${petState.growthLabel}` : 
                           petState.complexity >= 4 ? "🌟 Master Artisan" : 
                           `📅 ${petState.growthLabel}`;
        
        statContent = `
            <div style="color: #f1e05a; font-size: 10px; margin-bottom: 2px;">${achievement}</div>
            Final Tier: ${petState.evolutionTier}/3<br>
            Final Complexity: ${petState.complexity}/5
        `;
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'dna-pet-tooltip';
    tooltip.innerHTML = `
        <div style="border-bottom: 1px solid #30363d; margin-bottom: 5px; padding-bottom: 5px;">
            <strong style="color: #58a6ff;">${petState.title}</strong><br>
            <small style="color: #8b949e;">Born: ${label}</small>
        </div>
        <div style="text-align: left; margin-bottom: 8px;">
            <strong>${isCurrentMonth ? "Active Stats:" : "Achievements:"}</strong><br>
            ${statContent}
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
