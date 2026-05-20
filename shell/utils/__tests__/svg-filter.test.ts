import { Solver } from '@shell/utils/svg-filter';

describe('solver', () => {
  describe('css', () => {
    it.each([
      {
        desc:     'all-zero filter values produce zero percentages and zero hue-rotate',
        filters:  [0, 0, 0, 0, 0, 0],
        expected: 'filter: invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(0%);',
      },
      {
        desc:     'integer filter values are rounded and formatted correctly',
        filters:  [50, 20, 3750, 50, 100, 100],
        expected: 'filter: invert(50%) sepia(20%) saturate(3750%) hue-rotate(180deg) brightness(100%) contrast(100%);',
      },
      {
        desc:     'fractional filter values are rounded to nearest integer',
        filters:  [10.6, 30.4, 100.5, 25.2, 80.9, 120.1],
        expected: 'filter: invert(11%) sepia(30%) saturate(101%) hue-rotate(91deg) brightness(81%) contrast(120%);',
      },
      {
        desc:     'hue-rotate index (3) uses 3.6 multiplier',
        filters:  [0, 0, 0, 100, 0, 0],
        expected: 'filter: invert(0%) sepia(0%) saturate(0%) hue-rotate(360deg) brightness(0%) contrast(0%);',
      },
    ])('$desc', ({ filters, expected }) => {
      const solver = new Solver({
        r: 255, g: 0, b: 0
      });

      expect(solver.css(filters)).toStrictEqual(expected);
    });
  });

  describe('loss', () => {
    it('returns 0 for filters that reproduce the target color exactly', () => {
      // Target: black (0,0,0). Starting from black and applying:
      // invert(0%), sepia(0%), saturate(0%), hueRotate(0), brightness(100%), contrast(100%)
      // should leave color as (0,0,0) — perfect match.
      const solver = new Solver({
        r: 0, g: 0, b: 0
      });
      const loss = solver.loss([0, 0, 0, 0, 100, 100]);

      expect(loss).toStrictEqual(0);
    });

    it('returns a positive value when filters produce a color that differs from the target', () => {
      const solver = new Solver({
        r: 255, g: 0, b: 0
      });
      // Filters that are all zero → color stays black → far from red target
      const loss = solver.loss([0, 0, 0, 0, 0, 0]);

      expect(loss).toBeGreaterThan(0);
    });

    it('loss is smaller when color produced by filters is closer to target', () => {
      const solver = new Solver({
        r: 0, g: 0, b: 0
      });
      // filters [0,0,0,0,0,0]: contrast(0) pushes everything to mid-gray → far from black target
      const highLoss = solver.loss([0, 0, 0, 0, 0, 0]);
      // filters [0,0,0,0,100,100]: identity transforms → stays black → matches target
      const lowerLoss = solver.loss([0, 0, 0, 0, 100, 100]);

      expect(lowerLoss).toBeLessThan(highLoss);
    });

    it('uses the same reusedColor instance without side effects between calls', () => {
      const solver = new Solver({
        r: 100, g: 150, b: 200
      });
      const loss1 = solver.loss([10, 5, 200, 30, 90, 110]);
      const loss2 = solver.loss([10, 5, 200, 30, 90, 110]);

      // Same inputs must produce the same loss regardless of call order
      expect(loss1).toStrictEqual(loss2);
    });
  });

  describe('constructor', () => {
    it('stores target color components', () => {
      const solver = new Solver({
        r: 100, g: 150, b: 200
      });

      expect(solver.target.r).toStrictEqual(100);
      expect(solver.target.g).toStrictEqual(150);
      expect(solver.target.b).toStrictEqual(200);
    });

    it('clamps target components above 255 to 255', () => {
      const solver = new Solver({
        r: 300, g: 0, b: 0
      });

      expect(solver.target.r).toStrictEqual(255);
    });

    it('clamps target components below 0 to 0', () => {
      const solver = new Solver({
        r: 0, g: -10, b: 0
      });

      expect(solver.target.g).toStrictEqual(0);
    });

    it('computes targetHSL from the provided color', () => {
      // Pure white: hsl should be h=0, s=0, l=100
      const solver = new Solver({
        r: 255, g: 255, b: 255
      });

      expect(solver.targetHSL.h).toStrictEqual(0);
      expect(solver.targetHSL.s).toStrictEqual(0);
      expect(solver.targetHSL.l).toBeCloseTo(100, 1);
    });

    it('computes targetHSL for pure red', () => {
      // Pure red: r=255, g=0, b=0 → hsl h≈0 (normalised *100 → 0), s=100, l=50
      const solver = new Solver({
        r: 255, g: 0, b: 0
      });

      expect(solver.targetHSL.h).toBeCloseTo(0, 1);
      expect(solver.targetHSL.s).toBeCloseTo(100, 1);
      expect(solver.targetHSL.l).toBeCloseTo(50, 1);
    });
  });

  describe('solve', () => {
    it('returns an object with values, loss, filter and filterVal properties', () => {
      const solver = new Solver({
        r: 255, g: 0, b: 0
      });
      const result = solver.solve();

      expect(result).toHaveProperty('values');
      expect(result).toHaveProperty('loss');
      expect(result).toHaveProperty('filter');
      expect(result).toHaveProperty('filterVal');
    });

    it('filter starts with "filter: " and ends with ";"', () => {
      const solver = new Solver({
        r: 0, g: 128, b: 255
      });
      const result = solver.solve();

      expect(result.filter.startsWith('filter: ')).toBe(true);
      expect(result.filter.endsWith(';')).toBe(true);
    });

    it('filterVal is filter without the "filter: " prefix and trailing ";"', () => {
      const solver = new Solver({
        r: 0, g: 200, b: 100
      });
      const result = solver.solve();

      expect(result.filterVal).toStrictEqual(
        result.filter.replace('filter: ', '').replace(';', '')
      );
    });

    it('loss is a non-negative number', () => {
      const solver = new Solver({
        r: 50, g: 100, b: 150
      });
      const result = solver.solve();

      expect(result.loss).toBeGreaterThanOrEqual(0);
    });

    it('values array has exactly 6 elements', () => {
      const solver = new Solver({
        r: 10, g: 20, b: 30
      });
      const result = solver.solve();

      expect(result.values).toHaveLength(6);
    });
  });
});
