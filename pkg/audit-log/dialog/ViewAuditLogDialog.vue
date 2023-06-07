<script>
import { Card } from '@components/Card';
import JsonView from '@pkg/components/JsonView';

export default {
  props: {
    value: {
      type:     Object,
      required: true
    }
  },
  computed: {
    requestBody() {
      const json = this.value?.requestBody;

      return json && JSON.stringify(JSON.parse(json), undefined, 2);
    },
    responseBody() {
      const json = this.value?.responseBody;

      return json && JSON.stringify(JSON.parse(json), undefined, 2);
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
  },
  components: {
    Card,
    JsonView
  }
};
</script>
<template>
  <Card
    class="view-audit-log-dialog"
    :show-highlight-border="false"
  >
    <h4
      slot="title"
      v-clean-html="t('auditLog.detail.title')"
      class="text-default-text"
    />
    <div
      slot="body"
      class="pl-10 pr-10"
    >
      <div>
        <h4>{{ t('auditLog.detail.request') }}</h4>
        <JsonView :value="requestBody" />
      </div>
      <div class="mt-10">
        <h4>{{ t('auditLog.detail.response') }}</h4>
        <JsonView :value="responseBody" />
      </div>
    </div>
    <div
      slot="actions"
      class="buttons"
    >
      <button
        class="btn role-secondary mr-10"
        @click="close"
      >
        {{ t('generic.cancel') }}
      </button>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
.view-audit-log-dialog {
  &.card-container {
      box-shadow: none;
    }
}
</style>
