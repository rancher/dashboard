<script>
import { mapGetters } from 'vuex';
import { asciiLike, nlToBr } from '@shell/utils/string';
import { HIDE_SENSITIVE } from '@shell/store/prefs';
import CopyToClipboard from '@shell/components/CopyToClipboard';
import CodeMirror from '@shell/components/CodeMirror';
import { binarySize } from '@shell/utils/crypto';

export default {
  components: { CopyToClipboard, CodeMirror },

  props: {
    label: {
      type:    String,
      default: null,
    },

    labelKey: {
      type:    String,
      default: null,
    },

    value: {
      type:    String,
      default: '',
    },

    maxLength: {
      type:    Number,
      default: 640, // Ought to be enough for anybody
    },

    binary: {
      type:    Boolean,
      default: null, // Autodetect
    },

    conceal: {
      type:    Boolean,
      default: false
    },

    // Will manage it's own state around showing or hiding sensitive data
    concealStandAlone: {
      type:    Boolean,
      default: false
    },

    monospace: {
      type:    Boolean,
      default: true
    },

    copy: {
      type:    Boolean,
      default: true
    }
  },

  data() {
    const expanded = this.value.length <= this.maxLength;

    return { expanded, standAloneHide: true };
  },

  computed: {
    itemLabel() {
      return this.labelKey ? this.t(this.labelKey) : this.label ? this.label : this.t('labels.annotations.singular');
    },

    isBinary() {
      if ( this.binary === null ) {
        return typeof this.value === 'string' && !asciiLike(this.value);
      }

      return this.binary;
    },

    size() {
      return `${ this.value }`.length;
    },

    isLong() {
      return this.size > this.maxLength;
    },

    isEmpty() {
      return this.size === 0;
    },

    body() {
      if (this.isBinary) {
        return this.t('detailText.binary', { n: this.value.length ? binarySize(this.value) : 0 }, true);
      }

      if (this.expanded) {
        return this.value;
      }

      return this.value.slice(0, this.maxLength);
    },

    jsonStr() {
      const value = this.value;

      if ( value && ( value.startsWith('{') || value.startsWith('[') ) ) {
        try {
          let parsed = JSON.parse(value);

          parsed = JSON.stringify(parsed, null, 2);

          return parsed;
        } catch {
        }
      }

      return null;
    },

    bodyHtml() {
      // Includes escapeHtml()
      return nlToBr(this.body);
    },

    plusMore() {
      if (this.expanded) {
        return this.t('detailText.collapse');
      }

      const more = Math.max(this.size - this.maxLength, 0);

      return this.t('detailText.plusMore', { n: more }).trim();
    },

    hideSensitiveData() {
      if (this.concealStandAlone) {
        return this.standAloneHide;
      }

      return this.$store.getters['prefs/get'](HIDE_SENSITIVE);
    },

    concealed() {
      return this.conceal && this.hideSensitiveData && !this.isBinary;
    },

    sensitiveIcon() {
      return this.standAloneHide ? 'icon-show' : 'icon-hide';
    },

    sensitiveAria() {
      return this.standAloneHide ? this.t('detailText.sensitive.show') : this.t('detailText.sensitive.hide');
    },

    ...mapGetters({ t: 'i18n/t' })
  },
  methods: {
    expand() {
      this.expanded = !this.expanded;
    },
  }
};
</script>

<template>
  <div :class="{'force-wrap': true, 'with-copy':copy}">
    <h5
      v-if="labelKey"
      v-t="labelKey"
      v-clean-tooltip="{content: itemLabel, popperClass: 'detail-text-tooltip'}"
    />
    <h5
      v-else-if="label"
      v-clean-tooltip="{content: label, popperClass: 'detail-text-tooltip'}"
    >
      {{ label }}
    </h5>

    <span
      v-if="isEmpty"
      v-t="'detailText.empty'"
      class="text-italic"
    />
    <span
      v-else-if="isBinary"
      class="text-italic"
    >{{ body }}</span>

    <CodeMirror
      v-else-if="jsonStr"
      :options="{mode:{name:'javascript', json:true}, lineNumbers:false, foldGutter:false, readOnly:true}"
      :value="jsonStr"
      :class="{'conceal': concealed}"
      aria-live="polite"
    />

    <div
      v-else
      :class="{'conceal-wrapper': concealed}"
    >
      <span
        v-clean-html="bodyHtml"
        data-testid="detail-top_html"
        :class="{'conceal': concealed, 'monospace': monospace && !isBinary}"
        aria-live="polite"
      />
    </div>

    <template v-if="!isBinary && !jsonStr && isLong && !expanded">
      <a
        href="#"
        class="more-characters"
        @click.prevent="expand"
      >{{ plusMore }}</a>
    </template>

    <div class="action-group">
      <button
        v-if="conceal && concealStandAlone"
        class="sensitive btn ready-for-action role-tertiary"
        :aria-label="sensitiveAria"
        @click="standAloneHide = !standAloneHide"
      >
        <i
          class="icon icon-lg"
          :class="sensitiveIcon"
          :alt="sensitiveAria"
        />
      </button>
      <CopyToClipboard
        v-if="copy && !isBinary"
        :text="value"
        class="role-tertiary"
        action-color=""
        :aria-label="t('detailText.copyAriaLabel', {item: itemLabel })"
      />
    </div>
  </div>
</template>

<style lang='scss' scoped>
.with-copy {
  border: solid 1px var(--border);
  border-radius: var(--border-radius);
  padding: 10px;
  position: relative;
  background-color: var(--input-bg);
  border-radius: var(--border-radius);
  border: solid var(--border-width) var(--input-border);
  contain: inline-size;

  h5 {
    margin-bottom: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: fit-content;
    // Accounting for the button on the right
    max-width: calc(100% - 150px);
  }

  // This prevents the scrollbar from overlapping the text without changing the size of the detailtext container.
  $scrollBarShift: 10px;
  .conceal-wrapper {
    overflow-x: auto;
    padding-bottom: $scrollBarShift;
    margin-bottom: -$scrollBarShift;
  }

  .conceal {
    white-space: nowrap;
    display: block;
  }

  .action-group {
    position: absolute;
    top: -1px;
    right: -1px;
    white-space-collapse:collapse;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;

    button{
      border-radius: 0;

      &:first-of-type {
        border-radius: 0 0 0 var(--border-radius);
      }

      &.sensitive {
        margin-right: -1px;
        padding: 12px 16px;
      }
    }
  }
}

.monospace {
  white-space: pre-wrap;
  word-wrap: break-all
}

.more-characters {
  margin-top: 8px;
  display: inline-block;
}
</style>

<style lang="scss">
// The global styles for tooltips are in dashboard/shell/assets/styles/global/_tooltip.scss.
// I don't want to make this change for all tooltips since there's 149 instances as of writing this
// so I'm adding a global style here that's scoped to the class we're adding to the tooltips we have in this component.
.detail-text-tooltip.v-popper__popper.v-popper--theme-tooltip {
  overflow-wrap: anywhere;
}
</style>
