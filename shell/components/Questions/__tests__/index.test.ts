import { shallowMount } from '@vue/test-utils';
import Questions from '@shell/components/Questions/index.vue';

const mockT = jest.fn((key) => key);
const mockWithFallback = jest.fn((key, args, fallback) => fallback || key);

const defaultMocks = {
  $fetchState: { pending: false },
  $store:      {
    getters: {
      'i18n/t':            mockT,
      'i18n/withFallback': mockWithFallback
    }
  }
};

const defaultProps = {
  source:          { questions: { questions: [] } },
  value:           {},
  targetNamespace: 'default',
  mode:            'edit',
};

describe('component: Questions', () => {
  describe('computed: groups', () => {
    it('should group questions with the same group into a single group', () => {
      const questions = [
        { variable: 'q1', group: 'Group 1' },
        { variable: 'q2', group: 'Group 1' },
      ];
      const wrapper = shallowMount(Questions, {
        props:  { ...defaultProps, source: { questions: { questions } } },
        global: { mocks: defaultMocks },
      });

      const groups = wrapper.vm.groups;

      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe('Group 1');
      expect(groups[0].questions).toHaveLength(2);
    });

    it('should place questions without a group into a default group', () => {
      const questions = [
        { variable: 'q1' },
        { variable: 'q2' },
      ];
      const wrapper = shallowMount(Questions, {
        props:  { ...defaultProps, source: { questions: { questions } } },
        global: { mocks: defaultMocks },
      });

      const groups = wrapper.vm.groups;

      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe('Questions'); // Default group name
      expect(groups[0].questions).toHaveLength(2);
    });

    it('should create multiple groups for questions with different groups', () => {
      const questions = [
        { variable: 'q1', group: 'Group 1' },
        { variable: 'q2', group: 'Group 2' },
      ];
      const wrapper = shallowMount(Questions, {
        props:  { ...defaultProps, source: { questions: { questions } } },
        global: { mocks: defaultMocks },
      });

      const groups = wrapper.vm.groups;

      expect(groups).toHaveLength(2);
    });

    it('should correctly group a mix of grouped and ungrouped questions', () => {
      const questions = [
        { variable: 'q1', group: 'Group 1' },
        { variable: 'q2' },
        { variable: 'q3', group: 'Group 1' },
      ];
      const wrapper = shallowMount(Questions, {
        props:  { ...defaultProps, source: { questions: { questions } } },
        global: { mocks: defaultMocks },
      });

      const groups = wrapper.vm.groups;

      expect(groups).toHaveLength(2); // 'Group 1' and 'Questions'
      const group1 = groups.find((g: any) => g.name === 'Group 1');
      const defaultGroup = groups.find((g: any) => g.name === 'Questions');

      expect(group1.questions).toHaveLength(2);
      expect(defaultGroup.questions).toHaveLength(1);
    });
  });

  describe('computed: asTabs', () => {
    it('should be true by default', () => {
      const wrapper = shallowMount(Questions, {
        props:  defaultProps,
        global: { mocks: defaultMocks },
      });

      expect(wrapper.vm.asTabs).toBe(true);
    });

    it('should be true when tabbed is true', () => {
      const wrapper = shallowMount(Questions, {
        props:  { ...defaultProps, tabbed: true },
        global: { mocks: defaultMocks },
      });

      expect(wrapper.vm.asTabs).toBe(true);
    });

    it('should be false when tabbed is false', () => {
      const wrapper = shallowMount(Questions, {
        props:  { ...defaultProps, tabbed: false },
        global: { mocks: defaultMocks },
      });

      expect(wrapper.vm.asTabs).toBe(false);
    });

    it('should be false when tabbed is "never"', () => {
      const wrapper = shallowMount(Questions, {
        props:  { ...defaultProps, tabbed: 'never' },
        global: { mocks: defaultMocks },
      });

      expect(wrapper.vm.asTabs).toBe(false);
    });

    describe('when tabbed is "multiple"', () => {
      it('should be true if there are groups', () => {
        const questions = [{ variable: 'q1', group: 'Group 1' }];
        const wrapper = shallowMount(Questions, {
          props: {
            ...defaultProps, source: { questions: { questions } }, tabbed: 'multiple'
          },
          global: { mocks: defaultMocks },
        });

        expect(wrapper.vm.groups).toHaveLength(1);
        expect(wrapper.vm.asTabs).toBe(true);
      });

      it('should be false if there are no groups', () => {
        const wrapper = shallowMount(Questions, {
          props:  { ...defaultProps, tabbed: 'multiple' },
          global: { mocks: defaultMocks },
        });

        expect(wrapper.vm.groups).toHaveLength(0);
        expect(wrapper.vm.asTabs).toBe(false);
      });
    });
  });

  describe('watch: shownQuestions', () => {
    it('should remove values of questions that transition from shown to hidden', async() => {
      const questions = [
        { variable: 'parent', type: 'boolean' },
        { variable: 'child', show_if: 'parent=true' }
      ];
      const value = {
        parent: true,
        child:  'some-value'
      };
      const wrapper = shallowMount(Questions, {
        props: {
          ...defaultProps, source: { questions: { questions } }, value
        },
        global: { mocks: defaultMocks },
      });

      // Initially, child is shown
      expect(wrapper.vm.shownQuestions).toHaveLength(2);
      expect(wrapper.vm.shownQuestions[0].variable).toBe('parent');
      expect(wrapper.vm.shownQuestions[1].variable).toBe('child');
      expect(value.child).toBe('some-value');

      // Now set parent to false to hide child question
      wrapper.setProps({
        value: {
          parent: false,
          child:  'some-value'
        }
      });
      await wrapper.vm.$nextTick();

      // The child's value should have been deleted/removed from value
      expect(wrapper.vm.shownQuestions).toHaveLength(1);
      expect(wrapper.vm.shownQuestions[0].variable).toBe('parent');
      expect(wrapper.vm.value.child).toBeUndefined();
    });

    it('should remove nested values of questions that transition from shown to hidden', async() => {
      const questions = [
        { variable: 'parent', type: 'boolean' },
        { variable: 'nested.child', show_if: 'parent=true' }
      ];
      const value = {
        parent: true,
        nested: { child: 'some-nested-value' }
      };
      const wrapper = shallowMount(Questions, {
        props: {
          ...defaultProps, source: { questions: { questions } }, value
        },
        global: { mocks: defaultMocks },
      });

      expect(wrapper.vm.shownQuestions).toHaveLength(2);
      expect(wrapper.vm.shownQuestions[1].variable).toBe('nested.child');
      expect(wrapper.vm.value.nested.child).toBe('some-nested-value');

      wrapper.setProps({
        value: {
          parent: false,
          nested: { child: 'some-nested-value' }
        }
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.shownQuestions).toHaveLength(1);
      expect(wrapper.vm.value.nested.child).toBeUndefined();
    });

    it('should restore default values of questions that transition from shown to hidden if default exists in source.values', async() => {
      const questions = [
        { variable: 'parent', type: 'boolean' },
        { variable: 'ingress.path', show_if: 'parent=true' }
      ];
      const source = {
        values: {
          parent:  true,
          ingress: { path: '/' }
        },
        questions: { questions }
      };
      const value = {
        parent:  true,
        ingress: { path: '/api' }
      };
      const wrapper = shallowMount(Questions, {
        props: {
          ...defaultProps, source, value
        },
        global: { mocks: defaultMocks },
      });

      expect(wrapper.vm.shownQuestions).toHaveLength(2);
      expect(wrapper.vm.value.ingress.path).toBe('/api');

      wrapper.setProps({
        value: {
          parent:  false,
          ingress: { path: '/api' }
        }
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.shownQuestions).toHaveLength(1);
      expect(wrapper.vm.value.ingress.path).toBe('/');
    });

    it('should restore falsy default values of questions that transition from shown to hidden if default exists in source.values', async() => {
      const questions = [
        { variable: 'parent', type: 'boolean' },
        { variable: 'ingress.enabled', show_if: 'parent=true' },
        { variable: 'ingress.limit', show_if: 'parent=true' },
        { variable: 'ingress.path', show_if: 'parent=true' }
      ];
      const source = {
        values: {
          parent:  true,
          ingress: {
            enabled: false,
            limit:   0,
            path:    ''
          }
        },
        questions: { questions }
      };
      const value = {
        parent:  true,
        ingress: {
          enabled: true,
          limit:   10,
          path:    '/api'
        }
      };
      const wrapper = shallowMount(Questions, {
        props: {
          ...defaultProps, source, value
        },
        global: { mocks: defaultMocks },
      });

      expect(wrapper.vm.shownQuestions).toHaveLength(4);
      expect(wrapper.vm.value.ingress.enabled).toBe(true);
      expect(wrapper.vm.value.ingress.limit).toBe(10);
      expect(wrapper.vm.value.ingress.path).toBe('/api');

      wrapper.setProps({
        value: {
          parent:  false,
          ingress: {
            enabled: true,
            limit:   10,
            path:    '/api'
          }
        }
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.shownQuestions).toHaveLength(1);
      expect(wrapper.vm.value.ingress.enabled).toBe(false);
      expect(wrapper.vm.value.ingress.limit).toBe(0);
      expect(wrapper.vm.value.ingress.path).toBe('');
    });
  });
});
