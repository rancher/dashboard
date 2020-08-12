export const protocol = ['http', 'https'];

export function enabledDisabled(t) {
  return [
    {
      label: t('generic.enabled'),
      value: true
    },
    {
      label: t('generic.disabled'),
      value: false
    }
  ];
}
