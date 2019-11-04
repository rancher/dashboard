<script>
import { filterBy } from '../../../utils/array';
import { RIO } from '@/config/types';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  props:      {
    spec: {
      type:     Object,
      default: () => {
        return {};
      }
    },
    isWeighted: {
      type:    Boolean,
      default: false
    },
    pickVersion: {
      type:    Boolean,
      default: true
    }
  },
  data() {
    const { namespace = 'default', port = '', service = {} } = this.spec;

    return {
      services:    [],
      namespace,
      port,
      service,
      weight:     null,
      mode:       null
    };
  },
  computed: {
    formatted() {
      return {
        service:   this.service.metadata ? this.service.metadata.name : '',
        namespace: this.namespace.id,
        port:      this.port,
        weight:    this.weight
      };
    },
    versions() {
      if (this.computedApp) {
        const app = this.service.status.computedApp;

        return filterBy(this.services, 'status.computedApp', app, );
      } else {
        return [];
      }
    },
    computedApp() {
      if (this.service.status) {
        return this.service.status.computedApp;
      } else {
        return null;
      }
    },
  },
  mounted() {
    this.getServices();
  },
  methods: {
    async getServices() {
      const services = await this.$store.dispatch('cluster/findAll', { type: RIO.SERVICE });
      const servicesinNS = JSON.parse(JSON.stringify(services));

      this.services = servicesinNS;
      this.service = '';
    },
    setService(service) {
      this.service = service;
    },
    updateDestination() {
      this.$emit('input', this.formatted );
    }
  }
};
</script>

<template>
  <div class="destination" @input="updateDestination" @change="updateDestination">
    <div class="row inputs">
      <v-select
        class="inline"
        placeholder="service"
        :searchable="false"
        :clearable="false"
        :value="service"
        :get-option-label="option=>option.metadata ? option.metadata.name : option.id"
        :options="services"
        @input="setService"
      ></v-select>
      <v-select v-if="pickVersion" placeholder="version" class="inline" :options="versions" :get-option-label="option=>option.status.computedVersion" />
      <LabeledInput v-model="port" type="text" label="port" />
      <LabeledInput v-model="weight" :class="{hidden: !isWeighted}" label="Weight" />
    </div>
  </div>
</template>

<style scoped lang='scss'>
    .destination {
        display: flex;
        flex-direction: column;
        margin-bottom: 10px;
        .hidden {
          visibility: hidden;
        }
    }
</style>
