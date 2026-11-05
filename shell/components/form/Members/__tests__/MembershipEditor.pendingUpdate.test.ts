import { shallowMount } from '@vue/test-utils';
import MembershipEditor from '@shell/components/form/Members/MembershipEditor.vue';
import { NORMAN } from '@shell/config/types';

const savedA = { id: 'c-1:a', clusterId: 'c-1' };
const savedB = { id: 'c-1:b', clusterId: 'c-1' };
const otherCluster = { id: 'c-2:c', clusterId: 'c-2' };
const unsaved = { principalId: 'local://u-new', clusterId: 'c-1' };

const runFetch = async(pendingUpdate: any) => {
  const dispatch = jest.fn((action: string, { type }: any) => Promise.resolve(type === NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING ? [savedA, savedB, otherCluster] : []));
  const wrapper = shallowMount(MembershipEditor, {
    props: {
      addMemberDialogName: 'AddClusterMemberDialog',
      parentKey:           'clusterId',
      parentId:            'c-1',
      mode:                'edit',
      type:                NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING,
      pendingUpdate,
    },
    global: {
      mocks: {
        $store: {
          dispatch,
          getters: {
            'rancher/schemaFor':    () => ({ type: 'object' }),
            'management/schemaFor': () => null,
          }
        },
        $fetchState: { pending: false },
      },
    }
  });

  await (MembershipEditor as any).fetch.call(wrapper.vm);

  return wrapper;
};

describe('component: MembershipEditor pendingUpdate', () => {
  it('should show the saved bindings when there is no pending update', async() => {
    const wrapper = await runFetch(null);

    expect(wrapper.vm.bindings).toStrictEqual([savedA, savedB]);
  });

  it('should re-add pending new bindings after fetching', async() => {
    const wrapper = await runFetch({ newBindings: [unsaved], removedBindings: [] });

    expect(wrapper.vm.bindings).toStrictEqual([savedA, savedB, unsaved]);
  });

  it('should drop pending removed bindings after fetching', async() => {
    const wrapper = await runFetch({ newBindings: [], removedBindings: [{ ...savedB }] });

    expect(wrapper.vm.bindings).toStrictEqual([savedA]);
  });

  it('should report the restored changes as the membership update', async() => {
    const wrapper = await runFetch({ newBindings: [unsaved], removedBindings: [savedB] });

    expect(wrapper.vm.membershipUpdate.newBindings).toStrictEqual([unsaved]);
    expect(wrapper.vm.membershipUpdate.removedBindings).toStrictEqual([savedB]);
  });

  it('should treat an empty pending update as no changes', async() => {
    const wrapper = await runFetch({});

    expect(wrapper.vm.bindings).toStrictEqual([savedA, savedB]);
  });
});
