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
    spec: {
      type:     Object,
      required: true
    },
    isWeighted: {
      type:    Boolean,
      default: false
    }
  },
  data() {
    return {
      services:    [],
      namespaces:  [],
      namespace:   this.spec.namespace || '',
      port:        this.spec.port,
      service:     this.spec.service || {},
      weight:     0,
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
    }
  },
  mounted() {
    this.getNamespaces();
  },
  methods: {
    async getServices() {
      const services = await this.$store.dispatch('cluster/findAll', { type: RIO.SERVICE });
      const vm = this;

      const servicesinNS = JSON.parse(JSON.stringify(services.filter(row => row.metadata.namespace === vm.namespace.id )));

      this.services = servicesinNS;
      this.service = '';
    },
    async getNamespaces() {
      const namespaces = await this.$store.dispatch('cluster/findAll', { type: NAMESPACE });

      this.namespaces = JSON.parse(JSON.stringify(namespaces));
    },
    setService(service) {
      this.service = service;
      this.updateDestination();
    },
    setNamespace(namespace) {
      this.namespace = namespace;
      this.getServices();
      this.updateDestination();
    },
    updateDestination() {
      this.$emit('input', this.formatted );
    }
  }
};
</script>

<template>
  <div class="destination" @input="updateDestination">
    <span> destination</span>
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
      <div v-if="!services.length && namespace">
        no services found in this namespace
      </div>
      <div v-if="services.length>1">
        <v-select
          :searchable="false"
          :clearable="false"
          :value="service"
          label="id"
          :options="services"
          @input="setService"
        ></v-select>
      </div>
      <div v-if="service.metadata">
        <LabeledInput v-model="port" type="text" label="port" />
        <LabeledInput v-if="isWeighted" v-model="weight" type="text" label="weight" />
      </div>
    </div>
  </div>
</template>

<style scoped lang='scss'>
    .destination {
        display: flex;
        flex-direction: column;
        .service {
            flex-basis: 100%;
        }
    }
</style>
