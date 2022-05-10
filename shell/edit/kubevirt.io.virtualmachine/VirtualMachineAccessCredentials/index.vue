<script>
import { mapGetters } from 'vuex';

import Banner from '@shell/components/Banner';
import InfoBox from '@shell/components/InfoBox';

import { randomStr } from '@shell/utils/string';
import { removeObject } from '@shell/utils/array';
import { ACCESS_CREDENTIALS } from '@shell/config/harvester-map';
import { _EDIT } from '@shell/config/query-params';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';

const _NEW = '_NEW';

export default {
  components: {
    Banner,
    InfoBox
  },

  props: {
    value: {
      type:    Array,
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

    mode: {
      type:     String,
      default:  'create',
    },

    disableCreate: {
      type:    Boolean,
      default: false
    },

    disabled: {
      type:    Boolean,
      default: false
    },

    isQemuInstalled: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      ACCESS_CREDENTIALS,
      toRemove:       [],
      toSave:         [],
      rows:           [],
      newUserOptions: [],
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isEdit() {
      return this.mode === _EDIT;
    },

    historyUsersOptions() {
      const out = JSON.parse(this.resource?.spec?.template?.metadata?.annotations?.[HCI_ANNOTATIONS.DYNAMIC_SSHKEYS_USERS] || '[]');

      out.unshift({
        label: this.t('harvester.virtualMachine.accessCredentials.injectSSH.addUser'),
        value: _NEW,
      });

      return out;
    },

    userOptions() {
      return Array.from(new Set([...this.historyUsersOptions, ...this.newUserOptions]));
    },
  },

  watch: {
    value: {
      handler(neu) {
        this.rows = [...neu];
      },
      deep:      true,
      immediate: true,
    },
  },

  methods: {
    addCredentials(type) {
      const neu = {
        source:      type,
        users:       [],
        sshkeys:     [],
        username:    '',
        newPassword: '',
        secretName:  this.generateSecretName(this.resource.metadata.name),
      };

      this.rows.push(neu);
      this.update();
    },

    remove(row) {
      removeObject(this.rows, row);
      this.update();
    },

    update() {
      this.$emit('input', this.rows);
    },

    updateNewUser(newUser) {
      this.newUserOptions.push(newUser);
    },

    generateSecretName(name) {
      return name ? `${ name }-${ randomStr(5).toLowerCase() }` : undefined;
    },

    componentFor(type) {
      switch (type) {
      case ACCESS_CREDENTIALS.RESET_PWD:
        return require(`./type/basicAuth.vue`).default;
      case ACCESS_CREDENTIALS.INJECT_SSH:
        return require(`./type/sshkey.vue`).default;
      }
    },

    headerFor(type) {
      return {
        userPassword: this.$store.getters['i18n/t']('harvester.virtualMachine.accessCredentials.resetPwd.label'),
        sshPublicKey: this.$store.getters['i18n/t']('harvester.virtualMachine.accessCredentials.injectSSH.label'),
      }[type];
    },
  }
};
</script>

<template>
  <div>
    <Banner class="mb-20" color="info" :label="t('harvester.virtualMachine.accessCredentials.tips')" />

    <div v-for="(row, i) in rows" :key="row.id">
      <InfoBox class="volume-source">
        <button v-if="isEdit" type="button" class="role-link btn btn-sm remove-vol" @click="remove(row)">
          <i class="icon icon-2x icon-x" />
        </button>
        <h3>
          <span>
            {{ headerFor(row.source) }}
          </span>
        </h3>
        <div>
          <component
            :is="componentFor(row.source)"
            v-model="rows[i]"
            :rows="rows"
            :resource="resource"
            :user-options="userOptions"
            :mode="mode"
            :idx="i"
            @update="update"
            @update:newUser="updateNewUser"
          />
        </div>
      </InfoBox>
    </div>

    <div v-if="isEdit && isQemuInstalled" class="mt-20">
      <button
        type="button"
        class="btn btn-sm bg-primary mr-15 mb-10"
        @click="addCredentials(ACCESS_CREDENTIALS.RESET_PWD)"
      >
        {{ t('harvester.virtualMachine.accessCredentials.resetPwd.label') }}
      </button>

      <button
        type="button"
        class="btn btn-sm bg-primary mr-15 mb-10"
        @click="addCredentials(ACCESS_CREDENTIALS.INJECT_SSH)"
      >
        {{ t('harvester.virtualMachine.accessCredentials.injectSSH.label') }}
      </button>
    </div>
  </div>
</template>

<style lang='scss' scoped>
  .volume-source {
    position: relative;
  }

  .remove-vol {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 0px;
  }
</style>
