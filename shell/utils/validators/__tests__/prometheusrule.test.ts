import { ruleGroups, groupsAreValid } from '@shell/utils/validators/prometheusrule';

const mockGetters = {
  'i18n/t':      (key: string, args?: object) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
  'i18n/exists': () => false,
};

describe('validators/prometheusrule', () => {
  describe('ruleGroups', () => {
    it('adds error when groups is missing', () => {
      const errors: string[] = [];

      ruleGroups({}, mockGetters, errors, []);
      expect(errors).toStrictEqual(['validation.prometheusRule.groups.required']);
    });

    it('adds error when groups is empty array', () => {
      const errors: string[] = [];

      ruleGroups({ groups: [] }, mockGetters, errors, []);
      expect(errors).toStrictEqual(['validation.prometheusRule.groups.required']);
    });

    it('adds error when groups is null', () => {
      const errors: string[] = [];

      ruleGroups({ groups: null }, mockGetters, errors, []);
      expect(errors).toStrictEqual(['validation.prometheusRule.groups.required']);
    });

    it('does not add error when groups has entries', () => {
      const errors: string[] = [];

      ruleGroups({ groups: [{ name: 'g1', rules: [] }] }, mockGetters, errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('returns errors array', () => {
      const errors: string[] = [];
      const result = ruleGroups({}, mockGetters, errors, []);

      expect(result).toBe(errors);
    });
  });

  describe('groupsAreValid', () => {
    it('returns errors array', () => {
      const errors: string[] = [];
      const result = groupsAreValid([], mockGetters, errors, []);

      expect(result).toBe(errors);
    });

    it('does not add errors for empty groups array', () => {
      const errors: string[] = [];

      groupsAreValid([], mockGetters, errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('adds error when group name is missing', () => {
      const errors: string[] = [];

      groupsAreValid([{ name: '', rules: [{ expr: 'up == 0' }] }], mockGetters, errors, []);
      expect(errors.some((e) => e.includes('validation.prometheusRule.groups.valid.name'))).toBe(true);
    });

    it('adds error when group has no rules', () => {
      const errors: string[] = [];

      groupsAreValid([{ name: 'test-group', rules: [] }], mockGetters, errors, []);
      expect(errors.some((e) => e.includes('validation.prometheusRule.groups.valid.singleEntry'))).toBe(true);
    });

    it('adds error when group rules is missing', () => {
      const errors: string[] = [];

      groupsAreValid([{ name: 'test-group' }], mockGetters, errors, []);
      expect(errors.some((e) => e.includes('validation.prometheusRule.groups.valid.singleEntry'))).toBe(true);
    });

    it('uses 1-based index in group name error', () => {
      const errors: string[] = [];

      groupsAreValid([{ name: '', rules: [{ expr: 'up' }] }], mockGetters, errors, []);
      expect(errors.some((e) => e.includes('"index":1'))).toBe(true);
    });

    it('uses 1-based index for second group in group name error', () => {
      const errors: string[] = [];

      groupsAreValid([
        { name: 'valid', rules: [{ expr: 'up' }] },
        { name: '', rules: [{ expr: 'down' }] },
      ], mockGetters, errors, []);

      expect(errors.some((e) => e.includes('"index":2'))).toBe(true);
    });

    describe('rule validation', () => {
      it('adds error when alert rule has empty alert name', () => {
        const errors: string[] = [];

        groupsAreValid([{
          name:  'group1',
          rules: [{
            alert: '', expr: 'up == 0', labels: { severity: 'warning' }
          }]
        }], mockGetters, errors, []);

        expect(errors.some((e) => e.includes('validation.prometheusRule.groups.valid.rule.alertName'))).toBe(true);
      });

      it('does not error on alert rule with valid alert name', () => {
        const errors: string[] = [];

        groupsAreValid([{
          name:  'group1',
          rules: [{
            alert: 'MyAlert', expr: 'up == 0', labels: { severity: 'warning' }
          }]
        }], mockGetters, errors, []);

        expect(errors).toStrictEqual([]);
      });

      it('adds error when record rule has empty record name', () => {
        const errors: string[] = [];

        groupsAreValid([{
          name:  'group1',
          rules: [{ record: '', expr: 'sum(up)' }]
        }], mockGetters, errors, []);

        expect(errors.some((e) => e.includes('validation.prometheusRule.groups.valid.rule.recordName'))).toBe(true);
      });

      it('adds error when rule has no expr field', () => {
        const errors: string[] = [];

        groupsAreValid([{
          name:  'group1',
          rules: [{ alert: 'MyAlert', labels: { severity: 'warning' } }]
        }], mockGetters, errors, []);

        expect(errors.some((e) => e.includes('validation.prometheusRule.groups.valid.rule.expr'))).toBe(true);
      });

      it('adds error when rule has empty expr', () => {
        const errors: string[] = [];

        groupsAreValid([{
          name:  'group1',
          rules: [{
            alert: 'MyAlert', expr: '', labels: { severity: 'warning' }
          }]
        }], mockGetters, errors, []);

        expect(errors.some((e) => e.includes('validation.prometheusRule.groups.valid.rule.expr'))).toBe(true);
      });

      it('adds error when alert rule has no labels', () => {
        const errors: string[] = [];

        groupsAreValid([{
          name:  'group1',
          rules: [{ alert: 'MyAlert', expr: 'up == 0' }]
        }], mockGetters, errors, []);

        expect(errors.some((e) => e.includes('validation.prometheusRule.groups.valid.rule.labels'))).toBe(true);
      });

      it('adds error when alert rule has empty labels', () => {
        const errors: string[] = [];

        groupsAreValid([{
          name:  'group1',
          rules: [{
            alert: 'MyAlert', expr: 'up == 0', labels: {}
          }]
        }], mockGetters, errors, []);

        expect(errors.some((e) => e.includes('validation.prometheusRule.groups.valid.rule.labels'))).toBe(true);
      });

      it('does not add labels error for record rules', () => {
        const errors: string[] = [];

        groupsAreValid([{
          name:  'group1',
          rules: [{ record: 'my:record', expr: 'sum(up)' }]
        }], mockGetters, errors, []);

        expect(errors.filter((e) => e.includes('labels'))).toHaveLength(0);
      });

      it('uses 1-based index in rule errors', () => {
        const errors: string[] = [];

        groupsAreValid([{
          name:  'group1',
          rules: [{
            alert: 'MyAlert', expr: 'up == 0', labels: {}
          }]
        }], mockGetters, errors, []);

        expect(errors.some((e) => e.includes('"ruleIndex":1'))).toBe(true);
      });
    });
  });
});
