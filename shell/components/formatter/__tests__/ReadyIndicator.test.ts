import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import { compileStyle, parse } from '@vue/compiler-sfc';
import { shallowMount } from '@vue/test-utils';
import ReadyIndicator from '@shell/components/formatter/ReadyIndicator.vue';
import RcStatusIndicator from '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue';

describe('component: ReadyIndicator', () => {
  it('should show the value', () => {
    const wrapper = shallowMount(ReadyIndicator, {
      props: {
        value: '2/3', ready: 2, total: 3
      }
    });

    expect(wrapper.text()).toStrictEqual('2/3');
  });

  it.each([
    ['everything is ready', 'success', 3, 3],
    ['more are ready than expected', 'success', 4, 3],
    ['some are not ready', 'error', 2, 3],
    ['none are ready', 'error', 0, 3],
    ['there is nothing to be ready', 'error', 0, 0],
  ])('when %s, should show a %s dot', (_, expected, ready, total) => {
    const wrapper = shallowMount(ReadyIndicator, { props: { ready, total } });

    const dot = wrapper.findComponent(RcStatusIndicator);

    expect(dot.props('status')).toStrictEqual(expected);
    expect(dot.props('shape')).toStrictEqual('disc');
  });

  it('should use the status prop over the ready count', () => {
    const wrapper = shallowMount(ReadyIndicator, {
      props: {
        ready: 0, total: 1, status: 'none'
      }
    });

    expect(wrapper.findComponent(RcStatusIndicator).props('status')).toStrictEqual('none');
  });

  it('should space the dot from the value like a state dot in front of a link', () => {
    const style = parse(fs.readFileSync(path.resolve(__dirname, '../ReadyIndicator.vue'), 'utf8')).descriptor.styles[0];
    const { code, errors } = compileStyle({
      source:         style.content,
      filename:       'ReadyIndicator.vue',
      id:             'data-v-test',
      scoped:         style.scoped,
      preprocessLang: 'scss',
    });
    const decls: Record<string, string> = {};

    postcss.parse(code).walkRules('.ready-indicator[data-v-test]', (rule) => {
      rule.walkDecls((decl) => {
        decls[decl.prop] = decl.value;
      });
    });

    expect(errors).toStrictEqual([]);
    expect(decls.gap).toStrictEqual('12px');
  });
});
