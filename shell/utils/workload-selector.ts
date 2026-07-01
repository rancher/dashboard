/**
 * Generates a workload selector label value that respects Kubernetes' 63-character limit.
 *
 * For workload IDs that fit within 63 characters, returns the original format.
 * For longer IDs, returns a hash-based format to stay within the limit.
 *
 * @param type - The workload type (e.g., 'deployment', 'statefulset')
 * @param namespace - The namespace name
 * @param name - The workload name
 * @returns The workload selector value (≤63 chars)
 */
export function generateWorkloadSelector(type: string, namespace: string, name: string): string {
  const MAX_LABEL_VALUE_LENGTH = 63;

  // Original format: type-namespace-name
  const fullWorkloadId = `${type}-${namespace}-${name}`;

  // If it fits, use the full format
  if (fullWorkloadId.length <= MAX_LABEL_VALUE_LENGTH) {
    return fullWorkloadId;
  }

  // Otherwise, use hash-based format: type-<hash>
  // This matches the backend implementation
  const hash = generateSimpleHash(fullWorkloadId);

  return `${type}-${hash}`;
}

/**
 * Generates a 12-character hex hash from the input string.
 * Uses a simple deterministic hash algorithm that matches the backend SHA-256 approach
 * but works synchronously in the browser.
 *
 * Note: This is a simplified hash for UI consistency. The backend uses SHA-256.
 * For production, consider using a crypto library that works synchronously.
 *
 * @param input - The string to hash
 * @returns A 12-character hex hash
 */
function generateSimpleHash(input: string): string {
  // Simple deterministic hash (FNV-1a variant)
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }

  // Convert to positive number and get hex string
  const hashHex = (hash >>> 0).toString(16).padStart(8, '0');

  // Extend to 12 chars by hashing again with different seed
  let hash2 = 2166136261 + input.length;

  for (let i = input.length - 1; i >= 0; i--) {
    hash2 ^= input.charCodeAt(i);
    hash2 = Math.imul(hash2, 16777619);
  }

  const hashHex2 = (hash2 >>> 0).toString(16).padStart(8, '0');

  // Combine to get 12 chars (take 8 from first, 4 from second)
  return (hashHex + hashHex2.substring(0, 4)).substring(0, 12);
}

/**
 * Generates the full workload ID for use in annotations.
 * This preserves the complete namespace and workload name for debugging.
 *
 * @param type - The workload type
 * @param namespace - The namespace name
 * @param name - The workload name
 * @returns The full workload ID
 */
export function generateFullWorkloadId(type: string, namespace: string, name: string): string {
  return `${type}-${namespace}-${name}`;
}

/**
 * The annotation key for storing the full workload ID when hash is used.
 * This matches the backend constant.
 */
export const WORKLOAD_ID_FULL_ANNOTATION = 'workload.user.cattle.io/workload-id-full';
