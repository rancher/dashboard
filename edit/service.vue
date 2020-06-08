<script>
import { find } from 'lodash';
import ArrayList from '@/components/form/ArrayList';
import CreateEditView from '@/mixins/create-edit-view';
import DetailTop from '@/components/DetailTop';
import Footer from '@/components/form/Footer';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import LiveDate from '@/components/formatter/LiveDate';
import NameNsDescription from '@/components/form/NameNsDescription';
import RadioGroup from '@/components/form/RadioGroup';
import ResourceTabs from '@/components/form/ResourceTabs';
import ServicePorts from '@/components/form/ServicePorts';
import Tab from '@/components/Tabbed/Tab';
import UnitInput from '@/components/form/UnitInput';
import { DEFAULT_SERVICE_TYPES } from '@/config/types';
import { ucFirst } from '@/utils/string';
import Banner from '@/components/Banner';

const SESSION_AFFINITY_ACTION_VALUES = {
  NONE:      'None',
  CLUSTERIP: 'ClusterIP'
};

const SESSION_AFFINITY_ACTION_LABELS = {
  NONE:      'servicesPage.affinity.actionLabels.none',
  CLUSTERIP: 'servicesPage.affinity.actionLabels.clusterIp'
};

const SESSION_STICKY_TIME_DEFAULT = 10800;

const HEADLESS = (() => {
  const headless = find(DEFAULT_SERVICE_TYPES, ['id', 'Headless']);

  return headless.id;
})();

const CLUSTERIP = (() => {
  const clusterIp = find(DEFAULT_SERVICE_TYPES, ['id', 'ClusterIP']);

  return clusterIp.id;
})();

export default {
  // Props are found in CreateEditView
  // props: {},

  components: {
    ArrayList,
    Banner,
    DetailTop,
    Footer,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    LiveDate,
    NameNsDescription,
    RadioGroup,
    ResourceTabs,
    ServicePorts,
    Tab,
    UnitInput,
  },

  mixins: [CreateEditView],

  data() {
    if (!this?.value?.spec?.type) {
      if (!this.value?.spec) {
        const defaultService = find(DEFAULT_SERVICE_TYPES, ['id', CLUSTERIP]);

        this.$set(this.value, 'spec', {
          ports:           [],
          sessionAffinity: 'None',
        });

        this.serviceType = defaultService.id;
      }
    }

    return {
      defaultServiceTypes:          DEFAULT_SERVICE_TYPES,
      saving:                       false,
      sessionAffinityActionLabels:  Object.values(SESSION_AFFINITY_ACTION_LABELS).map(v => this.$store.getters['i18n/t'](v)).map(ucFirst),
      sessionAffinityActionOptions: Object.values(SESSION_AFFINITY_ACTION_VALUES),
    };
  },

  computed: {
    extraColumns() {
      return ['type-col'];
    },

    detailTopColumns() {
      return [
        {
          title:   this.$store.getters['i18n/t']('generic.type'),
          content: this.serviceType,
          name:    'type',
        },
        {
          title: this.$store.getters['i18n/t']('generic.created'),
          name:  'created'
        },
      ];
    },

    serviceType: {
      get() {
        const serviceType = this.value?.spec?.type;
        const clusterIp = this.value?.spec?.clusterIP;
        const defaultService = find(DEFAULT_SERVICE_TYPES, ['id', CLUSTERIP]);

        if (serviceType) {
          if (serviceType === CLUSTERIP && clusterIp === 'None') {
            return HEADLESS;
          } else {
            return serviceType;
          }
        }

        return defaultService;
      },

      set(serviceType) {
        if (serviceType === HEADLESS) {
          this.$set(this.value.spec, 'type', CLUSTERIP);
          this.$set(this.value.spec, 'clusterIP', 'None');
        } else {
          if (serviceType !== HEADLESS && this.value?.spec?.clusterIP === 'None') {
            this.$set(this.value.spec, 'clusterIP', null);
          } else if (serviceType === 'ExternalName') {
            this.$set(this.value.spec, 'ports', null);
          }

          this.$set(this.value.spec, 'type', serviceType);
        }
      },
    },
  },

  watch: {
    'value.spec.sessionAffinity'(val) {
      if (val === CLUSTERIP) {
        this.value.spec.sessionAffinityConfig = { clientIP: { timeoutSeconds: null } };

        // set it null and then set it with vue to make reactive.
        this.$set(this.value.spec.sessionAffinityConfig.clientIP, 'timeoutSeconds', SESSION_STICKY_TIME_DEFAULT);
      } else if (this.value?.spec?.sessionAffinityConfig?.clientIP?.timeoutSeconds) {
        delete this.value.spec.sessionAffinityConfig.clientIP.timeoutSeconds;
      }
    }
  },

  methods: {
    checkTypeIs(typeIn) {
      const { serviceType } = this;

      if (serviceType === typeIn) {
        return true;
      }

      return false;
    },
  },
};
</script>

<template>
  <div>
    <DetailTop v-if="isView" :columns="detailTopColumns">
      <template v-slot:created>
        <LiveDate
          :value="value.metadata.creationTimestamp"
          :add-suffix="true"
        />
      </template>
    </DetailTop>
    <form>
      <NameNsDescription
        v-if="!isView"
        :value="value"
        :mode="mode"
        :extra-columns="extraColumns"
      >
        <template #type-col>
          <LabeledSelect
            option-key="id"
            option-label="translationLabel"
            :label="t('servicesPage.typeOpts.label')"
            :localized-label="true"
            :mode="mode"
            :options="defaultServiceTypes"
            :value="serviceType"
            @input="e=>serviceType = e.id"
          />
        </template>
      </NameNsDescription>

      <div class="spacer"></div>

      <div v-if="checkTypeIs('ExternalName')">
        <div class="clearfix">
          <h4>
            <t k="servicesPage.externalName.label" />
          </h4>
          <Banner color="info" :label="t('servicesPage.externalName.helpText')" />
        </div>
        <div class="row mt-10">
          <div class="col span-6">
            <span v-if="isView">{{ value.spec.externalName }}</span>
            <input
              v-else
              ref="external-name"
              v-model.number="value.spec.externalName"
              type="text"
              :placeholder="t('servicesPage.externalName.placeholder')"
            />
          </div>
        </div>
      </div>
      <ServicePorts
        v-else
        v-model="value.spec.ports"
        class="col span-12"
        :mode="mode"
        :spec-type="serviceType"
      />

      <div class="spacer"></div>

      <ResourceTabs v-model="value" :mode="mode">
        <template #before>
          <Tab
            v-if="!checkTypeIs('ExternalName')"
            name="selectors"
            :label="t('servicesPage.selectors.label')"
          >
            <div class="row">
              <div class="col span-12">
                <Banner color="info" :label="t('servicesPage.selectors.helpText')" />
              </div>
            </div>
            <div class="row">
              <div class="col span-12">
                <KeyValue
                  key="selectors"
                  v-model="value.spec.selector"
                  :mode="mode"
                  :initial-empty-row="true"
                  :pad-left="false"
                  :read-allowed="false"
                  :protip="false"
                  @input="e=>$set(value.spec, 'selector', e)"
                />
              </div>
            </div>
          </Tab>
          <Tab name="ips" :label="t('servicesPage.ips.label')">
            <div class="row">
              <div class="col span-12">
                <Banner color="warning" :label="t('servicesPage.ips.helpText')" />
                <Banner
                  v-if="checkTypeIs('ClusterIP') || checkTypeIs('LoadBalancer') || checkTypeIs('NodePort')"
                  color="info"
                  :label="t('servicesPage.ips.clusterIpHelpText')"
                />
              </div>
            </div>
            <div v-if="checkTypeIs('ClusterIP') || checkTypeIs('LoadBalancer') || checkTypeIs('NodePort')" class="row mb-20">
              <div class="col span-6">
                <LabeledInput
                  v-model="value.spec.clusterIP"
                  :mode="mode"
                  :label="t('servicesPage.ips.input.label')"
                  :placeholder="t('servicesPage.ips.input.placeholder')"
                  @input="e=>$set(value.spec, 'clusterIP', e)"
                />
              </div>
            </div>
            <div class="row">
              <div class="col span-7">
                <ArrayList
                  key="clusterExternalIpAddresses"
                  v-model="value.spec.externalIPs"
                  :title="t('servicesPage.ips.external.label')"
                  :value-placeholder="t('servicesPage.ips.external.placeholder')"
                  :value-multiline="false"
                  :mode="mode"
                  :pad-left="false"
                  :protip="t('servicesPage.ips.external.protip')"
                  @input="e=>$set(value.spec, 'externalIPs', e)"
                />
              </div>
            </div>
          </Tab>
          <Tab
            v-if="!checkTypeIs('NodePort') && !checkTypeIs('ExternalName') && !checkTypeIs('Headless')"
            name="session-affinity"
            :label="t('servicesPage.affinity.label')"
          >
            <div class="col span-12">
              <Banner color="info" :label="t('servicesPage.affinity.helpText')" />
            </div>
            <div class="row session-affinity">
              <div class="col span-6">
                <RadioGroup
                  v-model="value.spec.sessionAffinity"
                  class="enforcement-action"
                  :options="sessionAffinityActionOptions"
                  :labels="sessionAffinityActionLabels"
                  :mode="mode"
                  @input="e=>value.spec.sessionAffinity = e"
                />
              </div>
              <div v-if="value.spec.sessionAffinity === 'ClusterIP'" class="col span-6">
                <UnitInput
                  v-model="value.spec.sessionAffinityConfig.clientIP.timeoutSeconds"
                  :suffix="t('suffix.seconds')"
                  :label="t('servicesPage.affinity.timeout.label')"
                  :placeholder="t('servicesPage.affinity.timeout.placeholder')"
                  @input="e=>$set(value.spec.sessionAffinityConfig.clientIP, 'timeoutSeconds', e)"
                />
              </div>
            </div>
          </Tab>
        </template>
      </ResourceTabs>

      <Footer
        v-if="!isView"
        :mode="mode"
        :errors="errors"
        @save="save"
        @done="done"
      />
    </form>
  </div>
</template>
