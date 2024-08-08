import { shallowMount } from '@vue/test-utils';
import Loki from '@shell/edit/logging.banzaicloud.io.output/providers/loki.vue';

describe('component: Loki', () => {
  it('should display URL placeholder', () => {
    const wrapper = shallowMount(Loki, { props: { mode: 'edit', namespace: 'whatever' } });
    const url = 'https://127.0.0.1:8000';

    const placeholder = wrapper.find('[data-testid="loki-url"]').attributes('placeholder');

    expect(placeholder).toBe(url);
  });
});
