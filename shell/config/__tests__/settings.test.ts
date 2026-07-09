import { SETTING, ALLOWED_SETTINGS, PROVISIONING_SETTINGS } from '../settings';

describe('Settings Configuration', () => {
  describe('DELETE_MACHINE_ON_FAILURE_AFTER', () => {
    it('should be defined in SETTING constants', () => {
      expect(SETTING.DELETE_MACHINE_ON_FAILURE_AFTER).toBe('delete-machine-on-failure-after');
    });

    it('should be included in ALLOWED_SETTINGS', () => {
      expect(ALLOWED_SETTINGS).toHaveProperty(SETTING.DELETE_MACHINE_ON_FAILURE_AFTER);
    });

    it('should be included in PROVISIONING_SETTINGS', () => {
      expect(PROVISIONING_SETTINGS).toContain(SETTING.DELETE_MACHINE_ON_FAILURE_AFTER);
    });

    it('should have the correct configuration in ALLOWED_SETTINGS', () => {
      const config = ALLOWED_SETTINGS[SETTING.DELETE_MACHINE_ON_FAILURE_AFTER];

      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });
  });

  describe('PROVISIONING_SETTINGS array', () => {
    it('should contain all expected provisioning-related settings', () => {
      const expectedSettings = [
        SETTING.ENGINE_ISO_URL,
        SETTING.RKE_METADATA_CONFIG,
        SETTING.K3S_UPGRADER_UNINSTALL_CONCURRENCY,
        SETTING.DELETE_MACHINE_ON_FAILURE_AFTER,
        SETTING.IMPORTED_CLUSTER_VERSION_MANAGEMENT,
        SETTING.CLUSTER_AGENT_DEFAULT_PRIORITY_CLASS,
        SETTING.CLUSTER_AGENT_DEFAULT_POD_DISTRIBUTION_BUDGET,
        SETTING.FLEET_AGENT_DEFAULT_PRIORITY_CLASS,
        SETTING.FLEET_AGENT_DEFAULT_POD_DISTRIBUTION_BUDGET,
        SETTING.IMPORTED_CLUSTER_DAY2_OPS_DEFAULT
      ];

      expectedSettings.forEach((setting) => {
        expect(PROVISIONING_SETTINGS).toContain(setting);
      });
    });

    it('should maintain proper order with DELETE_MACHINE_ON_FAILURE_AFTER after K3S_UPGRADER_UNINSTALL_CONCURRENCY', () => {
      const k3sIndex = PROVISIONING_SETTINGS.indexOf(SETTING.K3S_UPGRADER_UNINSTALL_CONCURRENCY);
      const deleteMachineIndex = PROVISIONING_SETTINGS.indexOf(SETTING.DELETE_MACHINE_ON_FAILURE_AFTER);

      expect(deleteMachineIndex).toBeGreaterThan(k3sIndex);
      expect(deleteMachineIndex).toBe(k3sIndex + 1);
    });
  });
});
