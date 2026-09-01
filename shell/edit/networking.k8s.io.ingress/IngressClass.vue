<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _EDIT } from '@shell/config/query-params';
import { get, set, remove } from '@shell/utils/object';

export default {
  components: { LabeledSelect },
  emits:      ['update:value'],
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    ingressClasses: {
      type:    Array,
      default: () => []
    },
    mode: {
      type:    String,
      default: _EDIT
    }
  },
  data() {
    return { ingressClassName: get(this.value, 'spec.ingressClassName') };
  },
  computed: {
    ingressClassOptions() {
      return [
        {
          label: this.t('generic.none'),
          value: '',
        },
        ...this.ingressClasses
      ];
    }
  },
  methods: {
    update(e) {
      if (!e || e === '' || e.label === this.t('generic.none')) {
        remove(this.value, 'spec.ingressClassName');
        this.ingressClassName = '';
        this.$emit('update:value', this.value);
      } else {
        // when a user manually types an ingress class name, the event emitted has a 'label' but no 'value'
        this.ingressClassName = e.label || e;
        set(this.value, 'spec.ingressClassName', this.ingressClassName);

        this.$emit('update:value', this.value);
      }
    }
  }
};
</script>
<template>
  <div class="col span-4">
    <LabeledSelect
      v-model:value="ingressClassName"
      :taggable="true"
      :searchable="true"
      :mode="mode"
      :label="t('ingress.ingressClass.label')"
      :options="ingressClassOptions"
      option-label="label"
      @update:value="update"
    />
  </div>
</template>
