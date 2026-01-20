import { SteveRevision } from '../revision';

describe('class: SteveRevision', () => {
  describe('constructor', () => {
    it('should correctly parse a numeric string', () => {
      const rev = new SteveRevision('123');

      expect(rev.asNumber).toBe(123);
      expect(rev.isNumber).toBe(true);
    });

    it('should correctly parse a number', () => {
      const rev = new SteveRevision(456);

      expect(rev.asNumber).toBe(456);
      expect(rev.isNumber).toBe(true);
    });

    it('should handle non-numeric strings', () => {
      const rev = new SteveRevision('abc');

      expect(rev.asNumber).toBeNaN();
      expect(rev.isNumber).toBe(false);
    });

    it('should handle undefined', () => {
      const rev = new SteveRevision(undefined);

      expect(rev.asNumber).toBeNaN();
      expect(rev.isNumber).toBe(false);
    });
  });

  describe('method: isNewerThan', () => {
    it('should return true if current revision is greater than provided revision', () => {
      const r1 = new SteveRevision('10');
      const r2 = new SteveRevision('5');

      expect(r1.isNewerThan(r2)).toBe(true);
    });

    it('should return false if current revision is less than provided revision', () => {
      const r1 = new SteveRevision('5');
      const r2 = new SteveRevision('10');

      expect(r1.isNewerThan(r2)).toBe(false);
    });

    it('should return false if revisions are equal', () => {
      const r1 = new SteveRevision('10');
      const r2 = new SteveRevision('10');

      expect(r1.isNewerThan(r2)).toBe(false);
    });

    it('should return false if current revision is not a number', () => {
      const r1 = new SteveRevision('abc');
      const r2 = new SteveRevision('10');

      expect(r1.isNewerThan(r2)).toBe(false);
    });

    it('should return false if provided revision is not a number', () => {
      const r1 = new SteveRevision('10');
      const r2 = new SteveRevision('abc');

      expect(r1.isNewerThan(r2)).toBe(false);
    });

    it('should return false if current revision is undefined', () => {
      const r1 = new SteveRevision(undefined);
      const r2 = new SteveRevision('10');

      expect(r1.isNewerThan(r2)).toBe(false);
    });

    it('should return false if provided revision is undefined', () => {
      const r1 = new SteveRevision('10');
      const r2 = new SteveRevision(undefined);

      expect(r1.isNewerThan(r2)).toBe(false);
    });
  });
});
