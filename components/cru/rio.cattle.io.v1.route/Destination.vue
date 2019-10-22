<script>
import { RIO, NAMESPACE } from '@/config/types';
import LabeledInput from '@/components/form/LabeledInput';
/*
 Weighted Destination
                    Weight - int
                    Desination
                        service - string
                        namespace - string
                        revision - string
                        port - uint32
*/
export default {
  components: { LabeledInput },
  props:      {
    isWeighted: {
      type:    Boolean,
      default: false
    }
  },
  data() {
    return {
      services:    [],
      destination: '',
      namespaces:  [],
      namespace:   '',
      port:        '',
      weight:      ''
    };
  },
  computed: {
    formatted() {
      return {
        service:   this.destination,
        namespace: this.namespace,
        port:      this.port
      };
    }
  },
  mounted() {
    this.getNamespaces();
  },
  methods: {
    async getServices() {
      const services = await this.$store.dispatch('cluster/findAll', { type: RIO.SERVICE });
      const vm = this;

      this.services = JSON.parse(JSON.stringify(services.filter(row => row.metadata.namespace === vm.namespace.id )));
    },
    async getNamespaces() {
      const namespaces = await this.$store.dispatch('cluster/findAll', { type: NAMESPACE });

      this.namespaces = JSON.parse(JSON.stringify(namespaces));
    },
    setService(service) {
      this.destination = service;
    },
    setNamespace(namespace) {
      this.namespace = namespace;
      this.getServices();
    },
    updateDestination() {
      this.$emit('input', this.formatted );
    }
  }
};
</script>

<template>
  <div class="destination" @input="updateDestination">
    <div class="service inputs">
      <div>
        <v-select
          :searchable="false"
          :clearable="false"
          :value="namespace"
          label="id"
          :options="namespaces"
          @input="setNamespace"
        ></v-select>
      </div>
      <div v-if="services.length>1">
        <v-select
          :searchable="false"
          :clearable="false"
          :value="destination"
          label="id"
          :options="services"
          @input="setService"
        ></v-select>
      </div>
      <div v-if="destination">
        <LabeledInput v-model="port" type="text" label="port" />
      </div>
    </div>
    <div v-if="isWeighted" class="weight input">
      <LabeledInput v-model="weight" type="text" label="weight" />
    </div>
  </div>
</template>

<style scoped lang='scss'>
    .destination {
        display: flex;
        .service {
            flex-basis: 100%;
        }
    }
</style>
