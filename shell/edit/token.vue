<script>
import { mapGetters } from 'vuex';
import day from 'dayjs';
import sortBy from 'lodash/sortBy';
import { MANAGEMENT, EXT } from '@shell/config/types';
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
import { SETTING } from '@shell/config/settings';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

export default {
  components: {
    Banner,
    DetailText,
    Footer,
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    Select,
    Checkbox,
  },

  mixins: [CreateEditView],

  data() {
    // Get the setting that defines the max token TTL allowed (in minutes)
    const maxTTLSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.AUTH_TOKEN_MAX_TTL_MINUTES);
    let maxTTL = 0;

    try {
      maxTTL = parseInt(maxTTLSetting.value || maxTTLSetting.default, 10);
    } catch (e) {
      maxTTL = 0;
    }

    return {
      errors: null,
      user:   null,
      form:   {
        enabled:           true,
        description:       '',
        clusterName:       '',
        expiryType:        'never',
        customExpiry:      0,
        customExpiryUnits: 'minute',
      },
      created:    null,
      ttlLimited: false,
      accessKey:  '',
      secretKey:  '',
      maxTTL,
      ttl:        ''
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    scopes() {
      const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
      const kubeClusters = filterHiddenLocalCluster(filterOnlyKubernetesClusters(all, this.$store), this.$store);
      let out = kubeClusters.map((opt) => ({ value: opt.id, label: opt.nameDisplay }));

      out = sortBy(out, ['label']);
      out.unshift( { value: '', label: this.t('accountAndKeys.apiKeys.add.noScope') } );

      return out;
    },

    expiryOptions() {
      const options = ['never', 'day', 'month', 'year', 'custom'];
      let opts = options.map((opt) => ({ value: opt, label: this.t(`accountAndKeys.apiKeys.add.expiry.options.${ opt }`) }));

      // When the TTL is greater than 0, present only two options
      // (1) The maximum allowed
      // (2) Custom
      if (this.maxTTL > 0 ) {
        const now = day();
        const expiry = now.add(this.maxTTL, 'minute');
        const max = diffFrom(expiry, now, this.t);

        opts = opts.filter((opt) => opt.value === 'custom');
        opts.unshift({ value: 'max', label: this.t('accountAndKeys.apiKeys.add.expiry.options.maximum', { value: max.string }) });
      } else {
        // maxTTL <= 0 means there is no maximum, so we can show the 'never' option which results in an infinite TTL
        // OR if we set a positive TTL, then it assumes that value
        opts = opts.filter((opt) => opt.value === 'never' || opt.value === 'custom');
      }

      return opts;
    },
    expiryUnitsOptions() {
      const options = ['minute', 'hour', 'day', 'month', 'year'];
      const filtered = this.filterOptionsForTTL(options);

      return filtered.map((opt) => ({ value: opt, label: this.t(`accountAndKeys.apiKeys.add.customExpiry.options.${ opt }`) }));
    },
    hasNeverOption() {
      return this.expiryOptions?.filter((opt) => opt.value === 'never')?.length === 1;
    }
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

    async actuallySave() {
      // update expiration value before save
      this.updateExpiry();

      if ( this.isCreate ) {
        const steveToken = await this.$store.dispatch('management/create', {
          type: EXT.TOKEN,
          spec: {
            description:   this.form.description,
            kind:          '',
            userPrincipal: null, // will be set by the backend to the current user
            clusterName:   this.form.clusterName,
            enabled:       this.form.enabled,
            ttl:           this.ttl
            // userID: not needed as it will be set by the backend to the current user
          }
        });

        const steveTokenSaved = await steveToken.save();

        this.created = steveTokenSaved;
        this.ttlLimited = this.created?.spec?.ttl !== this.ttl;
        const token = this.created?.status?.bearerToken?.split(':');

        this.accessKey = token[0];
        this.secretKey = (token.length > 1) ? token[1] : '';
        this.token = this.created?.status?.bearerToken;
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

      if (v === 'never') {
        ttl = -1;
      } else if (units === 'max') {
        ttl = this.maxTTL * 60 * 1000;
      } else if ( units !== 'never' ) {
        const now = day();
        const expiry = day().add(increment, units);

        ttl = expiry.diff(now);
      }

      this.ttl = ttl;
    }
  }
};
</script>

<template>
  <div v-if="!created">
    <div class="pl-10 pr-10">
      <LabeledInput
        key="description"
        v-model:value="form.description"
        :placeholder="t('accountAndKeys.apiKeys.add.description.placeholder')"
        label-key="accountAndKeys.apiKeys.add.description.label"
        mode="edit"
        :min-height="30"
      />

      <LabeledSelect
        v-model:value="form.clusterName"
        class="mt-20 scope-select"
        label-key="accountAndKeys.apiKeys.add.scope"
        :options="scopes"
      />

      <Checkbox
        v-model:value="form.enabled"
        class="mt-20 mb-20"
        :mode="mode"
        label-key="accountAndKeys.apiKeys.add.enabled"
      />

      <Banner
        v-if="hasNeverOption"
        color="warning"
        class="mt-20"
      >
        <div>
          {{ t('accountAndKeys.apiKeys.info.expiryOptionsWithNever') }}
        </div>
      </Banner>

      <h5 class="mb-20">
        {{ t('accountAndKeys.apiKeys.add.expiry.label') }}
      </h5>

      <div class="ml-10">
        <RadioGroup
          v-model:value="form.expiryType"
          :options="expiryOptions"
          data-testid="expiry__options"
          class="mr-20"
          name="expiryGroup"
        />
        <div
          class="ml-20 mt-10 expiry"
        >
          <input
            v-model="form.customExpiry"
            :disabled="form.expiryType !== 'custom'"
            type="number"
            :mode="mode"
            :aria-label="t('accountAndKeys.apiKeys.add.ariaLabel.expiration')"
          >
          <Select
            v-model:value="form.customExpiryUnits"
            :disabled="form.expiryType !== 'custom'"
            :options="expiryUnitsOptions"
            :clearable="false"
            :reduce="opt=>opt.value"
            :aria-label="t('accountAndKeys.apiKeys.add.ariaLabel.expirationUnits')"
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
          data-testid="token_done_create_button"
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
