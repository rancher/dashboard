<template>
  <div
    v-if="show"
    class="dialog"
  >
    <div class="dialog-content">
      <div class="dialog-header">
        <h2>{{ title }}</h2>
      </div>
      <div class="dialog-body">
        <slot />
      </div>
      <div class="dialog-footer">
        <button
          v-loading="loading"
          type="button"
          class="btn role-secondary mr-10"
          :disabled="loading"
          @click="closeDialog"
        >
          {{ t('generic.cancel') }}
        </button>
        <slot name="createButton">
          <button
            v-loading="loading"
            :disabled="loading"
            type="button"
            class="btn bg-primary"
            @click="create"
          >
            {{ t('generic.add') }}
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name:  'Dialog',
  props: {
    show: {
      type:    Boolean,
      default: false,
    },
    loading: {
      type:    Boolean,
      default: false,
    },
    title: {
      type:    String,
      default: '',
    },
  },
  methods: {
    closeDialog() {
      this.$emit('close');
    },
    create() {
      this.$emit('create');
    }
  },
};
</script>

<style lang="scss" scoped>
.dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 20;

  .dialog-content {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 100%;
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
      margin-bottom: 10px;
      H2 {
        margin: 0;
      }
    }
    .dialog-body {
      padding: 10px;
    }
    .dialog-footer {
      display: flex;
      align-items: center;
      padding-bottom: 10px;
      justify-content: flex-end;
    }
  }
}
</style>
