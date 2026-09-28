import { mount } from '@vue/test-utils';
import ViewOptions from '@shell/components/Resource/Detail/ViewOptions/index.vue';
import ButtonGroup from '@shell/components/ButtonGroup.vue';
import { _CONFIG, _GRAPH } from '@shell/config/query-params';

/**
 * `ButtonGroup` declares `options` as a bare array, so `props('options')` comes back
 * as `unknown`. `ViewOptions` always populates it with labelled values.
 */
const asOptions = (options: unknown): { value: string, label?: string }[] => options as { value: string, label?: string }[];

const mockPush = jest.fn();
const mockQuery = { view: _CONFIG };

jest.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute:  () => ({ query: mockQuery }),
}));

describe('component: ViewOptions/index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.view = _CONFIG;
  });

  const createWrapper = () => {
    return mount(ViewOptions);
  };

  it('should render a ButtonGroup component', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(ButtonGroup).exists()).toBeTruthy();
  });

  it('should provide two view options: detail and graph', () => {
    const wrapper = createWrapper();
    const buttonGroup = wrapper.findComponent(ButtonGroup);
    const options = asOptions(buttonGroup.props('options'));

    expect(options).toHaveLength(2);
    expect(options[0].value).toStrictEqual(_CONFIG);
    expect(options[1].value).toStrictEqual(_GRAPH);
  });

  it('should set the initial view from the route query', () => {
    const wrapper = createWrapper();
    const buttonGroup = wrapper.findComponent(ButtonGroup);

    expect(buttonGroup.props('value')).toStrictEqual(_CONFIG);
  });

  it('should push to router when view changes', async() => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('.btn-group button');
    const graphButton = buttons[1];

    await graphButton.trigger('click');

    expect(mockPush).toHaveBeenCalledWith({ query: { view: _GRAPH } });
  });

  it('should match the snapshot', () => {
    const wrapper = createWrapper();

    expect(wrapper.html()).toMatchSnapshot();
  });
});
