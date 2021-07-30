<script>
import Loading from '@/components/Loading';
import LiveData from '@/components/formatter/LiveDate';
import ResourceTable from '@/components/ResourceTable';

import { HCI } from '@/config/types';
import { allHash } from '@/utils/promise';
import { STATE, AGE, NAME, NAMESPACE } from '@/config/table-headers';

export default {
  name:       'ListTemplate',
  components: {
    ResourceTable, LiveData, Loading
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = await allHash({
      template:           this.$store.dispatch('virtual/findAll', { type: HCI.VM_TEMPLATE }),
      templateVersion:    this.$store.dispatch('virtual/findAll', { type: HCI.VM_VERSION }),
    });

    this.template = hash.template;
    this.templateVersion = hash.templateVersion;
  },

  data() {
    return {
      template:        [],
      templateVersion: [],
    };
  },

  computed: {
    headers() {
      return [
        STATE,
        NAME,
        NAMESPACE,
        {
          name:           'defaultVersion',
          value:          'id',
          formatter:      'defaultVersion',
          labelKey:       'tableHeaders.defaultVersion'
        },
        AGE
      ];
    },

    rows() {
      return [...this.templateVersion];
    },

    groupBy() {
      return 'spec.templateId';
    },

    groupTitleBy() {
      return HCI.VM_TEMPLATE;
    },
  },

  methods: {
    showActions(e, group) {
      const template = group.rows[0].template;

      this.$store.commit(`action-menu/show`, {
        resources: [template],
        elem:      e.target
      });
    },

    valueFor(group) {
      const resource = group?.rows?.[0].template;

      return resource?.metadata?.creationTimestamp;
    },

    templateLabel(group) {
      const row = group.rows[0];

      return row.id;
    },

    templateResource(group) {
      return group?.rows?.[0].template;
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    v-bind="$attrs"
    :headers="headers"
    :sub-rows="true"
    :groupable="false"
    :rows="rows"
    :group-title-by="groupTitleBy"
    :group-by="groupBy"
    :schema="schema"
    :group-can-action="true"
    key-field="_key"
    v-on="$listeners"
  >
    <template #group-by="group">
      <div class="group-bar">
        <div class="group-tab">
          <div class="project-name" v-html="templateLabel(group.group)" />
        </div>

        <div class="right">
          <LiveData
            :value="valueFor(group.group)"
            :row="templateResource(group.group)"
          />
          <button type="button" class="btn btn-sm actions mr-5 role-multi-action" @click="showActions($event, group.group)">
            <i class="icon icon-actions" />
          </button>
        </div>
      </div>
    </template>
  </ResourceTable>
</template>

<style lang="scss" scoped>
::v-deep {
  .group-name {
    line-height: 30px;
  }

  .group-bar {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .live-date {
      padding-right: 7px;
    }

    &.has-description {
      .right {
        margin-top: 5px;
      }
      .group-tab {
        &, &::after {
            height: 50px;
        }

        &::after {
            right: -20px;
        }

        .description {
            margin-top: -20px;
        }
      }
    }
  }
}
</style>
