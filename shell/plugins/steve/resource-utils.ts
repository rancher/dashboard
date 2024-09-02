import { dropKeys } from '@shell/utils/object';
import jsyaml from 'js-yaml';

export function steveCleanForDownload(yaml: string, keys?: {
  rootKeys?: string[],
  metadataKeys?: string[],
  conditionKeys?: string[]
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
    ]
  } = keys || {};

  const obj: any = jsyaml.load(yaml);

  dropKeys(obj, rootKeys);
  dropKeys(obj?.metadata, metadataKeys);
  (obj?.status?.conditions || []).forEach((condition: any) => dropKeys(condition, conditionKeys));

  return jsyaml.dump(obj);
}
