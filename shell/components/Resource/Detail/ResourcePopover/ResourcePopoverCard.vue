<script lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import { useStore } from 'vuex';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { useI18n } from '@shell/composables/useI18n';

export interface Props {
  resource: any;
}
</script>

<script setup lang="ts">
const emit = defineEmits(['action-invoked']);
const props = defineProps<Props>();
const store = useStore();
const i18n = useI18n(store);

const getGlanceItemValueId = (glanceItem: any): string => `value-${ glanceItem.label }:${ glanceItem.content }`.toLowerCase().replaceAll(' ', '');
</script>

<template>
  <Card
    class="resource-popover-card"
    :title="resource.nameDisplay"
  >
    <template #heading-action>
      <ActionMenu
        :resource="props.resource"
        :button-aria-label="i18n.t('component.resource.detail.glance.ariaLabel.actionMenu', { resource: props.resource.nameDisplay })"
        data-testid="resource-popover-action-menu"
        @action-invoked="emit('action-invoked')"
      />
    </template>

    <div>
      <div
        v-for="(glanceItem, i) in props.resource.glance"
        :key="glanceItem.label"
        class="row"
      >
        <label
          class="label text-deemphasized"
          :for="getGlanceItemValueId(glanceItem)"
        >
          {{ glanceItem.label }}
        </label>
        <div
          :id="getGlanceItemValueId(glanceItem)"
          class="value"
        >
          <component
            :is="glanceItem.formatter"
            v-if="glanceItem.formatter"
            v-bind="glanceItem.formatterOpts"
            :id="i === 0 ? 'first-glance-item' : undefined"
            :value="glanceItem.content"
          />
          <span
            v-else
            :id="i === 0 ? 'first-glance-item' : undefined"
          >
            {{ glanceItem.content }}
          </span>
        </div>
      </div>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.resource-popover-card {
  width: 288px;

  .dropdown-item {
    display: inline-block;
    padding: 0;
    margin: 0;
    border: none;

    &:hover {
      background: none;
    }
  }

  &:deep() {
    .badge-state {
      height: 20px;
      font-size: 12px;
    }

    .heading {
      height: 24px;

      .title {
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
      }
    }

    .v-popper, .btn.role-link {
      height: 24px;
      min-height: initial;
      padding: 0;
    }

    .v-popper {
      padding: 0;
    }

    .btn.role-link {
      color: #141419;
      padding: 0 12px;
      i {
        display: inline-flex;
        justify-content: center;
        font-size: 12px;
        width: 2.5px;
      }

      &:hover {
        background-color: transparent
      }
    }
  }

  .row {
    display: flex;
    flex-direction: row;
    line-height: 21px;

    &:not(:first-of-type) {
      margin-top: 4px;
    }

    .label {
      width: 50%;
    }
  }
}
</style>
