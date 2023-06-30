<template>
  <div class="page-header mb-20">
    <slot name="title">
      <h1 class="m-0">
        {{ title ? title : t('auditLog.title') }}
      </h1>
    </slot>
    <slot name="action">
      <div>
        <button
          class="btn role-primary"
          @click="showDialog"
        >
          {{ t('auditLog.btn.updateUrl') }}
        </button>
      </div>
    </slot>
  </div>
</template>
<script>
export default {
  props: {
    title: {
      type:    String,
      default: ''
    },
  },
  methods: {
    showDialog() {
      this.$store.dispatch('management/promptModal', {
        component:   'UpdateAuditLogServerUrlDialog',
        modalSticky: true,
      });
    }
  }
};
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
