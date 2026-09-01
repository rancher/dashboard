import { dropKeys } from '@shell/utils/object';
import jsyaml from 'js-yaml';

// Metadata fields that are meaningful when viewing or downloading a resource's
// YAML but are server-managed and not suitable for editing. These are stripped
// only when the YAML is being prepared for editing.
export const EDIT_HIDDEN_METADATA_KEYS = [
  'uid',
  'generation',
  'resourceVersion',
  'creationTimestamp',
  'managedFields',
];

export function steveCleanForDownload(yaml: string, keys?: {
  rootKeys?: string[],
  metadataKeys?: string[],
  conditionKeys?: string[],
  editing?: boolean,
 }): string | undefined {
  if (!yaml) {
    return;
  }

  const {
    rootKeys = [
      'id',
      'links',
      'type',
      'actions'
    ],
    metadataKeys = [
      'fields',
      'relationships',
      'state',
    ],
    conditionKeys = [
      'error',
      'transitioning',
    ],
    editing = false,
  } = keys || {};

  const obj: any = jsyaml.load(yaml);

  dropKeys(obj, rootKeys);
  dropKeys(obj?.metadata, editing ? [...metadataKeys, ...EDIT_HIDDEN_METADATA_KEYS] : metadataKeys);
  (obj?.status?.conditions || []).forEach((condition: any) => dropKeys(condition, conditionKeys));

  return jsyaml.dump(obj);
}
