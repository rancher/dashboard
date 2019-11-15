<script>
import isEmpty from 'lodash/isEmpty';
import { RIO } from '@/config/types';
import { get } from '@/utils/object';

export default {
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
      namespace = 'default', port = '', app = '', uuid, version = ''
    } = this.spec;

    return {
      version,
      uuid,
      apps:     [],
      namespace,
      port,
      app,
      weight:     '',
      mode:       null
    };
  },
  computed: {
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
      if (this.app && !isEmpty(this.apps)) {
        return this.apps[this.app].map(service => service.version);
      } else {
        return [];
      }
    },
  },
  mounted() {
    this.getServices();
  },
  methods: {
    async getServices() {
      const services = await this.$store.dispatch('cluster/findAll', { type: RIO.SERVICE });
      const servicesinNS = [];

      services.forEach((service) => {
        if ( get(service, 'metadata.namespace') === this.namespace) {
          servicesinNS.push(service);
        }
      });

      const apps = {};

      servicesinNS.forEach((service) => {
        if (!apps[service.app]) {
          apps[service.app] = [service];
        } else {
          apps[service.app].push(service);
        }
      });

      this.apps = apps;
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
      <v-select
        class="inline"
        :clearable="false"
        :value="app"
        :options="Object.keys(apps)"
        :placeholder="showPlaceholders ? placeholders[0] : null"
        @input="setApp"
      ></v-select>
    </td>
    <td v-if="pickVersion">
      <v-select
        v-model="version"
        class="inline"
        :options="versions"
        :placeholder="showPlaceholders ? placeholders[1] : null"

        @input="updateDestination"
      />
    </td>
    <td class="sm">
      <input v-model.number="port" type="number" :placeholder="showPlaceholders ? placeholders[2] : null" @input="updateDestination" />
    </td>
    <td v-if="isWeighted" class="sm">
      <input v-model.number="weight" type="number" :placeholder="showPlaceholders ? placeholders[3] : null" @input="updateDestination" />
    </td>
    <td v-if="canRemove" class="sm">
      <button type="button" class="btn btn-sm role-link" @click="$emit('remove')">
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
