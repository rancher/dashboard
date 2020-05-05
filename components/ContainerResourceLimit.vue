<script>
import { isEmpty } from 'lodash';
import UnitInput from '@/components/form/UnitInput';
import { CONTAINER_DEFAULT_RESOURCE_LIMIT } from '@/config/labels-annotations';

export default {
  components: { UnitInput },

  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    namespace: {
      type:    Object,
      default: () => ({})
    },

    registerBeforeHook: {
      type:    Function,
      default: null
    },
  },

  data() {
    return {
      limitsCpu:      null,
      limitsMemory:   null,
      requestsCpu:    null,
      requestsMemory: null,
    };
  },

  computed: {
    detailTopColumns() {
      return [
        {
          title: this.$store.getters['i18n/t']('generic.created'),
          name:  'created'
        },
      ];
    },
  },

  created() {
    if (this?.namespace?.id) {
      this.initLimits();
    }

    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.updateLimits);
    }
  },

  methods: {
    updateLimits(value) {
      const {
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory,
      } = this;
      const namespace = this.namespace; // no deep copy in destructure proxy yet
      const out = {
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory,
      };

      if (namespace) {
        namespace.setAnnotation(CONTAINER_DEFAULT_RESOURCE_LIMIT, JSON.stringify(out));
      }
    },

    initLimits() {
      const namespace = this.namespace;
      const defaults = namespace?.metadata?.annotations[CONTAINER_DEFAULT_RESOURCE_LIMIT];

      if (!isEmpty(defaults)) {
        const {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
        } = JSON.parse(defaults);

        this.limitsCpu = limitsCpu;
        this.limitsMemory = limitsMemory;
        this.requestsCpu = requestsCpu;
        this.requestsMemory = requestsMemory;
      }
    },
  }

};
</script>

<template>
  <div class="mt-20">
    <div class="row mb-5 pl-10">
      <div class="col span-12">
        <h4 class="mb-10">
          Container Default Resource Limit
        </h4>
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <div class="row">
          <span class="col span-6">
            <UnitInput
              v-model="requestsCpu"
              suffix="CPUs"
              label="CPU Reservation"
              :input-exponent="-1"
              :mode="mode"
            />
          </span>
          <span class="col span-6">
            <UnitInput
              v-model="requestsMemory"
              label="Memory Reservation"
              suffix="B"
              :input-exponent="2"
              :mode="mode"
            />
          </span>
        </div>
        <div class="row">
          <span class="col span-6">
            <UnitInput
              v-model="limitsCpu"
              suffix="CPUs"
              label="CPU Limit"
              :input-exponent="-1"
              :mode="mode"
            />
          </span>
          <span class="col span-6">
            <UnitInput
              v-model="limitsMemory"
              label="Memory Limit"
              suffix="B"
              :input-exponent="2"
              :mode="mode"
            />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
