import { mount } from '@vue/test-utils';
import { _VIEW } from '@shell/config/query-params';
import Index from '@shell/components/ResourceDetail/Masthead/index.vue';
import * as PageEnabled from '@shell/composables/useIsNewDetailPageEnabled';

jest.mock('@shell/composables/useIsNewDetailPageEnabled');
jest.mock('@shell/components/ResourceDetail/Masthead/latest.vue', () => ({
  name:     'Latest',
  template: `<div>Latest</div>`,
  props:    ['value', 'resourceSubtype']
}));
jest.mock('@shell/components/ResourceDetail/Masthead/legacy.vue', () => ({
  name:     'Legacy',
  template: `<div>Legacy</div>`
}));

describe('component: Masthead/index', () => {
  const useIsNewDetailPageEnabledSpy = jest.spyOn(PageEnabled, 'useIsNewDetailPageEnabled');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Latest if useIsNewDetailPageEnabled is true and mode is _VIEW', () => {
    useIsNewDetailPageEnabledSpy.mockReturnValue(true);
    const props = {
      value:           { type: 'VALUE' },
      mode:            _VIEW,
      resourceSubtype: 'SUBTYPE'
    };

    const wrapper = mount(Index, { props });

    const component = wrapper.getComponent({ name: 'Latest' });

    expect(component.props('value')).toStrictEqual(props.value);
    expect(component.props('resourceSubtype')).toStrictEqual(props.resourceSubtype);
  });

  it('should render Legacy if useIsNewDetailPageEnabled is false and mode is _VIEW', () => {
    useIsNewDetailPageEnabledSpy.mockReturnValue(false);
    const props = {
      value:           { type: 'VALUE' },
      mode:            _VIEW,
      resourceSubtype: 'SUBTYPE'
    };

    const wrapper = mount(Index, { props });

    const component = wrapper.getComponent({ name: 'Legacy' });

    expect(component).toBeDefined();
  });

  it('should render Legacy if useIsNewDetailPageEnabled is true and mode is not _VIEW', () => {
    useIsNewDetailPageEnabledSpy.mockReturnValue(true);
    const props = {
      value:           { type: 'VALUE' },
      mode:            'ANYTHING',
      resourceSubtype: 'SUBTYPE'
    };

    const wrapper = mount(Index, { props });

    const component = wrapper.getComponent({ name: 'Legacy' });

    expect(component).toBeDefined();
  });
});
