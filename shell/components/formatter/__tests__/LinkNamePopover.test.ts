import { flushPromises, mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import LinkNamePopover from '@shell/components/formatter/LinkNamePopover.vue';

// The popover is loaded when first used, this is what gets loaded
jest.mock('@shell/components/Resource/Detail/ResourcePopover/index.vue', () => ({
  __esModule: true,
  default:    {
    name:  'ResourcePopover',
    props: {
      id:             { type: String, default: '' },
      type:           { type: String, default: '' },
      name:           { type: String, default: '' },
      detailLocation: { type: Object, default: undefined },
      showStatus:     { type: Boolean, default: true },
      lazy:           { type: Boolean, default: false },
      wrapName:       { type: Boolean, default: false },
    },
    template: '<span class="resource-popover-stub" />',
  }
}));

describe('component: LinkNamePopover', () => {
  const createWrapper = async(props: any = {}, { canView = true, productId = 'explorer' }: { canView?: boolean, productId?: string } = {}) => {
    const schemaFor = jest.fn(() => (canView ? { id: 'node' } : undefined));
    const store = createStore({
      getters: {
        clusterId:            () => 'local',
        productId:            () => productId,
        currentStore:         () => () => 'cluster',
        'cluster/schemaFor':  () => schemaFor,
        'type-map/isVirtual': () => () => false,
      }
    });

    // shallowMount would stub the async wrapper of the popover, so it would never load. The popover is mocked instead
    const wrapper = mount(LinkNamePopover, {
      props:  { type: 'node', ...props },
      global: { plugins: [store] },
    });

    await flushPromises();

    return { wrapper, schemaFor };
  };

  const popover = (wrapper: any) => wrapper.findComponent({ name: 'ResourcePopover' });

  it('should render a lazy popover for the resource, without its state and wrapping its name', async() => {
    const { wrapper } = await createWrapper({ value: 'node-1' });

    expect(popover(wrapper).props()).toStrictEqual({
      id:             'node-1',
      type:           'node',
      name:           'node-1',
      detailLocation: {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster: 'local', product: 'explorer', resource: 'node', id: 'node-1'
        }
      },
      showStatus: false,
      lazy:       true,
      wrapName:   true,
    });
  });

  it.each([
    ['the current product', {}, 'apps', 'apps'],
    ['explorer when there is no current product', {}, '', 'explorer'],
  ])('should link to the resource in %s', async(_, props, productId, expected) => {
    const { wrapper } = await createWrapper({ value: 'node-1', ...props }, { productId });

    expect(popover(wrapper).props('detailLocation').params.product).toStrictEqual(expected);
  });

  it('should show plain text when the user can not view the type', async() => {
    const { wrapper, schemaFor } = await createWrapper({ value: 'node-1' }, { canView: false });

    expect(schemaFor).toHaveBeenCalledWith('node');
    expect(popover(wrapper).exists()).toBe(false);
    expect(wrapper.find('span').text()).toStrictEqual('node-1');
  });

  it.each([
    ['empty', ''],
    ['missing', undefined],
  ])('should render nothing when the value is %s', async(_, value) => {
    const { wrapper } = await createWrapper({ value });

    expect(popover(wrapper).exists()).toBe(false);
    expect(wrapper.text()).toStrictEqual('');
  });

  it('should not pass the other values a table gives a formatter to the popover as attributes', async() => {
    const { wrapper } = await createWrapper({
      value: 'node-1', row: { id: 'pod-1' }, col: { name: 'node' }
    });

    expect(popover(wrapper).attributes()).toStrictEqual({ class: 'resource-popover-stub' });
  });
});
