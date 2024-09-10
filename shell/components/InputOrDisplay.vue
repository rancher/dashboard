<script>
import { h, computed } from 'vue';
import { _VIEW } from '@shell/config/query-params';

export default {
  name:  'InputOrDisplay',
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
  setup(props, { slots }) {
    const isView = computed(() => props.mode === _VIEW);

    const displayValue = computed(() => {
      if (Array.isArray(props.value) && props.value.length === 0) {
        return '';
      } else {
        return props.value;
      }
    });

    return () => {
      if (isView.value) {
        return h('div', { class: 'label' }, [
          h('div', { class: 'text-label' }, slots.name ? slots.name : props.name),
          h('div', { class: 'value' }, slots.value ? slots.value : displayValue.value)
        ]);
      } else {
        return slots.default;
      }
    };
  }
};
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
