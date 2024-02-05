export default {
  computed: {
    isSystemAdmin() {
      return this?.currentUser?.sysadmin_flag;
    },
    isProjectAdmin() {
      if (this.isSystemAdmin) {
        return true;
      } else {
        return parseInt(this?.project?.current_user_role_id, 10) === 1;
      }
    },
    isProjectMaster() {
      if (this.isSystemAdmin) {
        return true;
      } else {
        return parseInt(this?.project?.current_user_role_id, 10) === 4;
      }
    },
    isMember() {
      if (this.isSystemAdmin) {
        return true;
      } else {
        return parseInt(this?.project?.current_user_role_id, 10) > 0;
      }
    },
    isLimitedGuest() {
      if (this.isSystemAdmin) {
        return false;
      } else {
        return parseInt(this?.project?.current_user_role_id, 10) === 5;
      }
    },
  },
};
