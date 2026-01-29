import { mount, RouterLinkStub } from '@vue/test-utils';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { createStore } from 'vuex';
import { defineComponent, h } from 'vue';

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

    expect(buttonComponent.props('variant')).toStrictEqual('primary');
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

    expect(actionMenuComponent.props('buttonVariant')).toStrictEqual('multiAction');
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

  describe('additionalActions', () => {
    it('should not render additional action buttons when additionalActions is not provided', async() => {
      const wrapper = mount(TitleBar, {
        props:  { resourceTypeLabel, resourceName },
        global: { stubs: { 'router-link': RouterLinkStub, RcButton: true }, provide: { store } }
      });

      const actionButtons = wrapper.findAll('.top > .actions > rc-button-stub');

      expect(actionButtons).toHaveLength(0);
    });

    it('should render buttons when additionalActions is an array of button props', async() => {
      const onClick1 = jest.fn();
      const onClick2 = jest.fn();
      const additionalActions = [
        {
          label: 'Action 1', variant: 'secondary', onClick: onClick1
        },
        {
          label: 'Action 2', variant: 'primary', size: 'large', onClick: onClick2
        }
      ];

      const wrapper = mount(TitleBar, {
        props: {
          resourceTypeLabel, resourceName, additionalActions
        },
        global: { stubs: { 'router-link': RouterLinkStub, RcButton: true }, provide: { store } }
      });

      const actionButtons = wrapper.findAll('.top > .actions > rc-button-stub');

      expect(actionButtons).toHaveLength(2);

      const button1 = actionButtons[0].getComponent<any>('rc-button-stub');
      const button2 = actionButtons[1].getComponent<any>('rc-button-stub');

      expect(button1.props('variant')).toStrictEqual('secondary');
      expect(button2.props('variant')).toStrictEqual('primary');
      expect(button2.props('size')).toStrictEqual('large');
    });

    it('should call onClick handler when additional action button is clicked', async() => {
      const onClick = jest.fn();
      const additionalActions = [
        {
          label: 'Action 1', variant: 'secondary', onClick
        }
      ];

      const wrapper = mount(TitleBar, {
        props: {
          resourceTypeLabel, resourceName, additionalActions
        },
        global: { stubs: { 'router-link': RouterLinkStub, RcButton: true }, provide: { store } }
      });

      const actionButton = wrapper.find('.top > .actions > rc-button-stub');

      await actionButton.trigger('click');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should render a custom component when additionalActions is a Vue component', async() => {
      const CustomComponent = defineComponent({
        name:   'CustomActions',
        render: () => h('div', { class: 'custom-actions' }, 'Custom Actions')
      });

      const wrapper = mount(TitleBar, {
        props: {
          resourceTypeLabel, resourceName, additionalActions: CustomComponent
        },
        global: { stubs: { 'router-link': RouterLinkStub }, provide: { store } }
      });

      expect(wrapper.find('.custom-actions').exists()).toBeTruthy();
      expect(wrapper.find('.custom-actions').text()).toBe('Custom Actions');
    });

    it('should use slot content when additional-actions slot is provided', async() => {
      const additionalActions = [
        {
          label: 'Action 1', variant: 'secondary', onClick: jest.fn()
        }
      ];

      const wrapper = mount(TitleBar, {
        props: {
          resourceTypeLabel, resourceName, additionalActions
        },
        slots:  { 'additional-actions': '<button class="slot-button">Slot Button</button>' },
        global: { stubs: { 'router-link': RouterLinkStub }, provide: { store } }
      });

      // Slot content should override the additionalActions prop
      expect(wrapper.find('.slot-button').exists()).toBeTruthy();
      expect(wrapper.find('.slot-button').text()).toBe('Slot Button');
    });
  });
});
