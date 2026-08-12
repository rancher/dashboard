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

  describe('method: shouldShow', () => {
    it.each([
      // Happy path for single conditions
      ['foo=bar', { foo: 'bar' }, true],
      ['foo=bar', { foo: 'baz' }, false],
      ['foo!=bar', { foo: 'baz' }, true],
      ['foo=true', { foo: true }, true],
      ['foo=false', { foo: false }, true],
      ['foo=', { foo: null }, true],
      ['foo!=', { foo: 'bar' }, true],

      // Unary logical NOT operator '!'
      ['!(foo=bar)', { foo: 'baz' }, true],
      ['!(foo=bar)', { foo: 'bar' }, false],
      ['!foo', { foo: true }, false],
      ['!foo', { foo: false }, true],

      // Flat multi-conditions
      ['foo=bar&&baz=qux', { foo: 'bar', baz: 'qux' }, true],
      ['foo=bar&&baz=qux', { foo: 'bar', baz: 'not-qux' }, false],
      ['foo=bar||baz=qux', { foo: 'bar', baz: 'not-qux' }, true],

      // Complex nested expressions with parentheses
      ['(foo=bar || baz=qux) && target=test', {
        foo: 'bar', baz: 'not-qux', target: 'test'
      }, true],
      ['(foo=bar || baz=qux) && target=test', {
        foo: 'not-bar', baz: 'not-qux', target: 'test'
      }, false],
      ['(foo=bar || baz=qux) && target=test', {
        foo: 'not-bar', baz: 'qux', target: 'test'
      }, true],
      ['(foo=bar || baz=qux) && target=test', {
        foo: 'bar', baz: 'not-qux', target: 'not-test'
      }, false],

      // Spacing and whitespace robustness variations
      ['(foo=bar||baz=qux)&&target=test', {
        foo: 'bar', baz: 'not-qux', target: 'test'
      }, true],
      ['(  foo=bar   ||   baz=qux  )   &&   target=test', {
        foo: 'bar', baz: 'not-qux', target: 'test'
      }, true],

      // Values containing '(', ')' or '!' must not be split by the grouping tokenizer
      ['foo=bar(1)', { foo: 'bar(1)' }, true],
      ['foo=bar(1)', { foo: 'something-else' }, false],
      ['foo=a!b', { foo: 'a!b' }, true],
      ['foo=a!b', { foo: 'something-else' }, false],
      ['storageClass=Premium (SSD)', { storageClass: 'Premium (SSD)' }, true],
      ['storageClass=Premium (SSD)', { storageClass: 'Standard' }, false],

      // '!=' must actually be evaluated as a comparison, not silently treated as always-true
      ['foo!=bar', { foo: 'bar' }, false],
      ['foo!=', { foo: null }, false],

      // A value entirely wrapped in parens (e.g. "foo=(bar)") migrates to "!foo(bar)", which
      // *compiles* as a negated function call but throws "Function foo is not defined" when
      // evaluated. evalExpr() catches that throw and returns true unconditionally, which would
      // make the question always show - the { foo: 'something-else' } case below only passes
      // if migrate() detects this and falls back to a plain "foo == \"(bar)\"" comparison.
      ['foo=(bar)', { foo: '(bar)' }, true],
      ['foo=(bar)', { foo: 'something-else' }, false],
    ])('should correctly evaluate show_if condition "%s" with values %j to %s', (showIf, values, expected) => {
      const wrapper = shallowMount(Questions, {
        props:  defaultProps,
        global: { mocks: defaultMocks },
      });

      const question = { show_if: showIf };
      const result = wrapper.vm.shouldShow(question, values);

      expect(result).toBe(expected);
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
      expect(wrapper.vm.shownQuestions?.[0].variable).toBe('parent');
      expect(wrapper.vm.shownQuestions?.[1].variable).toBe('child');
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
      expect(wrapper.vm.shownQuestions?.[0].variable).toBe('parent');
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
      expect(wrapper.vm.shownQuestions?.[1].variable).toBe('nested.child');
      expect(wrapper.vm.value.nested.child).toBe('some-nested-value');

      wrapper.setProps({
        value: {
          parent: false,
          nested: { child: 'some-nested-value' }
        }
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.shownQuestions).toHaveLength(1);
      expect(wrapper.vm.value.nested).toBeUndefined();
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

    it('should restore the user-entered value of a question that is hidden and then shown again (no default in source.values)', async() => {
      const questions = [
        { variable: 'parent', type: 'boolean' },
        { variable: 'nested.child', show_if: 'parent=true' }
      ];
      const wrapper = shallowMount(Questions, {
        props: {
          ...defaultProps, source: { questions: { questions } }, value: { parent: true, nested: { child: 'my-custom-value' } }
        },
        global: { mocks: defaultMocks },
      });

      expect(wrapper.vm.value.nested.child).toBe('my-custom-value');

      // Hide the question
      wrapper.setProps({ value: { parent: false, nested: { child: 'my-custom-value' } } });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.shownQuestions).toHaveLength(1);
      expect(wrapper.vm.value.nested).toBeUndefined();

      // Show the question again
      wrapper.setProps({ value: { parent: true } });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.shownQuestions).toHaveLength(2);
      expect(wrapper.vm.value.nested.child).toBe('my-custom-value');
    });

    it('should restore the user-entered value of a question that is hidden and then shown again (default exists in source.values)', async() => {
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
      const wrapper = shallowMount(Questions, {
        props: {
          ...defaultProps, source, value: { parent: true, ingress: { path: '/api' } }
        },
        global: { mocks: defaultMocks },
      });

      expect(wrapper.vm.value.ingress.path).toBe('/api');

      // Hide the question, its value is reset to the chart default
      wrapper.setProps({ value: { parent: false, ingress: { path: '/api' } } });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.shownQuestions).toHaveLength(1);
      expect(wrapper.vm.value.ingress.path).toBe('/');

      // Show the question again, the user's custom answer should come back, not the default
      wrapper.setProps({ value: { parent: true, ingress: { path: '/' } } });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.shownQuestions).toHaveLength(2);
      expect(wrapper.vm.value.ingress.path).toBe('/api');
    });
  });
});
