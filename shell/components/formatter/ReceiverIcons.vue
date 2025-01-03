<script>
import { RECEIVERS_TYPES } from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/receiverConfig.vue';
import { MONITORING } from '@shell/config/types';
export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    }
  },
  computed: {

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
      const expectedKeys = RECEIVERS_TYPES.map((type) => type.key).filter((key) => key !== 'custom');

      expectedKeys.push('name');
      const customKeys = Object.keys(receiver)
        .filter((key) => !expectedKeys.includes(key));

      if (customKeys.length > 0) {
        const customType = RECEIVERS_TYPES.find((type) => type.name === 'custom');
        const customLabel = this.t(customType.label);

        types[customLabel] = { count: customKeys.length, logo: customType.logo };
      }

      return types;
    },

    countDisplay(type, count) {
      if (count > 1) {
        return `${ type }(x${ count })`;
      }

      return type;
    }
  }
};
</script>

<template>
  <span class="name-container">
    <template
      v-for="(type, key, i) in types"
      :key="i"
    >
      <div
        class="logo"
      >
        <img :src="type.logo">
      </div>
      <span>
        <span
          v-if="i<Object.keys(types).length-1"
          class="comma"
        >
          {{ `${countDisplay(key, type.count)}, ` }}
        </span>
        <span v-else>
          {{ countDisplay(key, type.count) }}
        </span>
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
  .comma{
    margin-right: 2px;
  }
</style>
