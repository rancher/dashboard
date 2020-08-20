<script>
export default {
  props: {
    size: {
      type:    String,
      default: '' // possible values are xs, sm, lg. empty is default .btn
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
    }
  }
};
</script>
<template>
  <div class="dropdown-button-group">
    <div
      class="dropdown-button bg-primary"
      :class="buttonSize"
    >
      <slot name="button-content" :buttonSize="buttonSize">
        <button
          class="bg-transparent"
          :class="buttonSize"
          disabled="true"
          type="button"
        >
          Button
        </button>
      </slot>

      <div v-if="hasSlot('popover-content')" class="button-divider"></div>

      <v-popover
        v-if="hasSlot('popover-content')"
        placement="bottom"
        :container="false"
        offset="10"
        :popper-options="{modifiers: { flip: { enabled: false } } }"
      >
        <slot name="button-toggle-content" :buttonSize="buttonSize">
          <button
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
