import Legacy from '@shell/components/ResourceDetail/Masthead/legacy.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { FLEET, KUBERNETES } from '@shell/config/labels-annotations';

type LegacyComputed = { managedWarning: (this: { value: object, mode: string }) => { show: boolean } };

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
});
