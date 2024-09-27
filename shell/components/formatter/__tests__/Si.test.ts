import { mount } from '@vue/test-utils';
import Si from '@shell/components/formatter/Si.vue';

describe('component: Si formatter', () => {
  it('should format integers as Bytes', async() => {
    const wrapper = await mount(Si, { props: { value: 13 } });

    const element = wrapper.find('span');

    expect(element.text()).toBe('13 B');
  });

  it.each([
    ['1024 Mi', '1 GiB'],
    ['1024', '1 KiB'],
    ['2048 GiB', '2 TiB']
  ])('should parse and re-format Si input strings', async(input, out) => {
    const wrapper = await mount(Si, { props: { value: input, needParseSi: true } });

    const element = wrapper.find('span');

    expect(element.text()).toBe(out);
  });

  it('should allow additional si formatting opts', async() => {
    const wrapper = await mount(Si, {
      props: {
        value: '1 TiB', needParseSi: true, opts: { maxExponent: 3 }
      }
    });
    const element = wrapper.find('span');

    expect(element.text()).toBe('1024 GiB');
  });
});
