import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import {
  useIsInResourceDetailPage,
  useResourceDetailPageProvider,
} from '@shell/composables/resourceDetail';

describe('useIsInResourceDetailPage', () => {
  it('returns false when no provider is present', () => {
    const comp = defineComponent({
      setup() {
        return { result: useIsInResourceDetailPage() };
      },
      template: '<span />',
    });

    const wrapper = mount(comp);

    expect(wrapper.vm.result).toStrictEqual(false);
  });

  it('returns true when useResourceDetailPageProvider has been called by an ancestor', () => {
    const Child = defineComponent({
      setup() {
        return { result: useIsInResourceDetailPage() };
      },
      template: '<span />',
    });

    const Parent = defineComponent({
      components: { Child },
      setup() {
        useResourceDetailPageProvider();
      },
      template: '<Child />',
    });

    const wrapper = mount(Parent);
    const child = wrapper.findComponent(Child);

    expect((child.vm as any).result).toStrictEqual(true);
  });

  it('returns false in a sibling that is not a descendant of the provider', () => {
    const ChildWith = defineComponent({
      setup() {
        useResourceDetailPageProvider();
      },
      template: '<span />',
    });

    const ChildWithout = defineComponent({
      setup() {
        return { result: useIsInResourceDetailPage() };
      },
      template: '<div />',
    });

    const Parent = defineComponent({
      components: { ChildWith, ChildWithout },
      template:   '<div><ChildWith /><ChildWithout /></div>',
    });

    const wrapper = mount(Parent);
    const withoutChild = wrapper.findComponent(ChildWithout);

    expect((withoutChild.vm as any).result).toStrictEqual(false);
  });
});
