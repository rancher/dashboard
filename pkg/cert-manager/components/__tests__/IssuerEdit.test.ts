import { shallowMount } from '@vue/test-utils';
import IssuerEdit from '../IssuerEdit.vue';
import { ISSUER_CONFIG_TYPES } from '../../form-options';

function render(spec: Record<string, any> = {}, clusterScoped = false) {
  const value = { metadata: { name: 'my-issuer', namespace: 'default' }, spec };

  const wrapper = shallowMount(IssuerEdit, {
    props: {
      value, mode: 'create', clusterScoped
    },
    global: {
      mocks: {
        t:           (key: string, args?: any) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
        $store:      { getters: { 'i18n/t': (key: string) => key, currentProduct: {} } },
        $route:      { query: {}, params: {} },
        $fetchState: { pending: false },
      },
    },
  });

  return { wrapper, value };
}

describe('component: IssuerEdit', () => {
  describe('config type', () => {
    it('should default a new issuer to self signed', () => {
      const { wrapper, value } = render();

      expect(wrapper.vm.configType).toBe('selfSigned');
      expect(value.spec.selfSigned).toStrictEqual({});
    });

    it('should read the type from whichever config block is present', () => {
      expect(render({ acme: { server: 'https://acme' } }).wrapper.vm.configType).toBe('acme');
      expect(render({ ca: { secretName: 'ca' } }).wrapper.vm.configType).toBe('ca');
    });

    it('should drop the previous block when the type changes', () => {
      const { wrapper, value } = render({ ca: { secretName: 'ca' } });

      wrapper.vm.configType = 'acme';

      expect(value.spec.ca).toBeUndefined();
      // Seeded with Let's Encrypt production so the server radio lands on a sensible default
      expect(value.spec.acme).toStrictEqual({
        server: 'https://acme-v02.api.letsencrypt.org/directory', privateKeySecretRef: { name: '' }, solvers: []
      });
    });

    it('should never leave two config blocks set, which cert-manager rejects', () => {
      const { wrapper, value } = render({ ca: { secretName: 'ca' } });

      wrapper.vm.configType = 'acme';
      wrapper.vm.configType = 'vault';

      const present = ['selfSigned', 'ca', 'acme', 'vault', 'venafi'].filter((type) => !!value.spec[type]);

      expect(present).toStrictEqual(['vault']);
    });

    it('should describe each issuer type, not just name it', () => {
      // Most people picking an issuer type for the first time do not know a CA issuer from a
      // self signed one.
      const options = render().wrapper.vm.configTypeOptions;

      expect(options.map((o: any) => o.value)).toStrictEqual(['selfSigned', 'ca', 'acme', 'vault', 'venafi']);
      options.forEach((o: any) => expect(o.description).toBeTruthy());
    });

    it('should flag types the form does not cover', () => {
      expect(render({ vault: {} }).wrapper.vm.isUnsupportedConfigType).toBe(true);
      expect(render({ venafi: {} }).wrapper.vm.isUnsupportedConfigType).toBe(true);
      expect(render({ acme: {} }).wrapper.vm.isUnsupportedConfigType).toBe(false);
    });
  });

  describe('validation', () => {
    const rulesFor = (spec: Record<string, any>) => render(spec).wrapper.vm.fvExtraRules;

    it('should require a config type', () => {
      // `configType` seeds one on create, so this is the hand-written / YAML-authored case
      expect(rulesFor({}).exactlyOneConfigType({})).toBe('certManager.issuer.validation.noConfigType');
    });

    it('should reject more than one config type', () => {
      const result = rulesFor({}).exactlyOneConfigType({ ca: {}, acme: {} });

      expect(result).toContain('certManager.issuer.validation.multipleConfigTypes');
    });

    it('should accept exactly one config type', () => {
      expect(rulesFor({}).exactlyOneConfigType({ selfSigned: {} })).toBeUndefined();
    });

    it('should require the ACME account key secret, which the webhook rejects when missing', () => {
      const spec = { acme: { server: 'https://acme', privateKeySecretRef: {} } };

      expect(rulesFor({}).acmeRequiredFields(spec)).toBe('certManager.issuer.validation.privateKeySecretRequired');
    });

    it('should require an ACME server URL', () => {
      expect(rulesFor({}).acmeRequiredFields({ acme: {} })).toBe('certManager.issuer.validation.serverRequired');
    });

    it('should accept a complete ACME config', () => {
      const spec = { acme: { server: 'https://acme', privateKeySecretRef: { name: 'key' } } };

      expect(rulesFor({}).acmeRequiredFields(spec)).toBeUndefined();
    });

    it('should not impose ACME requirements on other issuer types', () => {
      expect(rulesFor({}).acmeRequiredFields({ selfSigned: {} })).toBeUndefined();
    });

    it('should reject a solver that sets more than one ingress key', () => {
      const solvers = [{ http01: { ingress: { ingressClassName: 'nginx', name: 'my-ingress' } } }];

      expect(rulesFor({}).acmeSolverShape({ acme: { solvers } })).toBe('certManager.issuer.validation.solverIngress');
    });

    it('should accept a solver with exactly one ingress key', () => {
      const solvers = [{ http01: { ingress: { ingressClassName: 'nginx' } } }];

      expect(rulesFor({}).acmeSolverShape({ acme: { solvers } })).toBeUndefined();
    });

    it.each([
      ['a solver with neither challenge type', { selector: {} }],
      ['a solver with both challenge types', { http01: {}, dns01: { cloudflare: {} } }],
    ])('should reject %s', (_label, solver) => {
      const result = rulesFor({}).acmeSolverShape({ acme: { solvers: [solver] } });

      expect(result).toBe('certManager.issuer.validation.solverChallengeType');
    });

    it('should reject a DNS-01 solver with no provider chosen', () => {
      const result = rulesFor({}).acmeSolverShape({ acme: { solvers: [{ dns01: {} }] } });

      expect(result).toBe('certManager.issuer.validation.solverProvider');
    });

    it('should accept well formed solvers', () => {
      const solvers = [{ http01: { ingress: {} } }, { dns01: { cloudflare: {} } }];

      expect(rulesFor({}).acmeSolverShape({ acme: { solvers } })).toBeUndefined();
    });

    it('should accept an issuer with no solvers at all', () => {
      expect(rulesFor({}).acmeSolverShape({ selfSigned: {} })).toBeUndefined();
    });
  });

  describe('config type options', () => {
    // `RadioButton` renders the label as HTML but interpolates the description as text, so the
    // description has to be asked for raw - otherwise "Let's Encrypt" arrives as "Let&#39;s Encrypt".
    it('should ask for the description unescaped and the label escaped', () => {
      const wrapper = shallowMount(IssuerEdit, {
        props:  { value: { metadata: {}, spec: {} }, mode: 'create' },
        global: {
          mocks: {
            t:           (key: string, _args: any, raw?: boolean) => (raw ? `raw:${ key }` : `escaped:${ key }`),
            $store:      { getters: { 'i18n/t': (key: string) => key, currentProduct: {} } },
            $route:      { query: {}, params: {} },
            $fetchState: { pending: false },
          },
        },
      });

      const options = wrapper.vm.configTypeOptions as { label: string, description: string }[];

      expect(options.map((option) => option.description)).toStrictEqual(
        ISSUER_CONFIG_TYPES.map((type) => `raw:certManager.issuer.typeDescription.${ type }`)
      );
      expect(options.map((option) => option.label)).toStrictEqual(
        ISSUER_CONFIG_TYPES.map((type) => `escaped:certManager.issuer.type.${ type }`)
      );
    });
  });
});
