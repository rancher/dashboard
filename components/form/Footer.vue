<script>
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';
import AsyncButton from '@/components/AsyncButton';

export default {
  components: { AsyncButton },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    errors: {
      type:    Array,
      default: null,
    },

    createActionLabel: {
      type:    String,
      default: null,
    },

    createWaitingLabel: {
      type:    String,
      default: null,
    },

    createSuccessLabel: {
      type:    String,
      default: null,
    },

    createErrorLabel: {
      type:    String,
      default: null,
    },

    editActionLabel: {
      type:    String,
      default: null,
    },

    editWaitingLabel: {
      type:    String,
      default: null,
    },

    editSuccessLabel: {
      type:    String,
      default: null,
    },

    editErrorLabel: {
      type:    String,
      default: null,
    },
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isView() {
      return this.mode === _VIEW;
    },
  },

  methods: {
    save(buttonCb) {
      this.$emit('save', buttonCb);
    },

    done() {
      this.$emit('done');
    }
  }
};
</script>
<template>
  <div>
    <div class="spacer"></div>

    <div v-for="(err,idx) in errors" :key="idx">
      <div class="text-error">
        {{ err }}
      </div>
    </div>
    <div class="text-center">
      <slot name="left" />
      <slot name="cancel">
        <button type="button" class="btn role-secondary" @click="done">
          Cancel
        </button>
      </slot>
      <slot name="middle" />
      <slot name="save">
        <AsyncButton
          v-if="isEdit"
          key="edit"
          mode="edit"
          :action-label="editActionLabel"
          :error-label="editErrorLabel"
          :success-label="editSuccessLabel"
          :waiting-label="editWaitingLabel"
          @click="save"
        />
        <AsyncButton
          v-if="isCreate"
          key="create"
          mode="create"
          :action-label="createActionLabel"
          :error-label="createErrorLabel"
          :success-label="createSuccessLabel"
          :waiting-label="createWaitingLabel"
          @click="save"
        />
      </slot>
      <slot name="right" />
    </div>
  </div>
</template>
