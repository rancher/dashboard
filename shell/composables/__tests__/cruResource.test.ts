import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import {
  useIsInResourceEditPage,
  useIsInResourceCreatePage,
  useResourceEditPageProvider,
  useResourceCreatePageProvider,
} from '@shell/composables/cruResource';

describe('useIsInResourceEditPage', () => {
  it('returns false when no provider is present', () => {
    const comp = defineComponent({
      setup() {
        return { result: useIsInResourceEditPage() };
      },
      template: '<span />',
    });

    const wrapper = mount(comp);

    expect((wrapper.vm as any).result).toStrictEqual(false);
  });

  it('returns true when useResourceEditPageProvider has been called by an ancestor', () => {
    const Child = defineComponent({
      setup() {
        return { result: useIsInResourceEditPage() };
      },
      template: '<span />',
    });

    const Parent = defineComponent({
      components: { Child },
      setup() {
        useResourceEditPageProvider();
      },
      template: '<Child />',
    });

    const wrapper = mount(Parent);
    const child = wrapper.findComponent(Child);

    expect((child.vm as any).result).toStrictEqual(true);
  });
});

describe('useIsInResourceCreatePage', () => {
  it('returns false when no provider is present', () => {
    const comp = defineComponent({
      setup() {
        return { result: useIsInResourceCreatePage() };
      },
      template: '<span />',
    });

    const wrapper = mount(comp);

    expect((wrapper.vm as any).result).toStrictEqual(false);
  });

  it('returns true when useResourceCreatePageProvider has been called by an ancestor', () => {
    const Child = defineComponent({
      setup() {
        return { result: useIsInResourceCreatePage() };
      },
      template: '<span />',
    });

    const Parent = defineComponent({
      components: { Child },
      setup() {
        useResourceCreatePageProvider();
      },
      template: '<Child />',
    });

    const wrapper = mount(Parent);
    const child = wrapper.findComponent(Child);

    expect((child.vm as any).result).toStrictEqual(true);
  });
});

describe('independence of edit and create providers', () => {
  it('edit provider does not affect create injector', () => {
    const Child = defineComponent({
      setup() {
        return { result: useIsInResourceCreatePage() };
      },
      template: '<span />',
    });

    const Parent = defineComponent({
      components: { Child },
      setup() {
        useResourceEditPageProvider();
      },
      template: '<Child />',
    });

    const wrapper = mount(Parent);
    const child = wrapper.findComponent(Child);

    expect((child.vm as any).result).toStrictEqual(false);
  });

  it('create provider does not affect edit injector', () => {
    const Child = defineComponent({
      setup() {
        return { result: useIsInResourceEditPage() };
      },
      template: '<span />',
    });

    const Parent = defineComponent({
      components: { Child },
      setup() {
        useResourceCreatePageProvider();
      },
      template: '<Child />',
    });

    const wrapper = mount(Parent);
    const child = wrapper.findComponent(Child);

    expect((child.vm as any).result).toStrictEqual(false);
  });

  it('both providers can coexist — child sees both as true', () => {
    const Child = defineComponent({
      setup() {
        return {
          edit:   useIsInResourceEditPage(),
          create: useIsInResourceCreatePage(),
        };
      },
      template: '<span />',
    });

    const Parent = defineComponent({
      components: { Child },
      setup() {
        useResourceEditPageProvider();
        useResourceCreatePageProvider();
      },
      template: '<Child />',
    });

    const wrapper = mount(Parent);
    const child = wrapper.findComponent(Child);

    expect((child.vm as any).edit).toStrictEqual(true);
    expect((child.vm as any).create).toStrictEqual(true);
  });
});
