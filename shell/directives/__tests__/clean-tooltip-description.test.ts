import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import DOMPurify from 'dompurify';
import cleanTooltip from '@shell/directives/clean-tooltip';
import { waitUntil } from './utils/tooltip';

let sanitize: jest.SpyInstance;


const mountOptions = {
  global:   { directives: { 'clean-tooltip': cleanTooltip } },
  attachTo: document.body,
};

const describedText = (el: Element): string | null => {
  const id = el.getAttribute('aria-describedby');

  return id ? document.getElementById(id)?.textContent ?? null : null;
};

describe('clean-tooltip accessible description', () => {
  beforeEach(() => {
    sanitize = jest.spyOn(DOMPurify, 'sanitize');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should describe the trigger from mount, before any interaction', () => {
    const wrapper = mount({ template: `<i v-clean-tooltip="'Pull secrets'" role="button" tabindex="0" />` }, mountOptions);

    expect(describedText(wrapper.element)).toBe('Pull secrets');

    wrapper.unmount();
  });

  it('should still describe the trigger after a full show and hide cycle', async() => {
    const wrapper = mount({ template: `<i v-clean-tooltip="'Pull secrets'" role="button" tabindex="0" />` }, mountOptions);
    const el = wrapper.element;

    el.dispatchEvent(new MouseEvent('mouseenter'));
    await waitUntil(() => !!document.querySelector('.v-popper__popper--shown'));

    expect(el.getAttribute('aria-describedby')).toBe(document.querySelector('.v-popper__popper')?.id);

    el.dispatchEvent(new MouseEvent('mouseleave'));
    await waitUntil(() => describedText(el) === 'Pull secrets');

    expect(describedText(el)).toBe('Pull secrets');

    wrapper.unmount();
  });

  it('should still describe the previous trigger when the next one has nothing to show', async() => {
    const wrapper = mount({
      template: `
        <div>
          <i id="a" v-clean-tooltip="'Pull secrets'" role="button" tabindex="0" />
          <i id="b" v-clean-tooltip="{ content: '', triggers: ['hover', 'focus'] }" role="button" tabindex="0" />
        </div>
      `,
    }, mountOptions);
    const a = wrapper.find('#a').element;

    a.dispatchEvent(new MouseEvent('mouseenter'));
    await waitUntil(() => !!document.querySelector('.v-popper__popper--shown'));

    expect(a.getAttribute('aria-describedby')).toBe(document.querySelector('.v-popper__popper')?.id);

    wrapper.find('#b').element.dispatchEvent(new FocusEvent('focus'));
    await waitUntil(() => describedText(a) === 'Pull secrets');

    expect(describedText(a)).toBe('Pull secrets');

    wrapper.unmount();
  });

  it('should still describe the previous trigger when the next one shows its own tooltip', async() => {
    const wrapper = mount({
      template: `
        <div>
          <i id="a" v-clean-tooltip="'Pull secrets'" role="button" tabindex="0" />
          <i id="b" v-clean-tooltip="{ content: 'Image name', triggers: ['hover', 'focus'] }" role="button" tabindex="0" />
        </div>
      `,
    }, mountOptions);
    const a = wrapper.find('#a').element;

    a.dispatchEvent(new MouseEvent('mouseenter'));
    await waitUntil(() => !!document.querySelector('.v-popper__popper--shown'));

    expect(a.getAttribute('aria-describedby')).toBe(document.querySelector('.v-popper__popper')?.id);

    wrapper.find('#b').element.dispatchEvent(new FocusEvent('focus'));
    await waitUntil(() => describedText(a) === 'Pull secrets');

    expect(describedText(a)).toBe('Pull secrets');

    wrapper.unmount();
  });

  it.each([
    ['markup', 'Use <b>kubectl</b> to<br>continue', 'Use kubectl tocontinue'],
    ['entities', 'Requests &amp; limits', 'Requests & limits'],
    ['plain text', 'Pull secrets', 'Pull secrets'],
  ])('should flatten %s content to plain text', (_name, content, expected) => {
    const wrapper = mount({ template: `<i v-clean-tooltip="'${ content }'" role="button" tabindex="0" />` }, mountOptions);

    expect(describedText(wrapper.element)).toBe(expected);

    wrapper.unmount();
  });

  it('should not describe a trigger that has no content', () => {
    const wrapper = mount({ template: `<i v-clean-tooltip="''" role="button" tabindex="0" />` }, mountOptions);

    expect(wrapper.element.getAttribute('aria-describedby')).toBeNull();

    wrapper.unmount();
  });

  it('should track content changes', async() => {
    const component = defineComponent({
      data() {
        return { content: 'First' };
      },
      template: `<i v-clean-tooltip="content" role="button" tabindex="0" />`,
    });
    const wrapper = mount(component, mountOptions);

    expect(describedText(wrapper.element)).toBe('First');

    await wrapper.setData({ content: 'Second' });

    expect(describedText(wrapper.element)).toBe('Second');

    wrapper.unmount();
  });

  it('should not describe a trigger whose tooltip repeats its own text', () => {
    const wrapper = mount({ template: `<p v-clean-tooltip="'rancher-monitoring-crd'">rancher-monitoring-crd</p>` }, mountOptions);

    expect(wrapper.element.getAttribute('aria-describedby')).toBeNull();

    wrapper.unmount();
  });

  it('should describe a trigger once its tooltip stops repeating its own text', async() => {
    const component = defineComponent({
      data() {
        return { content: 'rancher-monitoring-crd' };
      },
      template: `<p v-clean-tooltip="content">rancher-monitoring-crd</p>`,
    });
    const wrapper = mount(component, mountOptions);

    expect(wrapper.element.getAttribute('aria-describedby')).toBeNull();

    await wrapper.setData({ content: 'Installed by rancher-monitoring' });

    expect(describedText(wrapper.element)).toBe('Installed by rancher-monitoring');

    wrapper.unmount();
  });

  it('should describe a trigger once its own text stops repeating its tooltip', async() => {
    const component = defineComponent({
      data() {
        return { label: 'rancher-monitoring-crd' };
      },
      template: `<p v-clean-tooltip="'rancher-monitoring-crd'">{{ label }}</p>`,
    });
    const wrapper = mount(component, mountOptions);

    expect(wrapper.element.getAttribute('aria-describedby')).toBeNull();

    await wrapper.setData({ label: 'rancher-monitoring' });

    expect(describedText(wrapper.element)).toBe('rancher-monitoring-crd');

    wrapper.unmount();
  });

  it('should keep the description nodes out of the accessibility tree', () => {
    const wrapper = mount({ template: `<i v-clean-tooltip="'Pull secrets'" role="button" tabindex="0" />` }, mountOptions);
    const container = document.querySelector('[data-clean-tooltip-descriptions]') as HTMLElement;

    expect(container.style.display).toBe('none');

    wrapper.unmount();
  });

  it('should not sanitise plain text content at mount', () => {
    const wrapper = mount({ template: `<i v-clean-tooltip="'Pull secrets'" role="button" tabindex="0" />` }, mountOptions);

    expect(sanitize).not.toHaveBeenCalled();
    expect(describedText(wrapper.element)).toBe('Pull secrets');

    wrapper.unmount();
  });

  it('should sanitise content that carries markup', () => {
    const content = 'Use <b>kubectl</b> to continue';
    const wrapper = mount({ template: `<i v-clean-tooltip="'${ content }'" role="button" tabindex="0" />` }, mountOptions);

    expect(sanitize).toHaveBeenCalledWith(content, expect.anything());
    expect(describedText(wrapper.element)).toBe('Use kubectl to continue');

    wrapper.unmount();
  });

  it('should remove the hidden description node on unmount', () => {
    const wrapper = mount({ template: `<i v-clean-tooltip="'Pull secrets'" role="button" tabindex="0" />` }, mountOptions);
    const id = wrapper.element.getAttribute('aria-describedby');

    expect(document.getElementById(id as string)).not.toBeNull();

    wrapper.unmount();

    expect(document.getElementById(id as string)).toBeNull();
  });
});
