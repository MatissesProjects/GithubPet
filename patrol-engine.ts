import { PetState } from './engine';
import { PERSONALITY_PHRASES, PATROL_CONFIG, monthNames } from './config';
import { parseDateParts, getCommitCount, getL2Threshold } from './dom-utils';

export function startPatrol(petElement: HTMLElement, petState: PetState): void {
    const idParts = petElement.id.replace('pet-', '').split('-');
    const targetMonthName = idParts[2];

    function moveToRandomDay() {
        if (!petElement.parentElement) return;
        
        const allDays = Array.from(document.querySelectorAll('.js-calendar-graph rect.ContributionCalendar-day, .js-calendar-graph td.ContributionCalendar-day')) as HTMLElement[];
        if (allDays.length === 0) return;

        // Restriction: stay within birth month +/- 4 days
        let patrolPool = allDays.filter(day => {
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return false;
            
            const date = new Date(dateStr);
            const { month } = parseDateParts(dateStr);
            
            // Check if it's the target month
            if (monthNames[month] === targetMonthName) return true;

            // Check if it's within 4 days of the target month
            // We find the first and last day of the target month in the DOM to check proximity
            // But a simpler way: if it's NOT the target month, check distance to any day THAT IS the target month
            // Efficiency: just check if the date is within 4 days of the start or end of the target month.
            
            // For simplicity and performance, we'll stick to: 
            // If it's the month before or after, check date distance.
            const targetMonthIndex = monthNames.indexOf(targetMonthName);
            const dist = Math.abs(month - targetMonthIndex);
            
            // Handle Dec/Jan wrap around if needed, but usually graph is one year
            if (dist === 1 || dist === 11) {
                // Check if it's within 4 days
                // We'll use a rough estimate or check if the date is near the boundary
                const dayOfMonth = date.getDate();
                if (month < targetMonthIndex || (dist === 11 && month === 11)) {
                    // Month before: must be at the end of the month
                    const lastDay = new Date(date.getFullYear(), month + 1, 0).getDate();
                    return dayOfMonth > (lastDay - 4);
                } else {
                    // Month after: must be at the start of the month
                    return dayOfMonth <= 4;
                }
            }

            return false;
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
