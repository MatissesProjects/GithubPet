import type { PetState } from './engine.js';
import { PERSONALITY_PHRASES, PATROL_CONFIG, monthNames } from './config.js';
import { parseDateParts, getCommitCount, getL2Threshold } from './dom-utils.js';

export function getPatrolPool(allDays: HTMLElement[], targetMonthName: string, targetYear: string): HTMLElement[] {
    const now = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(now.getDate() + PATROL_CONFIG.futureLimitDays);

    const targetMonthIndex = monthNames.indexOf(targetMonthName);
    const yearNum = parseInt(targetYear, 10);
    
    const monthStart = new Date(yearNum, targetMonthIndex, 1);
    const monthEnd = new Date(yearNum, targetMonthIndex + 1, 0);

    const bufferStart = new Date(monthStart);
    bufferStart.setDate(bufferStart.getDate() - 4);
    
    const bufferEnd = new Date(monthEnd);
    bufferEnd.setDate(bufferEnd.getDate() + 4);

    return allDays.filter(day => {
        const dateStr = day.getAttribute('data-date');
        if (!dateStr) return false;
        
        const [y, m, d] = dateStr.split('-').map(v => parseInt(v, 10));
        const date = new Date(y, m - 1, d);
        const withinBuffer = date >= bufferStart && date <= bufferEnd;
        const notTooFarFuture = date <= futureLimit;

        return withinBuffer && notTooFarFuture;
    });
}

export function startPatrol(petElement: HTMLElement, petState: PetState): void {
    const idParts = petElement.id.replace('pet-', '').split('-');
    const targetMonthName = idParts[2];
    const targetYear = idParts[1];

    function moveToRandomDay() {
        if (!petElement.parentElement) return;
        
        const allDays = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')) as HTMLElement[];
        if (allDays.length === 0) return;

        let patrolPool = getPatrolPool(allDays, targetMonthName, targetYear);
        if (patrolPool.length === 0) patrolPool = allDays;

        const targetDay = patrolPool[Math.floor(Math.random() * patrolPool.length)];
        const rect = targetDay.getBoundingClientRect();
        const containerRect = (petElement.parentElement as HTMLElement).getBoundingClientRect();

        // 1. EXTRACT SQUARE COLOR
        const style = window.getComputedStyle(targetDay);
        const inlineStyle = targetDay.getAttribute('style') || '';
        
        const extractColor = (prop: string) => {
            const match = inlineStyle.match(new RegExp(`${prop}:\\s*(rgb\\([^;!]+?\\))`, 'i'));
            return match ? match[1].trim() : null;
        };

        const inlineFill = extractColor('fill');
        const inlineBg = extractColor('background-color');
        
        const squareColor = inlineFill || inlineBg || 
            (style.fill !== 'none' && style.fill !== 'rgba(0, 0, 0, 0)' ? style.fill : style.backgroundColor);

        // 2. DYNAMIC GLOW (Set on container to avoid clipping and include all parts)
        // Check if there's an existing hue-rotate from createPetElement
        const currentStyle = petElement.getAttribute('style') || '';
        const hueRotateMatch = currentStyle.match(/hue-rotate\([^)]+\)/);
        const hueRotate = hueRotateMatch ? hueRotateMatch[0] : '';
        
        petElement.style.filter = `${hueRotate} drop-shadow(0 0 12px ${squareColor})`.trim();

        const visual = petElement.querySelector('.pet-visual') as HTMLElement;
        if (visual) {
            // Pulse animation trigger
            petElement.classList.remove('is-eating');
            void petElement.offsetWidth; // Trigger reflow
            petElement.classList.add('is-eating');
            setTimeout(() => petElement.classList.remove('is-eating'), 1000);
        }

        // 3. WINKING
        const eyes = petElement.querySelector('.pet-eyes') as HTMLElement;
        if (eyes && Math.random() > 0.85) {
            eyes.classList.add('is-winking');
            setTimeout(() => eyes.classList.remove('is-winking'), 600);
        }

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

        if (Math.random() > PATROL_CONFIG.speechProbability) {
            const speech = petElement.querySelector('#pet-speech') as HTMLElement;
            if (speech && petState.personality && PERSONALITY_PHRASES[petState.personality]) {
                let phrase = "";
                
                // Occasionally show evolution hints instead of personality phrases
                if (Math.random() > 0.7 && (currentMood === 'happy' || currentMood === 'ecstatic')) {
                    const nextConsistency = petState.evolutionTier === 0 ? 7 : (petState.evolutionTier === 1 ? 14 : 21);
                    const nextCommits = petState.evolutionTier === 0 ? 20 : (petState.evolutionTier === 1 ? 50 : 100);
                    
                    if (petState.evolutionTier < 3 && Math.random() > 0.5) {
                        const daysLeft = Math.max(0, nextConsistency - petState.dnaLength);
                        const commitsLeft = Math.max(0, nextCommits - petState.totalCommits);
                        
                        if (daysLeft > 0 && (Math.random() > 0.5 || commitsLeft <= 0)) {
                            phrase = `Only ${daysLeft} more days until I grow!`;
                        } else if (commitsLeft > 0) {
                            phrase = `I need about ${commitsLeft} more commits to evolve!`;
                        }
                    } else if (petState.complexity < 5) {
                        const nextComplexityCommits = (petState.complexity + 1) * 15;
                        const complexityLeft = Math.max(0, nextComplexityCommits - petState.totalCommits);
                        if (complexityLeft > 0) {
                            phrase = `Feed me ${complexityLeft} more commits for more complexity!`;
                        }
                    }
                }

                if (!phrase) {
                    const phrases = PERSONALITY_PHRASES[petState.personality][currentMood];
                    if (phrases) {
                        phrase = phrases[Math.floor(Math.random() * phrases.length)];
                    }
                }

                if (phrase) {
                    speech.textContent = phrase;
                    speech.style.display = 'block';
                    setTimeout(() => { if (speech) speech.style.display = 'none'; }, 2500);
                }
            }
        }
        setTimeout(() => petElement.classList.remove('is-moving'), PATROL_CONFIG.moveDuration);
    }

    moveToRandomDay();
    const interval = setInterval(() => {
        if (!document.body.contains(petElement)) { clearInterval(interval); return; }
        moveToRandomDay();
    }, PATROL_CONFIG.baseInterval + Math.random() * PATROL_CONFIG.randomVariance);
}
