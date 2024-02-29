export const MANAGED_TEMPLATE_PREFIX = 'rancher-managed-lt';

// aws tags are in the form [{Key: 'key1', Value: 'val1'}, {Key: 'key2', Value: 'val2}]
// rancher eksconfig tags are in the form {key1:val1, key2:val2}
// TODO nb jsdoc
export function parseTags(awsTags: any[]): {[key: string]: string}[] {
  return awsTags.reduce((out, tag) => {
    out[tag.Key] = tag.Value;

    return out;
  }, {});
}
