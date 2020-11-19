<script>
import isEmpty from 'lodash/isEmpty';
import { RIO } from '@/config/types';
import { _VIEW } from '@/config/query-params';
import Select from '@/components/form/Select';

export default {
  components: { Select },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    spec: {
      type:     Object,
      default: () => {
        return {};
      }
    },
    namespace: {
      type:    String,
      default: 'default'
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
    showPlaceholders: {
      type:    Boolean,
      default: false
    },
    placeholders: {
      type:    Array,
      default: () => ['App', 'Version', 'Port', 'Weight']
    }
  },
  data() {
    const {
      port = '', app = '', uuid, version = ''
    } = this.spec;

    return {
      services: [],
      version,
      uuid,
      port,
      app,
      weight:     '',
    };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    formatted() {
      return {
        app:     this.app,
        version:   this.pickVersion ? this.version : null,
        port:      this.port,
        weight:    this.weight,
        uuid:      this.uuid
      };
    },
    versions() {
      if (this.app && !isEmpty(this.appsInNS)) {
        return this.appsInNS[this.app].map(service => service.version);
      } else {
        return [];
      }
    },
    servicesInNS() {
      if (!this.services) {
        return [];
      }

      return this.services.filter((service) => {
        return service.metadata.namespace === this.namespace;
      });
    },
    appsInNS() {
      const apps = {};

      this.servicesInNS.forEach((service) => {
        if (!apps[service.app]) {
          apps[service.app] = [service];
        } else {
          apps[service.app].push(service);
        }
      });

      return apps;
    }
  },
  mounted() {
    this.getServices();
  },
  methods: {
    async getServices() {
      const services = await this.$store.dispatch('cluster/findAll', { type: RIO.SERVICE });

      this.services = services;
    },
    setApp(app) {
      this.app = app;
      this.version = '';
      this.updateDestination();
    },
    updateDestination() {
      this.$emit('input', this.formatted );
    }
  }
};
</script>

<template>
  <tr>
    <td>
      <Select
        class="inline"
        :clearable="false"
        :value="app"
        :options="Object.keys(appsInNS)"
        :placeholder="showPlaceholders ? placeholders[0] : null"
        :disabled="isView"
        @input="setApp"
      />
    </td>
    <td v-if="pickVersion">
      <Select
        v-model="version"
        class="inline"
        :options="versions"
        :placeholder="showPlaceholders ? placeholders[1] : null"
        :disabled="isView"
        @input="updateDestination"
      />
    </td>
    <td class="sm">
      <input v-model.number="port" :disabled="isView" type="number" :placeholder="showPlaceholders ? placeholders[2] : null" @input="updateDestination" />
    </td>
    <td v-if="isWeighted" class="sm">
      <input v-model.number="weight" :disabled="isView" type="number" :placeholder="showPlaceholders ? placeholders[3] : null" @input="updateDestination" />
    </td>
    <td v-if="canRemove" class="sm">
      <button :disabled="isView" type="button" class="btn btn-sm role-link" @click="$emit('remove')">
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
