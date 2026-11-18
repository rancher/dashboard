import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import EditPersona from '@shell/edit/customization.ui.rancher.persona.vue';
import { _CREATE } from '@shell/config/query-params';
import { DESCRIPTION } from '@shell/config/labels-annotations';

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
      mocks: {
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
});
