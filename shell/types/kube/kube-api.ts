export interface KubeLabelSelectorExpression {
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
  matchExpressions?: KubeLabelSelectorExpression[],
  /**
   * matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.
   */
  matchLabels?: { [key: string]: string }
}

/**
 * https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#objectmeta-v1-meta
 */
export interface KubeMetadata {
  labels?: { [key: string]: string },
  annotations?: { [key: string]: string },
}

export interface RancherKubeMetadata extends KubeMetadata {
  namespace?: string,
  name: string
}
