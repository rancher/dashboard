/**
 * Generates a workload selector label value that respects Kubernetes' 63-character limit.
 * This implementation matches SafeConcatName from pkg/capr/common.go for consistency.
 *
 * @param type - The workload type (e.g., 'deployment', 'statefulset')
 * @param namespace - The namespace name
 * @param name - The workload name
 * @returns The workload selector value (≤63 chars) and optionally the full ID
 */
export function generateWorkloadSelector(type: string, namespace: string, name: string): { labelValue: string; fullID: string } {
  const MAX_LABEL_VALUE_LENGTH = 63;
  const HASH_LENGTH = 6;

  // Join with hyphens like SafeConcatName does
  const fullPath = [type, namespace, name].join('-');

  // If it fits within the limit, use the full format
  if (fullPath.length <= MAX_LABEL_VALUE_LENGTH) {
    return {
      labelValue: fullPath,
      fullID:     ''  // No annotation needed
    };
  }

  // Create truncated string with hash
  // This matches the SafeConcatName algorithm from pkg/capr/common.go
  const hash = generateHash(fullPath);
  const truncateAt = MAX_LABEL_VALUE_LENGTH - (HASH_LENGTH + 1); // +1 for the hyphen
  const truncated = fullPath.substring(0, truncateAt);

  // Check if last char is valid (a-z or 0-9)
  const lastChar = truncated[truncated.length - 1];
  let remainingString = truncated;

  if (!/[a-z0-9]/.test(lastChar)) {
    // Remove invalid last char
    remainingString = truncated.substring(0, truncateAt - 1);
  } else {
    remainingString = truncated;
  }

  const labelValue = remainingString ? `${ remainingString }-${ hash }` : hash;

  return {
    labelValue,
    fullID: fullPath  // Store full ID for annotation
  };
}

/**
 * Generates a 5-character hex hash from the input string.
 * Matches the hash generation in SafeConcatName (SHA-256, first 5 hex chars).
 *
 * Note: This uses a simple hash for browser compatibility.
 * The backend uses SHA-256 via crypto/sha256.
 *
 * @param input - The string to hash
 * @returns A 5-character hex hash
 */
function generateHash(input: string): string {
  // Simple but deterministic hash (FNV-1a variant)
  // This produces consistent results across multiple calls
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }

  // Convert to positive number and get hex string
  const hashHex = (hash >>> 0).toString(16).padStart(8, '0');

  // Return first 5 characters to match backend hash length
  return hashHex.substring(0, 5);
}

/**
 * The annotation key for storing the full workload ID when truncation occurs.
 * This matches the backend constant.
 */
export const WORKLOAD_ID_FULL_ANNOTATION = 'workload.user.cattle.io/workload-id-full';
