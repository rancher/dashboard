<script>
import { isEmpty } from 'lodash';
import throttle from 'lodash/throttle';
import ArrayList from '@/components/form/ArrayList';
import CreateEditView from '@/mixins/create-edit-view';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import NameNsDescription from '@/components/form/NameNsDescription';
import RadioGroup from '@/components/form/RadioGroup';
import ServicePorts from '@/components/form/ServicePorts';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import UnitInput from '@/components/form/UnitInput';
import { DEFAULT_SERVICE_TYPES, HEADLESS, CLUSTERIP } from '@/models/service';
import { ucFirst } from '@/utils/string';
import CruResource from '@/components/CruResource';
import Banner from '@/components/Banner';
import Labels from '@/components/form/Labels';
import { clone } from '@/utils/object';
import { POD } from '@/config/types';
import { matching } from '@/utils/selector';

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
  // Props are found in CreateEditView
  // props: {},

  components: {
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
  },

  mixins: [CreateEditView],

  fetch() {
    return this.loadPods();
  },

  data() {
    if (!this?.value?.spec?.type) {
      if (!this.value?.spec) {
        this.$set(this.value, 'spec', {
          ports:           [],
          sessionAffinity: 'None',
        });
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
      allPods:                     [],
      defaultServiceTypes:         DEFAULT_SERVICE_TYPES,
      saving:                      false,
      sessionAffinityActionLabels: Object.values(SESSION_AFFINITY_ACTION_LABELS)
        .map(v => this.$store.getters['i18n/t'](v))
        .map(ucFirst),
      sessionAffinityActionOptions: Object.values(
        SESSION_AFFINITY_ACTION_VALUES
      ),
    };
  },

  computed: {
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
          this.$set(this.value.spec, 'type', CLUSTERIP);
          this.$set(this.value.spec, 'clusterIP', 'None');
        } else {
          if (
            serviceType !== HEADLESS &&
            this.value?.spec?.clusterIP === 'None'
          ) {
            this.$set(this.value.spec, 'clusterIP', null);
          } else if (serviceType === 'ExternalName') {
            this.$set(this.value.spec, 'ports', null);
          }

          this.$set(this.value.spec, 'type', serviceType);
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
  },

  watch: {
    'value.spec.selector': 'updateMatchingPods',
    'value.spec.sessionAffinity'(val) {
      if (val === 'ClientIP') {
        this.value.spec.sessionAffinityConfig = { clientIP: { timeoutSeconds: null } };

        // set it null and then set it with vue to make reactive.
        this.$set(
          this.value.spec.sessionAffinityConfig.clientIP,
          'timeoutSeconds',
          SESSION_STICKY_TIME_DEFAULT
        );
      } else if (
        this.value?.spec?.sessionAffinityConfig?.clientIP?.timeoutSeconds
      ) {
        delete this.value.spec.sessionAffinityConfig.clientIP.timeoutSeconds;
      }
    },
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  mounted() {
    const initialType = this.serviceType;

    this.$set(this, 'serviceType', initialType);
  },

  methods: {
    updateMatchingPods: throttle(function() {
      const { allPods, value: { spec: { selector = { } } } } = this;

      if (isEmpty(selector)) {
        this.matchingPods = {
          matched: 0,
          total:   allPods.length,
          none:    true,
          sample:  null,
        };
      } else {
        const match = matching(allPods, selector);

        this.matchingPods = {
          matched: match.length,
          total:   allPods.length,
          none:    match.length === 0,
          sample:  match[0] ? match[0].nameDisplay : null,
        };
      }
    }, 250, { leading: true }),

    async loadPods() {
      try {
        const inStore = this.$store.getters['currentProduct'].inStore;

        this.allPods = await this.$store.dispatch(`${ inStore }/findAll`, { type: POD });
        this.matchingPods.total = this.allPods.length;
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
      this.$set(this.value.spec, 'ports', servicePorts);
    },

    targetPortsStrOrInt(targetPorts = []) {
      const neu = clone(targetPorts);
      const isNumeric = new RegExp('^\\d+$');

      neu.forEach((port, idx) => {
        if (port?.targetPort && isNumeric.test(port.targetPort)) {
          port.targetPort = parseInt(port.targetPort, 10);
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
    :validation-passed="true"
    :errors="errors"
    @error="(e) => (errors = e)"
    @finish="save"
    @cancel="done"
    @select-type="(st) => (serviceType = st)"
    @apply-hooks="() => applyHooks('_beforeSaveHooks')"
  >
    <NameNsDescription v-if="!isView" :value="value" :mode="mode" />

    <Tabbed :side-tabs="true">
      <Tab
        v-if="checkTypeIs('ExternalName')"
        name="define-external-name"
        :label="t('servicesPage.externalName.define')"
        :tooltip="t('servicesPage.externalName.helpText')"
      >
        <div class="row mt-10">
          <div class="col span-6">
            <span v-if="isView">{{ value.spec.externalName }}</span>
            <LabeledInput
              v-else
              ref="external-name"
              v-model.number="value.spec.externalName"
              :mode="mode"
              :label="t('servicesPage.externalName.input.label')"
              :placeholder="t('servicesPage.externalName.placeholder')"
              :required="true"
              type="text"
            />
          </div>
        </div>
      </Tab>
      <Tab
        v-else
        name="define-service-ports"
        :label="t('servicesPage.ips.define')"
        :weight="10"
      >
        <ServicePorts
          v-model="value.spec.ports"
          class="col span-12"
          :mode="mode"
          :spec-type="serviceType"
          @input="updateServicePorts"
        />
      </Tab>
      <Tab
        v-if="!checkTypeIs('ExternalName')"
        name="selectors"
        :label="t('servicesPage.selectors.label')"
      >
        <div class="row">
          <div class="col span-12">
            <Banner :color="(matchingPods.none ? 'warning' : 'success')">
              <span v-html="t('servicesPage.selectors.matchingPods.matchesSome', matchingPods)" />
            </Banner>
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <KeyValue
              key="selectors"
              v-model="value.spec.selector"
              :mode="mode"
              :initial-empty-row="true"
              :protip="false"
              @input="(e) => $set(value.spec, 'selector', e)"
            />
          </div>
        </div>
      </Tab>
      <Tab
        name="ips"
        :label="t('servicesPage.ips.label')"
        :tooltip="t('servicesPage.ips.external.protip')"
      >
        <div v-if="hasClusterIp" class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.clusterIP"
              :mode="mode"
              :label="t('servicesPage.ips.input.label')"
              :placeholder="t('servicesPage.ips.input.placeholder')"
              :tooltip-key="
                hasClusterIp ? 'servicesPage.ips.clusterIpHelpText' : null
              "
              @input="(e) => $set(value.spec, 'clusterIP', e)"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-7">
            <ArrayList
              key="clusterExternalIpAddresses"
              v-model="value.spec.externalIPs"
              :title="hasClusterIp ? t('servicesPage.ips.external.label') : ''"
              :value-placeholder="t('servicesPage.ips.external.placeholder')"
              :mode="mode"
              :protip="false"
              @input="(e) => $set(value.spec, 'externalIPs', e)"
            />
          </div>
        </div>
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
              v-model="value.spec.sessionAffinity"
              name="sessionAffinity"
              class="enforcement-action"
              :options="sessionAffinityActionOptions"
              :labels="sessionAffinityActionLabels"
              :mode="mode"
            />
          </div>
          <div v-if="showAffinityTimeout" class="col span-6">
            <UnitInput
              v-model="value.spec.sessionAffinityConfig.clientIP.timeoutSeconds"
              :suffix="
                t('suffix.seconds', {
                  count:
                    value.spec.sessionAffinityConfig.clientIP.timeoutSeconds,
                })
              "
              :label="t('servicesPage.affinity.timeout.label')"
              :placeholder="t('servicesPage.affinity.timeout.placeholder')"
              @input="
                (e) =>
                  $set(
                    value.spec.sessionAffinityConfig.clientIP,
                    'timeoutSeconds',
                    e
                  )
              "
            />
          </div>
        </div>
      </Tab>
      <Tab
        v-if="!isView"
        name="labels-and-annotations"
        :label="t('servicesPage.labelsAnnotations.label', {}, true)"
        :weight="-1"
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
