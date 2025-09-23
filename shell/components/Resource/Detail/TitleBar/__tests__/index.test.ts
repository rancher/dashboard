import { mount, RouterLinkStub } from '@vue/test-utils';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { createStore } from 'vuex';

jest.mock(`@shell/assets/images/icons/document.svg`, () => `@shell/assets/images/icons/document.svg`);

describe('component: TitleBar/index', () => {
  const resourceTypeLabel = 'RESOURCE_TYPE_LABEL';
  const resourceTo = 'RESOURCE_TO';
  const resourceName = 'RESOURCE_NAME';
  const store = createStore({ getters: {} });

  it('should render container with class title-bar', async() => {
    const wrapper = mount(TitleBar, {
      props: {
        resourceTypeLabel,
        resourceName
      },
      global: { stubs: { 'router-link': RouterLinkStub }, provide: { store } }
    });

    expect(wrapper.find('.title-bar').exists()).toBeTruthy();
  });

  it('should render type label as a link when resourceTo is provided', async() => {
    const wrapper = mount(TitleBar, {
      props: {
        resourceTypeLabel, resourceTo, resourceName
      },
      global: { stubs: { 'router-link': RouterLinkStub }, provide: { store } }
    });

    const link = wrapper.find('.top .title .resource-link').findComponent(RouterLinkStub);

    expect(link.props('to')).toStrictEqual(resourceTo);
    expect(link.element.innerHTML.trim()).toStrictEqual(`${ resourceTypeLabel }:`);
  });

  it('should render type label as text when resourceTo is not provided', async() => {
    const wrapper = mount(TitleBar, {
      props:  { resourceTypeLabel, resourceName },
      global: { stubs: { 'router-link': RouterLinkStub }, provide: { store } }
    });

    const span = wrapper.find('.top > .title > .resource-text');

    expect(span.element.innerHTML.trim()).toStrictEqual(`${ resourceTypeLabel }:`);
  });

  it('should render resourceName', async() => {
    const wrapper = mount(TitleBar, {
      props:  { resourceTypeLabel, resourceName },
      global: { stubs: { 'router-link': RouterLinkStub }, provide: { store } }
    });

    const span = wrapper.find('.top > .title > .resource-name');

    expect(span.element.innerHTML).toStrictEqual(resourceName);
  });

  it('should hide the ShowConfiguration button if onShowConfiguration is not defined', async() => {
    const wrapper = mount(TitleBar, {
      props:  { resourceTypeLabel, resourceName },
      global: { stubs: { 'router-link': RouterLinkStub }, provide: { store } }
    });

    expect(wrapper.find('.top > .actions > .show-configuration').exists()).toBeFalsy();
  });

  it('should pass appropriate props to RcButton if onShowConfiguration is defined and emits show-configuration', async() => {
    const wrapper = mount(TitleBar, {
      props: {
        resourceTypeLabel, resourceName, onShowConfiguration: () => {}
      },
      global: { stubs: { 'router-link': RouterLinkStub, RcButton: true }, provide: { store } }
    });

    const button = wrapper.find('.top > .actions > .show-configuration');
    const buttonComponent = button.getComponent<any>('rc-button-stub');

    expect(buttonComponent.props('primary')).toStrictEqual(true);
    button.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('show-configuration');
  });

  it('should hide ActionMenu if actionMenuResource is not defined', async() => {
    const wrapper = mount(TitleBar, {
      props:  { resourceTypeLabel, resourceName },
      global: { stubs: { 'router-link': RouterLinkStub, ActionMenu }, provide: { store } }
    });

    expect(wrapper.find('.top > .actions > [data-testid="masthead-action-menu"]').exists()).toBeFalsy();
  });

  it('should pass appropriate props to ActionMenu if actionMenuResource', async() => {
    const actionMenuResource = { resource: 'test' };
    const wrapper = mount(TitleBar, {
      props: {
        resourceTypeLabel, resourceName, actionMenuResource
      },
      global: {
        stubs:   { 'router-link': RouterLinkStub, ActionMenu: true },
        provide: { store }
      }
    });

    const actions = wrapper.find('.top > .actions');
    const actionMenuComponent = actions.getComponent<any>('action-menu-stub');

    expect(actionMenuComponent.props('buttonRole')).toStrictEqual('multiAction');
    expect(actionMenuComponent.props('resource')).toStrictEqual(actionMenuResource);
  });

  it('should hide the description element if description is not passed', async() => {
    const wrapper = mount(TitleBar, {
      props: {
        resourceTypeLabel,
        resourceName
      },
      global: { stubs: { 'router-link': RouterLinkStub }, provide: { store } }
    });

    expect(wrapper.find('.bottom.description').exists()).toBeFalsy();
  });

  it('should show the description element if description is passed', async() => {
    const description = 'DESCRIPTION';
    const wrapper = mount(TitleBar, {
      props: {
        resourceTypeLabel,
        resourceName,
        description
      },
      global: { stubs: { 'router-link': RouterLinkStub }, provide: { store } }
    });

    expect(wrapper.find('.bottom.description').exists()).toBeTruthy();
    expect(wrapper.find('.bottom.description').element.innerHTML).toStrictEqual(description);
  });
});
