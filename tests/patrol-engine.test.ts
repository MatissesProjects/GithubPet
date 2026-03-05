import { describe, test, expect } from '@jest/globals';
import { getPatrolPool } from '../patrol-engine';

describe('Patrol Engine', () => {
    const mockDays = [
        // Jan
        { getAttribute: (n: string) => n === 'data-date' ? '2026-01-25' : null },
        { getAttribute: (n: string) => n === 'data-date' ? '2026-01-28' : null },
        { getAttribute: (n: string) => n === 'data-date' ? '2026-01-31' : null },
        // Feb (Target)
        { getAttribute: (n: string) => n === 'data-date' ? '2026-02-01' : null },
        { getAttribute: (n: string) => n === 'data-date' ? '2026-02-15' : null },
        { getAttribute: (n: string) => n === 'data-date' ? '2026-02-28' : null },
        // Mar
        { getAttribute: (n: string) => n === 'data-date' ? '2026-03-01' : null },
        { getAttribute: (n: string) => n === 'data-date' ? '2026-03-04' : null },
        { getAttribute: (n: string) => n === 'data-date' ? '2026-03-10' : null },
    ] as any as HTMLElement[];

    test('should restrict pool to birth month +/- 4 days', () => {
        const pool = getPatrolPool(mockDays, "Feb", "2026");
        
        const dates = pool.map(d => d.getAttribute('data-date'));
        
        // Should include all Feb days
        expect(dates).toContain('2026-02-01');
        expect(dates).toContain('2026-02-15');
        expect(dates).toContain('2026-02-28');
        
        // Should include buffer days (Jan 28, 31 and Mar 1, 4)
        expect(dates).toContain('2026-01-28');
        expect(dates).toContain('2026-01-31');
        expect(dates).toContain('2026-03-01');
        expect(dates).toContain('2026-03-04');
        
        // Should NOT include far away days
        expect(dates).not.toContain('2026-01-25');
        expect(dates).not.toContain('2026-03-10');
    });

    test('should respect future limit', () => {
        // Mock current date to March 4, 2026
        // Future limit is March 8 (+4 days)
        const realDate = Date;
        global.Date = class extends realDate {
            constructor() {
                super();
                return new realDate('2026-03-04');
            }
        } as any;

        const pool = getPatrolPool(mockDays, "Mar", "2026");
        const dates = pool.map(d => d.getAttribute('data-date'));

        expect(dates).toContain('2026-03-04');
        // Mar 10 is in Mar but beyond the +4 day limit from Mar 4
        expect(dates).not.toContain('2026-03-10');

        global.Date = realDate;
    });
});
