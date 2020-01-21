<script>
import DetailTop from '@/components/DetailTop';
import DetailTopColumn from '@/components/DetailTopColumn';
import SortableTable from '@/components/SortableTable';
import VStack from '@/components/Layout/Stack/VStack';
import {
  KEY,
  VALUE,
  STATE,
  NAME,
  SIMPLE_SCALE,
  IMAGE,
  CREATED
} from '@/config/table-headers';

export default {
  name:       'DetailConfigMap',
  components: {
    DetailTop,
    DetailTopColumn,
    SortableTable,
    VStack
  },
  props: {
    value: {
      type:     Object,
      required: true,
    },
  },
  data() {
    return {
      valuesTableHeaders: [
        {
          ...KEY, sort:  false, width: 400
        },
        { ...VALUE, sort: false },
      ],
      relatedWorkloadsHeaders: [
        STATE,
        NAME,
        SIMPLE_SCALE,
        IMAGE,
        CREATED
      ]
    };
  },
  computed: {
    valuesTableRows() {
      return Object.entries(this.value.data).map(kvp => ({
        key:   kvp[0],
        value: kvp[1]
      }));
    },

    relatedWorkloadsRows() {
      return [
        {
          stateDisplay:    'Success',
          stateBackground: 'bg-success',
          nameDisplay:     'Workload0',
          detailUrl:       '#',
          scale:           4,
          image:           'nginx',
          created:         '2020-01-20T09:00:00+00:00'
        },
        {
          stateDisplay:    'Success',
          stateBackground: 'bg-success',
          nameDisplay:     'Workload1',
          detailUrl:       '#',
          scale:           44,
          image:           'ubuntu',
          created:         '2020-01-20T11:00:00+00:00'
        }
      ];
    }

  },
};
</script>

<template>
  <VStack class="config-map">
    <DetailTop>
      <DetailTopColumn title="Description">
        {{ value.metadata.annotations['cattle.io/description'] }}
      </DetailTopColumn>
      <DetailTopColumn title="Namespace">
        {{ value.metadata.namespace }}
      </DetailTopColumn>
    </DetailTop>
    <div>
      <div class="title">
        Values
      </div>
      <SortableTable
        key-field="_key"
        :headers="valuesTableHeaders"
        :rows="valuesTableRows"
        :row-actions="false"
        :search="false"
        :table-actions="false"
        :top-divider="false"
        :emphasized-body="false"
        :body-dividers="true"
      />
    </div>
    <div>
      <div>Related Workloads</div>
      <SortableTable
        key-field="_key"
        :headers="relatedWorkloadsHeaders"
        :rows="relatedWorkloadsRows"
        :row-actions="false"
        :search="false"
      />
    </div>
  </VStack>
</template>

<style lang="scss" scoped>
.config-map > * {
    margin-bottom: 50px;
}

.title {
    margin-bottom: 20px;
}
</style>
