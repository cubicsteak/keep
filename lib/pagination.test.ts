import { describe, expect, it } from 'vitest';
import { getPaginationRange, normalizePage, normalizeQuery } from './pagination';

describe('normalizePage', () => {
  it.each([undefined, null, '', '0', '-1', '1.5', 'NaN', 'Infinity'])('normalizes %s to page one', (value) => {
    expect(normalizePage(value)).toBe(1);
  });

  it('keeps positive safe integers', () => {
    expect(normalizePage('42')).toBe(42);
  });
});

describe('normalizeQuery', () => {
  it('handles missing values and limits query length', () => {
    expect(normalizeQuery()).toBe('');
    expect(normalizeQuery('abcdef', 3)).toBe('abc');
  });
});

describe('getPaginationRange', () => {
  it.each([
    { current: 1, total: 0, expected: [] },
    { current: 1, total: 3, expected: [1, 2, 3] },
    { current: 1, total: 10, expected: [1, 2, 3, 4, 5] },
    { current: 5, total: 10, expected: [3, 4, 5, 6, 7] },
    { current: 10, total: 10, expected: [6, 7, 8, 9, 10] },
    { current: 99, total: 10, expected: [6, 7, 8, 9, 10] },
  ])('builds the range around page $current of $total', ({ current, total, expected }) => {
    expect(getPaginationRange(current, total)).toEqual(expected);
  });
});
