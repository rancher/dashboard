import { Solver } from '@shell/utils/svg-filter';

describe('class: Solver', () => {
  describe('constructor', () => {
    it('should create a solver with target color', () => {
      const solver = new Solver({
        r: 255,
        g: 0,
        b: 0
      });

      expect(solver.target).toBeDefined();
      expect(solver.targetHSL).toBeDefined();
    });
  });

  describe('solve', () => {
    it('should return an object with values, loss, and filter', () => {
      const solver = new Solver({
        r: 255,
        g: 0,
        b: 0
      });

      const result = solver.solve();

      expect(result).toHaveProperty('values');
      expect(result).toHaveProperty('loss');
      expect(result).toHaveProperty('filter');
    });

    it('should return filter as a CSS filter string', () => {
      const solver = new Solver({
        r: 128,
        g: 128,
        b: 128
      });

      const result = solver.solve();

      expect(result.filter).toContain('filter:');
      expect(result.filter).toContain('invert(');
      expect(result.filter).toContain('sepia(');
      expect(result.filter).toContain('saturate(');
      expect(result.filter).toContain('hue-rotate(');
      expect(result.filter).toContain('brightness(');
      expect(result.filter).toContain('contrast(');
    });

    it('should return values as an array of 6 numbers', () => {
      const solver = new Solver({
        r: 100,
        g: 150,
        b: 200
      });

      const result = solver.solve();

      expect(result.values).toHaveLength(6);
      result.values.forEach((val: number) => {
        expect(typeof val).toBe('number');
      });
    });

    it('should return a loss value', () => {
      const solver = new Solver({
        r: 0,
        g: 255,
        b: 0
      });

      const result = solver.solve();

      expect(typeof result.loss).toBe('number');
      expect(result.loss).toBeGreaterThanOrEqual(0);
    });
  });

  describe('css', () => {
    it('should generate valid CSS filter string', () => {
      const solver = new Solver({
        r: 255,
        g: 255,
        b: 255
      });

      const result = solver.solve();

      expect(result.filter).toMatch(/filter: invert\(\d+%\) sepia\(\d+%\) saturate\(\d+%\) hue-rotate\(\d+deg\) brightness\(\d+%\) contrast\(\d+%\);/);
    });
  });

  describe('loss calculation', () => {
    it('should produce low loss for black target', () => {
      const solver = new Solver({
        r: 0,
        g: 0,
        b: 0
      });

      const result = solver.solve();

      expect(result.loss).toBeLessThan(50);
    });

    it('should produce reasonable loss for common colors', () => {
      const colors = [
        {
          r: 255,
          g: 0,
          b: 0
        },
        {
          r: 0,
          g: 255,
          b: 0
        },
        {
          r: 0,
          g: 0,
          b: 255
        },
      ];

      colors.forEach((color) => {
        const solver = new Solver(color);
        const result = solver.solve();

        expect(result.loss).toBeLessThan(100);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle white color', () => {
      const solver = new Solver({
        r: 255,
        g: 255,
        b: 255
      });

      const result = solver.solve();

      expect(result.filter).toBeDefined();
      expect(result.values).toHaveLength(6);
    });

    it('should handle gray color', () => {
      const solver = new Solver({
        r: 128,
        g: 128,
        b: 128
      });

      const result = solver.solve();

      expect(result.filter).toBeDefined();
      expect(result.values).toHaveLength(6);
    });

    it('should handle color with all different RGB values', () => {
      const solver = new Solver({
        r: 50,
        g: 100,
        b: 150
      });

      const result = solver.solve();

      expect(result.filter).toBeDefined();
      expect(result.values).toHaveLength(6);
    });
  });
});
