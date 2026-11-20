<script lang="ts">
import { defineComponent } from 'vue';
import Loading from '@shell/components/Loading.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import SortableTable from '@shell/components/SortableTable';
import Principal from '@shell/components/auth/Principal.vue';
import Banner from '@components/Banner/Banner.vue';
import { MANAGEMENT } from '@shell/config/types';
import { grantResourceHeaders, grantResourceRows } from '@shell/utils/grant-resources';

export default defineComponent({
  name: 'DetailUserType',

  emits: ['input'],

  components: {
    Loading,
    ResourceTabs,
    Tab,
    SortableTable,
    Principal,
    Banner,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    if (this.canSeeAssignments) {
      this.principalIds = await this.value.assignedPrincipalIds();
    }
  },

  data() {
    return { principalIds: [] as string[] };
  },

  computed: {
    canSeeAssignments(): boolean {
      return !!this.$store.getters['management/canList'](MANAGEMENT.GLOBAL_ROLE_BINDING);
    },

    ruleHeaders() {
      // User type rules have no non-resource URLs
      return grantResourceHeaders({ nonResourceUrls: false });
    },

    ruleRows() {
      return grantResourceRows(this.value.spec?.rules || []);
    },
  },
});
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs
    v-else
    :value="value"
    mode="view"
    :need-conditions="false"
    :need-events="false"
    @input="$emit('input', $event)"
  >
    <Tab
      v-if="canSeeAssignments"
      name="assignments"
      :label="t('userType.assignments.label', {}, true)"
      :weight="2"
    >
      <div class="tab-content">
        <Banner
          color="info"
          class="tab-note"
          label-key="userType.detail.assignmentsNote"
          data-testid="usertype-detail-assignments-note"
        />
        <p
          v-if="!principalIds.length"
          class="text-muted"
          data-testid="usertype-detail-no-assignments"
        >
          {{ t('userType.detail.noAssignments') }}
        </p>
        <ul
          v-else
          class="assignments"
          data-testid="usertype-detail-assignments"
        >
          <li
            v-for="id in principalIds"
            :key="id"
          >
            <Principal :value="id" />
          </li>
        </ul>
      </div>
    </Tab>
    <Tab
      name="resource-permissions"
      :label="t('userType.resourcePermissions.label')"
      :weight="1"
    >
      <div class="tab-content">
        <Banner
          color="info"
          class="tab-note"
          label-key="userType.resourcePermissions.description"
          data-testid="usertype-detail-rules-note"
        />
        <SortableTable
          v-if="ruleRows.length"
          key-field="index"
          :rows="ruleRows"
          :headers="ruleHeaders"
          :table-actions="false"
          :row-actions="false"
          :search="false"
          data-testid="usertype-detail-rules"
        />
        <p
          v-else
          class="text-muted"
          data-testid="usertype-detail-no-rules"
        >
          {{ t('userType.detail.noRules') }}
        </p>
      </div>
    </Tab>
  </ResourceTabs>
</template>

<style lang="scss" scoped>
  // Banner's own margin (15px above and below) would add to the tab's padding above it. Two classes, to outrank Banner's scoped rule
  .tab-content .tab-note {
    margin: 0 0 20px;
  }

  .assignments {
    @include list-unstyled;

    li + li {
      margin-top: 10px;
    }
  }
</style>
