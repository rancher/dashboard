import { mount } from '@vue/test-utils';
import RcButton from './RcButton.vue';

// Its own file so the module that remembers what has been reported starts empty.
describe('rcButton.vue deprecation warnings', () => {
  it('reports a deprecated variant once, not once per instance', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    mount(RcButton, { props: { variant: 'tertiary' } });
    mount(RcButton, { props: { variant: 'tertiary' } });
    mount(RcButton, { props: { variant: 'tertiary' } });

    const forTertiary = warn.mock.calls.filter(([message]) => typeof message === 'string' && message.includes('variant="tertiary"'));

    expect(forTertiary).toHaveLength(1);
    warn.mockRestore();
  });
});
