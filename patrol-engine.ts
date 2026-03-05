import { PetState } from './engine';
import { PERSONALITY_PHRASES, PATROL_CONFIG, monthNames } from './config';
import { parseDateParts, getCommitCount, getL2Threshold } from './dom-utils';

export function startPatrol(petElement: HTMLElement, petState: PetState): void {
    const idParts = petElement.id.replace('pet-', '').split('-');
    const targetMonthName = idParts[2];
    const targetYear = idParts[1];

    function moveToRandomDay() {
        if (!petElement.parentElement) return;
        
        const allDays = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')) as HTMLElement[];
        if (allDays.length === 0) return;

        const now = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + PATROL_CONFIG.futureLimitDays);

        // Find the boundary dates for the target month
        const targetMonthIndex = monthNames.indexOf(targetMonthName);
        const yearNum = parseInt(targetYear, 10);
        
        const monthStart = new Date(yearNum, targetMonthIndex, 1);
        const monthEnd = new Date(yearNum, targetMonthIndex + 1, 0);

        // Buffer limits
        const bufferStart = new Date(monthStart);
        bufferStart.setDate(bufferStart.getDate() - 4);
        
        const bufferEnd = new Date(monthEnd);
        bufferEnd.setDate(bufferEnd.getDate() + 4);

        let patrolPool = allDays.filter(day => {
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return false;
            
            const date = new Date(dateStr);
            
            // 1. Must be within Month +/- 4 days
            const withinBuffer = date >= bufferStart && date <= bufferEnd;
            
            // 2. Must not be beyond the global future limit (4 days from today)
            const notTooFarFuture = date <= futureLimit;

            return withinBuffer && notTooFarFuture;
        });

        if (patrolPool.length === 0) patrolPool = allDays;

        const targetDay = patrolPool[Math.floor(Math.random() * patrolPool.length)];
        const rect = targetDay.getBoundingClientRect();
        const containerRect = (petElement.parentElement as HTMLElement).getBoundingClientRect();

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
