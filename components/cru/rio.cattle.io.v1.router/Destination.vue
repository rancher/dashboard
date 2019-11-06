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
    },
    placeholders: {
      type:    Array,
      default: () => ['Service', 'Version', 'Port', 'Weight']
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
      weight:     '',
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

<template @input="updateDestination" @change="updateDestination">
  <tr>
    <td>
      <v-select
        class="inline"
        :placeholder="placeholders[0]"
        :searchable="false"
        :clearable="false"
        :value="service"
        :get-option-label="option=>option.metadata ? option.metadata.name : option.id"
        :options="services"
        @input="setService"
      ></v-select>
    </td>
    <td v-if="pickVersion">
      <v-select
        v-model="version"
        :placeholder="placeholders[1]"
        class="inline"
        :options="versions"
      />
    </td>
    <td class="sm">
      <LabeledInput v-model="port" type="text" :label="placeholders[2]" />
    </td>
    <td v-if="isWeighted" class="sm">
      <LabeledInput v-model="weight" :label="placeholders[3]" />
    </td>
    <td v-if="canRemove" class="sm">
      <button class="btn btn-sm role-link" @click="$emit('remove')">
        REMOVE
      </button>
    </td>
  </tr>
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
