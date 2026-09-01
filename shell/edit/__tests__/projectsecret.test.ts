import { shallowMount } from '@vue/test-utils';
import ProjectSecretProxy from '@shell/edit/projectsecret.vue';
import Secret from '@shell/edit/secret/index.vue';

describe('component: ProjectSecretProxy', () => {
  it('should render Secret component', () => {
    const wrapper = shallowMount(ProjectSecretProxy, {
      global: { stubs: { Secret: true } },
      attrs:  { someAttr: 'someValue' }
    });

    const secretComponent = wrapper.findComponent(Secret);

    expect(secretComponent.exists()).toBe(true);
  });

  it('should pass attributes to Secret component', () => {
    const wrapper = shallowMount(ProjectSecretProxy, {
      global: { stubs: { Secret: true } },
      attrs:  {
        mode:  'create',
        value: { metadata: { name: 'test' } }
      }
    });

    const secretComponent = wrapper.findComponent(Secret);

    expect(secretComponent.attributes('mode')).toBe('create');
  });

  it('should pass event listeners to Secret component', () => {
    const onInput = jest.fn();
    const wrapper = shallowMount(ProjectSecretProxy, {
      global: { stubs: { Secret: true } },
      attrs:  { onInput }
    });

    const secretComponent = wrapper.findComponent(Secret);

    expect(secretComponent.vm.$attrs.onInput).toBe(onInput);
  });
});
