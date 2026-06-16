/**
 * `container` (https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.26/#container-v1-core)
 * definition containing a reeeal small, low impact image
 */
export const SMALL_CONTAINER = {
  name:  'small-image',
  image: 'k8s.gcr.io/pause'
};
