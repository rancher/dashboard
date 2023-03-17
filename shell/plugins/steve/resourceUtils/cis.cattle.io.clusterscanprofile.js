export function _getNumberTestsSkipped(resource) {
  const { skipTests = [] } = resource.spec;

  return skipTests.length;
}

export const calculatedFields = [
  { name: 'numberTestsSkipped', func: _getNumberTestsSkipped }
];
