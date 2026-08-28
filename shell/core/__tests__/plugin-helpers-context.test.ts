import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { ExtensionPoint, TabLocation } from '@shell/core/types';

/**
 * Run the locationConfig matcher for a single registered enhancement and report whether it
 * applied. checkExtensionRouteBinding isn't exported, so this goes through the real entry point.
 */
const matches = (locationConfig: any, context?: any): boolean => {
  const pluginCtx: any = { $extension: { getUIConfig: () => [{ name: 'x', locationConfig }] } };
  const route: any = {
    params: { resource: 'provisioning.cattle.io.cluster' },
    query:  {},
    hash:   '',
    name:   'c-cluster-product-resource-id',
    meta:   {},
  };

  return getApplicableExtensionEnhancements(
    pluginCtx, ExtensionPoint.TAB, TabLocation.OTHER, route, pluginCtx, context
  ).length === 1;
};

describe('fx: checkExtensionRouteBinding, context matching', () => {
  it('should still match when the context is exactly what the locationConfig asks for', () => {
    expect(matches({ context: { provider: 'aks' } }, { provider: 'aks' })).toBe(true);
  });

  it('should match when the context carries keys the locationConfig does not mention', () => {
    // The in-tree aks/eks/gke tabs bind to `{ provider }`. The provisioning cluster detail page
    // also exposes annotations now, so an exact-equality match would break them.
    expect(matches({ context: { provider: 'aks' } }, { provider: 'aks', annotations: { 'a/b': 'c' } })).toBe(true);
  });

  it('should not match when a value the locationConfig asks for differs', () => {
    expect(matches({ context: { provider: 'aks' } }, { provider: 'eks', annotations: {} })).toBe(false);
  });

  it('should not match when a key the locationConfig asks for is absent', () => {
    expect(matches({ context: { provider: 'aks' } }, { annotations: {} })).toBe(false);
  });

  it('should match a nested annotation among many', () => {
    const context = {
      provider:    'k3k',
      annotations: {
        'ui.rancher/k3k-mode':       'hcp',
        'ui.rancher/parent-cluster': 'c-m-abc',
        'ui.rancher/provider':       'k3k',
      },
    };

    expect(matches({ context: { annotations: { 'ui.rancher/k3k-mode': 'hcp' } } }, context)).toBe(true);
  });

  it('should not match when a nested annotation has a different value', () => {
    const context = { annotations: { 'ui.rancher/k3k-mode': 'shared' } };

    expect(matches({ context: { annotations: { 'ui.rancher/k3k-mode': 'hcp' } } }, context)).toBe(false);
  });

  it('should not match when a nested annotation is absent', () => {
    const context = { annotations: { 'ui.rancher/provider': 'k3k' } };

    expect(matches({ context: { annotations: { 'ui.rancher/k3k-mode': 'hcp' } } }, context)).toBe(false);
  });

  it('should not match when the host component supplies no context at all', () => {
    expect(matches({ context: { annotations: { 'ui.rancher/k3k-mode': 'hcp' } } })).toBe(false);
  });

  it('should compare arrays exactly rather than as subsets', () => {
    expect(matches({ context: { list: ['a'] } }, { list: ['a'] })).toBe(true);
    expect(matches({ context: { list: ['a'] } }, { list: ['a', 'b'] })).toBe(false);
  });

  it('should treat an empty context requirement as satisfied', () => {
    expect(matches({ context: {} }, { provider: 'aks' })).toBe(true);
  });

  it('should still AND context together with other locationConfig params', () => {
    const context = { annotations: { 'ui.rancher/k3k-mode': 'hcp' } };
    const ask = { annotations: { 'ui.rancher/k3k-mode': 'hcp' } };

    expect(matches({ resource: ['provisioning.cattle.io.cluster'], context: ask }, context)).toBe(true);
    expect(matches({ resource: ['pod'], context: ask }, context)).toBe(false);
  });
});
