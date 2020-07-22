<script>
export default {
  methods: {
    hasSlot(name = 'default') {
      return !!this.$slots[name] || !!this.$scopedSlots[name];
    }
  }
};
</script>
<template>
  <div class="dropdown-button-group">
    <div class="dropdown-button btn bg-primary">
      <slot name="button-content">
        <button
          class="btn bg-transparent"
          disabled="true"
          type="button"
        >
          Button
        </button>
      </slot>

      <div class="button-divider"></div>

      <v-popover
        v-if="hasSlot('popover-content')"
        placement="bottom"
        container=".dropdown-button-group"
        offset="10"
        :popper-options="{modifiers: { flip: { enabled: false } } }"
      >
        <slot name="button-toggle-content">
          <button
            class="icon-container btn bg-transparent"
            type="button"
          >
            <i class="icon icon-chevron-down" />
          </button>
        </slot>

        <template slot="popover">
          <slot name="popover-content" />
        </template>
      </v-popover>
    </div>
  </div>
</template>
