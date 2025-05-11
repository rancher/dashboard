<script>
import { getVersionData } from '@shell/config/version';
import { mapState, mapGetters } from 'vuex';
import { isEmpty } from '@shell/utils/object';
import { FLEET } from '@shell/config/types';
import { WORKSPACE } from '@shell/store/prefs';
import Loading from '@shell/components/Loading';
import { checkPermissions, checkSchemasForFindAllHash } from '@shell/utils/auth';
import { WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';
import { filterBy } from '@shell/utils/array';
import NoWorkspaces from '@shell/components/fleet/FleetNoWorkspaces.vue';
import { RcButton } from '@components/RcButton';
import ResourcePanel from '@shell/components/fleet/dashboard/ResourcePanel.vue';
import ResourceCard from '@shell/components/fleet/dashboard/ResourceCard.vue';
import ResourceDetails from '@shell/components/fleet/dashboard/ResourceDetails.vue';
import EmptyDashboard from '@shell/components/fleet/dashboard/Empty.vue';
import ButtonGroup from '@shell/components/ButtonGroup';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FleetApplications from '@shell/components/fleet/FleetApplications.vue';
import FleetUtils from '@shell/utils/fleet';
import Preset from '@shell/mixins/preset';

export default {
  name:       'FleetDashboard',
  components: {
    ButtonGroup,
    Checkbox,
    EmptyDashboard,
    FleetApplications,
    Loading,
    NoWorkspaces,
    RcButton,
    ResourceCard,
    ResourcePanel,
  },

  mixins: [Preset],

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
      createRoute: { name:   'c-cluster-fleet-application-create' },
      permissions:     {},
      FLEET,
      [FLEET.REPO]:    [],
      [FLEET.HELM_OP]: [],
      fleetWorkspaces: [],
      viewModeOptions: [
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
      CARDS_MIN:            50,
      CARDS_SIZE:           50,
      cardsCount:           {},
      viewMode:             'cards',
      isWorkspaceCollapsed: {},
      isStateCollapsed:     {},
      typeFilter:           {},
      stateFilter:          {},
      selectedCard:         null,
      presetVersion:        getVersionData()?.Version,
    };
  },

  created() {
    this.$store.dispatch('showWorkspaceSwitcher', false);
  },

  mounted() {
    this.preset('cardsCount', 'object');
    this.preset('viewMode', 'string');
  },

  beforeUnmount() {
    this.$store.dispatch('showWorkspaceSwitcher', true);
  },

  computed: {
    ...mapState(['workspace', 'allNamespaces']),
    ...mapGetters({ isOpenSlideInPanel: 'slideInPanel/isOpen' }),
    ...mapGetters({ isClosingSlideInPanel: 'slideInPanel/isClosing' }),

    repoSchema() {
      return this.$store.getters['management/schemaFor'](FLEET.GIT_REPO);
    },

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

    applicationStates() {
      return this._groupByWorkspace((ws) => this._resourceStates([ ...ws.repos, ...ws.helmOps ]));
    },

    clusterStates() {
      return this._groupByWorkspace((ws) => this._resourceStates(ws.clusters));
    },

    clusterGroupsStates() {
      return this._groupByWorkspace((ws) => this._resourceStates(ws.clusterGroups));
    },

    cardResources() {
      return this._groupByWorkspace((ws) => {
        const filtered = this.applicationStates[ws.id].reduce((acc, state) => ({
          ...acc,
          [state.stateDisplay]: this._filterResources(state),
        }), {});

        return filtered;
      });
    },

    tableResources() {
      return this._groupByWorkspace((ws) => {
        const filtered = this.applicationStates[ws.id].reduce((acc, state) => ([
          ...acc,
          ...this._filterResources(state)
        ]), []);

        return filtered;
      });
    },

    isEmptyDashboard() {
      return this[FLEET.GIT_REPO]?.length === 0 && this[FLEET.HELM_OP]?.length === 0;
    },

    allCardsExpanded() {
      return Object.keys(this.isWorkspaceCollapsed).every((key) => !this.isWorkspaceCollapsed[key]);
    },
  },

  methods: {
    selectStates(workspace, state) {
      this._checkInit(workspace, 'stateFilter');

      this._cleanStateFilter(workspace);

      if (this.stateFilter[workspace][state]) {
        delete this.stateFilter[workspace][state];
      } else {
        this.stateFilter[workspace][state] = true;
      }

      if (this.isWorkspaceCollapsed[workspace]) {
        this.toggleCard(workspace);
      }

      this.$nextTick(() => {
        this.toggleStateAll(workspace, 'expand');
      });
    },

    selectType(workspace, type, value) {
      this._checkInit(workspace, 'typeFilter');

      this.typeFilter[workspace][type] = value;

      this.toggleStateAll(workspace, 'expand');
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
      this._checkInit(workspace, 'isStateCollapsed');

      this.isStateCollapsed[workspace][state] = !this.isStateCollapsed[workspace][state];
    },

    toggleStateAll(workspace, action) {
      const val = action !== 'expand';

      Object.keys(this.isStateCollapsed[workspace] || []).forEach((state) => {
        this.isStateCollapsed[workspace][state] = val;
      });
    },

    loadMore(workspace, state) {
      this._checkInit(workspace, 'cardsCount');

      const count = this.cardsCount[workspace][state] || this.CARDS_MIN;

      const val = count + this.CARDS_SIZE;

      this.cardsCount[workspace][state] = val;
    },

    loadLess(workspace, state) {
      this._checkInit(workspace, 'cardsCount');

      const count = this.cardsCount[workspace][state] || this.CARDS_MIN;

      const val = count - this.CARDS_MIN < 0 ? this.CARDS_MIN : count - this.CARDS_SIZE;

      this.cardsCount[workspace][state] = val;
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
          returnFocusSelector: `[data-testid="resource-card-${ value.id }"]`
        }
      });
    },

    _resourceStates(resources) {
      const out = [];

      resources.forEach((obj) => {
        const {
          stateDisplay,
          stateSort
        } = obj;

        const exists = out.find((s) => s.stateDisplay === stateDisplay);

        if (exists) {
          exists.resources.push(obj);
        } else {
          out.push({
            stateDisplay,
            stateSort,
            statePanel: FleetUtils.getDashboardState(obj),
            resources:  [obj]
          });
        }
      });

      return out.sort((a, b) => a.stateSort.localeCompare(b.stateSort));
    },

    _filterResources(state) {
      return state.resources.filter((item) => this._decodeTypeFilter(item.namespace, item.type) &&
        this._decodeStateFilter(item.namespace, state)
      );
    },

    _groupByWorkspace(callback) {
      return this.workspaces.reduce((acc, ws) => ({
        ...acc,
        [ws.id]: callback(ws)
      }), {});
    },

    _stateExistsInWorkspace(workspace, state) {
      return !!this.applicationStates[workspace].find((s) => s.statePanel.id === state);
    },

    _decodeStateFilter(workspace, state) {
      const stateFilter = Object.keys(this.stateFilter[workspace] || {});

      if (stateFilter.length === 0) {
        return true;
      }

      if (stateFilter.filter((key) => this.stateFilter[workspace][key] && this._stateExistsInWorkspace(workspace, key)).length === 0) {
        return true;
      }

      if (this.stateFilter[workspace][state.statePanel.id]) {
        return true;
      }

      return false;
    },

    _decodeTypeFilter(workspace, type) {
      const emptyFilter = isEmpty(this.typeFilter) || !this.viewMode;

      return emptyFilter || this.typeFilter[workspace]?.[type];
    },

    _cleanStateFilter(workspace) {
      const all = [...Object.keys(this.stateFilter[workspace] || {})];

      all.forEach((state) => {
        const exists = this._stateExistsInWorkspace(workspace, state);

        if (!exists) {
          delete this.stateFilter[workspace][state];
        }
      });
    },

    _checkInit(workspace, name) {
      if (!this[name][workspace]) {
        this[name][workspace] = {};
      }
    },
  },

  watch: {
    workspaces(neu) {
      if (neu) {
        neu?.forEach((ws) => {
          this.isWorkspaceCollapsed[ws.id] = neu.length > 1;

          this.isStateCollapsed[ws.id] = { Active: true };

          this.typeFilter[ws.id] = {
            [FLEET.GIT_REPO]: true,
            [FLEET.HELM_OP]:  true,
          };

          this.stateFilter[ws.id] = {};
        });

        this.preset('isWorkspaceCollapsed', 'object');
        this.preset('isStateCollapsed', 'object');
        this.preset('typeFilter', 'object');
        this.preset('stateFilter', 'object');
      }
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
              <h3 class="label label-secondary">
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
                v-if="workspace.repos?.length || workspace.helmOps?.length"
                :data-testid="'resource-panel-applications'"
                :states="applicationStates[workspace.id]"
                :workspace="workspace.id"
                :type="FLEET.APPLICATION"
                :selected-states="stateFilter[workspace.id] || {}"
                @click:state="selectStates(workspace.id, $event)"
              />
              <ResourcePanel
                v-if="workspace.clusters?.length"
                :data-testid="'resource-panel-clusters'"
                :states="clusterStates[workspace.id]"
                :workspace="workspace.id"
                :type="FLEET.CLUSTER"
                :selectable="false"
              />
              <ResourcePanel
                v-if="workspace.clusterGroups?.length"
                :data-testid="'resource-panel-cluster-groups'"
                :states="clusterGroupsStates[workspace.id]"
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
              <RcButton
                small
                ghost
                :aria-label="`workspace-expand-btn-${ workspace.id }`"
                @click="toggleCard(workspace.id)"
              >
                <i
                  :class="{
                    ['icon icon-lg icon-chevron-right']: isWorkspaceCollapsed[workspace.id],
                    ['icon icon-lg icon-chevron-down']: !isWorkspaceCollapsed[workspace.id],
                  }"
                />
              </RcButton>
            </div>
          </div>
        </div>
        <div
          v-if="!isWorkspaceCollapsed[workspace.id] && (workspace.repos?.length || workspace.helmOps?.length)"
          class="panel-expand mt-10"
          :data-testid="`fleet-dashboard-expanded-panel-${ workspace.id }`"
        >
          <div class="actions">
            <div class="type-filters">
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
            <div class="create-button">
              <router-link
                :to="createRoute"
                class="btn role-primary"
              >
                {{ t('fleet.gitRepo.intro.add') }}
              </router-link>
            </div>
          </div>
          <div
            v-if="viewMode === 'cards'"
            class="cards-panel"
          >
            <div
              v-for="(state, j) in applicationStates[workspace.id]"
              :key="j"
              :data-testid="`state-panel-${ state.stateDisplay }`"
            >
              <div
                v-if="cardResources[workspace.id][state.stateDisplay]?.length"
                class="card-panel"
              >
                <div
                  role="button"
                  tabindex="0"
                  class="title"
                  :aria-label="`state-expand-btn-${ state.stateDisplay }`"
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
                      {{ state.stateDisplay }}&nbsp;&nbsp;{{ cardResources[workspace.id]?.[state.stateDisplay]?.length }}
                    </span>
                    <span class="total label-secondary">/{{ [ ...workspace.repos, ...workspace.helmOps ].length }}</span>
                  </div>
                </div>
                <div
                  v-if="!isStateCollapsed[workspace.id]?.[state.stateDisplay]"
                  class="card-panel-body"
                >
                  <div class="resource-cards-container">
                    <div
                      v-for="(item, y) in cardResources[workspace.id][state.stateDisplay]"
                      :key="y"
                      class="resource-card"
                      :class="{
                        ['selected']: selectedCard === `${ item.id }-${ y }` && isOpenSlideInPanel
                      }"
                      :data-testid="`card-${ item.id }`"
                    >
                      <ResourceCard
                        v-if="y < (cardsCount[workspace.id]?.[state.stateDisplay] || CARDS_MIN)"
                        role="button"
                        tabindex="0"
                        :aria-label="`resource-card-${ item.id }`"
                        :data-testid="`resource-card-${ item.id }`"
                        :value="item"
                        :state-panel="state.statePanel"
                        @click="showResourceDetails(item, state.statePanel, workspace, `${ item.id }-${ y }`)"
                      />
                    </div>
                  </div>
                  <div class="resource-cards-action">
                    <p
                      v-if="(cardsCount[workspace.id]?.[state.stateDisplay] || 0) > CARDS_MIN"
                      @click="loadLess(workspace.id, state.stateDisplay)"
                    >
                      {{ t('generic.showLess') }}
                    </p>
                    <div />
                    <p
                      v-if="cardResources[workspace.id][state.stateDisplay]?.length > (cardsCount[workspace.id]?.[state.stateDisplay] || CARDS_MIN)"
                      @click="loadMore(workspace.id, state.stateDisplay)"
                    >
                      {{ t('generic.showMore') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="viewMode === 'flat'"
            class="table-panel"
          >
            <FleetApplications
              :workspace="workspace.id"
              :rows="tableResources[workspace.id]"
              :schema="{
                id: FLEET.APPLICATION,
                type: 'schema'
              }"
              :loading="$fetchState.pending"
              :use-query-params-for-simple-filtering="true"
              :show-intro="false"
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

    i {
      color: var(--primary);
    }
  }
}

.card-container {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 16px;
  background-color: var(--body-bg);
  box-shadow: none;
  min-width: 500px;
  padding: 16px;

  :focus-visible {
    @include focus-outline;
  }

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

  .panel-expand {
    animation: slideInOut 0.5s ease-in-out;

    :focus-visible {
      @include focus-outline;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .type-filters {
        display: flex;
        flex-direction: column;
        margin-top: 5px;

        label {
          width: fit-content;
        }

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
        margin-top: 32px;

        .title {
          display: flex;
          align-items: center;
          cursor: pointer;
          width: fit-content;
          margin-bottom: 16px;

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
          .resource-cards-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
            min-height: 100%;

            .resource-card {
              cursor: pointer;

              &.selected {
                .dashboard-resource-card {
                  border: 2px solid var(--primary);
                  margin: 0;
                }
              }
            }
          }

          .resource-cards-action {
            display: flex;
            justify-content: space-between;

            p {
              width: fit-content;
              margin-left: 15px;
            }
          }
        }
      }
    }

    .table-panel {
      margin-top: 20px;
    }
  }
}

p {
  color: var(--primary);
  margin-right: 2px;

  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
}

.label-secondary{
  color: var(--label-secondary);
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
