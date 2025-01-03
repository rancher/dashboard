<script>
import CruResource from '@shell/components/CruResource';

import CreateEditView from '@shell/mixins/create-edit-view';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { MONITORING } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { EDITOR_MODES } from '@shell/components/YamlEditor';
import { RECEIVERS_TYPES } from '@shell/models/monitoring.coreos.com.receiver';
import RouteConfig from './routeConfig';
import ResourceTable from '@shell/components/ResourceTable';
import ActionMenu from '@shell/components/ActionMenu';
import { _CREATE, _EDIT, _VIEW, _CONFIG } from '@shell/config/query-params';
import { fetchAlertManagerConfigSpecs } from '@shell/utils/alertmanagerconfig';

export default {
  emits:      ['input'],
  components: {
    ActionMenu,
    CruResource,
    Loading,
    NameNsDescription,
    ResourceTable,
    RouteConfig,
    Tab,
    Tabbed,
  },

  mixins: [CreateEditView],

  inheritAttrs: false,

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const alertmanagerConfigId = this.value.id;

    const { receiverSchema, routeSchema } = await fetchAlertManagerConfigSpecs(this.$store);

    this.receiverSchema = receiverSchema;
    this.routeSchema = routeSchema;

    const alertmanagerConfigResource = await this.$store.dispatch(`${ inStore }/find`, { type: MONITORING.ALERTMANAGERCONFIG, id: alertmanagerConfigId });

    this.alertmanagerConfigId = alertmanagerConfigId;
    this.alertmanagerConfigResource = alertmanagerConfigResource;
    this.alertmanagerConfigDetailRoute = alertmanagerConfigResource?._detailLocation;

    const alertmanagerConfigActions = alertmanagerConfigResource.availableActions;
    const receiverActions = alertmanagerConfigResource.getReceiverActions(alertmanagerConfigActions);

    this.receiverActions = receiverActions;
  },

  data() {
    this.value.applyDefaults();

    const defaultReceiverValues = {};
    const receiverOptions = (this.value?.spec?.receivers || []).map((receiver) => receiver.name);

    return {
      actionMenuTargetElement:  null,
      actionMenuTargetEvent:    null,
      config:                   _CONFIG,
      create:                   _CREATE,
      createReceiverLink:       this.value.getCreateReceiverRoute(),
      defaultReceiverValues,
      receiverActionMenuIsOpen: false,
      receiverTableHeaders:     [
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'name',
          sort:          ['nameSort'],
          formatter:     'LinkDetail',
          canBeVariable: true,
        },
        {
          name:          'type',
          labelKey:      'tableHeaders.type',
          value:         'name',
          formatter:     'ReceiverIcons',
          canBeVariable: true,
        }
        // Add more columns
      ],
      newReceiverType:      null,
      receiverActions:      [],
      receiverOptions,
      receiverTypes:        RECEIVERS_TYPES,
      selectedReceiverName: '',
      selectedRowValue:     null,
      view:                 _VIEW,
    };
  },

  computed: {

    editorMode() {
      if ( this.mode === _VIEW ) {
        return EDITOR_MODES.VIEW_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },
  },
  methods: {

    translateReceiverTypes() {
      return this.receiverTypes.map((receiverType) => {
        return {
          ...receiverType,
          label: this.t(receiverType.label)
        };
      });
    },
    getReceiverDetailLink(receiverData) {
      if (receiverData && receiverData.name) {
        return this.value.getReceiverDetailLink(receiverData.name);
      }
    },

    toggleReceiverActionMenu() {
      this.receiverActionMenuIsOpen = true;
    },
    setActionMenuState(eventData) {
      // This method is called when the user clicks a context menu
      // for a receiver in the receiver in the receiver list view.
      // It sets the target element so the menu can open where the
      // user clicked.
      const { event, targetElement } = eventData;

      // TargetElement could be an array of more than
      // one if there is more than one ref of the same name.
      if (event && targetElement) {
        this.actionMenuTargetElement = targetElement;
        this.actionMenuTargetEvent = event;

        // We take the selected receiver name out of the target
        // element's ID to help us build the URL to link to
        // the detail page of that receiver.
        // We use a plus sign as the delimiter to separate the
        // name because the plus is not an allowed character in
        // Kubernetes names.
        this.selectedReceiverName = targetElement.id.split('+').slice(2).join('');

        this.toggleReceiverActionMenu();
      } else {
        throw new Error('Could not find action menu target element.');
      }
    },
    goToEdit() {
      // 'goToEdit' is the exact name of an action for AlertmanagerConfig
      // and this method executes the action.
      this.$router.push(this.alertmanagerConfigResource.getEditReceiverConfigRoute(this.selectedReceiverName, _EDIT));
    },

    goToEditYaml() {
      // 'goToEditYaml' is the exact name of an action for AlertmanagerConfig
      // and this method executes the action.
      this.$router.push(this.alertmanagerConfigResource.getEditReceiverYamlRoute(this.selectedReceiverName, _EDIT));
    },
    promptRemove() {
      // 'promptRemove' is the exact name of an action for AlertmanagerConfig
      // and this method executes the action.
      // Get the name of the receiver to delete from the action info.
      const nameOfReceiverToDelete = this.selectedReceiverName;
      // Remove it from the configuration of the parent AlertmanagerConfig
      // resource.
      const existingReceivers = this.alertmanagerConfigResource.spec.receivers || [];
      const receiversMinusDeletedItem = existingReceivers.filter((receiver) => {
        return receiver.name !== nameOfReceiverToDelete;
      });

      this.alertmanagerConfigResource.spec.receivers = receiversMinusDeletedItem;
      // After saving the AlertmanagerConfig, the resource has been deleted.
      this.alertmanagerConfigResource.save(...arguments);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    class="route"
    :done-route="doneRoute"
    :errors="errors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :cancel-event="true"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :value="value"
      :mode="mode"
      :namespaced="isNamespaced"
      @input="$emit('input', $event)"
    />

    <Tabbed>
      <Tab
        :label="t('monitoring.route.label')"
        :weight="1"
        name="route"
      >
        <RouteConfig
          :value="value.spec.route"
          :mode="mode"
          :receiver-options="receiverOptions"
        />
      </Tab>
      <Tab
        :label="t('alertmanagerConfigReceiver.receivers')"
        :weight="2"
        name="receivers"
      >
        <ResourceTable
          :headers="receiverTableHeaders"
          :schema="receiverSchema"
          :rows="value.spec.receivers || []"
          :get-custom-detail-link="getReceiverDetailLink"
          :table-actions="false"
          :custom-actions="value.receiverActions"
          @clickedActionButton="setActionMenuState"
        >
          <template #header-button>
            <router-link
              v-if="createReceiverLink && createReceiverLink.name"
              :to="mode !== create ? createReceiverLink : {}"
            >
              <button
                class="btn role-primary"
                :disabled="mode === create"
                :tooltip="t('monitoring.alertmanagerConfig.disabledReceiverButton')"
                data-testid="v2-monitoring-add-receiver"
              >
                {{ t('monitoring.receiver.addReceiver') }}
                <i
                  v-if="mode === create"
                  v-clean-tooltip="t('monitoring.alertmanagerConfig.disabledReceiverButton')"
                  class="icon icon-info"
                />
              </button>
            </router-link>
          </template>
        </ResourceTable>
      </Tab>
    </Tabbed>
    <ActionMenu
      :custom-actions="receiverActions"
      :open="receiverActionMenuIsOpen"
      :use-custom-target-element="true"
      :custom-target-element="actionMenuTargetElement"
      :custom-target-event="actionMenuTargetEvent"
      @close="receiverActionMenuIsOpen = false"
      @goToEdit="goToEdit"
      @goToEditYaml="goToEditYaml"
      @promptRemove="promptRemove"
    />
  </CruResource>
</template>

<style lang="scss" scoped>
  h3 {
    margin-top: 2em;
  }
  input {
    margin-top: 1em;
  }
  .route {
    &[real-mode=view] .label {
      color: var(--input-label);
    }
  }
  button {
    margin-left: 0.5em;
  }
  a:hover {
      text-decoration: none;
  }
</style>
