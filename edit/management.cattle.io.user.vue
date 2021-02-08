<script>
import { MANAGEMENT, NORMAN } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import GlobalRoleBindings from '@/components/GlobalRoleBindings.vue';
import ChangePassword from '@/components/form/ChangePassword';
import LabeledInput from '@/components/form/LabeledInput';
import CruResource from '@/components/CruResource';
import { exceptionToErrorsArray } from '@/utils/error';
import { _CREATE, _EDIT } from '@/config/query-params';
import Loading from '@/components/Loading';

export default {
  components: {
    ChangePassword, GlobalRoleBindings, CruResource, LabeledInput, Loading
  },
  mixins:     [
    CreateEditView
  ],
  data() {
    return {
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
        roles:        false,
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

      const user = await this.$store.dispatch('management/create', {
        type:               MANAGEMENT.USER,
        metadata:           { generateName: `user-` },
        description:        this.form.description,
        displayName:        this.form.displayName,
        enabled:            true,
        mustChangePassword: this.form.password.userChangeOnLogin,
        // password:           this.form.password.password,
        username:           this.form.username,
      });

      const newSteveUser = await user.save();

      // Change the password in a separate step... sent via create request just means storeing it in plane text
      const newNormanUser = await this.$store.dispatch('rancher/find', {
        type:       NORMAN.USER,
        id:   newSteveUser.id,
      });

      this.$refs.changePassword.setPassword(newNormanUser);

      return newSteveUser;
    },
    async editUser() {
      if (!this.credentialsChanged) {
        return;
      }
      // Save user edits
      this.value.description = this.form.description;
      this.value.displayName = this.form.displayName;
      this.value.mustChangePassword = this.form.password.userChangeOnLogin;
      await this.value.save();

      // Save change of password
      if (this.form.password.password) {
        // Fetch the user to ensure the `actions` property is correctly populated
        // (this is missing from `.save` response above... and using `value` results in api error)
        const updatedUser = await this.$store.dispatch('rancher/find', {
          type:       NORMAN.USER,
          id:   this.value.id,
        });

        this.$refs.changePassword.save(updatedUser);
      }
    },
    async updateRoles(userId) {
      await this.$refs.grb.save(userId);
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
          @valid="validation.password = $event"
        />
      </div>
      <div class="global-permissions">
        <GlobalRoleBindings
          ref="grb"
          :user-id="value.id || originalValue.id"
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
