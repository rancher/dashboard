import Questions from '@shell/components/Questions';
import { mount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
const defaultStubs = {
  Tab:    true,
  Tabbed: true,
};
const defaultGetters = {
  currentStore:           () => 'current_store',
  'management/schemaFor': jest.fn(),
  'current_store/all':    jest.fn(),
  'i18n/t':               jest.fn(),
  'i18n/withFallback':    jest.fn((key, args, fallback) => fallback),
};

describe('the Boolean Component', () => {
  it('input field is present', () => {
    const wrapper = mount(Questions, {
      propsData: {
        value:           {},
        targetNamespace: 'test',
        source:          [{
          variable: 'var_name',
          type:     'boolean',
          label:    '',
        }],
        mode: _EDIT
      },
      mocks: { $store: { getters: defaultGetters } },
      stubs: defaultStubs,
    });

    const inputFields = wrapper.findAll('[data-testid="boolean-input-var_name"] input[type=checkbox]');

    expect(inputFields).toHaveLength(1);

    const descriptionFields = wrapper.findAll('[data-testid="boolean-description-var_name"]');

    expect(descriptionFields).toHaveLength(0);

    const labelFields = wrapper.findAll('[data-testid="boolean-row-var_name"] label');

    expect(labelFields).toHaveLength(1);
    expect(labelFields.at(0).text()).toBe('var_name');
  });

  it('description is present', () => {
    const wrapper = mount(Questions, {
      propsData: {
        value:           {},
        targetNamespace: 'test',
        source:          [{
          variable:    'var_name',
          type:        'boolean',
          description: 'test description'
        }],
        mode: _EDIT
      },
      mocks: { $store: { getters: defaultGetters } },
      stubs: defaultStubs,
    });

    const inputFields = wrapper.findAll('[data-testid="boolean-input-var_name"]');

    expect(inputFields).toHaveLength(1);

    const descriptionFields = wrapper.findAll('[data-testid="boolean-description-var_name"]');

    expect(descriptionFields).toHaveLength(1);
    expect(descriptionFields.at(0).text()).toBe('test description');
  });

  it('label is present', () => {
    const wrapper = mount(Questions, {
      propsData: {
        value:           {},
        targetNamespace: 'test',
        source:          [{
          variable: 'var_name',
          type:     'boolean',
          label:    'test label'
        }],
        mode: _EDIT
      },
      mocks: { $store: { getters: defaultGetters } },
      stubs: defaultStubs,
    });

    const inputFields = wrapper.findAll('[data-testid="boolean-input-var_name"]');

    expect(inputFields).toHaveLength(1);

    const labelFields = wrapper.findAll('[data-testid="boolean-row-var_name"] label');

    expect(labelFields).toHaveLength(1);
    expect(labelFields.at(0).text()).toBe('test label');
  });

  it('tooltip is present', () => {
    const wrapper = mount(Questions, {
      propsData: {
        value:           {},
        targetNamespace: 'test',
        source:          [{
          variable: 'var_name',
          type:     'boolean',
          tooltip:  'test tooltip'
        }],
        mode: _EDIT
      },
      mocks: { $store: { getters: defaultGetters } },
      stubs: defaultStubs,
    });

    const inputFields = wrapper.findAll('[data-testid="boolean-input-var_name"]');

    expect(inputFields).toHaveLength(1);

    const labelFields = wrapper.findAll('[data-testid="boolean-row-var_name"] .checkbox-info');

    expect(labelFields).toHaveLength(1);
  });
});
