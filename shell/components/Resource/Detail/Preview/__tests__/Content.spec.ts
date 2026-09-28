import { shallowMount } from '@vue/test-utils';
import Content from '@shell/components/Resource/Detail/Preview/Content.vue';
import CodeMirror from '@shell/components/CodeMirror.vue';

describe('component: Resource Detail Preview Content', () => {
  const toTextDirective = (el: any, binding: any) => {
    el.textContent = binding.value;
  };
  const global = {
    directives: {
      cleanHtml: toTextDirective,
      t:         toTextDirective
    },
    stubs: { CodeMirror: true }
  };

  it('should display an empty message when value is empty', () => {
    const wrapper = shallowMount(Content, {
      props: { value: '' },
      global
    });

    const span = wrapper.find('span');

    expect(span.exists()).toBe(true);
    expect(span.text()).toBe('detailText.empty');
  });

  it('should display a CodeMirror component for a valid JSON string', () => {
    const jsonValue = '{"key":"value"}';
    const wrapper = shallowMount(Content, {
      props: { value: jsonValue },
      global
    });

    const codeMirror = wrapper.findComponent(CodeMirror);

    expect(codeMirror.exists()).toBe(true);

    const expectedFormattedJson = JSON.stringify(JSON.parse(jsonValue), null, 2);

    expect(codeMirror.props('value')).toBe(expectedFormattedJson);
  });

  it('should display a plain text message for a non-JSON string', () => {
    const textValue = 'line 1';
    const wrapper = shallowMount(Content, {
      props: { value: textValue },
      global
    });

    const span = wrapper.find('[data-testid="detail-top_html"]');

    expect(span.exists()).toBe(true);
    expect(span.text()).toBe('line 1');
    expect(span.classes()).toContain('monospace');
  });

  it('should display a plain text message for a string that looks like JSON but is invalid', () => {
    const invalidJson = '{';
    const wrapper = shallowMount(Content, {
      props: { value: invalidJson },
      global
    });

    const span = wrapper.find('[data-testid="detail-top_html"]');

    expect(span.exists()).toBe(true);
    expect(span.text()).toBe('{');
  });
});
