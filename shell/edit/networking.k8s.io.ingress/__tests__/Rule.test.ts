import { shallowMount, VueWrapper } from '@vue/test-utils';
import Rule from '@shell/edit/networking.k8s.io.ingress/Rule.vue';

const ingress = {
  showPathType:        true,
  serviceNamePath:     'service.name',
  servicePortPath:     'service.port.number',
  servicePortNamePath: 'service.port.name',
};

describe('component: networking.k8s.io.ingress/Rule', () => {
  let wrapper: VueWrapper<any>;

  afterEach(() => {
    wrapper.unmount();
  });

  it('does not make the add path button a submit button, so pressing Enter in the form cannot add a path', () => {
    wrapper = shallowMount(Rule, { props: { ingress } });

    const addPathButton = wrapper.find('.rule > button.add');

    expect(addPathButton.text()).toStrictEqual('%ingress.rules.addPath%');
    expect((addPathButton.element as HTMLButtonElement).type).toStrictEqual('button');
  });
});
