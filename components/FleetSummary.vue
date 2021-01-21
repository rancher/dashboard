<script>
import capitalize from 'lodash/capitalize';
import CountBox from '@/components/CountBox';
import { STATES } from '@/plugins/steve/resource-instance';

export default {
  components: { CountBox },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    counts() {
      const out = {
        success: {
          count: 0,
          color: 'success'
        },
        info:    {
          count: 0,
          color: 'info'
        },
        warning: {
          count: 0,
          color: 'warning'
        },
        error:   {
          count: 0,
          color: 'error'
        },
        unknown: {
          count: 0,
          color: 'warning'
        },
      };

      for (const k in this.value) {
        if (k.startsWith('desired')) {
          continue;
        }

        const mapped = STATES[k] || STATES['other'];

        if (out[k]) {
          out[k].count += this.value[k] || 0;
          out[k].color = mapped.color;
        } else {
          out[k] = {
            count: this.value[k] || 0,
            color: mapped.color,
          };
        }
      }

      return out;
    },
  },

  methods: { capitalize },
};
</script>

<template>
  <div class="row">
    <div v-for="(v, k) in counts" :key="k" class="col span-2-of-10">
      <CountBox
        :count="v['count']"
        :name="capitalize(k)"
        :primary-color-var="'--sizzle-' + v.color"
      />
    </div>
  </div>
</template>
