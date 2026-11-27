import { flushPromises, shallowMount, VueWrapper } from '@vue/test-utils';
import Rule from '@shell/edit/networking.k8s.io.ingress/Rule.vue';

const ingress = {
  showPathType:        true,
  serviceNamePath:     'service.name',
  servicePortPath:     'service.port.number',
  servicePortNamePath: 'service.port.name',
};

const focusPath = jest.fn();

const RulePathStub = {
  name:     'RulePath',
  emits:    ['remove', 'update:value'],
  template: '<div class="rule-path" />',
  methods:  { focus: focusPath },
};

describe('component: networking.k8s.io.ingress/Rule', () => {
  let form: HTMLFormElement;
  let submit: jest.Mock;
  let wrapper: VueWrapper<any>;

  const createWrapper = (value = {}) => shallowMount(Rule, {
    props:    { ingress, value },
    attachTo: form,
    global:   { stubs: { RulePath: RulePathStub } },
  });

  const lastEmittedPaths = () => {
    const emitted = wrapper.emitted('update:value') as any[][];

    return emitted[emitted.length - 1][0].http.paths;
  };

  beforeEach(() => {
    form = document.createElement('form');
    submit = jest.fn((event: Event) => event.preventDefault());
    form.addEventListener('submit', submit);
    document.body.appendChild(form);
  });

  afterEach(() => {
    wrapper.unmount();
    form.remove();
    focusPath.mockClear();
  });

  it('does not give the form a default button, so pressing Enter in a field cannot click Add Path', () => {
    wrapper = createWrapper();

    expect(wrapper.find('.rule > button.add').text()).toStrictEqual('%ingress.rules.addPath%');
    expect(form.querySelector(':default')).toBeNull();
  });

  it('adds a path row and focuses it when Add Path is clicked, without submitting the form', async() => {
    wrapper = createWrapper();

    await wrapper.find('.rule > button.add').trigger('click');
    await flushPromises();

    expect(wrapper.findAll('.rule-path')).toHaveLength(2);
    expect(focusPath.mock.calls).toStrictEqual([[]]);
    expect(lastEmittedPaths()).toHaveLength(2);
    expect(submit).toHaveBeenCalledTimes(0);
  });

  it('removes the path whose row asks to be removed', async() => {
    wrapper = createWrapper({ http: { paths: [{ id: 'a', path: '/a' }, { id: 'b', path: '/b' }] } });

    wrapper.findAllComponents(RulePathStub)[0].vm.$emit('remove');
    await flushPromises();

    expect(wrapper.findAll('.rule-path')).toHaveLength(1);
    expect(lastEmittedPaths()).toStrictEqual([{ id: 'b', path: '/b' }]);
  });
});
