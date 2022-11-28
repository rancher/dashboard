import { filter, keys } from 'lodash';
import { PSALabelsNamespaces } from '@shell/config/pod-security-admission';

/**
 * Return PSA labels present in the resource
 * @param labels Rancher resource labels
 * @returns string[]
 */
export const getPSALabels = (labels: Record<string, string>): string[] => filter(keys(labels), key => PSALabelsNamespaces.includes(key));

/**
 * Return boolean value if the label is a PSA label
 * @param labels Rancher resource labels
 * @returns Boolean
 */
export const hasPSALabels = (labels: Record<string, string>): boolean => getPSALabels(labels).length > 0;
