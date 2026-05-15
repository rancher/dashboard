/**
 * A label selector requirement that contains values, a key, and an operator that relates the key and values.
 *
 * See https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#labelselectorrequirement-v1-meta
 */
export interface KubeLabelSelectorExpression {
  /**
   * The label key that the selector applies to
   */
  key: string,
  /**
   * Gt and Lt are only applicable to node selectors
   */
  operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist' | 'Gt' | 'Lt',
  /**
   * An array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. If the operator is Gt or Lt, the values array must have a single element, which will be interpreted as an integer. This array is replaced during a strategic merge patch.
   */
  values?: string[],
}

/**
 * https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#labelselector-v1-meta
 */
export interface KubeLabelSelector {
  /**
   * A list of label selector requirements. The requirements are ANDed.
   *
   * See {@link KubeLabelSelectorExpression}
   */
  matchExpressions?: KubeLabelSelectorExpression[],
  /**
   * matchLabels is a map of `{key,value}` pairs. A single `{key,value}` in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.
   */
  matchLabels?: { [key: string]: string }
}

/**
 * https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#objectmeta-v1-meta
 */
export interface KubeMetadata {
  namespace?: string,
  name: string

  labels?: { [key: string]: string },
  annotations?: { [key: string]: string },
}

/**
 * Kube API JSON response for LIST requests
 */
export interface KubeListResponse<T = any> {
  kind: string,
  apiVersion: string,

  items: T[],

  // Bucket for everything else (hopefully to remove once above populated)
  [key: string]: any
}

/**
 * Kube API JSON response for GET requests
 */
export interface KubeGetResponse {
  kind: string,
  apiVersion: string,

  metadata: KubeMetadata,
  spec: any,
  status: any,

  // Bucket for everything else (hopefully to remove once above populated)
  [key: string]: any
}
