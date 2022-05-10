<script>
import { mapGetters } from 'vuex';
import { clone } from '@shell/utils/object';
import { randomStr } from '@shell/utils/string';

import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ModalWithCard from '@shell/components/ModalWithCard';

const _NEW = '_NEW';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    ModalWithCard,
  },

  props: {
    value: {
      type:    [Array, String],
      default: () => {
        return [];
      }
    },

    resource: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    userOptions: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    multiple: {
      type:    Boolean,
      default: false
    },

    mode: {
      type:     String,
      default:  'create',
    },

    disabled: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      selectedUser: this.value,
      newUsername:  '',
      randomStr:    randomStr(5).toLowerCase(),
      errors:       [],
    };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  watch: {
    value(neu) {
      this.selectedUser = neu;
    },

    selectedUser(val, old) {
      if ( val.includes(_NEW)) {
        this.$set(this, 'selectedUser', old);
        this.update();
        this.show();
      }
    }
  },

  methods: {
    update() {
      this.$emit('update:user', clone(this.selectedUser));
    },

    addUser(buttonCb) {
      const reg = /^[-._0-9a-zA-Z]+$/;

      this.errors = [];

      if (!reg.test(this.newUsername)) {
        const message = this.t('harvester.virtualMachine.accessCredentials.invalidUser');

        this.errors.push(message);
        buttonCb(false);

        return;
      }

      if (this.userOptions.includes(this.newUsername)) {
        const message = this.t('harvester.virtualMachine.accessCredentials.duplicatedUser');

        this.errors.push(message);
        buttonCb(false);

        return;
      }

      if (this.multiple) {
        this.selectedUser.push(this.newUsername);
      } else {
        this.selectedUser = this.newUsername;
      }

      this.$emit('update:newUser', this.newUsername);
      this.update();

      buttonCb(true);
      this.cancel();
    },

    show() {
      this.$modal.show(this.randomStr);
    },

    hide() {
      this.$modal.hide(this.randomStr);
    },

    cancel() {
      this.hide();
      this.newUsername = '';
    },

  }
};
</script>

<template>
  <div class="vm__credentials-users">
    <LabeledSelect
      v-model="selectedUser"
      :options="userOptions"
      :label="t('harvester.virtualMachine.accessCredentials.injectSSH.users')"
      :taggable="multiple"
      :mode="mode"
      :multiple="multiple"
      :searchable="false"
      :tooltip="t('harvester.virtualMachine.accessCredentials.userTips')"
      :class="{'hasUsers': selectedUser.length > 0}"
      @input="update"
    />

    <ModalWithCard
      :ref="randomStr"
      :name="randomStr"
      width="40%"
      :errors="errors"
      @finish="addUser"
      @close="cancel"
    >
      <template #title>
        {{ t('harvester.virtualMachine.accessCredentials.injectSSH.addUser') }}
      </template>

      <template #content>
        <LabeledInput
          v-model="newUsername"
          :label="t('harvester.virtualMachine.input.username')"
          class="mb-20"
          required
          @keydown.native.enter.prevent="()=>{}"
        />
      </template>
    </ModalWithCard>
  </div>
</template>

<style lang="scss">
  .vm__credentials-users {
    .hasUsers.labeled-select.edit.taggable {
      .labeled-tooltip {
        .icon.status-icon {
          top: 30px;
        }
      }
    }
  }
</style>
