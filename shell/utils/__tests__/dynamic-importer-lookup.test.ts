import {
  resolveList, resolveChart, resolveEdit, resolveDetail, resolveWindowComponent, resolveMachineConfigComponent,
  resolveCloudCredentialComponent, resolveCustomPromptRemove, listProducts, loadProduct, loadTranslation, importDialog
} from '@shell/utils/dynamic-importer';
import GenericPrompt from '@shell/dialog/GenericPrompt.vue';

describe('fx: dynamic-importer lookups', () => {
  describe('resolve', () => {
    it.each([
      [resolveList, 'catalog.cattle.io.app', '../list/catalog.cattle.io.app'],
      [resolveChart, 'monitoring', '../chart/monitoring'],
      [resolveEdit, 'secret', '../edit/secret'],
      [resolveEdit, 'secret/basic', '../edit/secret/basic'],
      [resolveDetail, 'autoscaling.horizontalpodautoscaler', '../detail/autoscaling.horizontalpodautoscaler'],
      [resolveWindowComponent, 'KubectlShell', '../components/Window/KubectlShell'],
      [resolveMachineConfigComponent, 'amazonec2', '../machine-config/amazonec2'],
      [resolveCloudCredentialComponent, 'aws', '../cloud-credential/aws'],
      [resolveCustomPromptRemove, 'pod', '../promptRemove/pod'],
    ])('should find %p for "%s"', (resolve, key, expected) => {
      expect(resolve(key)).toStrictEqual(expected);
    });

    it.each([
      resolveList, resolveChart, resolveEdit, resolveDetail, resolveWindowComponent, resolveMachineConfigComponent,
      resolveCloudCredentialComponent, resolveCustomPromptRemove,
    ])('should throw from %p for a component that does not exist', (resolve) => {
      expect(() => resolve('does-not-exist')).toThrow('Cannot find module');
    });

    it('should not find test files', () => {
      expect(() => resolveEdit('__tests__/Secret.test')).toThrow('Cannot find module');
    });
  });

  describe('listProducts', () => {
    it('should list the product configurations by name', () => {
      expect(listProducts()).toContain('explorer');
    });

    it('should not list test files', () => {
      expect(listProducts().filter((name) => name.includes('test'))).toStrictEqual([]);
    });
  });

  describe('load', () => {
    it('should load a dialog by name', async() => {
      const component = importDialog('GenericPrompt') as any;

      expect(await component.__asyncLoader()).toBe(GenericPrompt);
    });

    it.each([
      ['a product', () => loadProduct('does-not-exist')],
      ['a translation', () => loadTranslation('does-not-exist')],
    ])('should reject for %s that does not exist', async(_, load) => {
      await expect(load()).rejects.toThrow('Cannot find module');
    });
  });
});
