import { mount } from '@vue/test-utils';
import cleanTooltip from '@shell/directives/clean-tooltip';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('clean-tooltip role="tooltip"', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should set role="tooltip" on the popper element', async() => {
    const wrapper = mount(
      { template: `<i v-clean-tooltip="'Hello world'" tabindex="0" />` },
      { global: { directives: { 'clean-tooltip': cleanTooltip } } }
    );

    wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));

    await wait(600);

    expect(document.querySelector('.v-popper__popper')?.getAttribute('role')).toBe('tooltip');

    wrapper.unmount();
  });

  it('should set role="tooltip" on a second tooltip after switching targets', async() => {
    const wrapper = mount(
      {
        template: `
          <div>
            <i id="a" v-clean-tooltip="'First'" tabindex="0" />
            <i id="b" v-clean-tooltip="'Second'" tabindex="0" />
          </div>
        `,
      },
      { global: { directives: { 'clean-tooltip': cleanTooltip } } }
    );

    const elA = wrapper.find('#a').element;
    const elB = wrapper.find('#b').element;

    elA.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(600);

    expect(document.querySelector('.v-popper__popper')?.getAttribute('role')).toBe('tooltip');

    elA.dispatchEvent(new MouseEvent('mouseleave'));
    await wait(100);

    elB.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(600);

    expect(document.querySelector('.v-popper__popper--shown')?.getAttribute('role')).toBe('tooltip');

    wrapper.unmount();
  });
});
