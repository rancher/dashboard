export const buildBulkLink = (arr: { [key: string]: any[] }, type: string): { [key: string]: string } => {
  return Object
    .keys(arr)
    .reduce((acc, cur) => {
      type === 'applications' ? acc[cur] = arr[cur].map(_e => `applications[]=${ _e }`).join('&') : acc[cur] = arr[cur].map(_e => `${ type }[]=${ _e }`).join('&');

      return acc;
    }, {} as { [key: string]: string });
};
