import { mount } from '@vue/test-utils';
import AcmeConfig from '../AcmeConfig.vue';
import { ACME_SERVERS } from '../../../form-options';

const STUB = { template: '<div />' };

function render(acme: Record<string, any>) {
  const wrapper = mount(AcmeConfig, {
    props:  { value: acme, mode: 'edit' },
    global: {
      mocks: { t: (key: string) => key },
      stubs: {
        RadioGroup:       STUB,
        LabeledInput:     STUB,
        Checkbox:         STUB,
        Banner:           STUB,
        ArrayListGrouped: STUB,
        AcmeSolver:       STUB,
      },
    },
  });

  return { wrapper, acme };
}

describe('component: AcmeConfig', () => {
  describe('server choice', () => {
    it.each([
      ['production', ACME_SERVERS.PRODUCTION],
      ['staging', ACME_SERVERS.STAGING],
    ])('should recognise the %s Let\'s Encrypt URL', (expected, server) => {
      expect(render({ server }).wrapper.vm.serverChoice).toBe(expected);
    });

    it('should treat anything else as a custom server', () => {
      expect(render({ server: 'https://ca.internal/acme' }).wrapper.vm.serverChoice).toBe('custom');
    });

    it('should treat an unset server as custom', () => {
      expect(render({}).wrapper.vm.serverChoice).toBe('custom');
    });

    it.each([
      ['production', ACME_SERVERS.PRODUCTION],
      ['staging', ACME_SERVERS.STAGING],
    ])('should write the URL when %s is chosen', (choice, expected) => {
      const { wrapper, acme } = render({ server: '' });

      wrapper.vm.serverChoice = choice as any;

      expect(acme.server).toBe(expected);
    });

    it('should clear the URL when switching to custom, so it can be typed', () => {
      const { wrapper, acme } = render({ server: ACME_SERVERS.PRODUCTION });

      wrapper.vm.serverChoice = 'custom';

      expect(acme.server).toBe('');
    });

    it('should only allow editing the URL for a custom server', () => {
      // Staging vs production is the consequential choice; the URL is a consequence of it.
      expect(render({ server: ACME_SERVERS.STAGING }).wrapper.vm.isCustomServer).toBe(false);
      expect(render({ server: 'https://ca.internal/acme' }).wrapper.vm.isCustomServer).toBe(true);
    });

    it('should offer all three choices', () => {
      expect(render({}).wrapper.vm.serverChoiceOptions.map((o: any) => o.value)).toStrictEqual([
        'production', 'staging', 'custom',
      ]);
    });
  });
});
