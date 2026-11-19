import { mount } from '@vue/test-utils';
import RcButton from './RcButton.vue';

// Its own file so the module that remembers what has been reported starts
// empty, and ordered because that module is shared by every test in it.
describe('rcButton.vue deprecation warnings', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => warn.mockRestore());

  const deprecations = () => warn.mock.calls.filter(([message]) => typeof message === 'string' && message.includes('is deprecated'));

  it('names the deprecated value and its replacement', () => {
    mount(RcButton, { props: { variant: 'primary' } });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('variant="primary" is deprecated'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('variant="solid"'));
  });

  it('says nothing more for any other deprecated value', () => {
    mount(RcButton, { props: { variant: 'secondary' } });
    mount(RcButton, { props: { variant: 'tertiary' } });
    mount(RcButton, { props: { variant: 'multiAction' } });
    mount(RcButton, { props: { small: true } });

    expect(deprecations()).toHaveLength(0);
  });

  it('says nothing for a current variant value', () => {
    mount(RcButton, { props: { variant: 'outline' } });

    expect(deprecations()).toHaveLength(0);
  });
});
