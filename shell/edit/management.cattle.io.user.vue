<script>
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import GlobalRoleBindings from '@shell/components/GlobalRoleBindings.vue';
import ChangePassword from '@shell/components/form/ChangePassword';
import LabeledInput from '@shell/components/form/LabeledInput';
import CruResource from '@shell/components/CruResource';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import Loading from '@shell/components/Loading';

export default {
  components: {
    ChangePassword, GlobalRoleBindings, CruResource, LabeledInput, Loading
  },
  mixins:     [
    CreateEditView
  ],

  data() {
    const showGlobalRoles = !!this.$store.getters[`management/schemaFor`](MANAGEMENT.GLOBAL_ROLE);

    return {
      showGlobalRoles,
      form:             {
        username:    this.value.username,
        description: this.value.description,
        displayName: this.value.displayName,
        password:    {
          password:          '',
          userChangeOnLogin: false,
        }
      },
      validation: {
        password:     false,
        roles:        !showGlobalRoles,
        rolesChanged:     false,
      },
    };
  },

  computed: {
    valid() {
      const valid = this.credentialsValid && this.rolesValid;

      if (this.isCreate) {
        return valid;
      }
      if (this.isEdit) {
        return valid && (this.credentialsChanged || this.validation.rolesChanged);
      }

      return false;
    },
    credentialsValid() {
      if (this.isCreate) {
        // Username must be supplied, password valid
        return !!this.form.username && this.validation.password;
      }
      if (this.isEdit) {
        // Password must be valid (though password field doesn't have to exist)
        return this.validation.password;
      }

      return false;
    },
    credentialsChanged() {
      if (this.isCreate) {
        return true; // Covered by valid
      }
      if (this.isEdit) {
        return !!this.form.password.password ||
          this.form.description !== this.value.description ||
          this.form.displayName !== this.value.displayName ||
          this.form.password.userChangeOnLogin !== this.value.mustChangePassword;
      }

      return false;
    },
    rolesValid() {
      return this.validation.roles;
    },
    isCreate() {
      return this.mode === _CREATE;
    },
    isEdit() {
      return this.mode === _EDIT;
    }
  },

  mounted() {
    this.$nextTick(() => {
      if (this.$refs.name) {
        this.$refs.name.focus();
      }
    });
  },
  methods: {
    async save(buttonDone) {
      this.errors = [];
      try {
        if (this.isCreate) {
          const user = await this.createUser();

          await this.updateRoles(user.id);
        } else {
          await this.editUser();
          await this.updateRoles();
        }

        this.$router.replace({ name: this.doneRoute });
        buttonDone(true);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },

    async createUser() {
      // Ensure username is unique (this does not happen in the backend)
      const users = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER });

      if (users.find(u => u.username === this.form.username)) {
        throw new Error(this.t('user.edit.credentials.username.exists'));
      }

      const user = await this.$store.dispatch('rancher/create', {
        type:               NORMAN.USER,
        description:        this.form.description,
        enabled:            true,
        mustChangePassword: this.form.password.userChangeOnLogin,
        name:               this.form.displayName,
        password:           this.form.password.password,
        username:           this.form.username
      });

      const newNormanUser = await user.save();

      return this.$store.dispatch('management/find', { type: MANAGEMENT.USER, id: newNormanUser.id });
    },

    async editUser() {
      if (!this.credentialsChanged) {
        return;
      }

      const normanUser = await this.$store.dispatch('rancher/find', {
        type:       NORMAN.USER,
        id:   this.value.id,
      });

      // Save change of password
      // - Password must be changed before editing mustChangePassword (setpassword action sets this to false)
      if (this.form.password.password) {
        await this.$refs.changePassword.save(normanUser);

        // Why the wait? Without these the user updates below are ignored
        // - The update request succeeds and shows the correct values in it's response.
        // - Fetching the norman user again sometimes shows the correct value, sometimes not
        // - Even if the fetched norman user shows the correct value, it doesn't show up in the steve user
        //   - Looks like we re-request the stale version via socket?
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Save user updates
      normanUser.description = this.form.description;
      normanUser._name = this.form.displayName;
      normanUser.mustChangePassword = this.form.password.userChangeOnLogin;

      return normanUser.save();
    },

    async updateRoles(userId) {
      if (this.$refs.grb) {
        await this.$refs.grb.save(userId);
      }
    }
  }
};
</script>

<template>
  <Loading v-if="!value" />
  <div v-else>
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :validation-passed="valid"
      :errors="errors"
      :can-yaml="false"
      class="create-edit"
      @finish="save"
    >
      <div class="credentials">
        <h2> {{ t("user.edit.credentials.label") }}</h2>
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              ref="name"
              v-model="form.username"
              label-key="user.edit.credentials.username.label"
              placeholder-key="user.edit.credentials.username.placeholder"
              :required="isCreate"
              :readonly="isEdit"
              :disabled="isView || isEdit"
              :ignore-password-managers="!isCreate"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="form.displayName"
              label-key="user.edit.credentials.displayName.label"
              placeholder-key="user.edit.credentials.displayName.placeholder"
              :disabled="isView"
            />
          </div>
        </div>
        <div class="row mt-20 mb-10">
          <div class="col span-8">
            <LabeledInput
              v-model="form.description"
              label-key="user.edit.credentials.userDescription.label"
              placeholder-key="user.edit.credentials.userDescription.placeholder"
              :disabled="isView"
            />
          </div>
        </div>

        <ChangePassword
          v-if="!isView"
          ref="changePassword"
          v-model="form.password"
          :mode="mode"
          :must-change-password="value.mustChangePassword"
          @valid="validation.password = $event"
        />
      </div>
      <div v-if="showGlobalRoles" class="global-permissions">
        <GlobalRoleBindings
          ref="grb"
          :user-id="value.id || liveValue.id"
          :mode="mode"
          :real-mode="realMode"
          type="user"
          @hasChanges="validation.rolesChanged = $event"
          @canLogIn="validation.roles = $event"
        />
      </div>
    </CruResource>
  </div>
</template>
