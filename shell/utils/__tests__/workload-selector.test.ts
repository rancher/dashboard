import { generateWorkloadSelector, WORKLOAD_ID_FULL_ANNOTATION } from '../workload-selector';

describe('workload-selector', () => {
  describe('generateWorkloadSelector', () => {
    it('should return full format for short names', () => {
      const result = generateWorkloadSelector('deployment', 'default', 'nginx');

      expect(result.labelValue).toStrictEqual('deployment-default-nginx');
      expect(result.fullID).toStrictEqual('');
    });

    it('should return full format when exactly at 63 character limit', () => {
      // deployment(10) + -(1) + namespace(26) + -(1) + name(25) = 63
      const namespace = 'a'.repeat(26);
      const name = 'b'.repeat(25);
      const result = generateWorkloadSelector('deployment', namespace, name);

      expect(result.labelValue).toHaveLength(63);
      expect(result.labelValue).toStrictEqual(`deployment-${ namespace }-${ name }`);
      expect(result.fullID).toStrictEqual('');
    });

    it('should return truncated format when exceeding 63 characters', () => {
      // deployment(10) + -(1) + namespace(27) + -(1) + name(26) = 65 chars
      const namespace = 'a'.repeat(27);
      const name = 'b'.repeat(26);
      const result = generateWorkloadSelector('deployment', namespace, name);

      expect(result.labelValue.length).toBeLessThanOrEqual(63);
      expect(result.labelValue).toMatch(/^deployment-[ab-]+-[a-f0-9]{5}$/);
      expect(result.fullID).toStrictEqual(`deployment-${ namespace }-${ name }`);
    });

    it('should return truncated format for maximum length names', () => {
      const namespace = 'a'.repeat(63);
      const name = 'b'.repeat(63);
      const result = generateWorkloadSelector('deployment', namespace, name);

      expect(result.labelValue.length).toBeLessThanOrEqual(63);
      expect(result.fullID).toHaveLength(138); // deployment(10) + -(1) + 63 + -(1) + 63
    });

    it('should generate deterministic results', () => {
      const namespace = 'very-long-namespace-name-that-exceeds-limits';
      const name = 'very-long-deployment-name-that-also-exceeds-limits';

      const result1 = generateWorkloadSelector('deployment', namespace, name);
      const result2 = generateWorkloadSelector('deployment', namespace, name);

      expect(result1.labelValue).toStrictEqual(result2.labelValue);
      expect(result1.fullID).toStrictEqual(result2.fullID);
    });

    it('should generate different results for different inputs', () => {
      const result1 = generateWorkloadSelector('deployment', 'namespace-a'.repeat(10), 'workload-1'.repeat(10));
      const result2 = generateWorkloadSelector('deployment', 'namespace-b'.repeat(10), 'workload-2'.repeat(10));

      expect(result1.labelValue).not.toStrictEqual(result2.labelValue);
    });

    it('should work with different workload types', () => {
      const namespace = 'a'.repeat(30);
      const name = 'b'.repeat(30);

      const deployment = generateWorkloadSelector('deployment', namespace, name);
      const statefulset = generateWorkloadSelector('statefulset', namespace, name);
      const daemonset = generateWorkloadSelector('daemonset', namespace, name);

      expect(deployment.labelValue).toMatch(/^deployment-/);
      expect(statefulset.labelValue).toMatch(/^statefulset-/);
      expect(daemonset.labelValue).toMatch(/^daemonset-/);

      // Different types should produce different results
      expect(deployment.labelValue).not.toStrictEqual(statefulset.labelValue);
      expect(deployment.labelValue).not.toStrictEqual(daemonset.labelValue);
    });

    it('should handle apps.deployment type format', () => {
      const namespace = 'a'.repeat(30);
      const name = 'b'.repeat(30);

      const result = generateWorkloadSelector('apps.deployment', namespace, name);

      expect(result.labelValue.length).toBeLessThanOrEqual(63);
      expect(result.labelValue).toMatch(/^apps\.deployment-/);
    });

    it('should handle boundary case exactly', () => {
      const type = 'deployment';
      // Create exactly 63 chars: deployment(10) + -(1) + ns(26) + -(1) + name(25) = 63
      const ns63 = 'a'.repeat(26);
      const name63 = 'b'.repeat(25);

      const result63 = generateWorkloadSelector(type, ns63, name63);

      expect(result63.labelValue).toHaveLength(63);
      expect(result63.fullID).toStrictEqual('');

      // Create 64 chars: deployment(10) + -(1) + ns(26) + -(1) + name(26) = 64
      const ns64 = 'a'.repeat(26);
      const name64 = 'b'.repeat(26);

      const result64 = generateWorkloadSelector(type, ns64, name64);

      expect(result64.labelValue.length).toBeLessThanOrEqual(63);
      expect(result64.fullID).not.toStrictEqual('');
    });
  });

  describe('WORKLOAD_ID_FULL_ANNOTATION constant', () => {
    it('should match backend annotation key', () => {
      expect(WORKLOAD_ID_FULL_ANNOTATION).toStrictEqual('workload.user.cattle.io/workload-id-full');
    });
  });
});
