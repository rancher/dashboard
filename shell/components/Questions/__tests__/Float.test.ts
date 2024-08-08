import Questions from '@shell/components/Questions';
import { mount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
import defaults from './utils/questions-defaults';

describe('the float Component', () => {
  it('input field is present', () => {
    const wrapper = mount(Questions, {
      props: {
        value:           {},
        targetNamespace: 'test',
        source:          [{
          variable: 'var_name',
          type:     'float',
          label:    '',
        }],
        mode: _EDIT
      },

      global: {
        mocks: defaults.mocks,
        stubs: defaults.stubs,
      },
    });

    const inputFields = wrapper.findAll('[data-testid="float-input-var_name"]');

    expect(inputFields).toHaveLength(1);

    const descriptionFields = wrapper.findAll('[data-testid="float-description-var_name"]');

    expect(descriptionFields).toHaveLength(0);

    const labelFields = wrapper.findAll('[data-testid="float-row-var_name"] label');

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
          type:        'float',
          description: 'test description'
        }],
        mode: _EDIT
      },

      global: {
        mocks: defaults.mocks,
        stubs: defaults.stubs,
      },
    });

    const inputFields = wrapper.findAll('[data-testid="float-input-var_name"]');

    expect(inputFields).toHaveLength(1);

    const descriptionFields = wrapper.findAll('[data-testid="float-description-var_name"]');

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
          type:     'float',
          label:    'test label'
        }],
        mode: _EDIT
      },

      global: {
        mocks: defaults.mocks,
        stubs: defaults.stubs,
      },
    });

    const inputFields = wrapper.findAll('[data-testid="float-input-var_name"]');

    expect(inputFields).toHaveLength(1);

    const labelFields = wrapper.findAll('[data-testid="float-row-var_name"] label');

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
          type:     'float',
          tooltip:  'test tooltip'
        }],
        mode: _EDIT
      },

      global: {
        mocks: defaults.mocks,
        stubs: defaults.stubs,
      },
    });

    const inputFields = wrapper.findAll('[data-testid="float-input-var_name"]');

    expect(inputFields).toHaveLength(1);

    const labelFields = wrapper.findAll('[data-testid="float-row-var_name"] .labeled-tooltip');

    expect(labelFields).toHaveLength(1);
  });
});
