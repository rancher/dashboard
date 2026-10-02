import { reactive } from 'vue';
import { shallowMount } from '@vue/test-utils';
import CertificateEdit from '../../edit/cert-manager.io.certificate.vue';
import { CERT_MANAGER } from '../../types';

function render(spec: Record<string, any> = {}, mode = 'create') {
  // Reactive so the component's watchers fire when the test mutates the resource, the same way
  // they do when the real form edits it.
  const value = reactive({ metadata: { name: '', namespace: 'default' }, spec } as Record<string, any>);

  const wrapper = shallowMount(CertificateEdit, {
    props:  { value, mode },
    global: {
      mocks: {
        t:           (key: string) => key,
        $store:      { getters: { 'i18n/t': (key: string) => key, currentProduct: {} } },
        $route:      { query: {}, params: {} },
        $fetchState: { pending: false },
      },
    },
  });

  return { wrapper, value };
}

describe('component: CertificateEdit', () => {
  describe('defaults', () => {
    it('should seed an issuerRef pointing at a namespaced Issuer', () => {
      const { value } = render();

      expect(value.spec.issuerRef).toStrictEqual({ kind: 'Issuer', group: 'cert-manager.io' });
    });

    it('should not overwrite an existing issuerRef', () => {
      const { value } = render({
        issuerRef: {
          name: 'letsencrypt', kind: 'ClusterIssuer', group: 'cert-manager.io'
        }
      });

      expect(value.spec.issuerRef.name).toBe('letsencrypt');
      expect(value.spec.issuerRef.kind).toBe('ClusterIssuer');
    });

    it('should not create empty optional objects', () => {
      // They are stripped on save anyway, and the form no longer needs them to exist.
      const { value } = render();

      expect(value.spec.secretTemplate).toBeUndefined();
    });

    it('should default the private key on create', () => {
      expect(render().value.spec.privateKey).toStrictEqual({
        algorithm: 'RSA', size: 2048, encoding: 'PKCS1', rotationPolicy: 'Always'
      });
    });

    it('should not default the private key when editing an existing certificate', () => {
      expect(render({}, 'edit').value.spec.privateKey).toBeUndefined();
    });

    it('should not overwrite private key values that are already set', () => {
      const { value } = render({ privateKey: { algorithm: 'ECDSA', size: 384 } });

      expect(value.spec.privateKey).toMatchObject({ algorithm: 'ECDSA', size: 384 });
    });

    it('should leave duration and renewBefore unset, since ACME issuers ignore them', () => {
      const { value } = render();

      expect(value.spec.duration).toBeUndefined();
      expect(value.spec.renewBefore).toBeUndefined();
    });
  });

  describe('optional spec objects', () => {
    // They are pruned from the saved resource when empty, so the store can hand this form back a
    // spec with neither present. Reading through them directly crashed the Advanced tab.
    it('should render when privateKey and secretTemplate are both absent', () => {
      const { wrapper } = render({}, 'edit');

      expect(wrapper.vm.keyAlgorithm).toBeUndefined();
      expect(wrapper.html()).toBeTruthy();
    });

    it('should create privateKey on first write', () => {
      const { wrapper, value } = render({}, 'edit');

      wrapper.vm.setPrivateKey('algorithm', 'ECDSA');

      expect(value.spec.privateKey).toStrictEqual({ algorithm: 'ECDSA' });
    });

    it('should create secretTemplate on first write', () => {
      const { wrapper, value } = render({}, 'edit');

      wrapper.vm.setSecretTemplate('labels', { a: 'b' });

      expect(value.spec.secretTemplate).toStrictEqual({ labels: { a: 'b' } });
    });

    it('should keep the other keys when writing one', () => {
      const { wrapper, value } = render({ privateKey: { algorithm: 'RSA', size: 2048 } }, 'edit');

      wrapper.vm.setPrivateKey('encoding', 'PKCS8');

      expect(value.spec.privateKey).toStrictEqual({
        algorithm: 'RSA', size: 2048, encoding: 'PKCS8'
      });
    });
  });

  describe('identifier hint', () => {
    it('should prompt for an identifier while none is set', () => {
      expect(render().wrapper.vm.hasNoIdentifier).toBe(true);
    });

    it.each([
      ['a common name', { commonName: 'example.com' }],
      ['a dns name', { dnsNames: ['example.com'] }],
      ['an email address', { emailAddresses: ['a@b.com'] }],
    ])('should stop prompting once %s is set', (_label, spec) => {
      expect(render(spec).wrapper.vm.hasNoIdentifier).toBe(false);
    });

    it('should not raise a page level error banner for the identifier rule', () => {
      // Reporting the path keeps CruResource from rendering a red banner the moment the form
      // opens; the inline warning covers it instead. The rule still gates the Create button.
      const { wrapper } = render();

      expect(wrapper.vm.fvReportedValidationPaths).toContain('spec');
      expect(wrapper.vm.fvUnreportedValidationErrors).not.toContain('certManager.certificate.validation.noIdentifiers');
    });
  });

  describe('issuer scope', () => {
    it('should select the matching resource type', () => {
      expect(render().wrapper.vm.issuerResourceType).toBe(CERT_MANAGER.ISSUER);
      expect(render({ issuerRef: { kind: 'ClusterIssuer' } }).wrapper.vm.issuerResourceType).toBe(CERT_MANAGER.CLUSTER_ISSUER);
    });

    const issuers = [
      { metadata: { name: 'a', namespace: 'default' } },
      { metadata: { name: 'b', namespace: 'other' } },
    ];

    it('should limit Issuer choices to the certificate namespace', () => {
      const { wrapper } = render();

      expect(wrapper.vm.issuerSelectSettings.updateResources(issuers)).toStrictEqual([{ label: 'a', value: 'a' }]);
    });

    it('should not filter ClusterIssuers, which are reachable from every namespace', () => {
      const { wrapper } = render({ issuerRef: { kind: 'ClusterIssuer' } });

      expect(wrapper.vm.issuerSelectSettings.updateResources(issuers)).toStrictEqual([
        { label: 'a', value: 'a' },
        { label: 'b', value: 'b' },
      ]);
    });

    it('should map issuers to plain label/value options', () => {
      // LabeledSelect renders `optionLabel` (default 'label') and `reduce` unwraps `value`.
      // Handing it raw Steve models prints the entire serialised resource as the option text.
      const { wrapper } = render();
      const [option] = wrapper.vm.issuerSelectSettings.updateResources(issuers);

      expect(Object.keys(option).sort()).toStrictEqual(['label', 'value']);
      expect(typeof option.value).toBe('string');
    });

    it('should clear the chosen issuer when the scope changes', async() => {
      const { wrapper, value } = render({ issuerRef: { name: 'my-issuer', kind: 'Issuer' } });

      value.spec.issuerRef.kind = 'ClusterIssuer';
      await wrapper.vm.$nextTick();

      expect(value.spec.issuerRef.name).toBeUndefined();
    });
  });

  describe('private key', () => {
    it.each([
      ['RSA', [2048, 3072, 4096]],
      ['ECDSA', [256, 384, 521]],
      // cert-manager rejects an explicit size for Ed25519
      ['Ed25519', []],
      [undefined, []],
    ])('should offer the sizes valid for %s', (algorithm, expected) => {
      const { wrapper } = render({ privateKey: { algorithm } });

      expect(wrapper.vm.keySizeOptions).toStrictEqual(expected);
    });

    it('should clear the size when the algorithm changes, since sizes are not interchangeable', async() => {
      const { wrapper, value } = render({ privateKey: { algorithm: 'RSA', size: 4096 } });

      value.spec.privateKey.algorithm = 'ECDSA';
      await wrapper.vm.$nextTick();

      expect(value.spec.privateKey.size).toBeUndefined();
    });
  });

  describe('validation', () => {
    const rule = () => render().wrapper.vm.fvExtraRules.atLeastOneIdentifier;

    it.each([
      ['a common name', { commonName: 'example.com' }],
      ['a dns name', { dnsNames: ['example.com'] }],
      ['an ip address', { ipAddresses: ['10.0.0.1'] }],
      ['a uri', { uris: ['spiffe://cluster/ns/default/sa/app'] }],
      ['an email address', { emailAddresses: ['a@b.com'] }],
    ])('should accept a certificate identified by %s', (_label, spec) => {
      expect(rule()(spec)).toBeUndefined();
    });

    it.each([
      ['an empty spec', {}],
      ['empty identifier lists', {
        dnsNames: [], ipAddresses: [], uris: [], emailAddresses: []
      }],
      ['a blank common name', { commonName: '' }],
      ['undefined', undefined],
    ])('should reject %s', (_label, spec) => {
      expect(rule()(spec)).toBe('certManager.certificate.validation.noIdentifiers');
    });
  });
});
