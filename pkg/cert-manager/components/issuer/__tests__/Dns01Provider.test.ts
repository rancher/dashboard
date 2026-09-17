import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Dns01Provider from '../Dns01Provider.vue';
import { DNS01_PROVIDER_FIELDS } from '../dns01-providers';

const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

function render(dns01: Record<string, any>) {
  const wrapper = mount(Dns01Provider, {
    props:  { value: dns01, mode: 'edit' },
    global: {
      provide: { store },
      stubs:   {
        LabeledSelect: {
          props:    ['value'],
          emits:    ['update:value'],
          template: '<div class="labeled-select" />',
        },
        LabeledInput: {
          props:    ['value', 'label'],
          emits:    ['update:value'],
          template: '<div class="labeled-input" />',
        },
        Banner: { template: '<div class="banner"><slot /></div>' },
      },
    },
  });

  return wrapper;
}

describe('component: Dns01Provider', () => {
  it('should read the provider from whichever key is present', () => {
    expect(render({ cloudflare: {} }).vm.provider).toBe('cloudflare');
    expect(render({ route53: {} }).vm.provider).toBe('route53');
  });

  it('should render a field for each descriptor of a known provider', () => {
    // cloudflare: email + apiTokenSecretRef.name + apiTokenSecretRef.key
    expect(render({ cloudflare: {} }).findAll('.labeled-input')).toHaveLength(3);
  });

  it('should replace the previous provider when a new one is chosen', () => {
    const dns01: Record<string, any> = { cloudflare: { email: 'a@b.com' } };
    const wrapper = render(dns01);

    wrapper.vm.provider = 'route53';

    expect(Object.keys(dns01)).toStrictEqual(['route53']);
    expect(dns01.cloudflare).toBeUndefined();
  });

  it('should write a field into the live provider object', () => {
    const dns01: Record<string, any> = { cloudflare: {} };
    const wrapper = render(dns01);

    wrapper.vm.updateField('email', 'admin@example.com');
    wrapper.vm.updateField('apiTokenSecretRef.name', 'cloudflare-token');

    expect(dns01.cloudflare).toStrictEqual({
      email:             'admin@example.com',
      apiTokenSecretRef: { name: 'cloudflare-token' },
    });
  });

  it('should clear a field rather than persisting an empty string', () => {
    const dns01: Record<string, any> = { cloudflare: { email: 'a@b.com' } };

    render(dns01).vm.updateField('email', '');

    expect(dns01.cloudflare.email).toBeUndefined();
  });

  it('should preserve keys it does not render when editing a known provider', () => {
    // The single biggest data-loss risk: a field cert-manager supports but this form omits must
    // survive being edited through the UI.
    const dns01: Record<string, any> = {
      route53: {
        region:                   'eu-west-1',
        secretAccessKeySecretRef: { name: 'aws', key: 'secret' },
        auth:                     { kubernetes: { serviceAccountRef: { name: 'sa' } } },
        someFutureField:          'keep me',
      },
    };

    render(dns01).vm.updateField('region', 'us-east-1');

    expect(dns01.route53.auth).toStrictEqual({ kubernetes: { serviceAccountRef: { name: 'sa' } } });
    expect(dns01.route53.someFutureField).toBe('keep me');
    expect(dns01.route53.secretAccessKeySecretRef).toStrictEqual({ name: 'aws', key: 'secret' });
    expect(dns01.route53.region).toBe('us-east-1');
  });

  it('should not render fields for an unknown provider, and should leave its config alone', () => {
    const config = {
      groupName: 'acme', solverName: 'my-solver', config: { apiKey: 'x' }
    };
    const dns01: Record<string, any> = { webhook: { ...config } };
    const wrapper = render(dns01);

    expect(wrapper.vm.isKnownProvider).toBe(false);
    expect(wrapper.findAll('.labeled-input')).toHaveLength(0);
    expect(wrapper.find('.banner').exists()).toBe(true);
    expect(dns01.webhook).toStrictEqual(config);
  });

  it('should show the raw config of an unknown provider', () => {
    const wrapper = render({ webhook: { solverName: 'my-solver' } });

    expect(wrapper.vm.unknownProviderYaml).toContain('my-solver');
  });

  describe('field layout', () => {
    // The wrapping is CSS, so jsdom cannot see it. This only guards the hook the stylesheet
    // needs: `.row` does not wrap on its own, and most providers overflow a single row.
    // `webhook` is deliberately absent - it has no descriptors and renders the raw editor.
    it.each(Object.keys(DNS01_PROVIDER_FIELDS))('should mark the field row of %s as wrapping', (provider) => {
      const wrapper = render({ [provider]: {} });
      const row = wrapper.find('.row.provider-fields');

      expect(row.exists()).toBe(true);
      expect(row.findAll('.col')).toHaveLength(DNS01_PROVIDER_FIELDS[provider].length);
    });

    it('should be laying out more fields than fit in one unwrapped row', () => {
      // Guards the test above from passing vacuously if the providers ever shrink to two fields.
      const widest = Math.max(...Object.values(DNS01_PROVIDER_FIELDS).map((fields) => fields.length));

      expect(widest).toBeGreaterThan(2);
    });
  });
});
