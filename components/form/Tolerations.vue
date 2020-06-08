<script>
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import SortableTable from '@/components/SortableTable';
import UnitInput from '@/components/form/UnitInput';
import { _VIEW } from '@/config/query-params';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    SortableTable,
    UnitInput
  },
  props: {
    // pod tolerations array
    value: {
      type:    Array,
      default: () => []
    },

    mode: {
      type:    String,
      default: 'edit'
    }
  },

  data() {
    return { rules: this.value };
  },

  computed: {
    tableHeaders() {
      return [
        {
          name:  'key',
          label: this.t('workload.scheduling.tolerations.labelKey'),
          value: 'key'
        },
        {
          name:  'operator',
          label: this.t('workload.scheduling.tolerations.operator'),
          value: 'operator',
          width: '10%'
        },
        {
          name:  'value',
          label: this.t('workload.scheduling.tolerations.value'),
          value: 'value'
        },
        {
          name:  'effect',
          label: this.t('workload.scheduling.tolerations.effect'),
          value: 'effect',
          width: '20%'
        },
        {
          name:  'seconds',
          label: this.t('workload.scheduling.tolerations.tolerationSeconds'),
          value: 'tolerationSeconds',
          width: '20%'
        },
        { name: 'remove', width: '50' }
      ];
    },
    operatorOpts() {
      return [
        {
          label: this.t('workload.scheduling.tolerations.operatorOptions.exists'),
          value: 'Exists'
        },
        {
          label: this.t('workload.scheduling.tolerations.operatorOptions.equal'),
          value: 'Equal'
        }
      ];
    },
    effectOpts() {
      return [
        {
          label: this.t('workload.scheduling.tolerations.effectOptions.all'),
          value: 'All'
        },
        {
          label: this.t('workload.scheduling.tolerations.effectOptions.noSchedule'),
          value: 'NoSchedule'
        },
        {
          label: this.t('workload.scheduling.tolerations.effectOptions.preferNoSchedule'),
          value: 'PreferNoSchedule'
        },
        {
          label: this.t('workload.scheduling.tolerations.effectOptions.noExecute'),
          value: 'NoExecute'
        }
      ];
    },

    isView() {
      return this.mode === _VIEW;
    },
    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    remove(row) {
      const idx = this.rules.indexOf(row);

      this.rules.splice(idx, 1);
      this.update();
    },

    update() {
      this.$emit('input', this.rules);
    },

    addToleration() {
      this.rules.push({});
    }
  }

};
</script>

<template>
  <div>
    <SortableTable
      :class="mode"
      class="for-inputs"
      :headers="tableHeaders"
      :rows="rules"
      :search="false"
      :table-actions="false"
      :row-actions="false"
      :show-no-rows="isView"
      key-field="id"
    >
      <template #col:key="{row}">
        <td class="key">
          <LabeledInput v-model="row.key" :mode="mode" />
        </td>
      </template>
      <template #col:operator="{row}">
        <td>
          <LabeledSelect
            id="operator"
            v-model="row.operator"
            :options="operatorOpts"
            :mode="mode"
            @input="update"
          />
        </td>
      </template>
      <template #col:value="{row}">
        <td v-if="row.operator==='Exists'">
          <div :style="{'padding-top':'17px'}">
            n/a
          </div>
        </td>
        <td v-else>
          <LabeledInput v-model="row.value" :mode="mode" />
        </td>
      </template>
      <template #col:effect="{row}">
        <td>
          <LabeledSelect
            v-model="row.effect"
            :options="effectOpts"
            :mode="mode"
            @input="update"
          />
        </td>
      </template>
      <template #col:seconds="{row}">
        <td>
          <UnitInput v-model="row.tolerationSeconds" :mode="mode" suffix="Seconds" />
        </td>
      </template>
      <template #col:remove="{row}">
        <td>
          <button
            v-if="!isView"
            type="button"
            class="btn btn-sm role-link col remove-rule-button"
            :style="{padding:'0px'}"

            :disabled="mode==='view'"
            @click="remove(row)"
          >
            <t k="buttons.remove" />
          </button>
        </td>
      </template>
    </SortableTable>
    <button v-if="!isView" class="btn role-primary" @click="addToleration">
      <t k="workload.scheduling.tolerations.addToleration" />
    </button>
  </div>
</template>
