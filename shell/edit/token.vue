<script>
import { mapGetters } from 'vuex';
import day from 'dayjs';
import sortBy from 'lodash/sortBy';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { Banner } from '@components/Banner';
import DetailText from '@shell/components/DetailText';
import Footer from '@shell/components/form/Footer';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RadioGroup } from '@components/Form/Radio';
import Select from '@shell/components/form/Select';
import CreateEditView from '@shell/mixins/create-edit-view';
import { diffFrom } from '@shell/utils/time';
import { filterHiddenLocalCluster, filterOnlyKubernetesClusters } from '@shell/utils/cluster';

export default {
  components: {
    Banner,
    DetailText,
    Footer,
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    Select,
  },

  mixins: [CreateEditView],

  data() {
    // Get the setting that defines the max token TTL allowed (in minutes)
    const maxTTLSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, 'auth-token-max-ttl-minutes');
    let maxTTL = 0;

    try {
      maxTTL = parseInt(maxTTLSetting.value || maxTTLSetting.default, 10);
    } catch (e) {
      maxTTL = 0;
    }

    return {
      errors: null,
      form:   {
        expiryType:        'never',
        customExpiry:      0,
        customExpiryUnits: 'minute',
      },
      created:    null,
      ttlLimited: false,
      accessKey:  '',
      secretKey:  '',
      maxTTL,
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    scopes() {
      const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
      const kubeClusters = filterHiddenLocalCluster(filterOnlyKubernetesClusters(all), this.$store);
      let out = kubeClusters.map(opt => ({ value: opt.id, label: opt.nameDisplay }));

      out = sortBy(out, ['label']);
      out.unshift( { value: '', label: this.t('accountAndKeys.apiKeys.add.noScope') } );

      return out;
    },

    expiryOptions() {
      const options = ['never', 'day', 'month', 'year', 'custom'];
      let opts = options.map(opt => ({ value: opt, label: this.t(`accountAndKeys.apiKeys.add.expiry.options.${ opt }`) }));

      // When the TTL is anything other than 0, present only two options
      // (1) The maximum allowed
      // (2) Custom
      if (this.maxTTL !== 0 ) {
        const now = day();
        const expiry = now.add(this.maxTTL, 'minute');
        const max = diffFrom(expiry, now, this.t);

        opts = opts.filter(opt => opt.value === 'custom');
        opts.unshift({ value: 'max', label: this.t('accountAndKeys.apiKeys.add.expiry.options.maximum', { value: max.string }) });
      }

      return opts;
    },
    expiryUnitsOptions() {
      const options = ['minute', 'hour', 'day', 'month', 'year'];
      const filtered = this.filterOptionsForTTL(options);

      return filtered.map(opt => ({ value: opt, label: this.t(`accountAndKeys.apiKeys.add.customExpiry.options.${ opt }`) }));
    },
  },

  mounted() {
    // Auto-select the first option on load
    this.form.expiryType = this.expiryOptions[0].value;
  },

  methods: {
    filterOptionsForTTL(opts) {
      return opts.filter((option) => {
        if (option === 'never' ) {
          return this.maxTTL === 0;
        } else if (option === 'custom') {
          return true;
        } else {
          const now = day();
          const expiry = day().add(1, option);
          const ttl = expiry.diff(now) / 60000; // Convert to minutes

          return this.maxTTL === 0 || ttl <= this.maxTTL;
        }
      });
    },

    async actuallySave(url) {
      this.updateExpiry();
      if ( this.isCreate ) {
        // Description is a bit weird, so need to clone and set this
        // rather than use this.value - need to find a way to set this if we ever
        // want to allow edit (which I don't think we do)
        const res = await this.value.save();

        this.created = res;
        this.ttlLimited = res.ttl !== this.value.ttl;
        const token = this.created.token.split(':');

        this.accessKey = token[0];
        this.secretKey = (token.length > 1) ? token[1] : '';
        this.token = this.created.token;

        // Force a refresh of the token so we get the expiry date correctly
        await this.$store.dispatch('rancher/find', {
          type: NORMAN.TOKEN,
          id:   res.id,
          opt:  { force: true }
        }, { root: true });
      } else {
        // Note: update of existing key not supported currently
        await this.value.save();
      }
    },

    done() {
      if (!this.created) {
        this.doneCreate();
      }
    },

    doneCreate() {
      this.$router.push({ name: 'account' });
    },

    updateExpiry() {
      const v = this.form.expiryType;
      const increment = (v === 'custom') ? parseInt(this.form.customExpiry) : 1;
      const units = (v === 'custom') ? this.form.customExpiryUnits : v;
      let ttl = 0;

      if (units === 'max') {
        ttl = this.maxTTL * 60 * 1000;
      } else if ( units !== 'never' ) {
        const now = day();
        const expiry = day().add(increment, units);

        ttl = expiry.diff(now);
      }
      this.value.ttl = ttl;
    }
  }
};
</script>

<template>
  <div v-if="!created">
    <div class="pl-10 pr-10">
      <LabeledInput
        key="description"
        v-model="value.description"
        :placeholder="t('accountAndKeys.apiKeys.add.description.placeholder')"
        label-key="accountAndKeys.apiKeys.add.description.label"
        mode="edit"
        :min-height="30"
      />

      <LabeledSelect
        v-model="value.clusterId"
        class="mt-20 scope-select"
        label-key="accountAndKeys.apiKeys.add.scope"
        :options="scopes"
      />

      <h5 class="pt-20">
        {{ t('accountAndKeys.apiKeys.add.expiry.label') }}
      </h5>

      <div class="ml-10">
        <RadioGroup
          v-model="form.expiryType"
          :options="expiryOptions"
          class="mr-20"
          name="expiryGroup"
        />
        <div class="ml-20 mt-10 expiry">
          <input
            v-model="form.customExpiry"
            :disabled="form.expiryType !== 'custom'"
            type="number"
            :mode="mode"
          >
          <Select
            v-model="form.customExpiryUnits"
            :disabled="form.expiryType !== 'custom'"
            :options="expiryUnitsOptions"
            :clearable="false"
            :reduce="opt=>opt.value"
          />
        </div>
      </div>
    </div>
    <Footer
      :errors="errors"
      :mode="mode"
      @save="save"
      @done="done"
    />
  </div>
  <div v-else>
    <div>{{ t('accountAndKeys.apiKeys.info.keyCreated') }}</div>

    <DetailText
      :value="accessKey"
      label-key="accountAndKeys.apiKeys.info.accessKey"
      class="mt-20"
    />
    <DetailText
      :value="secretKey"
      label-key="accountAndKeys.apiKeys.info.secretKey"
      class="mt-20"
    />

    <p class="mt-20">
      {{ t('accountAndKeys.apiKeys.info.bearerTokenTip') }}
    </p>

    <DetailText
      :value="token"
      label-key="accountAndKeys.apiKeys.info.bearerToken"
      class="mt-20"
    />

    <Banner
      color="warning"
      class="mt-20"
    >
      <div>
        {{ t('accountAndKeys.apiKeys.info.saveWarning') }}
      </div>
    </Banner>

    <Banner
      v-if="ttlLimited"
      color="warning"
      class="mt-20"
    >
      <div>
        {{ t('accountAndKeys.apiKeys.info.ttlLimitedWarning') }}
      </div>
    </Banner>

    <div class="buttons mt-20">
      <div class="right">
        <button
          type="button"
          class="btn role-primary"
          @click="doneCreate"
        >
          <t k="generic.done" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .scope-select {
    min-width: 33%;
    width: unset;
  }
  .expiry {
    display: flex;
    > * {
      flex: 0 0 200px;
      margin-right: 10px;
    }
  }

  .buttons {
    display: grid;
    grid-template-areas:  "left right";
    grid-template-columns: "min-content auto";

    .right {
      grid-area: right;
      text-align: right;

      .btn, button {
        margin: 0 0 0 $column-gutter;
      }
    }
  }
</style>
