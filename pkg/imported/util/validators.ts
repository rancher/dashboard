import { get } from '@shell/utils/object';
export const clusterNameRequired = (ctx: any) => {
  return () :String | undefined => {
    return !ctx.isEdit && !get(ctx.normanCluster, 'name') ? ctx.t('imported.errors.clusterName.required') : undefined;
  };
};
// a lowercase RFC 1123 label must consist of lower case alphanumeric characters or '-',
// and must start and end with an alphanumeric character (e.g. 'my-name', or '123-abc',
// regex used for validation is '[a-z0-9]([-a-z0-9]*[a-z0-9])?')
export const clusterNameChars = (ctx: any ) => {
  return () :string | undefined => {
    const { name = '' } = get(ctx, 'normanCluster');
    const nameIsValid = name.match(/^[a-z0-9\-]*$/);

    return nameIsValid ? undefined : ctx.t('imported.errors.clusterName.chars');
  };
};

export const clusterNameStartEnd = (ctx: any) => {
  return () :string | undefined => {
    const { name = '' } = get(ctx, 'normanCluster');
    const nameIsValid = (!!name.match(/^([a-z]|[0-9])+.*(|[a-z]|[0-9])+$/) || !name.length);

    return nameIsValid ? undefined : ctx.t('imported.errors.clusterName.startEnd');
  };
};
// Must be no more than 63 characters
export const clusterNameLength = (ctx: any) => {
  return () : string | undefined => {
    const { name = '' } = get(ctx, 'normanCluster');
    const isValid = name.length <= 63;

    return isValid ? undefined : ctx.t('imported.errors.clusterName.length');
  };
};
