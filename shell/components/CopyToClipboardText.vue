<script>
import { VTooltip } from 'v-tooltip';
export default {
  props: {
    text: {
      type:     String,
      required: true,
    },
    // Show as plain - don't show in link style
    plain: {
      type:    Boolean,
      default: false
    },
    // Show label before copy-to-clipboard icon
    showLabel: {
      type:    Boolean,
      default: true
    },
    toolTip: {
      type:    Boolean,
      default: false
    },
  },

  data() {
    return {
      copied: false,
      text: "Copy to invite",
      copyText: ''
    };
  },

  methods: {
    clicked(event) {
      if (!this.copied) {
        event.preventDefault();
        this.$copyText(this.text);
        this.copied = true;

        let t = event.target;
        if (t.tagName === 'I') {
          t = t.parentElement || t;
        }
        setTimeout(() => {
          this.copied = false;
        }, 1000);
      }
    },
    reset() {
      this.copyText = this.text;
    }
  }
};
</script>

<template>
  <div>
    <a
      class="copy-to-clipboard-text"
      :class="{ 'copied': copied, 'plain': plain}"
      href="#"
      @click="clicked"
    >
      <span v-if="showLabel">{{ text }}</span>
      <i
        class="icon"
        :class="{ 'icon-copy': !copied, 'icon-checkmark': copied}"
      />
    </a>
    <v-popover
      popover-class="localeSelector"
      placement="top"
      @click="clicked"
      @mouseout="reset" 
    >
      {{copied}}
      <a
        data-testid="locale-selector"
        class="locale-chooser"
      >
        <i class="icon icon-copy" />
      </a>
      <template slot="popover">
        <span>test</span>
      </template>
    </v-popover>
  </div>
</template>
<style lang="scss" scoped>
  .copy-to-clipboard-text {
    &.plain {
      color: var(--body-text);

      &:hover {
        text-decoration: none;
      }
    }

    &.copied {
      pointer-events: none;
      color: var(--success);
    }
  }
</style>
