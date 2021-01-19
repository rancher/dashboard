<script>
import { mapGetters } from 'vuex';
import sortBy from 'lodash/sortBy';
import { clone } from '@/utils/object';
import { MANAGEMENT } from '@/config/types';
import Banner from '@/components/Banner';
import DetailText from '@/components/DetailText';
import Footer from '@/components/form/Footer';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';
import Select from '@/components/form/Select';
import CreateEditView from '@/mixins/create-edit-view';

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
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    scopes() {
      const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
      let out = all.map(opt => ({ value: opt.id, label: opt.metadata.name }));

      out = sortBy(out, ['label']);
      out.unshift( { value: '', label: this.t('account.apiKeys.add.noScope') } );

      return out;
    },
    expiryOptions() {
      const options = ['never', 'day', 'month', 'year', 'custom'];

      return options.map(opt => ({ value: opt, label: this.t(`account.apiKeys.add.expiryOptions.${ opt }`) }));
    },
    expiryUnitsOptions() {
      const options = ['minute', 'hour', 'day', 'year'];

      return options.map(opt => ({ value: opt, label: this.t(`account.apiKeys.add.customExpiryOptions.${ opt }`) }));
    },
  },

  methods: {
    async actuallySave(url) {
      this.updateExpiry();
      if ( this.isCreate ) {
        // Description is a bit weird, so need to clone and set this
        // rather than use this.value - need to find a way to set this if we ever
        // want to allow edit (which I don't think we do)
        const data = clone(this.value);

        data.description = this.value._description;
        const res = await this.$store.dispatch('rancher/request', {
          url:     '/v3/tokens',
          method:  'post',
          data,
          headers: { 'Content-Type': 'application/json' },
        });

        this.created = res;
        this.ttlLimited = res.ttl != this.value.ttl;
        const token = this.created.token.split(':');

        this.accessKey = token[0];
        this.secretKey = (token.length > 1) ? token[1] : '';
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
      this.$router.push({ path: '/account' });
    },

    updateExpiry() {
      const v = this.form.expiryType;
      const increment = (v === 'custom') ? parseInt(this.form.customExpiry) : 1;
      const units = (v === 'custom') ? this.form.customExpiryUnits : v;
      const now = new Date();
      let expiry = new Date(now);

      switch (units) {
      case 'never':
        expiry = null;
        break;
      case 'minute':
        expiry.setTime(expiry.getTime() + increment * 60 * 1000);
        break;
      case 'hour':
        expiry.setTime(expiry.getTime() + increment * 60 * 60 * 1000);
        break;
      case 'day':
        expiry.setDate(expiry.getDate() + increment);
        break;
      case 'month':
        expiry.setMonth(expiry.getMonth() + increment);
        break;
      case 'year':
        expiry.setFullYear(expiry.getFullYear() + increment);
        break;
      }

      const ttl = expiry ? Math.abs(expiry - now) : 0;

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
        v-model="value._description"
        :placeholder="t('account.apiKeys.add.descriptionPlaceholder')"
        :label="t('account.apiKeys.add.description')"
        :mode="'edit'"
        :min-height="30"
      />

      <LabeledSelect v-model="value.clusterId" class="mt-20 scope-select" :label="t('account.apiKeys.add.scope')" :options="scopes" />

      <h5 class="pt-20">
        {{ t('account.apiKeys.add.expiryLabel') }}
      </h5>

      <div class="ml-10">
        <RadioGroup v-model="form.expiryType" :options="expiryOptions" class="mr-20" name="expiryGroup" />
        <div class="ml-20 mt-10 expiry">
          <input v-model="form.customExpiry" :disabled="form.expiryType !== 'custom'" type="number" :mode="mode">
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
    ></Footer>
  </div>
  <div v-else>
    <div>{{ t('account.apiKeys.info.keyCreated') }}</div>

    <DetailText :value="accessKey" label-key="account.apiKeys.info.accessKey" class="mt-20" />
    <DetailText :value="secretKey" label-key="account.apiKeys.info.secretKey" class="mt-20" />

    <p class="mt-20">
      {{ t('account.apiKeys.info.bearerTokenTip') }}
    </p>

    <DetailText :value="created.token" label-key="account.apiKeys.info.bearerToken" class="mt-20" />

    <Banner color="warning" class="mt-20">
      <div>
        {{ t('account.apiKeys.info.saveWarning') }}
      </div>
    </Banner>

    <Banner color="warning" class="mt-20" v-if="ttlLimited">
      <div>
        {{ t('account.apiKeys.info.ttlLimitedWarning') }}
      </div>
    </Banner>    

    <div class="buttons mt-20">
      <div class="right">
        <button type="button" class="btn role-primary" @click="doneCreate">
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
