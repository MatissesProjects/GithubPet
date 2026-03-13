export function extractSignatureChars(containerElement: HTMLElement): string[] {
    const charSpans = containerElement.querySelectorAll('.gh-sig-char');
    return Array.from(charSpans).map(span => span.textContent?.trim() || '');
}

export function forceOverflowVisible(element: HTMLElement): void {
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
        parent.style.setProperty('overflow', 'visible', 'important');
        parent.style.setProperty('contain', 'none', 'important');
        parent = parent.parentElement;
    }
}

export function getActiveUsername(): string | null {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
        const first = pathParts[0];
        const reserved = ['settings', 'orgs', 'organizations', 'notifications', 'search', 'explore', 'marketplace', 'trending', 'account', 'pulls', 'issues', 'codespaces'];
        if (!reserved.includes(first)) return first;
    }
    return null;
}

export function getCurrentViewedYear(): string {
    const yearHeading = document.querySelector('.js-year-link.selected');
    if (yearHeading && yearHeading.textContent) {
        const match = yearHeading.textContent.match(/\d{4}/);
        if (match) return match[0];
    }
    return new Date().getFullYear().toString();
}

export function parseDateParts(dateStr: string) {
    const parts = dateStr.split('-').map(Number);
    return { year: parts[0], month: parts[1] - 1, day: parts[2] };
}

export function getCommitCount(day: HTMLElement): number {
    const dataCount = day.getAttribute('data-count');
    if (dataCount) return parseInt(dataCount, 10);

    const dateStr = day.getAttribute('data-date'); // e.g. "2026-03-06"
    
    // Aggregate all possible text sources
    let textSources = [
        day.getAttribute('aria-label') || '',
        day.textContent || ''
    ];
    
    // Check for tooltips (modern GitHub uses specialized tooltip elements)
    const tooltipId = day.getAttribute('aria-describedby');
    if (tooltipId) {
        const tooltipEl = document.getElementById(tooltipId);
        if (tooltipEl) textSources.push(tooltipEl.textContent || '');
    }

    // Check for tooltips that are children
    const childTooltip = (day instanceof HTMLElement) ? day.querySelector('tool-tip') : null;
    if (childTooltip) textSources.push(childTooltip.textContent || '');

    const combinedText = textSources.join(' ').replace(/,/g, '');
    
    if (combinedText.toLowerCase().includes('no contribution')) return 0;

    const contributionMatch = combinedText.length > 10 && combinedText.match(/(\d+)\s+contribution/i);
    if (contributionMatch) return parseInt(contributionMatch[1], 10);

    const allNumbers = combinedText.match(/\d+/g);
    if (allNumbers) {
        let filtered = allNumbers.map(Number);
        
        if (dateStr) {
            const [y, m, d] = dateStr.split('-').map(Number);
            // Remove the year, the day, and the month index (if it exists as a number)
            const toRemove = [y, d, m]; 
            for (const val of toRemove) {
                const idx = filtered.indexOf(val);
                if (idx !== -1) filtered.splice(idx, 1);
            }
        }

        // Return the largest number left - this is almost certainly the commit count
        if (filtered.length > 0) {
            return Math.max(...filtered);
        }
    }
    
    // Last fallback: use data-level as an estimate (L1=1, L2=4, L3=10, L4=25)
    const level = parseInt(day.getAttribute('data-level') || '0', 10);
    const estimates = [0, 1, 4, 10, 25];
    return estimates[level] || 0;
}

export function getL2Threshold(): number {
    const threshEl = document.querySelector('.gh-thresh-3');
    if (threshEl && threshEl.textContent) {
        const match = threshEl.textContent.match(/L2:\s*(\d+)/i);
        if (match) return parseInt(match[1], 10);
    }
    return 2;
}
