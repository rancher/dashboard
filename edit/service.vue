<script>
import { find } from 'lodash';
import { ucFirst } from '@/utils/string';
import CreateEditView from '@/mixins/create-edit-view';
import ArrayList from '@/components/form/ArrayList';
import Footer from '@/components/form/Footer';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import NameNsDescription from '@/components/form/NameNsDescription';
import RadioGroup from '@/components/form/RadioGroup';
import ResourceTabs from '@/components/form/ResourceTabs';
import ServicePorts from '@/components/form/ServicePorts';
import Tab from '@/components/Tabbed/Tab';
import UnitInput from '@/components/form/UnitInput';
import { DEFAULT_SERVICE_TYPES } from '@/config/types';

const SESSION_AFFINITY_ACTION_VALUES = {
  NONE:      'None',
  CLUSTERIP: 'ClusterIP'
};

const SESSION_AFFINITY_ACTION_LABELS = {
  NONE:      'servicesPage.affinity.actionLabels.none',
  CLUSTERIP: 'servicesPage.affinity.actionLabels.clusterIp'
};

const SESSION_STICKY_TIME_DEFAULT = 10800;

export default {
  components: {
    ArrayList,
    Footer,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    NameNsDescription,
    RadioGroup,
    ResourceTabs,
    ServicePorts,
    Tab,
    UnitInput,
  },

  mixins:     [CreateEditView],

  data() {
    if (!this?.value?.spec?.type) {
      const defaultService = find(DEFAULT_SERVICE_TYPES, ['id', 'ClusterIP']);

      if (!this?.value?.spec) {
        this.$set(this.value, 'spec', {
          ports:           [],
          sessionAffinity: 'None',
          type:            defaultService.id,
        });
      } else {
        this.$set(this.value.spec, 'type', defaultService.id);
      }
    }

    return {
      sessionAffinityActionOptions: Object.values(SESSION_AFFINITY_ACTION_VALUES),
      sessionAffinityActionLabels:  Object.values(SESSION_AFFINITY_ACTION_LABELS).map(v => this.$store.getters['i18n/t'](v)).map(ucFirst),
      defaultServiceTypes:          DEFAULT_SERVICE_TYPES,
    };
  },

  computed: {
    extraColumns() {
      return ['type-col'];
    },
  },

  watch: {
    'value.spec.type'(val) {
      if (val === 'ExternalName') {
        this.value.spec.ports = null;
      }

      if (val === 'Headless') {
        this.value.spec.clusterIP = 'None';
      } else if (val !== 'Headless' && this.value.spec.clusterIP === 'None') {
        this.value.spec.clusterIP = null;
      }
    },

    'value.spec.sessionAffinity'(val) {
      if (val === 'ClusterIP') {
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
      const { value: { spec: { type } } } = this;

      if (type === typeIn) {
        return true;
      }

      return false;
    }
  }
};
</script>

<template>
  <div>
    <form>
      <NameNsDescription
        :value="value"
        :namespaced="false"
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
            :value="value.spec.type"
            @input="e=>$set(value.spec, 'type', e.id)"
          />
        </template>
      </NameNsDescription>

      <div class="spacer"></div>

      <div v-if="checkTypeIs('ExternalName')">
        <div class="title clearfix">
          <h4>
            <t k="servicesPage.externalName.label" />
          </h4>
          <p class="helper-text">
            <t k="servicesPage.externalName.helpText" />
          </p>
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
              @input="e=>$set(value.spec, 'externalName', e)"
            />
          </div>
        </div>
      </div>
      <ServicePorts
        v-else
        v-model="value.spec.ports"
        class="col span-12"
        :mode="mode"
        :spec-type="value.spec.type"
      />

      <div class="spacer"></div>

      <ResourceTabs v-model="value" :mode="mode">
        <template #before>
          <Tab
            v-if="!checkTypeIs('NodePort') && !checkTypeIs('ExternalName')"
            name="selectors"
            :label="t('servicesPage.selectors.label')"
          >
            <div class="row">
              <div class="col span-12">
                <p class="helper-text">
                  <t k="servicesPage.selectors.helpText" />
                </p>
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
            <div v-if="checkTypeIs('ClusterIP') || checkTypeIs('LoadBalancer')" class="row">
              <div class="col span-12">
                <p class="helper-text">
                  <t k="servicesPage.ips.helpText" />
                </p>
              </div>
            </div>
            <div v-if="checkTypeIs('ClusterIP') || checkTypeIs('LoadBalancer')" class="row mb-20">
              <div class="col span-6">
                <LabeledInput
                  v-model="value.spec.clusterIP"
                  :label="t('servicesPage.ips.input.label')"
                  :placeholder="t('servicesPage.ips.input.placeholder')"
                  @input="e=>$set(value.spec, 'clusterIP', e)"
                />
              </div>
            </div>
            <div class="row">
              <div class="col span-6">
                <ArrayList
                  key="clusterExternalIpAddresses"
                  v-model="value.spec.externalIPs"
                  :title="t('servicesPage.ips.external.label')"
                  :value-placeholder="t('servicesPage.ips.external.placeholder')"
                  :value-multiline="false"
                  :mode="mode"
                  :pad-left="false"
                  :protip="false"
                  @input="e=>$set(value.spec, 'externalIPs', e)"
                />
              </div>
            </div>
          </Tab>
          <Tab
            v-if="!checkTypeIs('NodePort') && !checkTypeIs('ExternalName')"
            name="session-affinity"
            :label="t('servicesPage.affinity.label')"
          >
            <div class="row">
              <div class="col span-12">
                <p class="helper-text">
                  <t k="servicesPage.affinity.helpText" />
                </p>
              </div>
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
        :mode="mode"
        :errors="errors"
        @save="save"
        @done="done"
      />
    </form>
  </div>
</template>
