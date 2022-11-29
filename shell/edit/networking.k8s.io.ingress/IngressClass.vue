<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _EDIT } from '@shell/config/query-params';
import { get, set, remove } from '@shell/utils/object';

export default {
  components: { LabeledSelect },
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
      this.ingressClassName = e && typeof e === 'object' ? e.value : e;

      if (this.ingressClassName) {
        set(this.value, 'spec.ingressClassName', this.ingressClassName);
      } else {
        remove(this.value, 'spec.ingressClassName');
      }
    }
  }
};
</script>
<template>
  <div class="col span-4">
    <LabeledSelect
      v-model="ingressClassName"
      :taggable="true"
      :mode="mode"
      :label="t('ingress.ingressClass.label')"
      :options="ingressClassOptions"
      option-label="label"
      @input="update"
    />
  </div>
</template>
