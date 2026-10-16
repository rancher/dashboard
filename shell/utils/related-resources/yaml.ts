import jsyaml from 'js-yaml';
import { saferDump } from '@shell/utils/create-yaml';
import { EDIT_HIDDEN_METADATA_KEYS, steveCleanForDownload } from '@shell/plugins/steve/resource-utils';

/**
 * The YAML of resources in the multi-resource YAML editor, and the resources saved from it
 */

// steve's own fields, as `steveCleanForDownload` drops them
// `actions` is not put back: saving does not use it
const STEVE_ROOT_KEYS = ['id', 'type', 'links'];
const STEVE_METADATA_KEYS = ['fields', 'relationships', 'state'];

// set by the store on its models, enumerable so `saferDump` includes them, and removed by `cleanForSave`
const MODEL_ROOT_KEYS = ['__clone', '__rehydrate'];

const HIDDEN_ROOT_KEYS = [...STEVE_ROOT_KEYS, 'actions', ...MODEL_ROOT_KEYS];

// a save without `resourceVersion` overwrites changes made since the yaml was made, instead of failing with a 409
const HIDDEN_METADATA_KEYS = [...STEVE_METADATA_KEYS, ...EDIT_HIDDEN_METADATA_KEYS.filter((key) => key !== 'resourceVersion')];

/**
 * The YAML of a resource, as the multi-resource YAML editor shows it
 *
 * As SingleResourceYaml shows a resource for editing: without the fields steve adds, such as `id`,
 * `type` and `links`, and without the server-managed metadata. `metadata.resourceVersion` is kept,
 * so a save of the YAML fails when the resource changed after the YAML was made
 *
 * Steve sends a `type` field of the resource as `_type`, as `type` is the steve type. It is shown
 * as `type`
 *
 * @param resource a resource model, or a resource as steve sends it
 * @returns the YAML, or '' for no resource
 */
export function toEditorYaml(resource: any): string {
  const yaml = saferDump(resource);

  if (!yaml) {
    return '';
  }

  const obj: any = jsyaml.load(steveCleanForDownload(yaml, { rootKeys: HIDDEN_ROOT_KEYS, metadataKeys: HIDDEN_METADATA_KEYS }) as string);

  if (obj && '_type' in obj) {
    obj.type = obj._type;
    delete obj._type;
  }

  return saferDump(obj);
}

/**
 * The resource described by YAML from `toEditorYaml`, as steve takes it
 *
 * `id`, `type` and `links` come from `resource`, so the store makes a model of the same type, which
 * saves to the same url. A `type` field in the YAML goes back to `_type`
 *
 * @param resource the resource the YAML was made from
 * @param yaml the YAML, edited or not
 * @returns the resource, ready for `$dispatch('create', ...)`
 * @throws when `yaml` is not valid YAML
 */
export function fromEditorYaml(resource: any, yaml: string): any {
  const { type: kubernetesType, ...data } = (jsyaml.load(yaml) || {}) as any;
  const steveFields = Object.fromEntries(STEVE_ROOT_KEYS.filter((key) => resource?.[key] !== undefined).map((key) => [key, resource[key]]));

  return {
    ...data, ...(kubernetesType === undefined ? {} : { _type: kubernetesType }), ...steveFields
  };
}
