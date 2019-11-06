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
    },
    canRemove: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    const {
      namespace = 'default', port = '', service = {}, uuid, version = ''
    } = this.spec;

    return {
      version,
      uuid,
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
        service:   this.service.metadata ? this.service.metadata.name : this.service,
        version:   this.pickVersion ? this.version : null,
        port:      this.port,
        weight:    this.weight,
        uuid:      this.uuid
      };
    },
    versions() {
      if (this.computedApp) {
        const app = this.service.status.computedApp;

        const thisApp = filterBy(this.services, 'status.computedApp', app, );

        return thisApp.map(service => service.status.computedVersion);
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
        placeholder="Service"
        :searchable="false"
        :clearable="false"
        :value="service"
        :get-option-label="option=>option.metadata ? option.metadata.name : option.id"
        :options="services"
        @input="setService"
      ></v-select>
      <v-select
        v-if="pickVersion"
        v-model="version"
        placeholder="Version"
        class="inline"
        :options="versions"
      />
      <LabeledInput v-model="port" type="text" label="Port" />
      <LabeledInput v-model="weight" :class="{hidden: !isWeighted}" label="Weight" />
      <button :class="{hidden: !canRemove}" class="btn btn-sm role-link" @click="$emit('remove')">
        REMOVE
      </button>
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
