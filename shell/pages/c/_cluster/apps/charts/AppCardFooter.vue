<script setup lang="ts">

interface FooterItem {
  icon?: string;
  iconTooltip?: Record<{key?: string, text?: string}>;
  labels: string[];
}

const emit = defineEmits<{(e: 'footer-item-click', type: string, label: string): void; }>();

defineProps<{
  items: FooterItem[];
}>();

function onFooterItemClick(type: string, label: string) {
  emit('footer-item-click', type, label);
}

</script>

<template>
  <div class="app-card-footer">
    <div
      v-for="(footerItem, i) in items"
      :key="i"
      class="app-card-footer-item no-card-click"
      data-testid="app-card-footer-item"
    >
      <i
        v-if="footerItem.icon"
        v-clean-tooltip="t(footerItem.iconTooltip?.key)"
        :class="['icon', 'app-card-footer-item-icon', footerItem.icon]"
      />
      <p
        v-for="(label, j) in footerItem.labels"
        :key="j"
        class="app-card-footer-item-text secondary-text-link"
        data-testid="app-card-footer-item-text"
        @click="onFooterItemClick(footerItem.type, label)"
      >
        {{ label }}<span v-if="footerItem.labels.length > 1 && j !== footerItem.labels.length - 1">, </span>
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-card-footer {
  display: flex;
  flex-wrap: wrap;

  &-item {
    display: flex;
    align-items: center;
    color: var(--link-text-secondary);
    margin-top: 8px;
    margin-right: 8px;

    &-text {
      text-transform: capitalize;
      margin-right: 8px;
    }

    &-icon {
      width: 20px;
      height: 20px;
      display: flex;
      font-size: 19px;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
    }
  }
}
</style>
