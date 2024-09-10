import Questions from '@shell/components/Questions';
import { mount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
import defaults from './utils/questions-defaults';

describe.skip('(Vue3 Skip) the Boolean Component', () => {
  it('input field is present', () => {
    const wrapper = mount(Questions, {
      props: {
        value:           {},
        targetNamespace: 'test',
        source:          [{
          variable: 'var_name',
          type:     'boolean',
          label:    '',
        }],
        mode: _EDIT
      },

      global: {
        mocks: defaults.mocks,
        stubs: defaults.stubs,
      },
    });

    const inputFields = wrapper.findAll('[data-testid="boolean-input-var_name"] input[type=checkbox]');

    // TODO: UNIT TEST - Default stubs give us a tab stub, rendering no input fields
    expect(inputFields).toHaveLength(1);

    const descriptionFields = wrapper.findAll('[data-testid="boolean-description-var_name"]');

    expect(descriptionFields).toHaveLength(0);

    const labelFields = wrapper.findAll('[data-testid="boolean-row-var_name"] label');

    expect(labelFields).toHaveLength(1);
    expect(labelFields.at(0).text()).toBe('var_name');
  });

  it('description is present', () => {
    const wrapper = mount(Questions, {
      props: {
        value:           {},
        targetNamespace: 'test',
        source:          [{
          variable:    'var_name',
          type:        'boolean',
          description: 'test description'
        }],
        mode: _EDIT
      },

      global: {
        mocks: defaults.mocks,
        stubs: defaults.stubs,
      },
    });

    const inputFields = wrapper.findAll('[data-testid="boolean-input-var_name"]');

    expect(inputFields).toHaveLength(1);

    const descriptionFields = wrapper.findAll('[data-testid="boolean-description-var_name"]');

    expect(descriptionFields).toHaveLength(1);
    expect(descriptionFields.at(0).text()).toBe('test description');
  });

  it('label is present', () => {
    const wrapper = mount(Questions, {
      props: {
        value:           {},
        targetNamespace: 'test',
        source:          [{
          variable: 'var_name',
          type:     'boolean',
          label:    'test label'
        }],
        mode: _EDIT
      },

      global: {
        mocks: defaults.mocks,
        stubs: defaults.stubs,
      },
    });

    const inputFields = wrapper.findAll('[data-testid="boolean-input-var_name"]');

    expect(inputFields).toHaveLength(1);

    const labelFields = wrapper.findAll('[data-testid="boolean-row-var_name"] label');

    expect(labelFields).toHaveLength(1);
    expect(labelFields.at(0).text()).toBe('test label');
  });

  it('tooltip is present', () => {
    const wrapper = mount(Questions, {
      props: {
        value:           {},
        targetNamespace: 'test',
        source:          [{
          variable: 'var_name',
          type:     'boolean',
          tooltip:  'test tooltip'
        }],
        mode: _EDIT
      },

      global: {
        mocks: defaults.mocks,
        stubs: defaults.stubs,
      },
    });

    const inputFields = wrapper.findAll('[data-testid="boolean-input-var_name"]');

    expect(inputFields).toHaveLength(1);

    const labelFields = wrapper.findAll('[data-testid="boolean-row-var_name"] .checkbox-info');

    expect(labelFields).toHaveLength(1);
  });
});
