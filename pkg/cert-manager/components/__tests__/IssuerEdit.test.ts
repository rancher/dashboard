import { shallowMount } from '@vue/test-utils';
import IssuerEdit from '../IssuerEdit.vue';

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
      expect(value.spec.acme).toStrictEqual({
        server: '', privateKeySecretRef: { name: '' }, solvers: []
      });
    });

    it('should never leave two config blocks set, which cert-manager rejects', () => {
      const { wrapper, value } = render({ ca: { secretName: 'ca' } });

      wrapper.vm.configType = 'acme';
      wrapper.vm.configType = 'vault';

      const present = ['selfSigned', 'ca', 'acme', 'vault', 'venafi'].filter((type) => !!value.spec[type]);

      expect(present).toStrictEqual(['vault']);
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
});
