import { filter, keys } from 'lodash';
import { PSALabelsNamespaces } from '@shell/config/pod-security-admission';

interface ResourcePartial {
  metadata: {
    labels: Record<string, string>
  }
}

/**
 * Return PSA labels present in the resource
 * @returns string[]
 */
export const getPSALabels = (resource: ResourcePartial): string[] => filter(keys(resource?.metadata?.labels), key => PSALabelsNamespaces.includes(key));

/**
 * Return boolean value if the label is a PSA label
 * @returns Boolean
 */
export const hasPSALabels = (resource: ResourcePartial): boolean => getPSALabels(resource).length > 0;
