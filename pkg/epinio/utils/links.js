export const buildBulkLink = (arr, type) => {
  return Object
    .keys(arr)
    .reduce((acc, cur) => {
      type === 'applications' ? acc[cur] = arr[cur].map(_e => `applications%5B%5D=${ _e }`).join('&') : acc[cur] = arr[cur].map(_e => `${ type }[%5B%5D]=${ _e }`).join('&');

      return acc;
    }, {});
};
