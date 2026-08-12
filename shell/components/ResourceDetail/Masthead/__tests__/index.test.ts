import { mount } from '@vue/test-utils';
import { _VIEW } from '@shell/config/query-params';
import Index from '@shell/components/ResourceDetail/Masthead/index.vue';
import * as PageEnabled from '@shell/composables/useIsNewDetailPageEnabled';
import { computed } from 'vue';

jest.mock('@shell/composables/useIsNewDetailPageEnabled');
jest.mock('@shell/components/ResourceDetail/Masthead/latest.vue', () => ({
  name:     'Latest',
  template: `<div>Latest</div>`,
  props:    ['value', 'resourceSubtype', 'isCustomDetailOrEdit', 'mode', 'resource', 'canViewYaml'],
  emits:    ['apply-template'],
}));
jest.mock('@shell/components/ResourceDetail/Masthead/legacy.vue', () => ({
  name:     'Legacy',
  template: `<div>Legacy</div>`,
  emits:    ['apply-template'],
}));

describe('component: Masthead/index', () => {
  const useIsNewDetailPageEnabledSpy = jest.spyOn(PageEnabled, 'useIsNewDetailPageEnabled');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Latest if useIsNewDetailPageEnabled is true and mode is _VIEW', () => {
    useIsNewDetailPageEnabledSpy.mockReturnValue(computed(() => true));
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
    useIsNewDetailPageEnabledSpy.mockReturnValue(computed(() => false));
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
    useIsNewDetailPageEnabledSpy.mockReturnValue(computed(() => true));
    const props = {
      value:           { type: 'VALUE' },
      mode:            'ANYTHING',
      resourceSubtype: 'SUBTYPE'
    };

    const wrapper = mount(Index, { props });

    const component = wrapper.getComponent({ name: 'Legacy' });

    expect(component).toBeDefined();
  });

  it('should pass isCustomDetailOrEdit as true when hasDetail is true', () => {
    useIsNewDetailPageEnabledSpy.mockReturnValue(computed(() => true));
    const props = {
      value:     { type: 'VALUE' },
      mode:      _VIEW,
      hasDetail: true,
      hasEdit:   false
    };

    const wrapper = mount(Index, { props });

    const component = wrapper.getComponent({ name: 'Latest' });

    expect(component.props('isCustomDetailOrEdit')).toBe(true);
  });

  it('should pass isCustomDetailOrEdit as true when hasEdit is true', () => {
    useIsNewDetailPageEnabledSpy.mockReturnValue(computed(() => true));
    const props = {
      value:     { type: 'VALUE' },
      mode:      _VIEW,
      hasDetail: false,
      hasEdit:   true
    };

    const wrapper = mount(Index, { props });

    const component = wrapper.getComponent({ name: 'Latest' });

    expect(component.props('isCustomDetailOrEdit')).toBe(true);
  });

  it('should pass isCustomDetailOrEdit as false when both hasDetail and hasEdit are false', () => {
    useIsNewDetailPageEnabledSpy.mockReturnValue(computed(() => true));
    const props = {
      value:     { type: 'VALUE' },
      mode:      _VIEW,
      hasDetail: false,
      hasEdit:   false
    };

    const wrapper = mount(Index, { props });

    const component = wrapper.getComponent({ name: 'Latest' });

    expect(component.props('isCustomDetailOrEdit')).toBe(false);
  });

  it('should pass mode/resource/canViewYaml to Latest and relay apply-template', async() => {
    useIsNewDetailPageEnabledSpy.mockReturnValue(computed(() => true));
    const props = {
      value: { type: 'VALUE' }, mode: _VIEW, resource: 'apps.deployment', canViewYaml: true
    };

    const wrapper = mount(Index, { props });
    const component = wrapper.getComponent({ name: 'Latest' });

    expect(component.props('mode')).toBe(_VIEW);
    expect(component.props('resource')).toBe('apps.deployment');
    expect(component.props('canViewYaml')).toBe(true);

    const configMap = { metadata: { namespace: 'default', name: 'my-template' } };

    await component.vm.$emit('apply-template', configMap);

    expect(wrapper.emitted('apply-template')).toBeTruthy();
    expect(wrapper.emitted('apply-template')![0]).toStrictEqual([configMap]);
  });

  it('should relay apply-template from Legacy', async() => {
    useIsNewDetailPageEnabledSpy.mockReturnValue(computed(() => false));
    const props = { value: { type: 'VALUE' }, mode: _VIEW };

    const wrapper = mount(Index, { props });
    const component = wrapper.getComponent({ name: 'Legacy' });

    const configMap = { metadata: { namespace: 'default', name: 'my-template' } };

    await component.vm.$emit('apply-template', configMap);

    expect(wrapper.emitted('apply-template')).toBeTruthy();
    expect(wrapper.emitted('apply-template')![0]).toStrictEqual([configMap]);
  });
});
