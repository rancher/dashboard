<script>
import { isEmpty, find, isNaN } from 'lodash';
import { findBy } from '@/utils/array';
import { _EDIT, _CLONE } from '@/config/query-params';
import { ucFirst } from '@/utils/string';
import { DEFAULT_SERVICE_TYPES, HEADLESS, CLUSTERIP } from '@/models/service';
import CreateEditView from '@/mixins/create-edit-view';
import ArrayList from '@/components/form/ArrayList';
import Banner from '@/components/Banner';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import Labels from '@/components/form/Labels';
import NameNsDescription from '@/components/form/NameNsDescription';
import RadioGroup from '@/components/form/RadioGroup';
import ServicePorts from '@/components/form/ServicePorts';
import UnitInput from '@/components/form/UnitInput';
import Wizard from '@/components/Wizard';

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
  // Props are found in CreateEditView
  // props: {},

  components: {
    ArrayList,
    Banner,
    KeyValue,
    LabeledInput,
    Labels,
    NameNsDescription,
    RadioGroup,
    ServicePorts,
    UnitInput,
    Wizard
  },

  mixins: [CreateEditView],

  data() {
    const bannerServiceType = this.value._type || this.value.type;

    if (!this?.value?.metadata?.name) {
      this.$set(this.value.metadata, 'name', '');
    }

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

    if (this.mode === _CLONE) {
      this.$set(this.value.spec, 'clusterIP', null);
    }

    return {
      bannerServiceType,
      defaultServiceTypes:          DEFAULT_SERVICE_TYPES,
      saving:                       false,
      serviceYaml:                  '',
      sessionAffinityActionLabels:  Object.values(SESSION_AFFINITY_ACTION_LABELS).map(v => this.$store.getters['i18n/t'](v)).map(ucFirst),
      sessionAffinityActionOptions: Object.values(SESSION_AFFINITY_ACTION_VALUES),
      showpreviewYamlWarning:       false,
      steps:                        [
        {
          label:   this.t('servicesPage.steps.select.label'),
          name:    'select-service',
          ready:   true,
          subtext: this.t('servicesPage.steps.define.subtext', {}, true),
        },
        {
          label:   this.t('servicesPage.steps.define.label'),
          name:    'define-service',
          ready:   true, // this.$route.query?.mode && this.$route.query.mode === _EDIT,
          subtext: this.t('servicesPage.steps.define.subtext', {}, true),
        },
        {
          label:   this.t('servicesPage.steps.advanced.label'),
          name:    'advanced-config-serivce',
          ready:   true,
          subtext: this.t('servicesPage.steps.advanced.subtext'),
        },
      ]
    };
  },

  computed: {
    extraColumns() {
      return ['type-col'];
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
    // TODO - reset config if we go back to step 1
    // '$route.query.step'(val) {
    //   console.log('Router step: ', val);
    // },
    'value.metadata.name': {
      handler(val, oldVal) {
        const defineServiceStep = findBy(( this?.steps || []), 'name', 'define-service');

        if (isEmpty(val)) {
          defineServiceStep.ready = false;
        } else if (!isEmpty(defineServiceStep)) {
          defineServiceStep.ready = true;
        }
      },
      deep: true
    },

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
    cancelEdit() {
      this.done();
    },

    setServiceType(type) {
      this.serviceType = type;
    },

    checkTypeIs(typeIn) {
      const { serviceType } = this;

      if (serviceType === typeIn) {
        return true;
      }

      return false;
    },

    updateServicePorts(servicePorts) {
      servicePorts.forEach((sp) => {
        if ( !isEmpty(sp?.targetPort) ) {
          const tpCoerced = parseInt(sp.targetPort, 10);

          if (!isNaN(tpCoerced)) {
            sp.targetPort = tpCoerced;
          }
        }
      });

      this.$set(this.value.spec, 'ports', servicePorts);
    },

    showCustomCancel() {
      const {
        isEdit,
        $route,
      } = this;

      if (!isEdit && ( $route.query.step <= 1 || !$route.query.step)) {
        return true;
      }

      return false;
    },
  },
};
</script>

<template>
  <form>
    <Wizard
      :banner-image="initialDisplayFor(bannerServiceType)"
      :banner-title="nameDisplayFor(bannerServiceType)"
      :can-create-immediately="true"
      :done-route="doneRoute"
      :edit-first-step="isCreate ? true : false"
      :errors="errors"
      :initial-title="false"
      :resource="value"
      :steps="steps"
      @finish="save"
      @clearErrors="clearErrors"
    >
      <template v-if="showCustomCancel" slot="cancel">
        <button type="button" class="btn role-secondary" @click="cancelEdit">
          <t k="generic.cancel" />
        </button>
      </template>

      <template v-if="$route.query.step > 1 || mode !=='create'" #bannerTitleImage>
        <span class="banner-text-service"> {{ initialDisplayFor(bannerServiceType) }} </span>
      </template>

      <template slot="select-service">
        <div class="row select-service-row">
          <div
            v-for="type in defaultServiceTypes"
            :key="type.id"
            class="choice-banner hand"
            :class="{active: type.id === serviceType}"
            @click="setServiceType(type.id)"
          >
            <div v-if="type.bannerAbbrv" class="round-image">
              <div class="banner-text-service">
                {{ type.bannerAbbrv }}
              </div>
            </div>
            <div>
              <h5 class="mb-0">
                {{ t(type.translationLabel) }}
              </h5>
              <span
                class="type-description"
                v-html="t(`servicesPage.wizard.types.${ type.id }`)"
              >
              </span>
            </div>
          </div>
        </div>
      </template>

      <template slot="define-service">
        <NameNsDescription
          v-if="!isView"
          :value="value"
          :mode="mode"
        />

        <div class="spacer-bordered"></div>

        <div v-if="checkTypeIs('ExternalName')">
          <div class="clearfix">
            <h4 class="inline-block">
              <t k="servicesPage.externalName.label" />
              <i
                v-tooltip="t('servicesPage.externalName.helpText')"
                class="icon icon-info"
                style="font-size: 12px"
              />
            </h4>
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
          @input="updateServicePorts"
        />

        <div class="spacer-bordered"></div>

        <section v-if="!checkTypeIs('ExternalName')">
          <div class="row">
            <div class="clearfix">
              <h2 class="inline-block">
                <t k="servicesPage.selectors.label" />
                <i
                  v-tooltip="t('servicesPage.selectors.helpText')"
                  class="icon icon-info"
                  style="font-size: 12px"
                />
              </h2>
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

          <div class="spacer-bordered"></div>
        </section>

        <div class="row labels-row">
          <Labels
            :spec="value.spec"
            :mode="mode"
            :display-side-by-side="false"
          />
        </div>
      </template>

      <template slot="advanced-config-serivce">
        <section>
          <div class="row">
            <div class="col span-12">
              <h4 class="inline-block">
                <t k="servicesPage.ips.label" />
                <i
                  v-if="checkTypeIs('ClusterIP') || checkTypeIs('LoadBalancer') || checkTypeIs('NodePort')"
                  v-tooltip="t('servicesPage.ips.clusterIpHelpText')"
                  class="icon icon-info"
                  style="font-size: 12px"
                />
              </h4>
              <Banner
                v-if="checkTypeIs('ClusterIP') || checkTypeIs('LoadBalancer') || checkTypeIs('NodePort')"
                color="warning"
                :label="t('servicesPage.ips.helpText')"
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
        </section>

        <section v-if="!checkTypeIs('NodePort') && !checkTypeIs('ExternalName') && !checkTypeIs('Headless')">
          <div class="spacer-bordered"></div>
          <div class="col span-12">
            <h4 class="inline-block">
              <t k="servicesPage.affinity.label" />
              <i
                v-tooltip="t('servicesPage.affinity.helpText')"
                class="icon icon-info"
                style="font-size: 12px"
              />
            </h4>
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
        </section>
      </template>
    </Wizard>
  </form>
</template>

<style lang="scss">
  .select-service-row {
    flex-wrap: wrap;
    .active {
      background: var(--primary-active-bg);
    }
  }
  .labels-row {
    .row:first-child {
      margin-bottom: 40px;
    }
  }
  .round-image {
    .banner-text-service {
      color: white;
      font-size: 2.5em;
      height: 100%;
      width: 100%;
      background-color: var(--primary);
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  .choice-banner {
    min-height: 90px; // ssr jumpy
    .round-image {
      background-color: var(--primary);
    }
  }
</style>
