<script>
import { mapGetters } from 'vuex';
import { escapeHtml } from '@/utils/string';
export default {
  props: {
    value: {
      type:    String,
      default: ''
    },

    maxLength: {
      type:    Number,
      default: 20
    },

    size: {
      type:    Number,
      default: null
    },

    units: {
      type:    String,
      default: 'Bytes'
    },

    valueConcealed: {
      type:    Boolean,
      default: false
    },

    valueBinary: {
      type:    Boolean,
      default: false
    },

    showCopy: {
      type:    Boolean,
      default: false
    }
  },
  data() {
    const expanded = this.value.length <= this.maxLength;

    return { expanded };
  },
  computed: {
    preview() {
      if (this.valueBinary) {
        return `${ this.size } ${ this.units }`;
      }

      if (this.expanded) {
        return this.value;
      } else {
        return this.value.slice(0, this.maxLength);
      }
    },

    plusMore() {
      if (this.expanded) {
        return this.t('generic.hide');
      }
      if (!!this.size) {
        return `${ this.t('generic.plusMoreUnits', { n: this.size - this.maxLength * 2, unit: this.units }) }`;
      } else {
        return this.t('generic.clickToShow');
      }
    },

    ...mapGetters({ t: 'i18n/t' })
  },
  methods: {
    expand() {
      this.expanded = !this.expanded;
    },

    escapeHtml
  }

};
</script>

<template>
  <div :style="{'display':'inline-block'}" :class="{'with-copy':showCopy}">
    <span :class="{'conceal':valueConcealed && !valueBinary, 'monospace':!valueBinary && !valueConcealed}" v-html="escapeHtml(preview || '').replace(/(\r\n|\r|\n)/g, '<br/>\n')"></span>
    <template v-if="!valueBinary && value.length>maxLength">
      <a @click.stop="expand">{{ plusMore }}</a>
    </template>
    <button v-if="showCopy" class="btn role-tertiary" @click.stop="$copyText(value)">
      <i class="icon icon-copy" />
      {{ t('generic.copy') }}
    </button>
  </div>
</template>

<style lang='scss' scoped>
.with-copy {
  border: solid thin var(--border);
  border-radius: var(--border-radius);
  padding: 40px 20px 20px 20px;
  position: relative;
  background-color: var(--input-bg);
  border-radius: var(--border-radius);
  border: solid var(--outline-width) var(--input-border);
  >button{
    position: absolute;
    top: -1px;
    right: -1px;
    border-radius: 0 0 0 var(--border-radius);
  }
}

.monospace {
  font-family: monospace, monospace;
}

</style>
