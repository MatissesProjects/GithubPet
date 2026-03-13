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
    
    const leftEye = document.createElement('div');
    leftEye.className = `pet-eye eye-left eye-type-${petState.eyeType}`;
    const leftPupil = document.createElement('div');
    leftPupil.className = 'pet-pupil';
    leftEye.appendChild(leftPupil);

    const rightEye = document.createElement('div');
    rightEye.className = `pet-eye eye-right eye-type-${petState.eyeType}`;
    const rightPupil = document.createElement('div');
    rightPupil.className = 'pet-pupil';
    rightEye.appendChild(rightPupil);
    
    eyes.appendChild(leftEye);
    eyes.appendChild(rightEye);
    face.appendChild(eyes);
    container.appendChild(face);
    
    // Tooltip
    const idParts = petId.split('-');
    const yearStr = idParts.find(p => /^\d{4}$/.test(p)) || "???";
    const monthName = idParts.find(p => monthNames.includes(p)) || "???";
    const label = `${monthName} ${yearStr}`;

    const now = new Date();
    const currentMonthName = monthNames[now.getMonth()];
    const currentYearStr = now.getFullYear().toString();
    const isCurrentMonth = (monthName === currentMonthName && yearStr === currentYearStr);

    // Normalization Logic for "Worst Month" / Efficiency
    const monthIndex = monthNames.indexOf(monthName);
    const daysInMonth = new Date(parseInt(yearStr), monthIndex + 1, 0).getDate();
    const efficiency = petState.totalCommits / Math.max(1, petState.observedDays);
    const roundedEff = efficiency.toFixed(1);
    const projectedTotal = Math.round(efficiency * daysInMonth);

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
            Complexity: ${petState.complexity}/5 <span style="font-size: 9px; color: #8b949e;">(${complexityHint})</span><br>
            Efficiency: ${roundedEff} <span style="font-size: 9px; color: #8b949e;">(commits/day)</span><br>
            <strong>Projected: ${projectedTotal}</strong> <span style="font-size: 9px; color: #8b949e;">(this month)</span>
        `;
    } else {
        // Achievements for past pets
        const achievement = petState.evolutionTier >= 3 ? `🏆 ${petState.growthLabel}` : 
                           petState.complexity >= 4 ? "🌟 Master Artisan" : 
                           `📅 ${petState.growthLabel}`;
        
        statContent = `
            <div style="color: #f1e05a; font-size: 10px; margin-bottom: 2px;">${achievement}</div>
            Final Tier: ${petState.evolutionTier}/3<br>
            Final Complexity: ${petState.complexity}/5<br>
            Efficiency: ${roundedEff} <span style="font-size: 9px; color: #8b949e;">(commits/day)</span>
        `;
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'dna-pet-tooltip';
    
    // Header
    const header = document.createElement('div');
    header.style.borderBottom = '1px solid #30363d';
    header.style.marginBottom = '5px';
    header.style.paddingBottom = '5px';
    
    const titleEl = document.createElement('strong');
    titleEl.style.color = '#58a6ff';
    titleEl.textContent = petState.title;
    header.appendChild(titleEl);
    header.appendChild(document.createElement('br'));
    
    const birthEl = document.createElement('small');
    birthEl.style.color = '#8b949e';
    birthEl.textContent = `Born: ${label}`;
    header.appendChild(birthEl);
    tooltip.appendChild(header);

    // Stats Body
    const body = document.createElement('div');
    body.style.textAlign = 'left';
    body.style.marginBottom = '8px';
    
    const statsHeader = document.createElement('strong');
    statsHeader.textContent = isCurrentMonth ? "Active Stats:" : "Achievements:";
    body.appendChild(statsHeader);
    body.appendChild(document.createElement('br'));

    if (petState.efficiencyRank) {
        const rankEl = document.createElement('div');
        rankEl.style.color = '#58a6ff';
        rankEl.style.fontWeight = 'bold';
        rankEl.style.marginBottom = '2px';
        rankEl.textContent = petState.efficiencyRank;
        body.appendChild(rankEl);
    }

    const statContainer = document.createElement('div');
    statContainer.innerHTML = statContent; // statContent is constructed internally from safe numbers/labels
    body.appendChild(statContainer);

    const personalityEl = document.createElement('div');
    personalityEl.textContent = `Personality: ${petState.personality}`;
    body.appendChild(personalityEl);
    tooltip.appendChild(body);

    // Traits Footer
    const footer = document.createElement('div');
    footer.style.textAlign = 'left';
    footer.style.borderTop = '1px solid #30363d';
    footer.style.paddingTop = '5px';
    
    const traitsHeader = document.createElement('strong');
    traitsHeader.textContent = "Traits:";
    footer.appendChild(traitsHeader);
    footer.appendChild(document.createElement('br'));
    
    const traitsList = document.createElement('div');
    traitsList.textContent = `Type: ${petState.body}\nPattern: ${petState.pattern}`;
    traitsList.style.whiteSpace = 'pre-line';
    footer.appendChild(traitsList);

    if (petState.accessory !== 'none') {
        const accTrait = document.createElement('div');
        accTrait.textContent = `Accessory: ${petState.accessory}`;
        footer.appendChild(accTrait);
    }

    const mutTrait = document.createElement('div');
    mutTrait.textContent = `Mutations: ${petState.mutations.join(', ') || 'None'}`;
    footer.appendChild(mutTrait);
    
    tooltip.appendChild(footer);
    container.appendChild(tooltip);

    // Speech Bubble
    const speech = document.createElement('div');
    speech.id = 'pet-speech';
    speech.style.cssText = "position:absolute; bottom:140%; left:50%; transform:translateX(-50%); background:#0d1117; color:#c9d1d9; border:1px solid #30363d; padding:4px 8px; border-radius:10px; font-size:10px; white-space:nowrap; display:none; pointer-events:none; z-index:100000001; box-shadow: 0 4px 12px rgba(0,0,0,0.5);";
    container.appendChild(speech);

    return container;
}
