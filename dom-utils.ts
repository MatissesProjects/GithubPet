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

    const label = day.getAttribute('aria-label');
    if (label) {
        // Look for the number immediately followed by "contribution" or similar
        // This handles "5 contributions", "1 contribution", and localized versions if they follow the pattern
        const match = label.match(/(\d+)\s+contribut/i);
        if (match) return parseInt(match[1], 10);
        
        // Handle "No contributions"
        if (label.toLowerCase().includes('no contribution')) return 0;

        // Fallback: If the label is just "5 on March 6" or similar
        // We look for a number that isn't the year (4 digits) or a small day number at the end
        // But actually, GitHub labels are usually consistent. 
        // Let's try to find the first number that isn't a year.
        const numbers = label.match(/\d+/g);
        if (numbers) {
            for (const n of numbers) {
                if (n.length < 4) return parseInt(n, 10);
            }
        }
    }
    
    // Last fallback: use data-level as an estimate (L1=1-2, L2=3-5, L3=6-10, L4=11+)
    const level = parseInt(day.getAttribute('data-level') || '0', 10);
    const estimates = [0, 1, 4, 8, 15]; // Slightly higher estimates to favor growth
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
