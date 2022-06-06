<script>
import { mapGetters } from 'vuex';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { alternateLabel } from '@shell/utils/platform';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import { Card } from '@components/Card';
import CopyToClipboardText from '@shell/components/CopyToClipboardText';
import Checkbox from '~/pkg/rancher-components/src/components/Form/Checkbox/Checkbox.vue';

export default {
  nameL: 'ForcePodRemoveDialog',

  components: {
    AsyncButton,
    Banner,
    Card,
    CopyToClipboardText,
    Checkbox
  },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return { errors: [], confirmName: '', forceDelete: true };
  },

  computed: {
    machine() {
      console.log('RESOURCES', this.resources)
      return this.resources[0];
    },

    nameToMatch() {
      return this.machine.metadata.name;
    },

    protip() {
      return this.t('promptRemove.protip', { alternateLabel });
    },
  },

  methods: {
    close() {
      this.confirmName = '';
      this.errors = [];
      this.$emit('close');
    },

    async remove(confirm) {
      try {
        if(this.forceDelete) {
          await this.machine.forceMachineRemove();
        }
        else {
          await this.machine.remove();
        }
      //  confirm(true);
        this.close();
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
        confirm(false);
      }
    }
  }
};
</script>

<template>
  <Card class="prompt-restore" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text">
      {{ t('promptForceRemove.modalTitle') }}
    </h4>
    <div slot="body" class="pl-10 pr-10">
      <span
        v-html="t('promptForceRemove.removeWarning', { nameToMatch }, true)"
      ></span>
      <div class="mb-10">
        <Checkbox
          v-model="forceDelete"
          label="nameToMatch"
        />
      </div>
      <input id="confirm" v-model="confirmName" type="text" />
      <div class="text-info mt-20">
        {{ protip }}
      </div>
      <Banner v-for="(error, i) in errors" :key="i" class="" color="error" :label="error" />
    </div>
    <template #actions>
      <button class="btn role-secondary mr-10" @click="close">
        {{ t('generic.cancel') }}
      </button>
      <AsyncButton mode="delete" class="btn bg-error ml-10" @click="remove" />
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .actions {
    text-align: right;
  }
</style>
