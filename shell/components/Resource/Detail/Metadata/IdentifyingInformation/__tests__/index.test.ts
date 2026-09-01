import { mount, RouterLinkStub } from '@vue/test-utils';
import IdentifyingInformation from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import KeyValueRow from '@shell/components/Resource/Detail/Metadata/KeyValueRow.vue';
import { markRaw } from 'vue';
jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn() }));
jest.mock('vuex', () => ({ useStore: () => { } }));

describe('component: Metadata/IdentifyingInformation', () => {
  const label = 'LABEL';
  const value = 'VALUE';
  const status = 'error';
  const to = 'http://google.com';

  it('should render container with identifying information', async() => {
    const wrapper = mount(IdentifyingInformation, {
      props:  { rows: [] },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    expect(wrapper.find('.identifying-information').exists()).toBeTruthy();
  });

  it('should render basic label and value', async() => {
    const wrapper = mount(IdentifyingInformation, {
      props: {
        rows: [
          {
            label,
            value
          }
        ]
      },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    expect(wrapper.find('.label').element.innerHTML.trim()).toStrictEqual(label);
    expect(wrapper.find('.value span').element.innerHTML.trim()).toStrictEqual(value);
  });

  it('should render a link value', async() => {
    const wrapper = mount(IdentifyingInformation, {
      props: {
        rows: [
          {
            label,
            value,
            to
          }
        ]
      },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    expect(wrapper.find('.label').element.innerHTML.trim()).toStrictEqual(label);

    const routerLinkComponent = wrapper.find('.value').getComponent(RouterLinkStub);

    expect(routerLinkComponent.props('to')).toStrictEqual(to);
    expect(routerLinkComponent.element.innerHTML).toStrictEqual(value);
  });

  it('should render a status value', async() => {
    const wrapper = mount(IdentifyingInformation, {
      props: {
        rows: [
          {
            label,
            value,
            status
          }
        ]
      },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    expect(wrapper.find('.label').element.innerHTML.trim()).toStrictEqual(label);
    expect(wrapper.find('.value span').element.innerHTML.trim()).toStrictEqual(value);
    expect(wrapper.find(`.value .status.${ status }`).exists()).toBeTruthy();
  });

  it('should render a .full-custom-value valueOverride', async() => {
    const valueOverride = {
      component: markRaw(KeyValueRow),
      props:     { type: 'interactive' }
    };
    const wrapper = mount(IdentifyingInformation, {
      props: {
        rows: [
          {
            label,
            value,
            valueOverride
          }
        ]
      },
      global: { stubs: { 'router-link': RouterLinkStub, KeyValueRow: true } }
    });

    expect(wrapper.find('.label').element.innerHTML.trim()).toStrictEqual(label);

    const testComponent = wrapper.find('.full-custom-value').getComponent(KeyValueRow);

    expect(testComponent.props('type')).toStrictEqual(valueOverride.props.type);
  });

  it('should render a formatter valueOverride', async() => {
    const valueOverride = {
      component: 'router-link',
      props:     { to: '#' }
    };
    const wrapper = mount(IdentifyingInformation, {
      props: {
        rows: [
          {
            label,
            value,
            valueOverride
          }
        ]
      },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    expect(wrapper.find('.label').element.innerHTML.trim()).toStrictEqual(label);

    const testComponent: any = wrapper.find('.value').getComponent('a');

    expect(testComponent.props('to')).toStrictEqual('#');
  });
});
