<script>
import { get, isEmpty } from '@/utils/object';
import UnitInput from '@/components/form/UnitInput';
import { RESOURCE_QUOTA } from '@/config/types';

const SPEC_KEYS = {
  'limits.cpu':      'limitsCPU',
  'requests.cpu':    'reqCPU',
  'limits.memory':   'limitsMem',
  'requests.memory': 'reqMem'
};

export default {
  components: { UnitInput },
  props:      {
    registerAfterHook: {
      type:    Function,
      default: null
    },
    mode: {
      type:    String,
      default: 'create'
    },
    originalID: {
      type:    String,
      default: null
    },
    namespace: {
      type:    Object,
      default: () => {}
    }
  },
  data() {
    return {
      'limitsCPU':      null, 'limitsMem':   null, 'reqCPU':      null, 'reqMem':      null, originalQuota: {}
    };
  },
  computed: {
    hard() {
      const hard = {};

      Object.keys(SPEC_KEYS).forEach((key) => {
        if (this[SPEC_KEYS[key]]) {
          hard[key] = this[SPEC_KEYS[key]];
        }
      });

      return hard;
    }
  },
  created() {
    if (this.originalID) {
      this.findQuota(this.originalID);
    }
    if (this.mode === 'create') {
      this.registerAfterHook(this.createQuota);
    } else {
      this.registerAfterHook(this.updateQuota);
    }
  },
  methods: {
    async findQuota(ID) {
      const quota = await this.$store.dispatch('cluster/find', { type: RESOURCE_QUOTA, id: ID });

      Object.keys(quota.spec.hard).forEach((key) => {
        this.$set(this, SPEC_KEYS[key], parseInt(quota.spec.hard[key]));
      });
      this.originalQuota = quota;
    },
    async createQuota() {
      const metadata = { name: `default-quota` };
      const hard = {};

      Object.keys(SPEC_KEYS).forEach((key) => {
        if (this[SPEC_KEYS[key]]) {
          hard[key] = this[SPEC_KEYS[key]];
        }
      });

      if (isEmpty(hard)) {
        return;
      }
      const data = { metadata, spec: { hard } };
      const nsURL = get(this.namespace, 'metadata.selfLink');

      try {
        await this.$store.dispatch('cluster/request', {
          url:    `${ nsURL }/resourcequotas`, data, method: 'POST'
        } );
      } catch (err) {
        throw err;
      }
    },
    async updateQuota() {
      const updated = this.originalQuota;

      updated.spec.hard = this.hard;
      try {
        await this.$store.dispatch('cluster/request', {
          url:    updated.links.update, data:   updated, method: 'PUT'
        } );
      } catch (err) {
        throw err;
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <span class="col span-6">
        <UnitInput
          v-model="limitsCPU"
          suffix="CPUs"
          label="CPU Limit"
          :input-exponent="2"
          :mode="mode"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          v-model="reqCPU"
          suffix="CPUs"
          label="CPU Reservation"
          :input-exponent="2"
          :mode="mode"
        />
      </span>
    </div>
    <div class="row">
      <span class="col span-6">
        <UnitInput
          v-model="limitsMem"
          label="Memory Limit"
          suffix="B"
          :input-exponent="2"
          :mode="mode"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          v-model="reqMem"
          label="Memory Reservation"
          suffix="B"
          :input-exponent="2"
          :mode="mode"
        />
      </span>
    </div>
  </div>
</template>
