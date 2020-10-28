<script>
export default {
  props: {
    size: {
      type:    String,
      default: '' // possible values are xs, sm, lg. empty is default .btn
    },
    // whether this is a button and dropdown (default) or dropdown that looks like a button/dropdown
    dualAction: {
      type:    Boolean,
      default: true
    }
  },

  computed: {
    buttonSize() {
      const { size } = this;
      let out;

      switch (size) {
      case '':
      default:
        out = 'btn';
        break;
      case 'xs':
        out = 'btn btn-xs';
        break;
      case 'sm':
        out = 'btn btn-sm';
        break;
      case 'lg':
        out = 'btn btn-lg';
        break;
      }

      return out;
    }
  },

  methods: {
    hasSlot(name = 'default') {
      return !!this.$slots[name] || !!this.$scopedSlots[name];
    },

    // allows parent components to programmatically open the dropdown
    togglePopover() {
      this.$refs.popoverButton.click();
    },
  }
};
</script>
<template>
  <div class="dropdown-button-group">
    <div
      class="dropdown-button bg-primary"
      :class="{'one-action':!dualAction, [buttonSize]:true}"
    >
      <slot v-if="dualAction" name="button-content" :buttonSize="buttonSize">
        <button
          class="bg-transparent"
          :class="buttonSize"
          disabled="true"
          type="button"
        >
          Button
        </button>
      </slot>
      <div
        v-else
        :class="buttonSize"
        type="button"
      >
        <slot name="button-content" />
      </div>
      <div v-if="hasSlot('popover-content') && dualAction" class="button-divider"></div>

      <v-popover
        v-if="hasSlot('popover-content')"
        placement="bottom"
        :container="false"
        offset="10"
        :popper-options="{modifiers: { flip: { enabled: false } } }"
      >
        <slot name="button-toggle-content" :buttonSize="buttonSize">
          <button
            ref="popoverButton"
            class="icon-container bg-transparent"
            :class="buttonSize"
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
