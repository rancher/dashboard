<script setup lang="ts">
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';

interface Props {
  onUpdate: Function;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};

const update = () => {
  props.onUpdate();
  close();
};

const store = useStore();
const { t } = useI18n(store);

</script>

<template>
  <div class="modal-header">
    {{ t('cluster.machineConfig.azure.managedDisks.modal.header') }}
  </div>
  <div class="modal-body">
    <div>
      {{ t('cluster.machineConfig.azure.managedDisks.modal.body') }}
    </div>
  </div>
  <div class="modal-footer">
    <rc-button @click="update">
      {{ t('generic.update') }}
    </rc-button>
    <rc-button
      secondary
      @click="close"
    >
      {{ t('generic.cancel') }}
    </rc-button>
  </div>
</template>

<style lang="scss" scoped>
.modal-header {
  font-size: 1.25rem;
  line-height: calc(1.75 / 1.25);
  padding: 1rem;
}

.modal-body {
  padding: 1rem;
  border-top: 1px solid var(--border);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  flex-direction: row-reverse;
  padding: 10px 20px;
}
</style>
