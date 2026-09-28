import { mount } from '@vue/test-utils';
import MultiResourceYaml from '@shell/components/ResourceYaml/MultiResourceYaml.vue';

jest.mock('@components/RcButton', () => ({ RcButton: { name: 'RcButtonStub', template: '<button><slot /></button>' } }));
jest.mock('@shell/components/YamlEditor.vue', () => ({ __esModule: true, EDITOR_MODES: { EDIT_CODE: 'EDIT_CODE', DIFF_CODE: 'DIFF_CODE' }, default: { template: '<div />' } }));
jest.mock('@shell/components/ResourceYaml/ResourceGraph.vue', () => ({ __esModule: true, default: { template: '<div />' } }));
jest.mock('@components/Banner', () => ({ Banner: { name: 'BannerStub', template: '<div />' } }));

it('debug', () => {
  const proto = { $state: { config: { namespace: 'cluster' } }, canCreate: true, typeDisplay: 'Config' };
  const a = Object.assign(Object.create(proto), { type: 'config', id: 'ns/a' });
  const w = mount(MultiResourceYaml, { props: { value: { type: 'cluster', id: 'ns/p' }, relatedResources: [{ resource: a }] }, global: { provide: { store: { getters: {}, commit: jest.fn() } } } });
  const vm: any = w.vm;
  console.log(JSON.stringify(Object.keys(vm.$.setupState || {})));
  const ss: any = vm.$.setupState;
  const e = ss.allRelatedResources[0]; const r = ss.resourceFor(e, 0); console.log('dbg', ss.typeKeyFor(r), ss.typeKeyFor(ss.props.value), r?.type, !!r);
  console.log('related', JSON.stringify(ss.relatedTypes?.map?.((t: any) => t.key)), 'creatable', ss.creatableTypes?.length, 'canCreate', a.canCreate, 'rel', ss.allRelatedResources?.length);
});
