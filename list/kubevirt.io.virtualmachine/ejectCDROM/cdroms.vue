<script>
import VM_MIXIN from '@/mixins/vm';

export default {
  name: 'CDROMS',

  mixins: [VM_MIXIN],

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  data() {
    return {
      spec:        this.value.spec,
      rows:        [],
      diskRows:    [],
      checkedList: []
    };
  },

  computed: {
    headers() {
      const out = [{
        name:  'name',
        label: 'Name',
        value: 'name',
      },
      {
        name:  'Source',
        label: 'Source',
        value: 'source',
      },
      {
        name:      'Size',
        label:     'Size',
        value:     'size',
      },
      {
        name:  'Interface',
        label: 'Bus',
        value: 'bus',
      },
      {
        name:  'bootOrder',
        label: 'Boot Order',
        value: 'bootOrder',
      }];

      out.unshift({
        name:  '',
        label: '',
        value: '',
        width: 50,
        align: 'center'
      });

      return out;
    },
  },

  watch: {
    value: {
      handler(neu) {
        this.$set(this, 'spec', this.value.spec);
        this.diskRows = this.getDiskRows();
      },
      deep: true
    },

    diskRows: {
      handler(neu) {
        this.rows = neu.filter(d => d.type === 'cd-rom');
      },
      deep: true
    },

    checkedList(neu) {
      this.$emit('change', neu);
    },

  },

  created() {
    this.diskRows = this.getDiskRows(this.value.spec);
  },

  methods: {
    getCheckCdrow() {
      const diskNames = [];

      this.hasChecked = false;

      for (let i = 0; i < this.diskRows.length; i++) {
        if (this.diskRows[i]?.isEjectCdRow) {
          this.hasChecked = true;
          diskNames.push(this.diskRows[i].name);
        }
      }

      return diskNames;
    },

  }
};
</script>

<template>
  <div>
    <span v-for="row in rows" :key="row.name">
      <label class="checkbox-container mr-15"><input v-model="checkedList" type="checkbox" :label="row.name" :value="row.name" />
        <span
          class="checkbox-custom mr-5"
          role="checkbox"
        />
        {{ row.name }}
      </label>
    </span>
  </div>
</template>
