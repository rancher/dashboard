import { nextTick } from 'vue';
import { mount, VueWrapper } from '@vue/test-utils';
import EditPersona from '@shell/edit/customization.ui.rancher.persona.vue';
import Persona from '@shell/models/customization.ui.rancher.persona';
import Select from '@shell/components/form/Select.vue';
import { _CREATE } from '@shell/config/query-params';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';

describe('view: customization.ui.rancher.persona', () => {
  const createPersona = () => {
    const persona = {
      metadata: { name: '', annotations: {} as Record<string, string> },
      spec:     {
        displayName: '', priority: 0, tags: [] as string[]
      },
      setAnnotation: jest.fn((key: string, val: string) => {
        persona.metadata.annotations[key] = val;
      }),
    };

    return persona;
  };

  const createWrapper = (value = createPersona(), router = { applyQuery: jest.fn(), replace: jest.fn() }) => mount(EditPersona, {
    props:  { value, mode: _CREATE },
    global: {
      provide: { store: { getters: { 'i18n/t': (val: string) => val } } },
      mocks:   {
        $store: {
          dispatch: jest.fn(),
          getters:  {
            currentStore:              () => 'current_store',
            'current_store/schemaFor': jest.fn(),
            'current_store/all':       jest.fn(),
            'i18n/t':                  (val: string) => val,
            'i18n/exists':             jest.fn(),
          }
        },
        $route: {
          name: 'c-cluster-product-resource-create', params: { resource: 'customization.ui.rancher.persona' }, query: { AS: '' }
        },
        $router: router,
      },
    },
  });

  const fill = async(wrapper: ReturnType<typeof createWrapper>, { name, displayName, priority }: { name: string, displayName: string, priority: string }) => {
    await wrapper.find('[data-testid="NameNsDescriptionNameInput"]').setValue(name);
    await wrapper.find('[data-testid="persona-display-name"]').setValue(displayName);
    await wrapper.find('[data-testid="persona-priority"]').setValue(priority);
    await nextTick();
  };

  const saveDisabled = (wrapper: ReturnType<typeof createWrapper>) => (wrapper.find('[data-testid="form-save"]').element as HTMLButtonElement).disabled;

  it('should disable save when the form opens with the defaults', () => {
    const wrapper = createWrapper();

    expect(saveDisabled(wrapper)).toBe(true);
  });

  it.each([
    [true, 'no name', {
      name: '', displayName: 'App Developer', priority: '5'
    }],
    [true, 'a name that is not a resource name', {
      name: 'App_Developer', displayName: 'App Developer', priority: '5'
    }],
    [true, 'no display name', {
      name: 'app-developer', displayName: '', priority: '5'
    }],
    [true, 'no priority', {
      name: 'app-developer', displayName: 'App Developer', priority: ''
    }],
    [true, 'a decimal priority', {
      name: 'app-developer', displayName: 'App Developer', priority: '1.5'
    }],
    [false, 'a priority of 0', {
      name: 'app-developer', displayName: 'App Developer', priority: '0'
    }],
    [false, 'every field set', {
      name: 'app-developer', displayName: 'App Developer', priority: '5'
    }],
  ])('should set save disabled to %p with %s', async(disabled, _, fields) => {
    const wrapper = createWrapper();

    await fill(wrapper, fields);

    expect(saveDisabled(wrapper)).toBe(disabled);
  });

  it('should store the priority as a number', async() => {
    const persona = createPersona();
    const wrapper = createWrapper(persona);

    await wrapper.find('[data-testid="persona-priority"]').setValue('10');

    expect(persona.spec.priority).toStrictEqual(10);
  });

  it('should store the description in the description annotation', async() => {
    const persona = createPersona();
    const wrapper = createWrapper(persona);

    await wrapper.find('[data-testid="name-ns-description-description"] input').setValue('Builds and deploys applications');

    expect(persona.metadata.annotations[DESCRIPTION]).toBe('Builds and deploys applications');
  });

  it('should go back to the list on cancel', async() => {
    const router = { applyQuery: jest.fn(), replace: jest.fn() };
    const wrapper = createWrapper(createPersona(), router);

    await wrapper.find('#cru-cancel').trigger('click');

    expect(router.replace).toHaveBeenCalledWith({ name: 'c-cluster-product-resource', params: { resource: 'customization.ui.rancher.persona' } });
  });

  it('should store tags in the spec', async() => {
    jest.useFakeTimers();
    const persona = createPersona();
    const wrapper = createWrapper(persona);

    await wrapper.find('[data-testid="array-list-button"]').trigger('click');
    await wrapper.find('[data-testid="array-list-input-0"]').setValue('development');
    jest.advanceTimersByTime(100);
    jest.useRealTimers();

    expect(persona.spec.tags).toStrictEqual(['development']);
  });

  describe('resource permissions', () => {
    const SECTION = '[data-testid="persona-resource-permissions"]';
    const ctx = { rootGetters: { 'i18n/t': (key: string) => key, 'i18n/exists': () => false } };

    // A real model, so the rules are validated by its customValidationRules
    const createModel = (spec: Record<string, any> = { displayName: 'App Developer', priority: 5 }) => new Persona({
      type:     'customization.ui.rancher.persona',
      metadata: { name: 'app-developer', annotations: {} },
      spec,
    }, ctx);

    const selectWithTestid = (wrapper: VueWrapper<any>, testid: string) => {
      const select = wrapper.findAllComponents(Select).find((s) => s.vm.$attrs['data-testid'] === testid);

      if (!select) {
        throw new Error(`no select rendered with data-testid "${ testid }"`);
      }

      return select;
    };

    const addRule = async(wrapper: VueWrapper<any>) => {
      await wrapper.find(`${ SECTION } [data-testid="array-list-button"]`).trigger('click');
      jest.advanceTimersByTime(100);
      await nextTick();
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start with no rules', () => {
      const wrapper = createWrapper(createModel() as any);

      expect(wrapper.findAll('[data-testid^="grant-resources-verbs"]')).toHaveLength(0);
    });

    it('should add a rule with no verbs, resources or API group', async() => {
      const persona = createModel();
      const wrapper = createWrapper(persona as any);

      await addRule(wrapper);

      expect(persona.spec.rules).toStrictEqual([{
        apiGroups: [''], resources: [], verbs: []
      }]);
    });

    it('should not offer non-resource URLs', async() => {
      const wrapper = createWrapper(createModel() as any);

      await addRule(wrapper);

      expect(wrapper.find('[data-testid="grant-resources-non-resource-urls0"]').exists()).toBe(false);
    });

    it('should not add rules to a persona that has none', async() => {
      const persona = createModel();

      createWrapper(persona as any);
      jest.advanceTimersByTime(100);
      await nextTick();

      expect(persona.spec.rules).toBeUndefined();
    });

    it.each([
      [true, 'a rule with no verbs or resources', [], null],
      [true, 'a rule with verbs and no resources', ['get'], null],
      [false, 'a complete rule', ['get'], { resourceName: 'deployments', apiGroupValue: 'apps' }],
    ])('should set save disabled to %p with %s', async(disabled, _, verbs, resource) => {
      const wrapper = createWrapper(createModel() as any);

      await addRule(wrapper);
      await selectWithTestid(wrapper, 'grant-resources-verbs0').vm.$emit('update:value', verbs);
      await selectWithTestid(wrapper, 'grant-resources-resources0').vm.$emit('update:value', resource);
      jest.advanceTimersByTime(100);
      await nextTick();

      expect(saveDisabled(wrapper)).toBe(disabled);
    });

    it('should allow saving with no rules', () => {
      const wrapper = createWrapper(createModel() as any);

      expect(saveDisabled(wrapper)).toBe(false);
    });

    it('should store a core API group typed as "" as an empty string when saving', async() => {
      const persona = createModel({
        displayName: 'App Developer',
        priority:    5,
        rules:       [{
          apiGroups: ['""'], resources: ['pods'], verbs: ['get']
        }]
      });
      const wrapper = createWrapper(persona as any);

      await (wrapper.vm as any).applyHooks(BEFORE_SAVE_HOOKS, persona);

      expect(persona.spec.rules?.[0].apiGroups).toStrictEqual(['']);
    });
  });
});
