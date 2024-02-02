export default {
  computed: {
    isSystemAdmin() {
      return this?.currentUser?.sysadmin_flag;
    },
    isProjectAdmin() {
      if (this.isSystemAdmin) {
        return true;
      } else {
        return this?.project?.currentUserRoleId === '1';
      }
    },
    isProjectMaster() {
      if (this.isSystemAdmin) {
        return true;
      } else {
        return this?.project?.currentUserRoleId === '4';
      }
    },
    isMember() {
      if (this.isSystemAdmin) {
        return true;
      } else {
        return parseInt(this?.project?.currentUserRoleId, 10) > 0;
      }
    },
  },
};
