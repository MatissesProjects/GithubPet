import { jest, describe, test, expect } from '@jest/globals';
import { parseDateParts, getCommitCount, getL2Threshold } from '../dom-utils';

describe('DOM Utilities', () => {
    describe('parseDateParts', () => {
        test('should correctly parse YYYY-MM-DD', () => {
            const result = parseDateParts("2026-03-04");
            expect(result).toEqual({
                year: 2026,
                month: 2, // March is 2
                day: 4
            });
        });

        test('should handle leading zeros', () => {
            const result = parseDateParts("2025-01-01");
            expect(result).toEqual({
                year: 2025,
                month: 0,
                day: 1
            });
        });
    });

    describe('getCommitCount', () => {
        test('should parse contributions from aria-label', () => {
            const mock = {
                getAttribute: (name: string) => {
                    if (name === 'aria-label') return "5 contributions on Wednesday, March 4, 2026";
                    return null;
                }
            } as any;
            expect(getCommitCount(mock)).toBe(5);
        });

        test('should return 0 for "no contribution"', () => {
            const mock = {
                getAttribute: (name: string) => {
                    if (name === 'aria-label') return "No contributions on Sunday, March 1, 2026";
                    return null;
                }
            } as any;
            expect(getCommitCount(mock)).toBe(0);
        });

        test('should fallback to data-level', () => {
            const mock = {
                getAttribute: (name: string) => {
                    if (name === 'aria-label') return null;
                    if (name === 'data-level') return "3";
                    return null;
                }
            } as any;
            expect(getCommitCount(mock)).toBe(3);
        });
    });

    describe('getL2Threshold', () => {
        test('should parse L2 value from text', () => {
            // Mock document.querySelector
            const originalQuerySelector = document.querySelector;
            document.querySelector = jest.fn() as any;
            (document.querySelector as jest.Mock).mockReturnValue({
                textContent: "L2: 5-10"
            });

            expect(getL2Threshold()).toBe(5);
            
            document.querySelector = originalQuerySelector;
        });

        test('should return fallback if element not found', () => {
            const originalQuerySelector = document.querySelector;
            document.querySelector = jest.fn() as any;
            (document.querySelector as jest.Mock).mockReturnValue(null);

            expect(getL2Threshold()).toBe(2);
            
            document.querySelector = originalQuerySelector;
        });
    });
});
