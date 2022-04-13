<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import DetailText from '@shell/components/DetailText';
import Tab from '@shell/components/Tabbed/Tab';

export default {
  components: {
    ResourceTabs,
    DetailText,
    Tab,
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  computed:   {
    parsedRows() {
      const rows = [];
      const { data = {}, binaryData = {} } = this.value;

      Object.keys(data).forEach((key) => {
        rows.push({
          key,
          value:  data[key],
          binary: false,
        });
      });

      Object.keys(binaryData).forEach((key) => {
        rows.push({
          key,
          value:  binaryData[key],
          binary: true,
        });
      });

      return rows;
    },
  },
};
</script>

<template>
  <ResourceTabs v-model="value">
    <Tab name="data" label-key="secret.data">
      <div v-for="(row,idx) in parsedRows" :key="idx" class="mb-20">
        <DetailText :value="row.value" :label="row.key" :binary="row.binary" />
      </div>
      <div v-if="!parsedRows.length">
        <div v-t="'sortableTable.noRows'" class="m-20 text-center" />
      </div>
    </Tab>
  </ResourceTabs>
</template>
