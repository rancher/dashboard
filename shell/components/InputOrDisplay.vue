<script>
import Vue from 'vue';
import { _VIEW } from '@shell/config/query-params';

const component = Vue.component('InputOrDisplay', {
  render(h) {
    if (this.isView) {
      return h('div',
        { attrs: { class: 'label' } },
        [
          h('div',
            { attrs: { class: 'text-label' } },
            this.$slots.name ? this.$slots.name : this.name
          ),
          h('div',
            { attrs: { class: 'value' } },
            this.$slots.value ? this.$slots.value : this.displayValue
          )
        ]
      );
    } else {
      return this.$slots.default;
    }
  },
  props: {
    name: {
      type:     String,
      required: true
    },
    value: {
      type:    [Number, String, Array, undefined],
      default: ''
    },
    mode: {
      type:    String,
      default: 'edit'
    }
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    displayValue() {
      if (Array.isArray(this.value) && this.value.length === 0) {
        return '';
      } else {
        return this.value;
      }
    }
  }
});

export default component;
</script>

<style lang="scss" scoped>
.label {
  display: flex;
  flex-direction: column;

  .value {
    font-size: 14px;
    line-height: $input-line-height;
  }
}
</style>
