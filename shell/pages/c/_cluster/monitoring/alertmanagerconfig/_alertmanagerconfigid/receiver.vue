<script>
import ActionMenu from '@shell/components/ActionMenu';
import ReceiverConfig from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/receiverConfig';
import ButtonGroup from '@shell/components/ButtonGroup';
import ResourceYaml from '@shell/components/ResourceYaml';
import { createYaml } from '@shell/utils/create-yaml';
import { EDITOR_MODES } from '@shell/components/YamlEditor';
import { MONITORING, SCHEMA } from '@shell/config/types';
import {
  _CREATE, _EDIT, _VIEW, _CONFIG, _YAML, _DETAIL
} from '@shell/config/query-params';

import { clone } from '@shell/utils/object';
import { loadAlertingConfig, updateDriverV2 } from '@shell/utils/alertmanagerconfig';
import { PANDARIA_WEBHOOK_URL } from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/pandariaWebhook.vue';

export default {
  name:       'AlertmanagerConfigReceiverCreateEdit',
  components: {
    ActionMenu,
    ButtonGroup,
    ReceiverConfig,
    ResourceYaml
  },

  async fetch() {
    this.alertingDrivers = await loadAlertingConfig(this.$store.dispatch);
    const inStore = this.$store.getters['currentProduct'].inStore;

    this.receiverName = this.$route.query.receiverName;

    const alertmanagerConfigId = this.$route.params.alertmanagerconfigid;
    const originalAlertmanagerConfigResource = await this.$store.dispatch(`${ inStore }/find`, { type: MONITORING.ALERTMANAGERCONFIG, id: alertmanagerConfigId });
    const alertmanagerConfigResource = await this.$store.dispatch(`${ inStore }/clone`, { resource: originalAlertmanagerConfigResource });
    const mode = this.$route.query.mode;

    if (mode !== _CREATE) {
      const existingReceiverData = (alertmanagerConfigResource.spec.receivers || []).find((receiverData) => {
        return receiverData.name === this.receiverName;
      });

      if (existingReceiverData) {
        this.initPandariaReceivers(existingReceiverData);

        this.receiverValue = existingReceiverData;
      }
    }

    this.alertmanagerConfigId = alertmanagerConfigResource.id;
    this.alertmanagerConfigResource = alertmanagerConfigResource;
    this.alertmanagerConfigDetailRoute = alertmanagerConfigResource._detailLocation;
  },

  // take edit link and edit request from AlertmanagerConfig resource
  // and pass it to ReceiverConfig as a prop

  data() {
    return {
      actionMenuTargetElement:       null,
      actionMenuTargetEvent:         null,
      alertmanagerConfigId:          '',
      alertmanagerConfigResource:    null,
      alertmanagerConfigDetailRoute: null,
      config:                        _CONFIG,
      create:                        _CREATE,
      detail:                        _DETAIL,
      edit:                          _EDIT,
      receiverActionMenuIsOpen:      false,
      receiverName:                  '',
      receiverValue:                 {},
      showPreview:                   false,
      view:                          _VIEW,
      viewOptions:                   [
        {
          labelKey: 'resourceDetail.masthead.config',
          value:    'config',
        }, {
          labelKey: 'resourceDetail.masthead.yaml',
          value:    _YAML,
        }
      ],
      yaml: _YAML
    };
  },

  computed: {
    currentView() {
      return this.$route.query.currentView;
    },
    receiverActions() {
      const alertmanagerConfigActions = this.alertmanagerConfigResource?.availableActions;

      if (!alertmanagerConfigActions) {
        return [];
      }

      // Receivers are not a separate resource, so they
      // should only have a subset of the AlertmanagerConfig
      // actions. So we take AlertmanagerConfig's actions and filter
      // out any that don't apply.
      // Example action data:
      // {
      //     "action": "goToEdit",
      //     "label": "Edit Config",
      //     "icon": "icon icon-edit",
      //     "enabled": true
      // },
      return this.alertmanagerConfigResource.getReceiverActions(alertmanagerConfigActions);
    },
    resourceYaml() {
      const resource = this.alertmanagerConfigResource;

      const inStore = this.$store.getters['currentStore'](resource);
      const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
      const clonedResource = clone(resource);

      const out = createYaml(schemas, MONITORING.ALERTMANAGERCONFIG, clonedResource);

      return out;
    },
    mode() {
      // Use the route as a dependency of the
      // computed property so that the component
      // updates when you navigate between edit
      // and view.
      return this.$route.query.mode;
    },
    editorMode() {
      if ( this.mode === this.view ) {
        return EDITOR_MODES.VIEW_CODE;
      } else if ( this.showPreview ) {
        return EDITOR_MODES.DIFF_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },
    heading() {
      switch (this.$route.query.mode) {
      case this.create:
        return this.t('monitoring.alertmanagerConfig.receiverFormNames.create');
      case this.edit:
        if (this.currentView === this.yaml || this.$route.query.as === this.yaml) {
          // When you edit as YAML, you edit the whole AlertmanagerConfig
          // at once, so the header is just "Edit AlertmanagerConfig"
          return this.t('monitoring.alertmanagerConfig.receiverFormNames.editYaml');
        }

        // When you edit as a form, you edit only the receiver,
        // so the form header is "Edit Receiver in AlertmanagerConfig"
        return this.t('monitoring.alertmanagerConfig.receiverFormNames.edit');

      default:
        return this.t('monitoring.alertmanagerConfig.receiverFormNames.detail');
      }
    },
  },

  methods: {
    // When creating or editing a receiver, in both cases
    // it is actually the one existing AlertmanagerConfig
    // being saved. Therefore we take the save from the
    // AlertmanagerConfig resource and pass it into the
    // receiver config form.
    saveOverride(buttonDone) {
      const receivers = this.alertmanagerConfigResource?.spec?.receivers || [];
      const errors = [];

      if (receivers.find(item => !item.name)) {
        errors.push(this.t('validation.required', { key: this.t('generic.name') }, true));
      }

      receivers.forEach((receiver) => {
        if (receiver.pandariaWebhookConfigs?.length) {
          receiver.pandariaWebhookConfigs.forEach((c) => {
            if (c.type === 'ALIYUN_SMS') {
              if (!c.http_config.access_key_id) {
                errors.push(this.t('validation.required', { key: this.t('monitoringReceiver.pandariaWebhook.aliyunSMS.accessKeyIdLabel') }, true));
              }
              if (!c.http_config.access_key_secret) {
                errors.push(this.t('validation.required', { key: this.t('monitoringReceiver.pandariaWebhook.aliyunSMS.accessKeySecretLabel') }, true));
              }
              if (!c.http_config.template_code) {
                errors.push(this.t('validation.required', { key: this.t('monitoringReceiver.pandariaWebhook.aliyunSMS.templateCodeLabel') }, true));
              }
              if (!c.http_config.sign_name) {
                errors.push(this.t('validation.required', { key: this.t('monitoringReceiver.pandariaWebhook.aliyunSMS.signatureNameLabel') }, true));
              }
            } else if (!c.webhook_url) {
              errors.push(this.t('validation.required', { key: 'URL' }, true));
            }
          });
        }
      });

      this.$set(this.alertmanagerConfigResource, 'errors', errors);

      if (this.alertmanagerConfigResource.errors.length) {
        buttonDone(false);

        return;
      }
      if (this.alertmanagerConfigResource.yamlError) {
        this.alertmanagerConfigResource.errors = this.alertmanagerConfigResource.errors || [];
        this.alertmanagerConfigResource.errors.push(this.alertmanagerConfigResource.yamlError);

        buttonDone(false);

        return;
      }

      this.updatePandariaWebhookConfigs();
      this.alertmanagerConfigResource.save(...arguments);
      this.redirectToAlertmanagerConfigDetail();
    },
    updatePandariaWebhookConfigs() {
      const alertmanagerConfigResource = this.alertmanagerConfigResource;
      const receivers = alertmanagerConfigResource?.spec?.receivers || [];

      updateDriverV2(receivers, this.$store.dispatch);

      receivers.forEach((r) => {
        if (r.pandariaWebhookConfigs && r.pandariaWebhookConfigs.length) {
          const config = r.pandariaWebhookConfigs.map((c, index) => {
            const nameKey = `${ r.name }-${ index }`;

            return {
              url:          `${ PANDARIA_WEBHOOK_URL }${ nameKey }`,
              sendResolved: c.sendResolved,
            };
          });

          if (!r.webhookConfigs) {
            r.webhookConfigs = config;
          } else {
            r.webhookConfigs = r.webhookConfigs.concat(config);
          }
        }
      });
    },
    initPandariaReceivers(receiver = {}) {
      const { config: alertingSecretConfig } = this.alertingDrivers;

      if (receiver.webhookConfigs && receiver.webhookConfigs.length) {
        const webhookConfigs = [];
        const pandariaWebhookConfigs = receiver.pandariaWebhookConfigs || [];

        receiver.webhookConfigs.forEach((i) => {
          if (i?.url.startsWith(PANDARIA_WEBHOOK_URL)) {
            const nameKey = i.url.replace(PANDARIA_WEBHOOK_URL, '');
            const provider = alertingSecretConfig.providers[nameKey] || {};
            const receiver = alertingSecretConfig.receivers[nameKey] || {};
            let config = {};

            if (provider.type === 'DINGTALK') {
              config = {
                http_config: {
                  proxy_url: provider.proxy_url,
                  secret:    provider.secret,
                },
                webhook_url:   provider.webhook_url,
                sendResolved: i.sendResolved || false,
                type:         'DINGTALK',
              };
            } else if (provider.type === 'ALIYUN_SMS') {
              config = {
                http_config: {
                  access_key_id:     provider.access_key_id,
                  access_key_secret: provider.access_key_secret,
                  template_code:     provider.template_code,
                  sign_name:         provider.sign_name,
                  phone:             receiver.to || [],
                },
                sendResolved: i.sendResolved || false,
                type:         'ALIYUN_SMS',
              };
            }

            pandariaWebhookConfigs.push(config);
          } else {
            webhookConfigs.push(i);
          }
        });

        receiver.webhookConfigs = webhookConfigs;
        receiver.pandariaWebhookConfigs = pandariaWebhookConfigs;
      }
    },
    handleButtonGroupClick(event) {
      if (event === this.yaml) {
        this.goToEditYaml(this.view);
      }
      if (event === this.config) {
        this.goToEdit(this.view);
      }
    },
    toggleReceiverActionMenu() {
      this.receiverActionMenuIsOpen = !this.receiverActionMenuIsOpen;
    },
    handleReceiverActionMenuClick(event) {
      this.actionMenuTargetElement = this.$refs.actions;
      this.actionMenuTargetEvent = event;
      this.toggleReceiverActionMenu();
    },
    goToEdit() {
    // 'goToEdit' is the exact name of an action for AlertmanagerConfig
    // and this method executes the action.
      this.$router.push(this.alertmanagerConfigResource.getEditReceiverConfigRoute(this.receiverValue.name, _EDIT));
    },
    goToEditYaml() {
    // 'goToEditYaml' is the exact name of an action for AlertmanagerConfig
    // and this method executes the action.
      this.$router.push(this.alertmanagerConfigResource.getEditReceiverYamlRoute(this.receiverValue.name, _EDIT));
    },
    promptRemove(actionData) {
      // 'promptRemove' is the exact name of an action for AlertmanagerConfig
      // and this method executes the action.
      // Get the name of the receiver to delete from the action info.
      const nameOfReceiverToDelete = actionData.route.query.receiverName;
      // Remove it from the configuration of the parent AlertmanagerConfig
      // resource.
      const existingReceivers = this.alertmanagerConfigResource.spec.receivers || [];
      const receiversMinusDeletedItem = existingReceivers.filter((receiver) => {
        return receiver.name !== nameOfReceiverToDelete;
      });

      this.alertmanagerConfigResource.spec.receivers = receiversMinusDeletedItem;
      // After saving the AlertmanagerConfig, the resource has been deleted.
      this.alertmanagerConfigResource.save(...arguments);
      this.$router.push(this.alertmanagerConfigResource._detailLocation);
    },
    redirectToReceiverDetail(receiverName) {
      return this.alertmanagerConfigResource.getReceiverDetailLink(receiverName);
    },
    redirectToAlertmanagerConfigDetail() {
      const route = this.alertmanagerConfigResource._detailLocation;

      this.$router.push(route);
    }
  }
};
</script>

<template>
  <div>
    <header class="header">
      <div class="title">
        <div class="primaryheader">
          <h1>
            {{ heading }}
          </h1>
        </div>
      </div>
      <div class="actions-container">
        <div class="actions">
          <ButtonGroup
            v-if="viewOptions && mode === view"
            :value="currentView"
            :options="viewOptions"
            @input="handleButtonGroupClick"
          />

          <button
            v-if="mode === view"
            ref="actions"
            aria-haspopup="true"
            type="button"
            class="btn role-multi-action actions"
            @click="handleReceiverActionMenuClick"
          >
            <i class="icon icon-actions" />
          </button>
        </div>
      </div>
    </header>
    <ResourceYaml
      v-if="currentView === yaml && alertmanagerConfigResource"
      ref="resourceyaml"
      :value="alertmanagerConfigResource"
      :mode="mode"
      :initial-yaml-for-diff="null"
      :yaml="resourceYaml"
      :offer-preview="mode === edit"
      :done-route="JSON.stringify(redirectToReceiverDetail(receiverName))"
      :done-override="alertmanagerConfigDetailRoute"
      :apply-hooks="alertmanagerConfigResource.applyHooks"
      @error="e=>$emit('error', e)"
    />
    <ReceiverConfig
      v-if="(currentView === config || currentView === detail) && alertmanagerConfigResource"
      :value="receiverValue"
      :mode="mode"
      :alertmanager-config-id="alertmanagerConfigId"
      :alertmanager-config-resource="alertmanagerConfigResource"
      :save-override="saveOverride"
    />
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
  </div>
</template>

<style lang='scss' scoped>
.header{
  H1{
    flex: 1;
  }
  border-bottom: 1px solid var(--border);
  margin-bottom: 0;
  padding-bottom: 20px;
}

</style>
