import { mount } from '@vue/test-utils';
import cleanTooltip from '@shell/directives/clean-tooltip';
import { waitForTooltip, waitForNoTooltip } from './utils/tooltip';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mountOptions = {
  global:   { directives: { 'clean-tooltip': cleanTooltip } },
  attachTo: document.body,
};

const infoIcon = `<button v-clean-tooltip="{ content: 'Pull secrets', triggers: ['hover', 'touch', 'focus', 'click'] }" type="button" />`;

const click = () => new MouseEvent('click', { bubbles: true, cancelable: true });

const isShown = () => document.querySelector('.v-popper__popper--shown') !== null;

/**
 * Waits out the hide a click would have caused, so that asserting the tooltip is still shown means
 * it survived rather than that the assertion ran too early to see it go.
 */
const settle = () => wait(600);

describe('clean-tooltip activation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should leave the tooltip shown when the trigger is activated from the keyboard', async() => {
    const wrapper = mount({ template: infoIcon }, mountOptions);

    wrapper.element.dispatchEvent(new FocusEvent('focus'));
    await waitForTooltip();

    expect(isShown()).toBe(true);

    wrapper.element.dispatchEvent(click());
    await settle();

    expect(isShown()).toBe(true);

    wrapper.unmount();
  });

  it('should leave the tooltip shown when the trigger is clicked with a pointer', async() => {
    const wrapper = mount({ template: infoIcon }, mountOptions);

    wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
    wrapper.element.dispatchEvent(new FocusEvent('focus'));
    await waitForTooltip();

    expect(isShown()).toBe(true);

    wrapper.element.dispatchEvent(click());
    await settle();

    expect(isShown()).toBe(true);

    wrapper.unmount();
  });

  it('should show the tooltip for a click that arrives without a focus', async() => {
    const wrapper = mount({ template: infoIcon }, mountOptions);

    wrapper.element.dispatchEvent(click());
    await waitForTooltip();

    expect(isShown()).toBe(true);

    wrapper.unmount();
  });

  it('should still toggle a tooltip that only a click opens', async() => {
    const wrapper = mount({ template: `<button v-clean-tooltip="{ content: 'Pull secrets', triggers: ['click'] }" type="button" />` }, mountOptions);

    wrapper.element.dispatchEvent(click());
    await waitForTooltip();

    expect(isShown()).toBe(true);

    wrapper.element.dispatchEvent(click());
    await waitForNoTooltip();

    expect(isShown()).toBe(false);

    wrapper.unmount();
  });
});
