import { generateWorkloadSelector, generateFullWorkloadId, WORKLOAD_ID_FULL_ANNOTATION } from '../workload-selector';

describe('workload-selector', () => {
  describe('generateWorkloadSelector', () => {
    it('should return full format for short names', () => {
      const result = generateWorkloadSelector('deployment', 'default', 'nginx');

      expect(result).toStrictEqual('deployment-default-nginx');
    });

    it('should return full format when exactly at 63 character limit', () => {
      // deployment(10) + -(1) + namespace(26) + -(1) + name(25) = 63
      const namespace = 'a'.repeat(26);
      const name = 'b'.repeat(25);
      const result = generateWorkloadSelector('deployment', namespace, name);

      expect(result).toHaveLength(63);
      expect(result).toStrictEqual(`deployment-${ namespace }-${ name }`);
    });

    it('should return hash format when exceeding 63 characters', () => {
      // deployment(10) + -(1) + namespace(27) + -(1) + name(26) = 65 chars
      const namespace = 'a'.repeat(27);
      const name = 'b'.repeat(26);
      const result = generateWorkloadSelector('deployment', namespace, name);

      expect(result.length).toBeLessThanOrEqual(63);
      expect(result).toMatch(/^deployment-[a-f0-9]{12}$/);
    });

    it('should return hash format for maximum length names', () => {
      const namespace = 'a'.repeat(63);
      const name = 'b'.repeat(63);
      const result = generateWorkloadSelector('deployment', namespace, name);

      expect(result.length).toBeLessThanOrEqual(63);
      expect(result).toMatch(/^deployment-[a-f0-9]{12}$/);
      // deployment(10) + -(1) + hash(12) = 23 chars
      expect(result).toHaveLength(23);
    });

    it('should generate deterministic hashes', () => {
      const namespace = 'very-long-namespace-name-that-exceeds-limits';
      const name = 'very-long-deployment-name-that-also-exceeds-limits';

      const result1 = generateWorkloadSelector('deployment', namespace, name);
      const result2 = generateWorkloadSelector('deployment', namespace, name);

      expect(result1).toStrictEqual(result2);
    });

    it('should generate different hashes for different inputs', () => {
      const result1 = generateWorkloadSelector('deployment', 'namespace-a'.repeat(10), 'workload-1'.repeat(10));
      const result2 = generateWorkloadSelector('deployment', 'namespace-b'.repeat(10), 'workload-2'.repeat(10));

      expect(result1).not.toStrictEqual(result2);
    });

    it('should work with different workload types', () => {
      const namespace = 'a'.repeat(30);
      const name = 'b'.repeat(30);

      const deployment = generateWorkloadSelector('deployment', namespace, name);
      const statefulset = generateWorkloadSelector('statefulset', namespace, name);
      const daemonset = generateWorkloadSelector('daemonset', namespace, name);

      expect(deployment).toMatch(/^deployment-[a-f0-9]{12}$/);
      expect(statefulset).toMatch(/^statefulset-[a-f0-9]{12}$/);
      expect(daemonset).toMatch(/^daemonset-[a-f0-9]{12}$/);

      // Different types should produce different hashes for same namespace/name
      expect(deployment).not.toStrictEqual(statefulset);
      expect(deployment).not.toStrictEqual(daemonset);
    });

    it('should handle apps.deployment type format', () => {
      const namespace = 'a'.repeat(30);
      const name = 'b'.repeat(30);

      const result = generateWorkloadSelector('apps.deployment', namespace, name);

      expect(result.length).toBeLessThanOrEqual(63);
      expect(result).toMatch(/^apps\.deployment-[a-f0-9]{12}$/);
    });
  });

  describe('generateFullWorkloadId', () => {
    it('should return the complete workload ID regardless of length', () => {
      const namespace = 'a'.repeat(63);
      const name = 'b'.repeat(63);
      const result = generateFullWorkloadId('deployment', namespace, name);

      // deployment(10) + -(1) + namespace(63) + -(1) + name(63) = 138 chars
      expect(result).toHaveLength(138);
      expect(result).toStrictEqual(`deployment-${ namespace }-${ name }`);
    });

    it('should match format for short names', () => {
      const result = generateFullWorkloadId('deployment', 'default', 'nginx');

      expect(result).toStrictEqual('deployment-default-nginx');
    });
  });

  describe('WORKLOAD_ID_FULL_ANNOTATION constant', () => {
    it('should match backend annotation key', () => {
      expect(WORKLOAD_ID_FULL_ANNOTATION).toStrictEqual('workload.user.cattle.io/workload-id-full');
    });
  });
});
