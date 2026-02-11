
import { shallowMount } from '@vue/test-utils';
import Opsgenie, { TARGETS, TYPES } from '@shell/edit/monitoring.coreos.com.receiver/types/opsgenie.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';

describe('component: Opsgenie', () => {
  const mockStore = {
    getters: {
      'i18n/t':      (key: string) => key,
      'i18n/exists': () => true,
    },
  };

  const requiredProps = {
    mode:  _EDIT,
    value: { responders: [] },
  };

  it('should render all child components', () => {
    const wrapper = shallowMount(Opsgenie, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);
    const checkbox = wrapper.findComponent(Checkbox);
    const arrayList = wrapper.findComponent(ArrayList);

    expect(labeledInputs).toHaveLength(2);
    expect(checkbox.exists()).toBe(true);
    expect(arrayList.exists()).toBe(true);
  });

  it('should pass down the mode prop to child components', () => {
    const wrapper = shallowMount(Opsgenie, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);
    const checkbox = wrapper.findComponent(Checkbox);
    const arrayList = wrapper.findComponent(ArrayList);

    labeledInputs.forEach((input) => {
      expect(input.props().mode).toBe(_EDIT);
    });

    expect(checkbox.props().mode).toBe(_EDIT);
    expect(arrayList.props().mode).toBe(_EDIT);
  });

  describe('data initialization', () => {
    it('should initialize http_config, send_resolved, and responders', () => {
      const value = {};
      const wrapper = shallowMount(Opsgenie, {
        props: {
          ...requiredProps,
          value,
        },
        global: { mocks: mockStore },
      });

      expect(wrapper.props().value.http_config).toBeDefined();
      expect(wrapper.props().value.send_resolved).toBe(true);
      expect(wrapper.props().value.responders).toBeDefined();
    });

    it('should correctly transform responders from props', () => {
      const value = {
        responders: [
          { type: 'team', id: 'team-id' },
          { type: 'user', name: 'user-name' },
        ],
      };
      const wrapper = shallowMount(Opsgenie, {
        props: {
          ...requiredProps,
          value,
        },
        global: { mocks: mockStore },
      });

      expect(wrapper.vm.responders).toStrictEqual([
        {
          type: 'team', target: 'id', value: 'team-id'
        },
        {
          type: 'user', target: 'name', value: 'user-name'
        },
      ]);
    });
  });

  describe('watchers', () => {
    it('should update value.responders when responders data changes', async() => {
      const value = { responders: [] };
      const wrapper = shallowMount(Opsgenie, {
        props: {
          ...requiredProps,
          value,
        },
        global: { mocks: mockStore },
      });

      wrapper.vm.responders = [
        {
          type: 'team', target: 'id', value: 'team-id'
        },
        {
          type: 'user', target: 'name', value: 'user-name'
        },
      ];

      await wrapper.vm.$nextTick();

      expect(value.responders).toStrictEqual([
        { type: 'team', id: 'team-id' },
        { type: 'user', name: 'user-name' },
      ]);
    });
  });

  describe('methods', () => {
    it('should update a responder with updateResponder', () => {
      const wrapper = shallowMount(Opsgenie, {
        props:  requiredProps,
        global: { mocks: mockStore },
      });
      const responder = {
        type:   'team',
        target: 'id',
        value:  'old-value',
      };

      wrapper.vm.updateResponder({ selected: 'name', text: 'new-value' }, responder);

      expect(responder.target).toBe('name');
      expect(responder.value).toBe('new-value');
    });

    it('should return the correct label with typeLabel', () => {
      const wrapper = shallowMount(Opsgenie, {
        props:  requiredProps,
        global: { mocks: mockStore },
      });

      TYPES.forEach((type) => {
        expect(wrapper.vm.typeLabel(type.value)).toBe(type.label);
      });
    });

    it('should return the correct label with targetLabel', () => {
      const wrapper = shallowMount(Opsgenie, {
        props:  requiredProps,
        global: { mocks: mockStore },
      });

      TARGETS.forEach((target) => {
        expect(wrapper.vm.targetLabel(target.value)).toBe(target.label);
      });
    });
  });

  describe('template', () => {
    describe('responders', () => {
      it('should render responders correctly in edit mode', async() => {
        const value = { responders: [{ type: 'team', id: 'team-id' }] };
        const wrapper = shallowMount(Opsgenie, {
          props: {
            ...requiredProps,
            value,
          },
          global: { mocks: mockStore },
        });

        const arrayList = wrapper.findComponent(ArrayList);

        expect(arrayList.props().value).toStrictEqual([{
          type:   'team',
          target: 'id',
          value:  'team-id'
        }]);
      });

      it('should render responders correctly in view mode', async() => {
        const value = { responders: [{ type: 'team', id: 'team-id' }] };
        const wrapper = shallowMount(Opsgenie, {
          props: {
            ...requiredProps,
            value,
            mode: _VIEW,
          },
          global: { mocks: mockStore },
        });

        const arrayList = wrapper.findComponent(ArrayList);

        expect(arrayList.props().value).toStrictEqual([{
          type:   'team',
          target: 'id',
          value:  'team-id'
        }]);
      });
    });
  });
});
