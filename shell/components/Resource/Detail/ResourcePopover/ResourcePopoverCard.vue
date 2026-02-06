<script lang="ts">
export interface Props {
  resource: any;
}
</script>

<script setup lang="ts">
const props = defineProps<Props>();

const getGlanceItemValueId = (glanceItem: any): string => `value-${ glanceItem.label }:${ glanceItem.content }`.toLowerCase().replaceAll(' ', '');
</script>

<template>
  <div
    class="resource-popover-card"
    :title="resource.nameDisplay"
  >
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
  </div>
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

    .v-popper, .btn.variant-link.rc-button {
      height: 24px;
      min-height: initial;
      padding: 0;
    }

    .v-popper {
      padding: 0;
    }

    .btn.variant-link.rc-button.variant-ghost {
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
