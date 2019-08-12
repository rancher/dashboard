<template>
  <div>
    NAMESPACES
    <MultiSelect
      deselect-label="Can't remove this value"
      placeholder="Choose namespace"
      :options="options"
      :track-by="id"
      :label="displayName"
      :taggable="true"
      :value="value"
      :limit="3"
      :limit-text="limitText"
      :allow-empty="true"
      :multiple="true"
      :searchable="true"
      :clear-on-select="false"
      :close-on-select="false"
      @input="updateSelection"
    >
      <template slot="tag" slot-scope="{ option, label, value, remove }">
        <span class="custom__tag">
          <span>{{ option.displayName }}</span>
          <span class="custom__remove text-small" @click="remove(option)">❌</span>
        </span>
      </template>
      <template slot="singleLabel" slot-scope="{ option }">
        {{ option.displayName }}
      </template>
      <template slot="clear" slot-scope="props">
        <div v-if="value.length" class="multiselect__clear" @mousedown.prevent.stop="clearAll(props.search)"></div>
      </template>
      <template slot="noResult">
        <span>No namespaces match</span>
      </template>
    </MultiSelect>
  </div>
</template>

<script>
import MultiSelect from 'vue-multiselect';
import { NAMESPACES } from '@/store/prefs';
import { NAMESPACE } from '@/utils/types';

const ALL = '_all';

export default {
  components: { MultiSelect },

  data() {
    // const value = this.$store.getters['prefs/get'](NAMESPACES);
    const value = [
      { id: ALL, displayName: 'All Namespaces' },
    ];

    const isAll = value.find(x => x.id === '_all');

    const choices = this.$store.getters['v1/all'](NAMESPACE);
    const out = [
      { id: ALL, displayName: 'All Namespaces' },
    ];

    choices.forEach((obj) => {
      out.push({
        id:          obj.id,
        displayName: obj.displayName,
        $isDisabled: isAll && false,
      });
    });

    return { value, options: choices };
  },

  computed: {
    namespaces() {
      const isAll = !!this.value.find(x => x.id === '_all');
      const choices = this.$store.getters['v1/all'](NAMESPACE);

      const out = [
        { id: ALL, displayName: 'All Namespaces' },
      ];

      choices.forEach((obj) => {
        out.push({
          id:          obj.id,
          displayName: obj.displayName,
          $isDisabled: isAll && false,
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
