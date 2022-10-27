<template>
  <ArrayList
    v-model="data"
    :title="title"
    :add-label="t('generic.add')"
    :mode="mode"
    :remove-allowed="mode !== 'view'"
    :protip="false"
    @input="update"
  >
    <template slot="columns" slot-scope="scope">
      <div class="endpoint">
        <div v-if="statusMap[scope.row.value] && statusMap[scope.row.value].status === false" v-tooltip="statusMap[scope.row.value] && statusMap[scope.row.value].error || ''">
          <i class="text-error icon icon-info icon-lg" />
        </div>
        <div v-else-if="statusMap[scope.row.value] && statusMap[scope.row.value].status === true">
          <i class="text-success icon icon-checkmark icon-lg" />
        </div>
        <div v-else></div>
        <div v-if="scope.isView">
          {{ scope.row.value }}
        </div>
        <input
          v-else
          ref="value"
          v-model="scope.row.value"
          :placeholder="t('clusterConnectMode.apiEndpoint.placeholder')"
          :disabled="scope.isView"
          @paste="onPaste(scope.rows, scope.i, $event, scope.update)"
          @input="scope.queueUpdate"
        />
      </div>
    </template>
  </ArrayList>
</template>

<script>
import ArrayList from '@shell/components/form/ArrayList';
export default {
  props: {
    title: {
      type:    String,
      default: ''
    },
    value: {
      type: Array,
      default() {
        return [];
      }
    },
    statusMap: {
      type: Object,
      default() {
        return {};
      }
    },
    mode: {
      type:     String,
      default:  'view'
    },
  },
  data() {
    return { data: [...(this.value || [])] };
  },
  methods: {
    update() {
      this.$emit('input', this.data);
    },
    onPaste(rows, index, event, update) {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      const split = text.split('\n').map(value => ({ value }));

      split[0].value = `${ rows[index].value }${ split[0].value }`;

      rows.splice(index, 1, ...split);
      update();
    }
  },
  watch: {
    value(v) {
      if (this.mode === 'edit') {
        return;
      }
      this.data = [...v];
    }
  },
  components: { ArrayList }
};
</script>
<style scoped>
.endpoint {
  display: grid;
  grid-template-columns: 20px 1fr;
  column-gap: 4px;
  align-items: center;
}
</style>
