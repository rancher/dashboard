import FileDiff from '@shell/components/FileDiff.vue';
import { mount } from '@vue/test-utils';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';

describe('global monitorning YAML Compare Change', () => {
  it('test that there is a specified class name', () => {
    const wrapper = mount(FileDiff, {
      directives: { cleanHtmlDirective },
      stubs:      { 'resize-observer': true },
      propsData:  {
        filename: '.yaml',
        orig:     'data: test1',
        neu:      'data: test2',
      }
    });

    const element = wrapper.find('.d2h-diff-table').element;

    expect(element).toBeDefined();
  });
});
