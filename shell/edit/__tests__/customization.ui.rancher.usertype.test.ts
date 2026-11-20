import { nextTick } from 'vue';
import { mount, VueWrapper } from '@vue/test-utils';
import EditUserType from '@shell/edit/customization.ui.rancher.usertype.vue';
import UserType from '@shell/models/customization.ui.rancher.usertype';
import Select from '@shell/components/form/Select.vue';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal.vue';
import Principal from '@shell/components/auth/Principal.vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { MANAGEMENT } from '@shell/config/types';
import { AFTER_SAVE_HOOKS, BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';

describe('view: customization.ui.rancher.usertype', () => {
  const createUserType = () => {
    const userType = {
      metadata: { name: '', annotations: {} as Record<string, string> },
      spec:     {
        displayName: '', priority: 0, tags: [] as string[]
      },
      setAnnotation: jest.fn((key: string, val: string) => {
        userType.metadata.annotations[key] = val;
      }),
    };

    return userType;
  };

  // A plain object, or a real model where its validation matters
  const createWrapper = (value: object = createUserType(), router = { applyQuery: jest.fn(), replace: jest.fn() }) => mount(EditUserType, {
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
          name: 'c-cluster-product-resource-create', params: { resource: 'customization.ui.rancher.usertype' }, query: { AS: '' }
        },
        $router:     router,
        $fetchState: { pending: false },
      },
    },
  });

  const fill = async(wrapper: ReturnType<typeof createWrapper>, { name, displayName, priority }: { name: string, displayName: string, priority: string }) => {
    await wrapper.find('[data-testid="NameNsDescriptionNameInput"]').setValue(name);
    await wrapper.find('[data-testid="usertype-display-name"]').setValue(displayName);
    await wrapper.find('[data-testid="usertype-priority"]').setValue(priority);
    await nextTick();
  };

  const saveDisabled = (wrapper: ReturnType<typeof createWrapper>) => wrapper.find<HTMLButtonElement>('[data-testid="form-save"]').element.disabled;

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
    const userType = createUserType();
    const wrapper = createWrapper(userType);

    await wrapper.find('[data-testid="usertype-priority"]').setValue('10');

    expect(userType.spec.priority).toStrictEqual(10);
  });

  it('should store the description in the description annotation', async() => {
    const userType = createUserType();
    const wrapper = createWrapper(userType);

    await wrapper.find('[data-testid="name-ns-description-description"] input').setValue('Builds and deploys applications');

    expect(userType.metadata.annotations[DESCRIPTION]).toBe('Builds and deploys applications');
  });

  it('should go back to the list on cancel', async() => {
    const router = { applyQuery: jest.fn(), replace: jest.fn() };
    const wrapper = createWrapper(createUserType(), router);

    await wrapper.find('#cru-cancel').trigger('click');

    expect(router.replace).toHaveBeenCalledWith({ name: 'c-cluster-product-resource', params: { resource: 'customization.ui.rancher.usertype' } });
  });

  it('should store tags in the spec', async() => {
    jest.useFakeTimers();
    const userType = createUserType();
    const wrapper = createWrapper(userType);

    await wrapper.find('[data-testid="usertype-tags"] [data-testid="array-list-button"]').trigger('click');
    await wrapper.find('[data-testid="usertype-tags"] [data-testid="array-list-input-0"]').setValue('development');
    jest.advanceTimersByTime(100);
    jest.useRealTimers();

    expect(userType.spec.tags).toStrictEqual(['development']);
  });

  describe('resource permissions', () => {
    const SECTION = '[data-testid="usertype-resource-permissions"]';
    const ctx = { rootGetters: { 'i18n/t': (key: string) => key, 'i18n/exists': () => false } };

    // A real model, so the rules are validated by its customValidationRules
    const createModel = (spec: Record<string, any> = { displayName: 'App Developer', priority: 5 }) => new UserType({
      type:     'customization.ui.rancher.usertype',
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
      const wrapper = createWrapper(createModel());

      expect(wrapper.findAll('[data-testid^="grant-resources-verbs"]')).toHaveLength(0);
    });

    it('should add a rule with no verbs, resources or API group', async() => {
      const userType = createModel();
      const wrapper = createWrapper(userType);

      await addRule(wrapper);

      expect(userType.spec.rules).toStrictEqual([{
        apiGroups: [''], resources: [], verbs: []
      }]);
    });

    it('should not offer non-resource URLs', async() => {
      const wrapper = createWrapper(createModel());

      await addRule(wrapper);

      expect(wrapper.find('[data-testid="grant-resources-non-resource-urls0"]').exists()).toBe(false);
    });

    it('should not add rules to a user type that has none', async() => {
      const userType = createModel();

      createWrapper(userType);
      jest.advanceTimersByTime(100);
      await nextTick();

      expect(userType.spec.rules).toBeUndefined();
    });

    it.each([
      [true, 'a rule with no verbs or resources', [], null],
      [true, 'a rule with verbs and no resources', ['get'], null],
      [false, 'a complete rule', ['get'], { resourceName: 'deployments', apiGroupValue: 'apps' }],
    ])('should set save disabled to %p with %s', async(disabled, _, verbs, resource) => {
      const wrapper = createWrapper(createModel());

      await addRule(wrapper);
      await selectWithTestid(wrapper, 'grant-resources-verbs0').vm.$emit('update:value', verbs);
      await selectWithTestid(wrapper, 'grant-resources-resources0').vm.$emit('update:value', resource);
      jest.advanceTimersByTime(100);
      await nextTick();

      expect(saveDisabled(wrapper)).toBe(disabled);
    });

    it('should allow saving with no rules', () => {
      const wrapper = createWrapper(createModel());

      expect(saveDisabled(wrapper)).toBe(false);
    });

    it('should store a core API group typed as "" as an empty string when saving', async() => {
      const userType = createModel({
        displayName: 'App Developer',
        priority:    5,
        rules:       [{
          apiGroups: ['""'], resources: ['pods'], verbs: ['get']
        }]
      });
      const wrapper = createWrapper(userType);

      await (wrapper.vm as any).applyHooks(BEFORE_SAVE_HOOKS, userType);

      expect(userType.spec.rules?.[0].apiGroups).toStrictEqual(['']);
    });
  });

  describe('users and groups', () => {
    const ALICE = 'local://u-alice';
    const DEVOPS = 'github_org://devops';
    const fresh = { fresh: true };

    // A user type with the model calls the section uses mocked
    const createAssignable = (assigned: string[] = [ALICE]) => ({
      ...createUserType(),
      type:                 'customization.ui.rancher.usertype',
      metadata:             { name: 'app-developer', annotations: { [DESCRIPTION]: 'Builds apps' } as Record<string, string> },
      spec:                 { displayName: 'App Developer', priority: 5 },
      assignedPrincipalIds: jest.fn().mockResolvedValue(assigned),
      assignPrincipals:     jest.fn().mockResolvedValue(undefined),
      remove:               jest.fn().mockResolvedValue(undefined),
      $dispatch:            jest.fn().mockResolvedValue(fresh),
    });

    const createSectionWrapper = (value: ReturnType<typeof createAssignable>, mode: string) => {
      const dispatch = jest.fn();
      const wrapper = mount(EditUserType, {
        props:  { value, mode },
        global: {
          provide: { store: { getters: { 'i18n/t': (val: string) => val } } },
          stubs:   { Principal: true, SelectPrincipal: true },
          mocks:   {
            $store: {
              dispatch,
              getters: {
                currentStore:              () => 'current_store',
                'current_store/schemaFor': jest.fn(),
                'current_store/all':       jest.fn(),
                'i18n/t':                  (val: string) => val,
                'i18n/exists':             jest.fn(),
              }
            },
            $route: {
              name: 'c-cluster-product-resource-id', params: { resource: 'customization.ui.rancher.usertype' }, query: {}
            },
            $router:     { applyQuery: jest.fn(), replace: jest.fn() },
            $fetchState: { pending: false },
          },
        },
      });

      return { wrapper, dispatch };
    };

    const load = async(wrapper: VueWrapper<any>) => {
      await (EditUserType as any).fetch.call(wrapper.vm);
      await nextTick();
    };

    it('should list the users and groups the user type is assigned to', async() => {
      const { wrapper } = createSectionWrapper(createAssignable([ALICE, DEVOPS]), _EDIT);

      await load(wrapper);

      expect(wrapper.findAllComponents(Principal).map((p) => p.props('value'))).toStrictEqual([ALICE, DEVOPS]);
    });

    it('should add a user or group once', async() => {
      const { wrapper } = createSectionWrapper(createAssignable(), _EDIT);

      await load(wrapper);
      wrapper.findComponent(SelectPrincipal).vm.$emit('add', DEVOPS);
      wrapper.findComponent(SelectPrincipal).vm.$emit('add', DEVOPS);
      await nextTick();

      expect(wrapper.findAllComponents(Principal).map((p) => p.props('value'))).toStrictEqual([ALICE, DEVOPS]);
    });

    it('should ask for users and groups, not cluster members', () => {
      const { wrapper } = createSectionWrapper(createAssignable(), _CREATE);

      expect(wrapper.findComponent(SelectPrincipal).props()).toStrictEqual(expect.objectContaining({ selectLabel: '%userType.assignments.add.label%', selectPlaceholder: '%userType.assignments.add.placeholder%' }));
    });

    it('should assign the listed users and groups after the user type is saved', async() => {
      const value = createAssignable();
      const { wrapper } = createSectionWrapper(value, _EDIT);

      await load(wrapper);
      wrapper.findComponent(SelectPrincipal).vm.$emit('add', DEVOPS);
      await (wrapper.vm as any).applyHooks(AFTER_SAVE_HOOKS, value);

      expect(value.assignPrincipals).toHaveBeenCalledWith([ALICE, DEVOPS]);
    });

    it('should not change the assignments when they were never loaded', async() => {
      const value = createAssignable();
      const { wrapper } = createSectionWrapper(value, _EDIT);

      await (wrapper.vm as any).applyHooks(AFTER_SAVE_HOOKS, value);

      expect(value.assignPrincipals).not.toHaveBeenCalled();
    });

    it('should not change the assignments when viewing', async() => {
      const value = createAssignable();
      const { wrapper } = createSectionWrapper(value, _VIEW);

      await load(wrapper);
      await (wrapper.vm as any).applyHooks(AFTER_SAVE_HOOKS, value);

      expect(value.assignPrincipals).not.toHaveBeenCalled();
    });

    describe('when assigning fails', () => {
      const failure = new Error('binding failed');

      it('should remove a user type it just created and carry on with an unsaved copy', async() => {
        const value = createAssignable();

        value.assignPrincipals.mockRejectedValue(failure);
        const { wrapper, dispatch } = createSectionWrapper(value, _CREATE);

        await expect((wrapper.vm as any).applyHooks(AFTER_SAVE_HOOKS, value)).rejects.toBe(failure);

        expect(value.remove).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith('management/forgetType', MANAGEMENT.GLOBAL_ROLE);
        expect(value.$dispatch).toHaveBeenCalledWith('create', {
          type:     'customization.ui.rancher.usertype',
          metadata: {
            name: 'app-developer', annotations: { [DESCRIPTION]: 'Builds apps' }, labels: undefined
          },
          spec: { displayName: 'App Developer', priority: 5 },
        });
        expect(wrapper.emitted('update:value')).toStrictEqual([[fresh]]);
      });

      it('should say the user type was left behind when it cannot be removed', async() => {
        const value = createAssignable();

        value.assignPrincipals.mockRejectedValue(failure);
        value.remove.mockRejectedValue(new Error('remove failed'));
        const { wrapper, dispatch } = createSectionWrapper(value, _CREATE);

        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect((wrapper.vm as any).applyHooks(AFTER_SAVE_HOOKS, value)).rejects.toBe(failure);

        expect(dispatch).toHaveBeenCalledWith('growl/error', { title: '%userType.assignments.orphaned.title%', message: '%userType.assignments.orphaned.message%' });
        expect(wrapper.emitted('update:value')).toBeUndefined();
      });

      it('should keep an existing user type', async() => {
        const value = createAssignable();

        value.assignPrincipals.mockRejectedValue(failure);
        const { wrapper } = createSectionWrapper(value, _EDIT);

        await load(wrapper);
        await expect((wrapper.vm as any).applyHooks(AFTER_SAVE_HOOKS, value)).rejects.toBe(failure);

        expect(value.remove).not.toHaveBeenCalled();
      });
    });
  });
});
