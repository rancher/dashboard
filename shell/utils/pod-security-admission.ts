import { filter, keys } from 'lodash';
import { PSALabelsNamespaces } from '@shell/config/pod-security-admission';
import { camelToTitle } from '~/shell/utils/string';

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

/**
 * Generate tooltips dictionary from a given PSA namespaced label pair of key and values
 */
export const getPSATooltipsDescription = (resource: ResourcePartial, version?: string) => Object.assign(
  {},
  ...Object
    .entries(resource.metadata.labels)
    .map(([key, value]) => ({
      [key]:
      `${ camelToTitle(key.replace('psp.kubernetes.io/', '')) } ${ camelToTitle(value) } (${ version || 'latest' })`
    }))
);
