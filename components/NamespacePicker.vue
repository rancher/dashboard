<template>
  <div class="picker">
    <div v-for="ns in namespaces" :key="ns.id">
      <label>
        <input v-model="value" type="radio" :value="ns.id">{{ ns.label }}
      </label>
    </div>
  </div>
</template>

<script>
import { NAMESPACES } from '@/store/prefs';
import { NAMESPACE } from '@/utils/types';
import { isArray } from '@/utils/array';

const ALL = '_all';

export default {
  computed: {
    value: {
      get() {
        const value = this.$store.getters['prefs/get'](NAMESPACES);

        // @TODO Mutliple support
        if ( isArray(value) ) {
          return value[0];
        } else {
          return value;
        }
      },

      set(neu) {
        const val = [neu];

        this.$store.dispatch('switchNamespaces', val);
      }
    },

    namespaces() {
      const choices = this.$store.getters['v1/all'](NAMESPACE);

      const out = [
        { id: ALL, label: 'All Namespaces' },
      ];

      choices.forEach((obj) => {
        out.push({
          id:    obj.id,
          label: obj.displayName,
        });
      });

      return out;
    }
  },

  methods: {
    limitText(count) {
      return `and ${ count } other namespace${ count === 1 ? '' : 's' }`;
    },

    updateSelection(value) {
      console.log('New Value', JSON.stringify(value));
      this.value = value;
    },
  }
};

</script>

<style type="scss" scoped>
</style>
