<script>
import { RECEIVERS_TYPES } from '@/edit/monitoring.coreos.com.alertmanagerconfig/receiverConfig.vue';
import { MONITORING } from '~/config/types';
export default {
  props:      {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    // this is used to pass through a detail link for instances in which 'row' is not a kubernetes resource/ doesn't have resource-class methods like detailLocation
    getCustomDetailLink: {
      type:    Function,
      default: null
    }
  },
  computed: {
    to() {
      if (this.getCustomDetailLink) {
        return this.getCustomDetailLink(this.row);
      }

      return this.row?.detailLocation;
    },

    types() {
    // get count and logo for all configured types in every receiver in the alertmanagerconfig
      if (this.row?.type === MONITORING.ALERTMANAGERCONFIG) {
        const receivers = this.row?.spec?.receivers;

        if (receivers && receivers.length > 0) {
          return receivers.reduce((totals, receiver) => {
            const counts = this.getReceiverTypes(receiver);

            Object.keys(counts).forEach((type) => {
              if (!totals[type]) {
                totals[type] = {
                  count: counts[type].count,
                  logo:  counts[type].logo
                };
              } else {
                totals[type].count += counts[type].count;
              }
            });

            return totals;
          }, {});
        }

        return null;
      } else {
        // if not alertmanagerconfig, this is an individual receiver
        return this.getReceiverTypes(this.row);
      }
    }
  },
  methods: {
    // get count and logo for each type configured in a given receiver
    getReceiverTypes(receiver) {
      // iterate through predefined types and sum the number configured in this receiver
      const types = RECEIVERS_TYPES
        .reduce((types, type) => {
          if (type.name !== 'custom' && receiver?.[type.key]?.length > 0) {
            types[this.t(type.label)] = { count: receiver?.[type.key]?.length, logo: type.logo };
          }

          return types;
        }, {});

      // if there are keys other than those defined in RECEIVERS_TYPES and 'name', assume they're custom types and sum them under "custom"
      const expectedKeys = RECEIVERS_TYPES.map(type => type.key).filter(key => key !== 'custom');

      expectedKeys.push('name');
      const customKeys = Object.keys(receiver)
        .filter(key => !expectedKeys.includes(key));

      if (customKeys.length > 0) {
        const customType = RECEIVERS_TYPES.find(type => type.name === 'custom');
        const customLabel = this.t(customType.label);

        types[customLabel] = { count: customKeys.length, logo: customType.logo };
      }

      return types;
    }
  }
};
</script>

<template>
  <span class="name-container">
    <n-link v-if="to" :to="to">
      {{ value }}
    </n-link>
    <span v-else>{{ value }}</span>
    <template v-for="(type, i) in types">
      <div :key="i" class="logo">
        <img :src="type.logo" />
      </div>
      <span v-if="type.count>1" :key="i" class="text-muted">
        {{ `(x${type.count})` }}
      </span>
    </template>
  </span>
</template>

<style scoped lang='scss'>
  .logo{
    display: inline;
    height: 1.3em;

    img{
      height: 1.3em;
    }
  }
  .name-container{
    display: flex;
    align-items: center;
  }
</style>
