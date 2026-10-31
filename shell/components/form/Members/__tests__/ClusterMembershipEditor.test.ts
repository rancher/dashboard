import * as ClusterMembershipEditor from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import * as MembershipEditor from '@shell/components/form/Members/MembershipEditor.vue';
import * as permissions from '@shell/utils/membership-permissions';

type PermissionName = keyof typeof permissions;

describe('membership editor exports', () => {
  it.each([
    ['canViewClusterMembershipEditor', 'ClusterMembershipEditor', ClusterMembershipEditor],
    ['canViewMembershipEditor', 'MembershipEditor', MembershipEditor],
    ['canViewMembershipEditorList', 'MembershipEditor', MembershipEditor],
  ])('should keep exporting %s from %s for extensions', (name: string, _: string, editor: Record<string, unknown>) => {
    expect(editor[name]).toStrictEqual(permissions[name as PermissionName]);
  });
});
