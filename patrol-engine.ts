import { PetState } from './engine.js';
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
        
        const date = new Date(dateStr);
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

        // React to square color: Extract fill or computed background
        const squareColor = targetDay.getAttribute('fill') || window.getComputedStyle(targetDay).backgroundColor;
        const visual = petElement.querySelector('.pet-visual') as HTMLElement;
        if (visual) {
            // Apply glow based on square color
            visual.style.boxShadow = `0 0 15px ${squareColor}`;
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
                const phrases = PERSONALITY_PHRASES[petState.personality][currentMood];
                if (phrases) {
                    speech.textContent = phrases[Math.floor(Math.random() * phrases.length)];
                    speech.style.display = 'block';
                    setTimeout(() => { if (speech) speech.style.display = 'none'; }, 2000);
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
