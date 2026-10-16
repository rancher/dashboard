import { mergeExtensionSectionProps } from '@shell/edit/provisioning.cattle.io.cluster/shared';

// shared.ts resolves ingress icons when it loads
jest.mock('@shell/utils/require-asset', () => ({ requireAsset: jest.fn(() => 'asset') }));

describe('fx: mergeExtensionSectionProps', () => {
  const defaultProps = { value: 'default-value', mode: 'create' };
  const context = { ...defaultProps, provisioningCluster: { id: 'cluster' } };

  it.each([
    ['undefined', undefined, { value: 'default-value', mode: 'create' }],
    ['an empty object', {}, { value: 'default-value', mode: 'create' }],
    ['an object', { mode: 'edit', added: true }, {
      value: 'default-value', mode: 'edit', added: true
    }],
    ['a function returning an object', () => ({ mode: 'edit', added: true }), {
      value: 'default-value', mode: 'edit', added: true
    }],
    ['a function returning null', () => null, { value: 'default-value', mode: 'create' }],
    ['a function returning a string', () => 'not-an-object', { value: 'default-value', mode: 'create' }],
    ['a function that throws', () => {
      throw new Error('extension failure');
    }, { value: 'default-value', mode: 'create' }],
  ])('should return the expected props when extension props are %s', (_, extensionProps, expected) => {
    const result = mergeExtensionSectionProps(defaultProps, extensionProps as any, context);

    expect(result).toStrictEqual(expected);
  });

  it('should call a function with the context', () => {
    const extensionProps = jest.fn(() => ({}));

    mergeExtensionSectionProps(defaultProps, extensionProps, context);

    expect(extensionProps).toHaveBeenCalledWith(context);
  });

  it('should not modify the default props', () => {
    const original = { value: 'default-value', mode: 'create' };

    mergeExtensionSectionProps(original, { mode: 'edit' }, context);

    expect(original).toStrictEqual({ value: 'default-value', mode: 'create' });
  });
});
