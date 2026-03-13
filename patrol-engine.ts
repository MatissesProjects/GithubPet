import type { PetState } from './engine.js';
import { PERSONALITY_PHRASES, PATROL_CONFIG, monthNames } from './config.js';
import { parseDateParts, getCommitCount, getL2Threshold } from './dom-utils.js';

/** Caches pools by month/year to avoid repeated filtering on every move */
const poolCache = new Map<string, HTMLElement[]>();
let lastViewedYear: string | null = null;

export function getPatrolPool(allDays: HTMLElement[], targetMonthName: string, targetYear: string): HTMLElement[] {
    const cacheKey = `${targetMonthName}-${targetYear}`;
    if (poolCache.has(cacheKey)) return poolCache.get(cacheKey)!;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const targetMonthIndex = monthNames.indexOf(targetMonthName);
    const yearNum = parseInt(targetYear, 10);
    
    const monthStart = new Date(yearNum, targetMonthIndex, 1);
    const monthEnd = new Date(yearNum, targetMonthIndex + 1, 0);

    const bufferStart = new Date(monthStart);
    bufferStart.setDate(bufferStart.getDate() - 4);
    
    const bufferEnd = new Date(monthEnd);
    bufferEnd.setDate(bufferEnd.getDate() + 4);

    const pool = allDays.filter(day => {
        const dateStr = day.getAttribute('data-date');
        if (!dateStr) return false;
        
        // Quick string comparison for date filtering
        const isNotFuture = dateStr <= todayStr;
        if (!isNotFuture) return false;

        const [y, m, d] = dateStr.split('-').map(v => parseInt(v, 10));
        const date = new Date(y, m - 1, d);
        return date >= bufferStart && date <= bufferEnd;
    });
    
    poolCache.set(cacheKey, pool);
    return pool;
}

export function startPatrol(petElement: HTMLElement, petState: PetState): void {
    // Extract ID parts once to handle hyphenated usernames robustly
    const idParts = petElement.id.replace('pet-', '').split('-');
    const targetMonthName = idParts.find(p => monthNames.includes(p)) || "";
    const targetYear = idParts.find(p => /^\d{4}$/.test(p)) || "";

    function moveToRandomDay() {
        if (!petElement.parentElement) return;
        
        const graphContainer = document.querySelector('.js-calendar-graph');
        if (!graphContainer) return;

        // Reset cache if year changes or on heavy DOM changes (managed by content.ts triggers)
        const currentYear = graphContainer.getAttribute('data-year');
        if (currentYear !== lastViewedYear) {
            poolCache.clear();
            lastViewedYear = currentYear;
        }

        const allDays = Array.from(graphContainer.querySelectorAll('.ContributionCalendar-day')) as HTMLElement[];
        if (allDays.length === 0) return;

        let patrolPool = getPatrolPool(allDays, targetMonthName, targetYear);
        if (patrolPool.length === 0) patrolPool = allDays;

        const targetDay = patrolPool[Math.floor(Math.random() * patrolPool.length)];
        
        // Use offset-based positioning to reduce getBoundingClientRect calls
        const targetX = targetDay.offsetLeft + (targetDay.offsetWidth / 2) - 12;
        const targetY = targetDay.offsetTop + (targetDay.offsetHeight / 2) - 12;

        // 1. EXTRACT SQUARE COLOR
        const style = window.getComputedStyle(targetDay);
        const squareColor = style.getPropertyValue('--color-calendar-graph-day-bg') || 
                           style.fill || style.backgroundColor;

        // 2. DYNAMIC GLOW
        const currentStyle = petElement.getAttribute('style') || '';
        const hueRotateMatch = currentStyle.match(/hue-rotate\([^)]+\)/);
        const filterStr = hueRotateMatch ? `${hueRotateMatch[0]} ` : '';
        petElement.style.filter = `${filterStr}drop-shadow(0 0 12px ${squareColor})`.trim();

        const visual = petElement.querySelector('.pet-visual') as HTMLElement;
        if (visual) {
            petElement.classList.remove('is-eating');
            void petElement.offsetWidth;
            petElement.classList.add('is-eating');
            setTimeout(() => { if (petElement) petElement.classList.remove('is-eating'); }, 1000);
        }

        // 3. WINKING
        const eyes = petElement.querySelector('.pet-eyes') as HTMLElement;
        if (eyes && Math.random() > 0.85) {
            eyes.classList.add('is-winking');
            setTimeout(() => { if (eyes) eyes.classList.remove('is-winking'); }, 600);
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
        
        // Calculate look direction relative to current position
        const currentX = parseFloat(petElement.style.left) || targetX;
        const currentY = parseFloat(petElement.style.top) || targetY;
        const dx = targetX - currentX;
        const dy = targetY - currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            const lookX = (dx / dist) * 2;
            const lookY = (dy / dist) * 2;
            petElement.style.setProperty('--look-x', `${lookX}px`);
            petElement.style.setProperty('--look-y', `${lookY}px`);
        }

        petElement.style.left = `${targetX}px`;
        petElement.style.top = `${targetY}px`;

        if (Math.random() > PATROL_CONFIG.speechProbability) {
            const speech = petElement.querySelector('#pet-speech') as HTMLElement;
            if (speech && petState.personality && PERSONALITY_PHRASES[petState.personality]) {
                let phrase = "";
                
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
        setTimeout(() => { if (petElement) petElement.classList.remove('is-moving'); }, PATROL_CONFIG.moveDuration);
    }

    moveToRandomDay();
    const interval = setInterval(() => {
        if (!document.body.contains(petElement)) { clearInterval(interval); return; }
        moveToRandomDay();
    }, PATROL_CONFIG.baseInterval + Math.random() * PATROL_CONFIG.randomVariance);
}
