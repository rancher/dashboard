<script>
import { mapGetters } from 'vuex';

import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import ModalWithCard from '@/components/ModalWithCard';

import { HCI } from '@/config/types';
import { clone } from '@/utils/object';
import { _VIEW, _CONFIG } from '@/config/query-params';

export default {
  components: {
    LabeledInput,
    ModalWithCard,
    LabeledSelect,
  },

  props: {
    value: {
      type:    Array,
      default: () => {
        return [];
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

    namespace: {
      type:    String,
      default: ''
    }
  },

  data() {
    return {
      checkedSsh:       this.value,
      publicKey:        '',
      sshName:          '',
      errors:           [],
      isAll:            false,
      checkAll:         false
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isConfig() {
      return this.$route.query?.as === _CONFIG;
    },

    ssh() {
      return this.$store.getters['harvester/all'](HCI.SSH);
    },

    sshOption() {
      const choise = this.$store.getters['harvester/all'](HCI.SSH);

      return choise.map( (O) => {
        return {
          label: O.id,
          value: O.id
        };
      });
    },

    isView() {
      return this.mode === _VIEW || this.disableCreate;
    }
  },

  watch: {
    publicKey(neu) {
      const splitSSH = neu.split(/\s+/);

      if (splitSSH.length === 3) {
        if (splitSSH[2].includes('@')) {
          if (splitSSH[2].split('@')) {
            if (!this.sshName) {
              this.sshName = splitSSH[2].split('@')[0];
            }
          }
        }
      }
    },

    value(neu) {
      this.checkedSsh = neu;
    }
  },

  methods: {
    show() {
      this.$modal.show('newSSH');
    },

    hide() {
      this.$modal.hide('newSSH');
    },

    async save(buttonCb) {
      this.errors = [];

      if (!this.sshName) {
        const fieldName = this.t('harvester.virtualMachine.input.name');
        const message = this.t('validation.required', { key: fieldName });

        this.errors.push(message);
      }

      if (!this.publicKey) {
        const fieldName = this.t('harvester.virtualMachine.input.sshKeyValue');
        const message = this.t('validation.required', { key: fieldName });

        this.errors.push(message);
      }

      if (this.sshName.length > 63) {
        const message = this.t('harvester.validation.custom.tooLongName', { max: 63 });

        this.errors.push(message);
      }

      if (this.errors.length > 0) {
        buttonCb(false);

        return;
      }

      try {
        const sshValue = await this.$store.dispatch('harvester/create', {
          metadata: {
            name:      this.sshName,
            namespace: this.namespace
          },
          spec:       { publicKey: this.publicKey },
          type:       HCI.SSH
        });

        const res = await sshValue.save({ extend: { isRes: true } });

        if (res._status === 200 || res._status === 201 || res._status === 204) {
          this.checkedSsh.push(`${ this.namespace }/${ this.sshName }`);
        }

        buttonCb(true);
        this.cancel();
      } catch (err) {
        this.errors = [err.message];
        buttonCb(false);
      }
    },

    cancel() {
      this.hide();
      this.resetFields();
    },

    resetFields() {
      this.sshName = '';
      this.publicKey = '';
      this.errors = [];
    },

    update() {
      this.$emit('update:sshKey', clone(this.checkedSsh));
    }
  }
};
</script>

<template>
  <div>
    <div>
      <LabeledSelect
        v-model="checkedSsh"
        :label="t('harvester.virtualMachine.input.sshKey')"
        :taggable="true"
        :mode="mode"
        :multiple="true"
        :searchable="true"
        :disabled="isConfig"
        :options="sshOption"
        @input="update"
      />

      <span v-if="!isView" class="btn btn-sm bg-primary mt-20" @click="show">
        {{ t('harvester.virtualMachine.createSSHKey') }}
      </span>
    </div>

    <ModalWithCard
      ref="newSSH"
      name="newSSH"
      width="40%"
      :errors="errors"
      @finish="save"
      @close="cancel"
    >
      <template #title>
        {{ t('harvester.virtualMachine.sshTitle') }}
      </template>

      <template #content>
        <LabeledInput
          v-model="sshName"
          :label="t('harvester.virtualMachine.input.name')"
          class="mb-20"
          required
          @keydown.native.enter.prevent="()=>{}"
        />

        <LabeledInput
          v-model="publicKey"
          :label="t('harvester.virtualMachine.input.sshKeyValue')"
          :min-height="160"
          class="mb-20"
          type="multiline"
          required
        />
      </template>
    </ModalWithCard>
  </div>
</template>
