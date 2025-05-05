<script>
import { mapState, mapGetters } from 'vuex';
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
import FleetUtils from '@shell/utils/fleet';

export default {
  name:       'FleetDashboard',
  components: {
    ButtonGroup,
    Checkbox,
    EmptyDashboard,
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
      permissions:           {},
      FLEET,
      [FLEET.REPO]:          [],
      [FLEET.HELM_OP]:       [],
      [FLEET.CLUSTER]:       [],
      [FLEET.CLUSTER_GROUP]: [],
      fleetWorkspaces:       [],
      viewModeOptions:       [
        {
          // tooltipKey: 'fleet.dashboard.viewMode.table',
          icon:     'icon-list-flat',
          value:    'flat',
          disabled: true
        },
        {
          tooltipKey: 'fleet.dashboard.viewMode.cards',
          icon:       'icon-apps',
          value:      'cards',
        },
      ],
      viewMode:             {},
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

    cardStates() {
      const states = [
        FLEET.GIT_REPO,
        FLEET.HELM_OP,
      ];

      const out = [];

      states.forEach((type) => {
        this[type].forEach((obj) => {
          const {
            stateDisplay,
            stateSort
          } = obj;

          if (!out.find((s) => s.stateDisplay === stateDisplay)) {
            const id = FleetUtils.getDashboardStateId(obj.state);

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
        const filtered = this.cardStates.reduce((acc, state) => ({
          ...acc,
          [state.stateDisplay]: this.filterByState(ws, state),
        }), {});

        return {
          ...acc,
          [ws.id]: filtered
        };
      }, {});
    },

    isEmptyDashboard() {
      return this[FLEET.GIT_REPO].length === 0 && this[FLEET.HELM_OP].length === 0;
    },

    allCardsExpanded() {
      return Object.keys(this.isWorkspaceCollapsed).every((key) => !this.isWorkspaceCollapsed[key]);
    },
  },

  methods: {
    filterByType(workspace) {
      return [
        ...(this.typeFilter[workspace.id][FLEET.GIT_REPO] ? workspace.repos : []),
        ...(this.typeFilter[workspace.id][FLEET.HELM_OP] ? workspace.helmOps : []),
      ];
    },

    filterByState(workspace, state) {
      return this.filterByType(workspace).filter((item) => {
        const filterStates = this.stateFilter[workspace.id][item.type];
        const id = FleetUtils.getDashboardStateId(item.state);

        const toShow = !filterStates?.length || !!filterStates.find((f) => f === id);

        return item.stateDisplay === state.stateDisplay && toShow;
      });
    },

    selectStates(workspace, type, states) {
      this.stateFilter[workspace][type] = states;

      this.toggleStateAll(workspace, 'expand');
    },

    selectType(workspace, type, value) {
      this.typeFilter[workspace][type] = value;

      this.toggleStateAll(workspace, 'expand');
    },

    showPanelSpacer(workspace) {
      return (workspace.clusters.length !== 0 || workspace.clusterGroups.length !== 0) &&
        (workspace.repos.length !== 0 || workspace.helmOps.length !== 0);
    },

    partialStateCount(workspace, state) {
      return this.cardResources[workspace][state.stateDisplay].length;
    },

    totaleStateCount(workspace) {
      return this.filterByType(workspace).length;
    },

    toggleState(workspace, state) {
      if (!this.isStateCollapsed[workspace]) {
        this.isStateCollapsed[workspace] = {};
      }

      this.isStateCollapsed[workspace][state] = !this.isStateCollapsed[workspace][state];
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

    toggleStateAll(workspace, action) {
      const val = action !== 'expand';

      Object.keys(this.isStateCollapsed[workspace] || []).forEach((state) => {
        this.isStateCollapsed[workspace][state] = val;
      });
    },

    showResourceDetails(value, statePanel, workspace, selected) {
      this.selectedCard = selected;

      this.$shell.slideInPanel({
        component:      ResourceDetails,
        componentProps: {
          value,
          statePanel,
          workspace,
          showHeader: false,
          zIndex:     1
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

        this.stateFilter[ws.id] = {
          [FLEET.GIT_REPO]: [],
          [FLEET.HELM_OP]:  [],
        };
      });
    }
  }
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <NoWorkspaces
      v-else-if="!workspaces.length"
      :can-view="permissions.workspaces"
    />
    <EmptyDashboard
      v-else-if="isEmptyDashboard"
      :permissions="permissions"
    />
    <div
      v-else
      class="dashboard"
    >
      <div class="dashboard-header">
        <h1>
          <t k="fleet.dashboard.pageTitle" />
        </h1>
        <div>
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
      </div>
      <div
        v-for="(workspace, i) in workspaces"
        :key="i"
        class="card-container m-0 mt-20"
        :show-actions="false"
        :show-separator="false"
        :show-highlight-border="false"
      >
        <div class="card-panel-main">
          <div
            class="card-panel-main-details"
            :class="{ expand: !isWorkspaceCollapsed[workspace.id] }"
          >
            <h2 class="title">
              <div class="label">
                <i class="icon icon-folder" />
                <span>{{ t('fleet.dashboard.workspace') }} : &nbsp;</span>
              </div>
              <router-link
                :to="workspace.detailLocation"
              >
                {{ workspace.nameDisplay }}
              </router-link>
            </h2>
            <div class="body">
              <ResourcePanel
                v-if="workspace.repos.length"
                class="git-repo"
                :resources="workspace.repos"
                :type="FLEET.GIT_REPO"
                :selectable="!isWorkspaceCollapsed[workspace.id]"
                @select:states="selectStates(workspace.id, FLEET.GIT_REPO, $event)"
              />
              <ResourcePanel
                v-if="workspace.helmOps.length"
                class="helm-ops"
                :resources="workspace.helmOps"
                :type="FLEET.HELM_OP"
                :selectable="!isWorkspaceCollapsed[workspace.id]"
                @select:states="selectStates(workspace.id, FLEET.HELM_OP, $event)"
              />
              <div
                v-if="showPanelSpacer(workspace)"
                class="spacer"
              />
              <ResourcePanel
                v-if="workspace.clusters.length"
                class="clusters"
                :resources="workspace.clusters"
                :type="FLEET.CLUSTER"
                :clickable-states="false"
                :show-chart="false"
                :selectable="false"
              />
              <ResourcePanel
                v-if="workspace.clusterGroups.length"
                class="cluster-groups"
                :resources="workspace.clusterGroups"
                :type="FLEET.CLUSTER_GROUP"
                :clickable-states="false"
                :show-chart="false"
                :selectable="false"
              />
            </div>
          </div>
          <div class="card-panel-main-actions">
            <div class="expand-button">
              <i
                :class="{
                  ['icon icon-lg icon-chevron-right']: isWorkspaceCollapsed[workspace.id],
                  ['icon icon-lg icon-chevron-down']: !isWorkspaceCollapsed[workspace.id],
                }"
                @click="toggleCard(workspace.id)"
              />
            </div>
          </div>
        </div>
        <div
          v-if="!isWorkspaceCollapsed[workspace.id]"
          class="card-panel-expand mt-20"
        >
          <div
            v-if="!viewMode[workspace.id] || viewMode[workspace.id] === 'cards'"
            class="cards-panel"
          >
            <div class="cards-panel-actions">
              <div class="cards-panel-filters">
                <Checkbox
                  :value="typeFilter[workspace.id][FLEET.GIT_REPO]"
                  @update:value="selectType(workspace.id, FLEET.GIT_REPO, $event)"
                >
                  <template #label>
                    <i class="icon icon-lg icon-git mr-5" />
                    <span class="label">{{ t('fleet.dashboard.cards.filters.gitRepos') }}</span>
                  </template>
                </Checkbox>
                <Checkbox
                  :value="typeFilter[workspace.id][FLEET.HELM_OP]"
                  @update:value="selectType(workspace.id, FLEET.HELM_OP, $event)"
                >
                  <template #label>
                    <i class="icon icon-lg icon-helm mr-5" />
                    <span class="label">{{ t('fleet.dashboard.cards.filters.helmOps') }}</span>
                  </template>
                </Checkbox>
              </div>
              <div class="cards-panel-view-buttons">
                <ButtonGroup
                  :value="viewMode[workspace.id] || 'cards'"
                  :options="viewModeOptions"
                  @update:value="viewMode[workspace.id] = $event"
                />
              </div>
            </div>
            <div
              v-for="(state, j) in cardStates"
              :key="j"
              class="card-panel mt-20"
            >
              <template v-if="cardResources[workspace.id][state.stateDisplay].length">
                <div
                  class="card-panel-title"
                  @click="toggleState(workspace.id, state.stateDisplay)"
                >
                  <i
                    :class="{
                      ['icon icon-chevron-right']: isStateCollapsed[workspace.id]?.[state.stateDisplay],
                      ['icon icon-chevron-down']: !isStateCollapsed[workspace.id]?.[state.stateDisplay],
                    }"
                  />
                  <div class="label">
                    <h3>
                      {{ state.stateDisplay }} {{ partialStateCount(workspace.id, state) }}
                    </h3>
                    <span>/{{ totaleStateCount(workspace) }}</span>
                  </div>
                  <i
                    v-if="state.statePanel.id !== 'success'"
                    class="ml-5 state-icon"
                    :class="state.statePanel.icon"
                    :style="{ color: state.statePanel.color }"
                  />
                </div>
                <div
                  v-if="!isStateCollapsed[workspace.id]?.[state.stateDisplay]"
                  class="card-panel-body"
                >
                  <ResourceCard
                    v-for="(item, y) in cardResources[workspace.id][state.stateDisplay]"
                    :key="y"
                    class="resource-card"
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
            v-if="viewMode[workspace.id] === 'flat'"
            class="table-panel"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

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
  border: 1px solid var(--modal-border);
  border-radius: 10px;
  background-color: var(--body-bg);
  min-width: 550px;

  .card-panel-main {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-panel-main-details {
      display: flex;
      align-items: center;

      .title {
        .label {
          display: flex;
          align-items: center;
          min-width: 150px;

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

      &.expand {
        display: block;

        .title {
          display: flex;
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

    .cards-panel {
      .cards-panel-actions {
        display: flex;
        flex-direction: row;
        align-items: center;

        .cards-panel-filters {
          display: flex;
          flex-direction: column;
          margin-right: 30px;

          .label {
            line-height: 20px;
          }

          .icon {
            padding: 2px;
          }
        }
      }

      .card-panel {
        .card-panel-title {
          display: flex;
          align-items: center;
          cursor: pointer;

          .icon {
            margin-right: 5px;
          }

          .label {
            display: flex;
            align-items: baseline;

            h3 {
              margin: 0;
              margin-right: 3px;
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
            margin: 10px;
            cursor: pointer;
          }
        }
      }
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
