<script>
import { mapState, mapGetters } from 'vuex';
import { isEmpty } from '@shell/utils/object';
import { FLEET } from '@shell/config/types';
import { WORKSPACE } from '@shell/store/prefs';
import Loading from '@shell/components/Loading';
import { checkPermissions, checkSchemasForFindAllHash } from '@shell/utils/auth';
import { WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';
import { filterBy } from '@shell/utils/array';
import NoWorkspaces from '@shell/components/fleet/FleetNoWorkspaces.vue';
import ResourcePanel from '@shell/components/fleet/dashboard/ResourcePanel.vue';
import ResourceCard from '@shell/components/fleet/dashboard/ResourceCard.vue';
import ResourceDetails from '@shell/components/fleet/dashboard/ResourceDetails.vue';
import EmptyDashboard from '@shell/components/fleet/dashboard/Empty.vue';
import ButtonGroup from '@shell/components/ButtonGroup';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FleetRepos from '@shell/components/fleet/FleetRepos';
import FleetUtils from '@shell/utils/fleet';

const IS_HELM_OPS_ENABLED = false;

export default {
  name:       'FleetDashboard',
  components: {
    ButtonGroup,
    Checkbox,
    EmptyDashboard,
    FleetRepos,
    Loading,
    NoWorkspaces,
    ResourceCard,
    ResourcePanel,
  },

  async fetch() {
    const schemas = {
      fleetWorkspaces: {
        inStoreType:     'management',
        type:            FLEET.WORKSPACE,
        schemaValidator: (schema) => {
          return !!schema?.links?.collection;
        }
      },
      clusterGroups: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER_GROUP
      },
      allBundles: {
        inStoreType: 'management',
        type:        FLEET.BUNDLE,
        opt:         { excludeFields: ['metadata.managedFields', 'spec.resources'] },
      },
      gitRepos: {
        inStoreType: 'management',
        type:        FLEET.GIT_REPO,
      },
      helmOps: {
        inStoreType: 'management',
        type:        FLEET.HELM_OP,
      },
      fleetClusters: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER,
      }
    };

    const hash = await checkSchemasForFindAllHash(schemas, this.$store);

    this.fleetWorkspaces = hash.fleetWorkspaces || [];

    this[FLEET.GIT_REPO] = hash.gitRepos || [];
    this[FLEET.HELM_OP] = hash.helmOps || [];
    this[FLEET.CLUSTER] = hash.fleetClusters || [];
    this[FLEET.CLUSTER_GROUP] = hash.clusterGroups || [];

    try {
      const permissionsSchemas = {
        workspaces: { type: FLEET.WORKSPACE },
        gitRepos:   {
          type:            FLEET.GIT_REPO,
          schemaValidator: (schema) => schema.resourceMethods.includes('PUT')
        },
        helmOps: {
          type:            FLEET.HELM_OP,
          schemaValidator: (schema) => schema.resourceMethods.includes('PUT')
        },
      };

      const permissions = await checkPermissions(permissionsSchemas, this.$store.getters);

      this.permissions = permissions;
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
    }
  },

  data() {
    return {
      IS_HELM_OPS_ENABLED,
      repoSchema:            this.$store.getters['management/schemaFor'](FLEET.GIT_REPO),
      permissions:           {},
      FLEET,
      [FLEET.REPO]:          [],
      [FLEET.HELM_OP]:       [],
      [FLEET.CLUSTER]:       [],
      [FLEET.CLUSTER_GROUP]: [],
      fleetWorkspaces:       [],
      viewModeOptions:       [
        {
          tooltipKey: 'fleet.dashboard.viewMode.table',
          icon:       'icon-list-flat',
          value:      'flat',
        },
        {
          tooltipKey: 'fleet.dashboard.viewMode.cards',
          icon:       'icon-apps',
          value:      'cards',
        },
      ],
      viewMode:             'cards',
      isWorkspaceCollapsed: {},
      isStateCollapsed:     {},
      typeFilter:           {},
      stateFilter:          {},
      selectedCard:         null,
    };
  },

  computed: {
    ...mapState(['workspace', 'allNamespaces']),
    ...mapGetters({ isOpenSlideInPanel: 'slideInPanel/isOpen' }),
    ...mapGetters({ isClosingSlideInPanel: 'slideInPanel/isClosing' }),

    workspaces() {
      if (this.fleetWorkspaces?.length) {
        return this.fleetWorkspaces;
      }

      // When user doesn't have access to the workspaces fall back to namespaces
      return this.allNamespaces.filter((item) => {
        return item.metadata.annotations[WORKSPACE_ANNOTATION] === WORKSPACE;
      }).map(( obj ) => {
        const repos = filterBy(this[FLEET.GIT_REPO], 'metadata.namespace', obj.id);
        const helmOps = filterBy(this[FLEET.HELM_OP], 'metadata.namespace', obj.id);

        return {
          ...obj,
          repos,
          helmOps,
          id: obj.id
        };
      });
    },

    resourceStates() {
      const resources = [
        FLEET.GIT_REPO,
      ];

      if (IS_HELM_OPS_ENABLED) {
        resources.push(FLEET.HELM_OP);
      }

      const out = [];

      resources.forEach((type) => {
        this[type].forEach((obj) => {
          const {
            stateDisplay,
            stateSort
          } = obj;

          if (!out.find((s) => s.stateDisplay === stateDisplay)) {
            const id = FleetUtils.getDashboardStateId(obj);

            out.push({
              stateDisplay,
              stateSort,
              statePanel: FleetUtils.getDashboardState(id)
            });
          }
        });
      });

      return out.sort((a, b) => a.stateSort.localeCompare(b.stateSort));
    },

    cardResources() {
      return this.workspaces.reduce((acc, ws) => {
        const filtered = this.resourceStates.reduce((acc, state) => ({
          ...acc,
          [state.stateDisplay]: this.filterByState(ws, state),
        }), {});

        return {
          ...acc,
          [ws.id]: filtered
        };
      }, {});
    },

    tableResources() {
      return this.workspaces.reduce((acc, ws) => {
        const filtered = this.resourceStates.reduce((acc, state) => ([
          ...acc,
          ...this.filterByState(ws, state).filter((r) => !IS_HELM_OPS_ENABLED || r.type === FLEET.GIT_REPO)
        ]), []);

        return {
          ...acc,
          [ws.id]: filtered
        };
      }, {});
    },

    isEmptyDashboard() {
      return this[FLEET.GIT_REPO]?.length === 0 && this[FLEET.HELM_OP]?.length === 0;
    },

    allCardsExpanded() {
      return Object.keys(this.isWorkspaceCollapsed).every((key) => !this.isWorkspaceCollapsed[key]);
    },
  },

  methods: {
    filterByType(workspace) {
      return [
        ...(isEmpty(this.typeFilter) || this.typeFilter[workspace.id]?.[FLEET.GIT_REPO] ? workspace.repos : []),
        ...(IS_HELM_OPS_ENABLED && (isEmpty(this.typeFilter) || this.typeFilter[workspace.id]?.[FLEET.HELM_OP]) ? workspace.helmOps : []),
      ];
    },

    filterByState(workspace, state) {
      return this.filterByType(workspace).filter((item) => {
        const stateId = FleetUtils.getDashboardStateId(item);

        const toShow = Object.values(this.stateFilter[workspace.id] || {}).filter((f) => f).length === 0 || this.stateFilter[workspace.id][stateId];

        return item.stateDisplay === state.stateDisplay && toShow;
      });
    },

    selectStates(workspace, state) {
      if (!this.stateFilter[workspace]) {
      this.stateFilter[workspace] = {};
      }

      this.stateFilter[workspace][state] = !this.stateFilter[workspace][state];

      if (this.isWorkspaceCollapsed[workspace]) {
        this.toggleCard(workspace);
      }

      this.$nextTick(() => {
        this.toggleStateAll(workspace, 'expand');
      });
    },

    selectType(workspace, type, value) {
if (!this.typeFilter[workspace]) {
        this.typeFilter[workspace] = {};
      }

      this.typeFilter[workspace][type] = value;

      this.toggleStateAll(workspace, 'expand');
    },

    partialStateCount(workspace, state) {
      return this.cardResources[workspace][state.stateDisplay]?.length;
    },

    totaleStateCount(workspace) {
      return this.filterByType(workspace)?.length;
    },

    toggleCard(key) {
      this.isWorkspaceCollapsed[key] = !this.isWorkspaceCollapsed[key];
    },

    toggleCardAll(action) {
      const val = action !== 'expand';

      Object.keys(this.isWorkspaceCollapsed).forEach((key) => {
        this.isWorkspaceCollapsed[key] = val;
      });
    },

    toggleState(workspace, state) {
      if (!this.isStateCollapsed[workspace]) {
        this.isStateCollapsed[workspace] = {};
      }

      this.isStateCollapsed[workspace][state] = !this.isStateCollapsed[workspace][state];
    },

    toggleStateAll(workspace, action) {
      const val = action !== 'expand';

      Object.keys(this.isStateCollapsed[workspace] || []).forEach((state) => {
        this.isStateCollapsed[workspace][state] = val;
      });
    },

    showResourceDetails(value, statePanel, workspace, selected) {
      if (this.isClosingSlideInPanel) {
        return;
      }

      this.selectedCard = selected;

      this.$shell.slideInPanel({
        component:      ResourceDetails,
        componentProps: {
          value,
          statePanel,
          workspace,
          showHeader:          false,
          width:               window.innerWidth / 3 > 530 ? `${ window.innerWidth / 3 }px` : '530px',
          zIndex:              1,
          triggerFocusTrap:    true,
          returnFocusSelector: `[data-testid="card-${ value.id }"]`
        }
      });
    },
  },

  watch: {
    workspaces(neu) {
      const collapsed = neu?.length > 1;

      neu?.forEach((ws) => {
        this.isWorkspaceCollapsed[ws.id] = collapsed;

        this.isStateCollapsed[ws.id] = { Active: true };

        this.typeFilter[ws.id] = {
          [FLEET.GIT_REPO]: true,
          [FLEET.HELM_OP]:  true,
        };

        this.stateFilter[ws.id] = [];
      });
    }
  }
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <NoWorkspaces
      v-else-if="!workspaces?.length"
      :can-view="permissions.workspaces"
    />
    <EmptyDashboard
      v-else-if="isEmptyDashboard"
      :permissions="permissions"
    />
    <div
      v-else
      class="dashboard"
      :data-testid="'fleet-dashboard-workspace-cards'"
    >
      <div class="dashboard-header">
        <h1>
          <t k="fleet.dashboard.pageTitle" />
        </h1>

        <div class="dashboard-main-actions">
          <div :data-testid="'fleet-dashboard-expand-all'">
            <p
              v-if="allCardsExpanded"
              @click="toggleCardAll('collapse')"
            >
              {{ t('fleet.dashboard.collapseAll') }}
            </p>
            <p
              v-else
              @click="toggleCardAll('expand')"
            >
              {{ t('fleet.dashboard.expandAll') }}
            </p>
          </div>
          <ButtonGroup
            :data-testid="'view-button'"
            :value="viewMode"
            :options="viewModeOptions"
            @update:value="viewMode = $event"
          />
        </div>
      </div>
      <div
        v-for="(workspace, i) in workspaces"
        :key="i"
        class="card-container m-0 mt-20"
        :data-testid="`fleet-dashboard-workspace-card-${ workspace.id }`"
        :show-actions="false"
        :show-separator="false"
        :show-highlight-border="false"
      >
        <div class="card-panel-main">
          <div
            class="card-panel-main-details"
            :class="{ expand: !isWorkspaceCollapsed[workspace.id] }"
          >
            <div class="title">
              <h3 class="label">
                <i class="icon icon-folder" />
                <span>{{ t('fleet.dashboard.workspace') }} : &nbsp;</span>
              </h3>
              <router-link
                class="name"
                role="link"
                tabindex="0"
                :aria-label="workspace.nameDisplay"
                :to="workspace.detailLocation || {}"
              >
                {{ workspace.nameDisplay }}
              </router-link>
            </div>
            <div class="body">
              <ResourcePanel
                v-if="workspace.repos?.length || (IS_HELM_OPS_ENABLED && workspace.helmOps?.length)"
                :data-testid="'resource-panel-git-repos'"
                :resources="[ ...workspace.repos, ...(IS_HELM_OPS_ENABLED ? workspace.helmOps : []) ]"
                :workspace="workspace.id"
                :type="FLEET.GIT_REPO"
                :selected-states="stateFilter[workspace.id] || {}"
                @click:state="selectStates(workspace.id, $event)"
              />
              <ResourcePanel
                v-if="workspace.clusters?.length"
                :data-testid="'resource-panel-clusters'"
                :resources="workspace.clusters"
                :workspace="workspace.id"
                :type="FLEET.CLUSTER"
                :selectable="false"
              />
              <div
                v-if="workspace.clusterGroups?.length"
                class="spacer"
              />
              <ResourcePanel
                v-if="workspace.clusterGroups?.length"
                :data-testid="'resource-panel-cluster-groups'"
                :resources="workspace.clusterGroups"
                :workspace="workspace.id"
                :type="FLEET.CLUSTER_GROUP"
                :show-chart="false"
                :selectable="false"
              />
            </div>
          </div>
          <div class="card-panel-main-actions">
            <div
              v-if="workspace.repos?.length || workspace.helmOps?.length"
              class="expand-button"
              :data-testid="'expand-button'"
            >
              <i
                role="button"
                tabindex="0"
                :aria-label="t(`${ isWorkspaceCollapsed[workspace.id] ? 'expand': 'collapse' }-${ workspace.id }`)"
                :class="{
                  ['icon icon-lg icon-chevron-right']: isWorkspaceCollapsed[workspace.id],
                  ['icon icon-lg icon-chevron-down']: !isWorkspaceCollapsed[workspace.id],
                }"
                @click="toggleCard(workspace.id)"
                @keydown.space.enter.stop.prevent="toggleCard(workspace.id)"
              />
            </div>
          </div>
        </div>
        <div
          v-if="!isWorkspaceCollapsed[workspace.id]"
          class="card-panel-expand mt-10"
          :data-testid="`fleet-dashboard-expanded-panel-${ workspace.id }`"
        >
          <div
v-if="IS_HELM_OPS_ENABLED"
class="cards-panel-actions"
>
            <div
              v-if="viewMode === 'cards'"
              class="cards-panel-filters"
            >
              <Checkbox
                :data-testid="'fleet-dashboard-filter-git-repos'"
                :value="typeFilter[workspace.id]?.[FLEET.GIT_REPO]"
                @update:value="selectType(workspace.id, FLEET.GIT_REPO, $event)"
              >
                <template #label>
                  <i class="icon icon-lg icon-git mr-5" />
                  <span class="label">{{ t('fleet.dashboard.cards.filters.gitRepos') }}</span>
                </template>
              </Checkbox>
              <Checkbox
                :data-testid="'fleet-dashboard-filter-helm-ops'"
                :value="typeFilter[workspace.id]?.[FLEET.HELM_OP]"
                @update:value="selectType(workspace.id, FLEET.HELM_OP, $event)"
              >
                <template #label>
                  <i class="icon icon-lg icon-helm mr-5" />
                  <span class="label">{{ t('fleet.dashboard.cards.filters.helmOps') }}</span>
                </template>
              </Checkbox>
            </div>
          </div>

          <div
            v-if="viewMode === 'cards'"
            class="cards-panel"
          >
            <div
              v-for="(state, j) in resourceStates"
              :key="j"
              :data-testid="`state-panel-${ state.stateDisplay }`"
              class="card-panel mt-20"
            >
              <template v-if="cardResources[workspace.id][state.stateDisplay]?.length">
                <div
                  role="button"
                  tabindex="0"
                  class="title"
                  :aria-label="t(`${ isStateCollapsed[workspace.id]?.[state.stateDisplay] ? 'expand': 'collapse' }-${ state.stateDisplay }`)"
                  @click="toggleState(workspace.id, state.stateDisplay)"
                  @keydown.space.enter.stop.prevent="toggleState(workspace.id, state.stateDisplay)"
                >
                  <i
                    :class="{
                      ['icon icon-chevron-right']: isStateCollapsed[workspace.id]?.[state.stateDisplay],
                      ['icon icon-chevron-down']: !isStateCollapsed[workspace.id]?.[state.stateDisplay],
                    }"
                  />
                  <i
                    v-if="state.statePanel.id !== 'success'"
                    class="ml-5 state-icon"
                    :class="state.statePanel.icon"
                    :style="{ color: state.statePanel.color }"
                  />
                  <div class="label">
                    <span class="partial">
                      {{ state.stateDisplay }}&nbsp;&nbsp;{{ partialStateCount(workspace.id, state) }}
                    </span>
                    <span lass="total">/{{ totaleStateCount(workspace) }}</span>
                  </div>
                </div>
                <div
                  v-if="!isStateCollapsed[workspace.id]?.[state.stateDisplay]"
                  class="card-panel-body"
                >
                  <ResourceCard
                    v-for="(item, y) in cardResources[workspace.id][state.stateDisplay]"
                    :key="y"
                    class="resource-card"
                    :data-testid="`card-${ item.id }`"
                    :value="item"
                    :state-panel="state.statePanel"
                    :selected="selectedCard === `${ item.id }-${ y }` && isOpenSlideInPanel"
                    @click="showResourceDetails(item, state.statePanel, workspace, `${ item.id }-${ y }`)"
                  />
                </div>
              </template>
            </div>
          </div>

          <div
            v-if="viewMode === 'flat'"
            class="table-panel"
          >
            <FleetRepos
              :workspace="workspace.id"
              :rows="tableResources[workspace.id]"
              :schema="repoSchema"
              :loading="$fetchState.pending"
              :use-query-params-for-simple-filtering="true"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.dashboard-main-actions {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 15px;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
  }

  > div {
    display: flex;
    align-items: center;

    p {
      color: var(--primary);
      margin-right: 2px;

      &:hover {
        text-decoration: underline;
        cursor: pointer;
      }
    }

    i {
      color: var(--primary);
    }
  }
}

.card-container {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 10px;
  background-color: var(--body-bg);
  min-width: 500px;
  padding: 16px;

  .card-panel-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    margin-bottom: auto;

    .card-panel-main-details {
      display: flex;
      align-items: center;

      .title {
        margin: 0 20px 0 0;

        .name {
          font-size: 25px;
        }

        .label {
          display: flex;
          align-items: center;
          min-width: 150px;
          margin: 0 0 5px 0;

          .icon {
            margin-right: 5px;
          }
        }
      }

      .body {
        display: flex;
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 15px;

        .spacer {
          border-left: 1px solid var(--border);
        }
      }
    }

    .card-panel-main-actions {
      display: flex;
      flex-direction: column;
      align-items: end;

      .expand-button {
        display: flex;
        align-items: center;

        &:hover {
          cursor: pointer;
        }
      }
    }
  }

  .card-panel-expand {
    animation: slideInOut 0.5s ease-in-out;

    .cards-panel-actions {
      display: flex;
      flex-direction: row;
      align-items: center;

      .cards-panel-filters {
        display: flex;
        flex-direction: column;
        margin-top: 5px;

        .label {
          margin-top: 2px;
          line-height: 20px;
        }

        .icon {
          padding: 2px;
          font-size: 25px;
        }
      }
    }

    .cards-panel {
      .card-panel {
        .title {
          display: flex;
          align-items: center;
          cursor: pointer;
          width: fit-content;

          .icon {
            margin-right: 5px;
          }

          .label {
            display: flex;
            align-items: baseline;
            margin-left: 2px;

            .partial {
              margin: 0;
              margin-right: 2px;
              font-size: 22px;
            }

            p {
              font-size: small;

              .icon {
                line-height: -1px;
              }
            }
          }

          .state-icon {
            font-size: 1.75em;
          }
        }

        .card-panel-body {
          display: flex;
          justify-content: flex-start;
          flex-wrap: wrap;

          .resource-card {
            cursor: pointer;
          }
        }
      }
    }

    .table-panel {
      margin-top: 20px;
    }
  }
}

@keyframes slideInOut {
  0% {
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
  }

  50% {
      opacity: 0.5;
      visibility: visible;
      transform: translateY(0);
  }

  100% {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
  }
}
</style>
