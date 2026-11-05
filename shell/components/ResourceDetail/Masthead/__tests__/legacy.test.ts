import Legacy from '@shell/components/ResourceDetail/Masthead/legacy.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { FLEET, KUBERNETES } from '@shell/config/labels-annotations';

type LegacyComputed = {
  managedWarning: (this: { value: object, mode: string }) => { show: boolean };
  showFleetManagedBanner: (this: { isView: boolean, isEdit: boolean }) => boolean;
};

describe('component: Masthead/legacy', () => {
  describe('computed: managedWarning', () => {
    const { managedWarning } = (Legacy as unknown as { computed: LegacyComputed }).computed;

    it('should show the Helm warning when editing a Helm-managed resource', () => {
      const value = { kind: 'Deployment', metadata: { labels: { [KUBERNETES.MANAGED_BY]: 'Helm' } } };

      expect(managedWarning.call({ value, mode: _EDIT }).show).toBe(true);
    });

    it('should not show the Helm warning when viewing a Helm-managed resource', () => {
      const value = { kind: 'Deployment', metadata: { labels: { [KUBERNETES.MANAGED_BY]: 'Helm' } } };

      expect(managedWarning.call({ value, mode: _VIEW }).show).toBe(false);
    });

    it('should not show the Helm warning when the resource is managed by Fleet', () => {
      const value = {
        kind:     'Deployment',
        metadata: { labels: { [KUBERNETES.MANAGED_BY]: 'Helm', [FLEET.MANAGED_BY_KIND]: 'helmop' } }
      };

      expect(managedWarning.call({ value, mode: _EDIT }).show).toBe(false);
    });
  });

  describe('computed: showFleetManagedBanner', () => {
    const { showFleetManagedBanner } = (Legacy as unknown as { computed: LegacyComputed }).computed;

    it.each([
      ['view', { isView: true, isEdit: false }, true],
      ['edit', { isView: false, isEdit: true }, true],
      ['create, clone or import', { isView: false, isEdit: false }, false],
    ])('should return the expected value when the mode is %s', (_, mode, expected) => {
      expect(showFleetManagedBanner.call(mode)).toBe(expected);
    });
  });
});
