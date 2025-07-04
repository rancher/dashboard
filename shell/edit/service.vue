<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import throttle from 'lodash/throttle';
import ArrayList from '@shell/components/form/ArrayList';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import KeyValue from '@shell/components/form/KeyValue';
import { LabeledInput } from '@components/Form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { RadioGroup } from '@components/Form/Radio';
import ServicePorts from '@shell/components/form/ServicePorts';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import UnitInput from '@shell/components/form/UnitInput';
import { DEFAULT_SERVICE_TYPES, HEADLESS, CLUSTERIP } from '@shell/models/service';
import { ucFirst } from '@shell/utils/string';
import CruResource from '@shell/components/CruResource';
import { Banner } from '@components/Banner';
import Labels from '@shell/components/form/Labels';
import HarvesterServiceAddOnConfig from '@shell/components/HarvesterServiceAddOnConfig';
import { clone } from '@shell/utils/object';
import { POD, CAPI, HCI } from '@shell/config/types';
import { matching } from '@shell/utils/selector-typed';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { allHash } from '@shell/utils/promise';
import { isHarvesterSatisfiesVersion } from '@shell/utils/cluster';
import { Port } from '@shell/utils/validators/formRules';
import { _CLONE } from '@shell/config/query-params';

const SESSION_AFFINITY_ACTION_VALUES = {
  NONE:     'None',
  CLIENTIP: 'ClientIP',
};

const SESSION_AFFINITY_ACTION_LABELS = {
  NONE:     'servicesPage.affinity.actionLabels.none',
  CLIENTIP: 'servicesPage.affinity.actionLabels.clientIp',
};

const SESSION_STICKY_TIME_DEFAULT = 10800;

export default {
  emits:        ['set-subtype'],
  // Props are found in CreateEditView
  // props: {},
  inheritAttrs: false,
  components:   {
    ArrayList,
    Banner,
    CruResource,
    KeyValue,
    Labels,
    LabeledInput,
    NameNsDescription,
    RadioGroup,
    ServicePorts,
    Tab,
    Tabbed,
    UnitInput,
    HarvesterServiceAddOnConfig,
  },

  mixins: [CreateEditView, FormValidation],

  fetch() {
    return this.loadPods();
  },

  data() {
    if (!this?.value?.spec?.type) {
      if (!this.value?.spec) {
        this.value['spec'] = {
          ports:           [],
          sessionAffinity: 'None'
        };
      }
    }

    // Set clusterIP to an empty string, if it exists and the value is not None when clone a service
    // Remove clusterIPs if it exists when clone a service
    if (this.realMode === _CLONE) {
      if (this.value?.spec?.clusterIP && this.value?.spec?.clusterIP !== 'None') {
        this.value.spec.clusterIP = '';
      }
      if (this.value?.spec?.clusterIPs) {
        delete this.value.spec['clusterIPs'];
      }
    }

    const matchingPods = {
      matched: 0,
      matches: [],
      none:    true,
      sample:  null,
      total:   0,
    };

    return {
      matchingPods,
      defaultServiceTypes:         DEFAULT_SERVICE_TYPES,
      saving:                      false,
      sessionAffinityActionLabels: Object.values(SESSION_AFFINITY_ACTION_LABELS)
        .map((v) => this.$store.getters['i18n/t'](v))
        .map(ucFirst),
      sessionAffinityActionOptions: Object.values(
        SESSION_AFFINITY_ACTION_VALUES
      ),
      fvFormRuleSets:            [],
      fvReportedValidationPaths: ['spec'],
      closedErrorMessages:       [],
      inStore:                   this.$store.getters['currentStore'](POD),
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    tabErrors() {
      const tabErrors = {};

      if (this.serviceType === 'ExternalName') {
        tabErrors.externalName = this.fvGetPathErrors(['spec.externalName'])?.length > 0;
      } else {
        tabErrors.servicePorts = this.fvGetPathErrors(['spec.ports'])?.length > 0;
      }

      return tabErrors;
    },

    showSelectorWarning() {
      const selector = this.value.spec?.selector;

      return !!isEmpty(selector);
    },
    serviceType: {
      get() {
        const serviceType = this.value?.spec?.type;
        const clusterIp = this.value?.spec?.clusterIP;

        if (serviceType) {
          if (serviceType === CLUSTERIP && clusterIp === 'None') {
            return HEADLESS;
          } else {
            return serviceType;
          }
        }

        return serviceType;
      },

      set(serviceType) {
        this.$emit('set-subtype', serviceType);

        if (serviceType === HEADLESS) {
          this.value.spec['type'] = CLUSTERIP;
          this.value.spec['clusterIP'] = 'None';
        } else {
          if (
            serviceType !== HEADLESS &&
            this.value?.spec?.clusterIP === 'None'
          ) {
            this.value.spec['clusterIP'] = null;
          } else if (serviceType === 'ExternalName') {
            this.value.spec['ports'] = null;
          }

          this.value.spec['type'] = serviceType;
        }
      },
    },
    showAffinityTimeout() {
      return (
        this.value.spec.sessionAffinity === 'ClientIP' &&
        !isEmpty(this.value.spec.sessionAffinityConfig)
      );
    },

    hasClusterIp() {
      return (
        this.checkTypeIs('ClusterIP') ||
        this.checkTypeIs('LoadBalancer') ||
        this.checkTypeIs('NodePort')
      );
    },

    showHarvesterAddOnConfig() {
      let cloudProvider;
      const version = this.provisioningCluster?.kubernetesVersion;

      if (this.provisioningCluster?.isRke2) {
        const machineSelectorConfig = this.provisioningCluster?.spec?.rkeConfig?.machineSelectorConfig || {};
        const agentConfig = (machineSelectorConfig[0] || {}).config;

        cloudProvider = agentConfig?.['cloud-provider-name'];
      } else if (this.provisioningCluster?.isRke1) {
        const currentCluster = this.$store.getters['currentCluster'];

        cloudProvider = currentCluster?.spec?.rancherKubernetesEngineConfig?.cloudProvider?.name;
      }

      return this.checkTypeIs('LoadBalancer') &&
              cloudProvider === HARVESTER &&
              isHarvesterSatisfiesVersion(version);
    },

    provisioningCluster() {
      const out = this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER).find((c) => c?.status?.clusterName === this.currentCluster.metadata.name);

      return out;
    },
    errorMessages() {
      if (!this.serviceType) {
        return [];
      }

      return this.fvUnreportedValidationErrors.filter((e) => !this.closedErrorMessages.includes(e));
    }
  },

  watch: {
    'value.metadata.namespace': 'updateMatchingPods',
    'value.spec.selector':      'updateMatchingPods',
    'value.spec.sessionAffinity'(val) {
      if (val === 'ClientIP') {
        this.value.spec.sessionAffinityConfig = { clientIP: { timeoutSeconds: null } };

        // set it null and then set it with vue to make reactive.
        this.value.spec.sessionAffinityConfig.clientIP.timeoutSeconds = SESSION_STICKY_TIME_DEFAULT;
      } else if (
        this.value?.spec?.sessionAffinityConfig?.clientIP?.timeoutSeconds
      ) {
        delete this.value.spec.sessionAffinityConfig.clientIP.timeoutSeconds;
      }
    },
    'value.spec.type'(val) {
      if (val === 'ExternalName') {
        this.fvFormRuleSets = [{
          path:           'spec.externalName',
          rules:          ['required', 'externalName'],
          translationKey: 'servicesPage.externalName.input.label'
        }];
      } else {
        this.fvFormRuleSets = [{ path: 'spec.ports', rules: ['servicePort'] }];
      }
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  mounted() {
    const initialType = this.serviceType;

    this['serviceType'] = initialType;
  },

  methods: {
    updateMatchingPods: throttle(async function() {
      // https://kubernetes.io/docs/reference/kubernetes-api/service-resources/service-v1/#ServiceSpec
      const { value: { spec: { selector = { } } } } = this;

      this.matchingPods = await matching({
        labelSelector: { matchLabels: selector },
        type:          POD,
        $store:        this.$store,
        inStore:       this.inStore,
        namespace:     this.value?.metadata?.namespace,
      });
    }, 250, { leading: true }),

    async loadPods() {
      try {
        const hash = {
          provClusters:     this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
          harvesterConfigs: this.$store.dispatch(`management/findAll`, { type: HCI.HARVESTER_CONFIG }),
        };

        await allHash(hash);
        this.updateMatchingPods();
      } catch (e) { }
    },

    checkTypeIs(typeIn) {
      const { serviceType } = this;

      if (serviceType === typeIn) {
        return true;
      }

      return false;
    },

    updateServicePorts(servicePorts) {
      this.value.spec['ports'] = servicePorts;
    },

    targetPortsStrOrInt(targetPorts = []) {
      const neu = clone(targetPorts);

      neu.forEach((port, idx) => {
        const targetPort = new Port(port?.targetPort);

        if (targetPort.isInt) {
          port.targetPort = targetPort.int;
        }
      });

      return neu;
    },

    willSave() {
      const { ports = [] } = this.value.spec;

      if (ports && ports.length > 0) {
        this.value.spec.ports = this.targetPortsStrOrInt(this.value.spec.ports);
      }
    },
  },
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :selected-subtype="serviceType"
    :subtypes="defaultServiceTypes"
    :validation-passed="fvFormIsValid"
    :errors="errorMessages"
    :apply-hooks="applyHooks"
    :description="t('servicesPage.serviceListDescription')"
    @error="(e) => (errors = e)"
    @finish="save"
    @cancel="done"
    @select-type="(st) => (serviceType = st)"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :mode="mode"
      :rules="{ name: fvGetAndReportPathRules('metadata.name'), namespace: [], description: [] }"
    />

    <Tabbed
      :side-tabs="true"
      :use-hash="useTabbedHash"
    >
      <Tab
        v-if="checkTypeIs('ExternalName')"
        name="define-external-name"
        :label="t('servicesPage.externalName.define')"
        :tooltip="t('servicesPage.externalName.helpText')"
        :error="tabErrors.externalName"
      >
        <div class="row mt-10">
          <div class="col span-6">
            <span v-if="isView">{{ value.spec.externalName }}</span>
            <LabeledInput
              v-else
              ref="external-name"
              v-model:value.number="value.spec.externalName"
              :mode="mode"
              :label="t('servicesPage.externalName.input.label')"
              :placeholder="t('servicesPage.externalName.placeholder')"
              type="text"
              :rules="fvGetAndReportPathRules('spec.externalName')"
            />
          </div>
        </div>
      </Tab>
      <Tab
        v-else
        name="define-service-ports"
        :label="t('servicesPage.ips.define')"
        :weight="10"
        :error="tabErrors.servicePorts"
      >
        <ServicePorts
          v-model:value="value.spec.ports"
          class="col span-12"
          :mode="mode"
          :spec-type="serviceType"
          :rules="fvGetAndReportPathRules('spec.ports')"
          @update:value="updateServicePorts"
        />
      </Tab>
      <Tab
        v-if="!checkTypeIs('ExternalName')"
        name="selectors"
        :label="t('servicesPage.selectors.label')"
      >
        <p>{{ t('servicesPage.selectors.matchingPods.description') }}</p>
        <div class="row">
          <div class="col span-12">
            <Banner :color="(matchingPods.none ? 'warning' : 'success')">
              <span v-clean-html="t('servicesPage.selectors.matchingPods.matchesSome', matchingPods)" />
            </Banner>
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <KeyValue
              key="selectors"
              v-model:value="value.spec.selector"
              :mode="mode"
              :initial-empty-row="true"
              :protip="false"
              @update:value="(e) => value.spec.selector = e"
            />
          </div>
        </div>
      </Tab>
      <Tab
        name="ips"
        :label="t('servicesPage.ips.label')"
        :tooltip="t('servicesPage.ips.external.protip')"
      >
        <div
          v-if="hasClusterIp"
          class="row mb-20"
        >
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.clusterIP"
              :mode="mode"
              :label="t('servicesPage.ips.input.label')"
              :placeholder="t('servicesPage.ips.input.placeholder')"
              :tooltip-key="
                hasClusterIp ? 'servicesPage.ips.clusterIpHelpText' : null
              "
              @update:value="(e) => value.spec.clusterIP = e"
            />
          </div>
        </div>
        <div
          v-if="checkTypeIs('LoadBalancer')"
          class="row mb-20"
        >
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.loadBalancerIP"
              :mode="mode"
              :label="t('servicesPage.ips.loadBalancerIp.label')"
              :placeholder="t('servicesPage.ips.loadBalancerIp.placeholder')"
              :tooltip-key="
                hasClusterIp ? 'servicesPage.ips.loadBalancerIp.helpText' : null
              "
              @update:value="(e) => value.spec.loadBalancerIP = e"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-7">
            <ArrayList
              key="clusterExternalIpAddresses"
              v-model:value="value.spec.externalIPs"
              :title="hasClusterIp ? t('servicesPage.ips.external.label') : ''"
              :value-placeholder="t('servicesPage.ips.external.placeholder')"
              :mode="mode"
              :protip="false"
              @update:value="(e) => value.spec.externalIPs = e"
            />
          </div>
        </div>
      </Tab>
      <Tab
        v-if="showHarvesterAddOnConfig"
        name="add-on-config"
        :label="t('servicesPage.harvester.title')"
        :weight="-1"
      >
        <HarvesterServiceAddOnConfig
          :mode="mode"
          :value="value"
          :register-before-hook="registerBeforeHook"
        />
      </Tab>
      <Tab
        v-if="!checkTypeIs('ExternalName') && !checkTypeIs('Headless')"
        name="session-affinity"
        :label="t('servicesPage.affinity.label')"
        :tooltip="t('servicesPage.affinity.helpText')"
      >
        <div class="row session-affinity">
          <div class="col span-6">
            <RadioGroup
              v-model:value="value.spec.sessionAffinity"
              name="sessionAffinity"
              class="enforcement-action"
              :options="sessionAffinityActionOptions"
              :labels="sessionAffinityActionLabels"
              :mode="mode"
            />
          </div>
          <div
            v-if="showAffinityTimeout"
            class="col span-6"
          >
            <UnitInput
              v-model:value="value.spec.sessionAffinityConfig.clientIP.timeoutSeconds"
              :suffix="
                t('suffix.seconds', {
                  count:
                    value.spec.sessionAffinityConfig.clientIP.timeoutSeconds,
                })
              "
              :label="t('servicesPage.affinity.timeout.label')"
              :placeholder="t('servicesPage.affinity.timeout.placeholder')"
            />
          </div>
        </div>
      </Tab>
      <Tab
        v-if="!isView"
        name="labels-and-annotations"
        :label="t('servicesPage.labelsAnnotations.label', {}, true)"
        :weight="-2"
      >
        <Labels
          :default-container-class="'labels-and-annotations-container'"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss">
</style>
