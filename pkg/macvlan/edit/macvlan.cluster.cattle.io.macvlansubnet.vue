<script>
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { MANAGEMENT } from '@shell/config/types';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { mapGetters } from 'vuex';
import { RadioGroup } from '@components/Form/Radio';
import { validateKubernetesName } from '@shell/utils/validators/kubernetes-name';
import FormValidation from '@shell/mixins/form-validation';
import { isArray } from 'lodash';
import CIDRMatcher from 'cidr-matcher';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import MacvlanIpRange from '../components/form/MacvlanIpRange';
import MacvlanIpRoute from '../components/form/MacvlanIpRoute';

export default {
  name:       'MacvlanResourceCreate',
  mixins:     [CreateEditView, FormValidation],
  components: {
    LabeledInput,
    Tabbed,
    Tab,
    LabeledSelect,
    MacvlanIpRange,
    MacvlanIpRoute,
    RadioGroup,
    CruResource,
  },
  data() {
    let config = JSON.parse(JSON.stringify(this.$store.getters['macvlan/emptyForm']));

    if (this.value.spec) {
      config = this.value;
    }

    if (config.spec.podDefaultGateway.enable === undefined) {
      config.spec.podDefaultGateway = {
        enable:      false,
        serviceCidr: ''
      };
    }

    if (!config.spec.ranges) {
      config.spec.ranges = [];
    }
    if (!config.spec.routes) {
      config.spec.routes = [];
    }

    return {
      config,
      errors:        [],
      cloneFormName: '',
      modeOptions:   [{
        label: 'bridge',
        value: 'bridge',
      }],
      vlan:           config.spec.vlan || '',
      fvFormRuleSets: [
        {
          path: 'metadata.name', rules: ['required', 'nameChar'], translationKey: 'generic.name', rootObject: config
        },
        {
          path: 'spec.master', rules: ['required', 'masterChar'], translationKey: 'macvlan.master.label', rootObject: config
        },
        {
          path: 'spec.vlan', rules: ['vlanValidate'], rootObject: config
        },
        {
          path: 'spec.cidr', rules: ['required', 'cidrValidate'], translationKey: 'macvlan.cidr.label', rootObject: config
        },
        {
          path: 'spec.gateway', rules: ['gatewayVlidate'], rootObject: config
        },
        {
          path: 'spec.ipDelayReuse', rules: ['ipDelayReuseVlidate'], rootObject: config
        },
        {
          path: 'spec.ranges', rules: ['ipRangeVlidate'], rootObject: config
        },
        {
          path: 'spec.routes', rules: ['routeVlidate'], rootObject: config
        },
        {
          path: 'spec.podDefaultGateway.serviceCidr', rules: ['defaultGatewayVlidate'], rootObject: config
        },
      ],
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    doneRoute() {
      return `c-cluster-product-resource`;
    },
    tabErrors() {
      return {
        general:  this.fvGetPathErrors(['spec.master', 'spec.vlan', 'spec.cidr', 'spec.gateway'])?.length > 0,
        advanced: this.fvGetPathErrors(['spec.routes', 'spec.ranges', 'spec.podDefaultGateway.serviceCidr'])?.length > 0
      };
    },
    projectOptions() {
      const out = [{
        label: 'All Projects',
        value: ''
      }];

      this.$store.getters['management/all'](
        MANAGEMENT.PROJECT
      ).forEach((obj) => {
        out.push({
          label: obj.nameDisplay,
          value: obj.id.replace(/[/]/g, '-'),
        });
      });

      return out;
    },
    mastheadData() {
      const {
        creationTimestamp, parentNameOverride, parentLocationOverride, detailPageHeaderActionOverride
      } = this;

      return {
        ...this.config,
        creationTimestamp,
        parentNameOverride,
        parentLocationOverride,
        detailPageHeaderActionOverride
      };
    },
    creationTimestamp() {
      return this.config?.metadata?.creationTimestamp;
    },
    fvExtraRules() {
      const ipv4RegExp = /^(((\d{1,2})|(1\d{2})|(2[0-4]\d)|(25[0-5]))\.){3}((\d{1,2})|(1\d{2})|(2[0-4]\d)|(25[0-5]))$/;
      const cidrIPV4RegExp = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/\d{1,2}$/;

      const nameChar = (value) => {
        const errors = [];

        validateKubernetesName(value, this.t('macvlan.name.label'), this.$store.getters, { minLength: 0 }, errors);

        if (errors.length) {
          return errors[0];
        }
      };
      const masterChar = (value) => {
        const errors = [];

        validateKubernetesName(value, this.t('macvlan.master.label'), this.$store.getters, { minLength: 0 }, errors);

        if (errors.length) {
          return errors[0];
        }
      };
      const vlanValidate = (value) => {
        if (value !== '' && value !== 0 && (!/^\d+$/.test(value) || value < 2 || value > 4095)) {
          return this.t('macvlan.vlan.vlanRangeError');
        }
      };
      const cidrValidate = (value) => {
        if (value !== '' && !cidrIPV4RegExp.test(value)) {
          return this.t('macvlan.cidr.cidrFormatError');
        }
      };

      const gatewayVlidate = (value) => {
        if (value && !ipv4RegExp.test(value)) {
          return this.t('macvlan.gateway.gatewayFormatError');
        }
      };
      const ipDelayReuseVlidate = (value) => {
        if (value < 1 || value > 3600 || (value > 1 && value % 1 !== 0)) {
          return this.t('macvlan.ipReuse.placeholder');
        }
      };
      const defaultGatewayVlidate = (value) => {
        if (this.config.spec.podDefaultGateway.enable) {
          if (!value) {
            return this.t('macvlan.defaultGateway.serviceCidr.serviceCidrReq');
          }

          if (!cidrIPV4RegExp.test(value)) {
            return this.t('macvlan.defaultGateway.serviceCidr.serviceCidrFormatError');
          }
        }
      };
      const ipRangeVlidate = (value) => {
        if (!isArray(value)) {
          value = [value];
        }

        const IPFormatError = value.find(r => !ipv4RegExp.test(r.rangeEnd) || !ipv4RegExp.test(r.rangeStart));

        if (IPFormatError) {
          return this.t('macvlan.ipRange.IPFormatError', { info: `，${ IPFormatError.rangeStart || 0 } - ${ IPFormatError.rangeEnd || 0 }` });
        }

        const IPInCidrError = value.find(r => !this.ip4CIDRContains(this.config.spec?.cidr, r.rangeEnd) || !this.ip4CIDRContains(this.config.spec?.cidr, r.rangeStart));

        if (IPInCidrError) {
          return this.t('macvlan.ipRange.IPInCidrError', { info: `${ IPInCidrError.rangeStart } - ${ IPInCidrError.rangeEnd }` });
        }

        const IPRangeError = value.find(r => this.comapreIP4(r.rangeStart, r.rangeEnd) > 0);

        if (IPRangeError) {
          return this.t('macvlan.ipRange.IPRangeError', {
            min: IPRangeError.rangeStart,
            max: IPRangeError.rangeEnd
          });
        }

        if (this.hasIpConflict()) {
          return this.t('macvlan.ipRange.IPRangeExistWithOthers');
        }
      };
      const routeVlidate = (value) => {
        if (!isArray(value)) {
          value = [value];
        }
        if (value.some(r => !r.dst)) {
          return this.t('macvlan.route.routeDstReq');
        }
        if (value.some(r => !!r.dst && !cidrIPV4RegExp.test(r.dst))) {
          return this.t('macvlan.route.routeDstFormatError');
        }
        if (value.some(r => !!r.gw && !ipv4RegExp.test(r.gw))) {
          return this.t('macvlan.route.routeGwFormatError');
        }
        if (value.some(r => ((r.iface && r.iface !== 'eth0') || !r.iface) && !!r.gw && ipv4RegExp.test(r.gw) && !this.ip4CIDRContains(this.config.spec?.cidr, r.gw))) {
          return this.t('macvlan.route.routeGwInCidrError');
        }
      };

      return {
        nameChar, masterChar, vlanValidate, cidrValidate, gatewayVlidate, ipDelayReuseVlidate, defaultGatewayVlidate, routeVlidate, ipRangeVlidate
      };
    },

    ipRangesExistedMsg() {
      const existedMasterMacvlan = this.existedMasterMacvlan;
      const name = this.config.metadata.name;

      return existedMasterMacvlan.filter(r => r.metadata.name !== name && r.spec.ranges && r.spec.ranges.length > 0).map(r => `${ r.spec.ranges.map(item => `${ item.rangeStart } - ${ item.rangeEnd }`).join(', ') }`).join(', ');
    },

    existedMasterMacvlan() {
      return this.$store.getters['macvlan/existedMasterMacvlan'] || [];
    },

    ipDelayReuse: {
      get() {
        return this.config.spec.ipDelayReuse / 60;
      },
      set(neu) {
        this.$set(this.config.spec, 'ipDelayReuse', neu * 60);
      }
    }
  },

  methods: {
    async save(btnCb) {
      const errors = [];

      await this.loadExistedMasterMacvlan();

      const {
        ranges, master, vlan, cidr
      } = this.config.spec;

      if ((!ranges || ranges.length === 0) && this.hasDuplicateCidr(cidr)) {
        errors.push(this.t('macvlan.ipRange.formInfoExist', {
          master,
          vlan,
          cidr
        }));
      }

      if (errors.length) {
        this.$set(this, 'errors', errors);
        btnCb(false);

        return;
      }

      this.$store.dispatch(`macvlan/${ this.isEdit ? 'update' : 'create' }Macvlan`, {
        cluster: this.currentCluster.id,
        params:  this.config
      }).then((res) => {
        btnCb(true);
        this.cancel();
      }).catch((err) => {
        errors.push(err.message);
        this.$set(this, 'errors', errors);
        btnCb(false);
      });
    },

    cancel() {
      const { resource } = this.$route.params;

      this.$router.push({
        name:   'c-cluster-product-resource',
        params: { resource }
      });
    },
    ip4CIDRContains(cidr, ip) {
      let result = false;

      try {
        const matcher = new CIDRMatcher([cidr]);

        result = matcher.contains(ip);
      } catch (err) {
        result = false;
      }

      return result;
    },
    comapreIP4(ipBegin, ipEnd) {
      const begin = ipBegin.split('.');
      const end = ipEnd.split('.');

      for (let i = 0;i < 4;i++) {
        if (parseInt(begin[i], 10) > parseInt(end[i], 10)) {
          return 1;
        } else if (parseInt(begin[i], 10) < parseInt(end[i], 10)) {
          return -1;
        }
      }

      return 0;
    },
    hasIpConflict() {
      const ipRanges = this.config.spec.ranges || [];
      const ipRangesExisted = this.existedMasterMacvlan;
      const name = this.config.metadata.name;
      const targetIpRanges = ipRangesExisted.filter(r => r.metadata.name !== name && r.spec.ranges).reduce((t, c) => {
        t.push(...c.spec.ranges);

        return t;
      }, []);

      return ipRanges.some(r => targetIpRanges.some(tr => this.comapreIP4(r.rangeStart, tr.rangeStart) >= 0 && this.comapreIP4(r.rangeStart, tr.rangeEnd) <= 0) ||
        targetIpRanges.some(tr => this.comapreIP4(r.rangeEnd, tr.rangeStart) >= 0 && this.comapreIP4(r.rangeEnd, tr.rangeEnd) <= 0) ||
        targetIpRanges.some(tr => this.comapreIP4(r.rangeStart, tr.rangeStart) < 0 && this.comapreIP4(r.rangeEnd, tr.rangeEnd) > 0));
    },
    hasDuplicateCidr(cidr) {
      const existedMasterMacvlan = this.existedMasterMacvlan;

      return existedMasterMacvlan.some(item => item.spec.cidr === cidr);
    },
    loadExistedMasterMacvlan() {
      const { master, vlan } = this.config.spec;

      if (!this.existedMasterMacvlan.length || master !== this.existedMasterMacvlan[0].spec.master || vlan !== this.existedMasterMacvlan[0].spec.vlan) {
        return this.$store.dispatch('macvlan/loadExistedMasterMacvlan', {
          cluster: this.currentCluster.id,
          query:   {
            labelSelector: {
              master: this.config.spec.master,
              vlan:   this.config.spec.vlan,
            },
            limit: '-1'
          }
        });
      }
    },
    onTabChanged({ selectedName }) {
      if (selectedName === 'advanced') {
        this.loadExistedMasterMacvlan();
      }
    }
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :validation-passed="fvFormIsValid"
    :resource="config"
    :mode="mode"
    :errors="errors"
    @finish="save"
    @error="e=>errors = e"
    @cancel="cancel"
  >
    <div>
      <div class="row mb-20">
        <div class="col span-3">
          <LabeledInput
            v-model="config.metadata.name"
            required
            label-key="generic.name"
            placeholder-key="nameNsDescription.name.placeholder"
            :mode="mode"
            :disabled="isEdit"
            :rules="fvGetAndReportPathRules('metadata.name')"
          />
        </div>
      </div>
      <Tabbed
        :side-tabs="true"
        default-tab="general"
        @changed="onTabChanged"
      >
        <Tab
          name="general"
          :label="t('macvlan.tabs.general')"
          :weight="99"
          :error="tabErrors.general"
        >
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="config.spec.master"
                required
                label-key="macvlan.master.label"
                placeholder-key="macvlan.master.placeholder"
                :mode="mode"
                :disabled="isEdit"
                :rules="fvGetAndReportPathRules('spec.master')"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model="vlan"
                label-key="macvlan.vlan.label"
                placeholder-key="macvlan.vlan.placeholder"
                :mode="mode"
                :disabled="isEdit"
                :rules="fvGetAndReportPathRules('spec.vlan')"
                @input="$set(config.spec, 'vlan', Number($event));"
              />
            </div>
          </div>

          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="config.spec.cidr"
                required
                label-key="macvlan.cidr.label"
                placeholder-key="macvlan.cidr.placeholder"
                :mode="mode"
                :disabled="isEdit"
                :rules="fvGetAndReportPathRules('spec.cidr')"
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                v-model="config.spec.mode"
                :mode="mode"
                required
                label-key="macvlan.mode.label"
                :options="modeOptions"
                option-label="label"
                :disabled="isEdit"
              />
            </div>
          </div>

          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="config.spec.gateway"
                label-key="macvlan.gateway.label"
                placeholder-key="macvlan.gateway.placeholder"
                :mode="mode"
                :rules="fvGetAndReportPathRules('spec.gateway')"
                :disabled="isEdit"
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                v-model="config.metadata.labels.project"
                :mode="mode"
                required
                label-key="macvlan.project.label"
                :options="projectOptions"
                option-label="label"
                :disabled="isEdit"
              />
            </div>
          </div>

          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="ipDelayReuse"
                label-key="macvlan.ipReuse.label"
                placeholder-key="macvlan.ipReuse.placeholder"
                :mode="mode"
                :disabled="isEdit"
                type="number"
                min="1"
                max="3600"
                :rules="fvGetAndReportPathRules('spec.ipDelayReuse')"
              />
            </div>
          </div>
        </Tab>
        <Tab
          name="advanced"
          :label="t('macvlan.tabs.advanced')"
          :weight="98"
          :error="tabErrors.advanced"
        >
          <MacvlanIpRange
            :value="config.spec.ranges"
            :mode="mode"
            :rules="fvGetAndReportPathRules('spec.ranges')"
            :ip-ranges-existed-msg="ipRangesExistedMsg"
          />
          <MacvlanIpRoute
            :value="config.spec.routes"
            :mode="mode"
            :rules="fvGetAndReportPathRules('spec.routes')"
          />

          <RadioGroup
            v-model="config.spec.podDefaultGateway.enable"
            :mode="mode"
            name="forceFormatted"
            label-key="macvlan.defaultGateway.label"
            :labels="[t('macvlan.defaultGateway.no'),t('macvlan.defaultGateway.yes')]"
            :options="[false, true]"
            :disabled="value.forceFormatted"
          />

          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="config.spec.podDefaultGateway.serviceCidr"
                label-key="macvlan.defaultGateway.serviceCidr.label"
                placeholder-key="macvlan.defaultGateway.serviceCidr.placeholder"
                :disabled="!config.spec.podDefaultGateway.enable"
                required
                :mode="mode"
                :rules="fvGetAndReportPathRules('spec.podDefaultGateway.serviceCidr')"
              />
            </div>
          </div>
        </Tab>
      </Tabbed>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
    $spacer: 10px;

    .controls-container {
      display: flex;
      justify-content: right;
      padding-top: $spacer;

      border-top: var(--header-border-size) solid var(--header-border);
    }
</style>
