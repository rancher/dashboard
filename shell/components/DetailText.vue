<script>
import { mapGetters } from 'vuex';
import { asciiLike, nlToBr } from '@shell/utils/string';
import { HIDE_SENSITIVE } from '@shell/store/prefs';
import CopyToClipboard from '@shell/components/CopyToClipboard';
import CodeMirror from '@shell/components/CodeMirror';

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
      default: null,
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

    return { expanded };
  },

  computed: {
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
        // It is base64 encoded, so adjust size
        let realSize = (3 * this.size / 4) ;

        // Might be one or two padding characters
        if (this.value.length > 0 && this.value[this.value.length - 1] === '=') {
          realSize--;
          if (this.value.length > 1 && this.value[this.value.length - 2] === '=') {
            realSize--;
          }
        }

        return this.t('detailText.binary', { n: realSize });
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
      return this.$store.getters['prefs/get'](HIDE_SENSITIVE);
    },

    concealed() {
      return this.conceal && this.hideSensitiveData && !this.isBinary;
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
    <h5 v-if="labelKey" v-t="labelKey" />
    <h5 v-else-if="label">
      {{ label }}
    </h5>

    <span v-if="isEmpty" v-t="'detailText.empty'" class="text-italic" />
    <span v-else-if="isBinary" class="text-italic">{{ body }}</span>

    <CodeMirror
      v-else-if="jsonStr"
      :options="{mode:{name:'javascript', json:true}, lineNumbers:false, foldGutter:false, readOnly:true}"
      :value="jsonStr"
      :class="{'conceal': concealed}"
    />

    <span v-else :class="{'conceal': concealed, 'monospace': monospace && !isBinary}" v-html="bodyHtml" />

    <template v-if="!isBinary && !jsonStr && isLong && !expanded">
      <a href="#" @click.prevent="expand">{{ plusMore }}</a>
    </template>

    <CopyToClipboard v-if="copy && !isBinary" :text="value" class="role-tertiary" action-color="" />
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

  > button {
    position: absolute;
    top: -1px;
    right: -1px;
    border-radius: 0 0 0 var(--border-radius);
  }
}

.monospace {
  white-space: pre-wrap;
  word-wrap: break-all
}
</style>
