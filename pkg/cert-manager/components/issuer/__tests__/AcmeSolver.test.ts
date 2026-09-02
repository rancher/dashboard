import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AcmeSolver from '../AcmeSolver.vue';

const STUB = { template: '<div />' };

const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

function render(solver: Record<string, any>) {
  return mount(AcmeSolver, {
    props:  { value: solver, mode: 'edit' },
    global: {
      provide: { store },
      stubs:   {
        RadioGroup:    STUB,
        LabeledInput:  STUB,
        ArrayList:     STUB,
        KeyValue:      STUB,
        Banner:        { template: '<div class="banner" />' },
        Dns01Provider: { props: ['value'], template: '<div class="dns01" />' },
      },
    },
  });
}

describe('component: AcmeSolver', () => {
  it('should default a new solver to HTTP-01', () => {
    const solver: Record<string, any> = {};

    expect(render(solver).vm.challengeType).toBe('http01');
    expect(solver.http01).toStrictEqual({ ingress: {} });
  });

  it('should report DNS-01 when a dns01 block is present', () => {
    expect(render({ dns01: { cloudflare: {} } }).vm.challengeType).toBe('dns01');
  });

  it('should drop http01 when switching to DNS-01', () => {
    const solver: Record<string, any> = { http01: { ingress: { ingressClassName: 'nginx' } } };
    const wrapper = render(solver);

    wrapper.vm.challengeType = 'dns01';

    expect(solver.http01).toBeUndefined();
    expect(solver.dns01).toStrictEqual({});
  });

  it('should drop dns01 when switching to HTTP-01', () => {
    const solver: Record<string, any> = { dns01: { cloudflare: { email: 'a@b.com' } } };
    const wrapper = render(solver);

    wrapper.vm.challengeType = 'http01';

    expect(solver.dns01).toBeUndefined();
    expect(solver.http01).toStrictEqual({ ingress: {} });
  });

  it('should never leave both challenge types set, which cert-manager rejects', () => {
    const solver: Record<string, any> = { http01: { ingress: {} } };
    const wrapper = render(solver);

    wrapper.vm.challengeType = 'dns01';
    wrapper.vm.challengeType = 'http01';
    wrapper.vm.challengeType = 'dns01';

    expect(!!solver.http01 && !!solver.dns01).toBe(false);
  });

  it('should keep existing dns01 provider config when toggling away and back', () => {
    const solver: Record<string, any> = { dns01: { cloudflare: { email: 'a@b.com' } } };
    const wrapper = render(solver);

    wrapper.vm.challengeType = 'http01';
    wrapper.vm.challengeType = 'dns01';

    // Switching away discards the block - the user explicitly chose a different challenge type.
    expect(solver.dns01).toStrictEqual({});
  });

  it('should treat an empty selector as a catch-all', () => {
    expect(render({ http01: { ingress: {} } }).vm.isCatchAll).toBe(true);
    expect(render({ selector: { dnsZones: ['example.com'] } }).vm.isCatchAll).toBe(false);
    expect(render({ selector: { matchLabels: { a: 'b' } } }).vm.isCatchAll).toBe(false);
  });

  it('should describe each challenge type, not just name it', () => {
    const options = render({}).vm.challengeTypeOptions;

    expect(options.map((o: any) => o.value)).toStrictEqual(['http01', 'dns01']);
    options.forEach((o: any) => expect(o.description).toBeTruthy());
  });

  it('should give each solver a distinct radio group name', () => {
    const first = render({}).vm.radioName;
    const second = render({}).vm.radioName;

    expect(first).not.toBe(second);
  });

  it('should flag a Gateway API solver it cannot edit', () => {
    const wrapper = render({ http01: { gatewayHTTPRoute: { parentRefs: [] } } });

    expect(wrapper.find('.banner').exists()).toBe(true);
  });

  describe('http01 ingress mode', () => {
    // cert-manager rejects any combination of ingressClassName / name / class, so the form has to
    // offer them as a choice rather than as three fields.
    it('should default to the ingress class name', () => {
      expect(render({ http01: { ingress: {} } }).vm.ingressMode).toBe('ingressClassName');
    });

    it.each([
      ['ingressClassName', { ingressClassName: 'nginx' }],
      ['name', { name: 'my-ingress' }],
      ['class', { class: 'nginx' }],
    ])('should derive %s from the key that is set', (expected, ingress) => {
      expect(render({ http01: { ingress } }).vm.ingressMode).toBe(expected);
    });

    it('should drop the other keys when the mode changes', () => {
      const solver: Record<string, any> = { http01: { ingress: { ingressClassName: 'nginx' } } };
      const wrapper = render(solver);

      wrapper.vm.ingressMode = 'name';

      expect(solver.http01.ingress).toStrictEqual({ name: '' });
    });

    it('should never leave two of them set', () => {
      const solver: Record<string, any> = { http01: { ingress: { ingressClassName: 'nginx' } } };
      const wrapper = render(solver);

      wrapper.vm.ingressMode = 'class';
      wrapper.vm.ingressMode = 'name';

      expect(Object.keys(solver.http01.ingress)).toStrictEqual(['name']);
    });

    it('should keep unrelated ingress settings', () => {
      const solver: Record<string, any> = { http01: { ingress: { ingressClassName: 'nginx', serviceType: 'ClusterIP' } } };
      const wrapper = render(solver);

      wrapper.vm.ingressMode = 'name';

      expect(solver.http01.ingress.serviceType).toBe('ClusterIP');
    });
  });
});
