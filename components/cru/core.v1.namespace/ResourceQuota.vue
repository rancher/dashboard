<script>
import { get, cleanUp, isEmpty } from '@/utils/object';
import UnitInput from '@/components/form/UnitInput';
import { RESOURCE_QUOTA } from '@/config/types';
export default {
  components: { UnitInput },
  props:      {
    registerAfterHook: {
      type:    Function,
      default: null
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const schema = this.$store.getters['cluster/schemaFor'](RESOURCE_QUOTA);
    const {
      hard = {
        'limits.cpu':      null, 'limits.memory':   null, 'requests.cpu':    null, 'requests.memory':  null
      }
    } = this.value.spec || {};

    return { schema, hard };
  },
  computed: {
    nsURL() {
      return get(this.value, 'metadata.selfLink');
    }
  },
  created() {
    this.registerAfterHook(this.createQuota);
  },
  methods: {
    async createQuota() {
      const metadata = { name: `default-quota` };
      const data = { spec: { hard: cleanUp(this.hard) }, metadata };

      if (isEmpty(data.spec.hard)) {
        return;
      }
      try {
        await this.$store.dispatch('cluster/request', {
          url:    `${ this.nsURL }/resourcequotas`, data, method: 'POST'
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
        <UnitInput v-model="hard['limits.cpu']" suffix="Mil CPUs" label="CPU Limit" />
      </span>
      <span class="col span-6">
        <UnitInput v-model="hard['requests.cpu']" suffix="Mil CPUs" label="CPU Reservation" />
      </span>
    </div>
    <div class="row">
      <span class="col span-6">
        <UnitInput v-model="hard['limits.memory']" label="Memory Limit" suffix="MB" />
      </span>
      <span class="col span-6">
        <UnitInput v-model="hard['requests.memory']" label="Memory Reservation" suffix="MB" />
      </span>
    </div>
  </div>
</template>

<style lang='scss'>
</style>
