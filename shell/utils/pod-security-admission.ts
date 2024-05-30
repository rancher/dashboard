import { reduce, filter, keys } from 'lodash';
import { PSALabelPrefix, PSALabelsNamespaces } from '@shell/config/pod-security-admission';
import { camelToTitle } from '@shell/utils/string';
import { PSA } from '@shell/types/resources/pod-security-admission';

/**
 * Return PSA labels present in the resource
 * @returns string[]
 */
export const getPSALabels = (resource: PSA): string[] => filter(keys(resource?.metadata?.labels), (key) => PSALabelsNamespaces.includes(key));

/**
 * Return boolean value if the label is a PSA label
 * @returns Boolean
 */
export const hasPSALabels = (resource: PSA): boolean => getPSALabels(resource).length > 0;

/**
 * Generate tooltips dictionary from a given PSA namespaced label pair of key and values
 */
export const getPSATooltipsDescription = (resource: PSA): Record<string, string> => reduce(
  resource?.metadata?.labels,
  (acc, value, key) => {
    const isPSA = PSALabelsNamespaces.includes(key);

    // Retrieve version from paired label ending with `-version`
    const suffix = '-version';
    const isVersionLabel = key.includes(suffix);
    const versionLabel = resource?.metadata?.labels[`${ key }${ suffix }`];
    const version = versionLabel || 'latest';

    // Add SPA labels and discard paired version label
    return isPSA && !isVersionLabel ? {
      ...acc,
      [key]: `${ camelToTitle(key.replace(PSALabelPrefix, '')) } ${ camelToTitle(value) } (${ version })`
    } : acc;
  },
  { }
);
