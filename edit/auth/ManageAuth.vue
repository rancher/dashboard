<script>
import { NORMAN } from '@/config/types';
import { mapGetters } from 'vuex';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import AsyncButton from '@/components/AsyncButton';
import Banner from '@/components/Banner';
import { findBy } from '@/utils/array';
import { _EDIT } from '@/config/query-params';

export default {
  components: {
    RadioGroup,
    LabeledSelect,
    AsyncButton,
    Banner
  },

  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  data() {
    return {
      principals: [], authorizedUsers: [], error: null
    };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  created() {
    this.getPrincipals();
    if (!this.value.accessMode) {
      this.$set(this.value, 'accessMode', 'unrestricted');
    }
  },

  methods: {
    async getPrincipals() {
      this.principals = await this.$store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals' }
      });

      this.authorizedUsers = this.principals.filter((principal) => {
        return (this.value.allowedPrincipalIds || []).includes(principal.id);
      });

      if (!this.authorizedUsers.length) {
        const me = findBy(this.principals, 'me', true);

        this.authorizedUsers.push(me);
      }
    },

    addUser(user) {
      if (!this.authorizedUsers.includes(user)) {
        this.authorizedUsers.push(user);
      }
    },

    removeUser(user) {
      const idx = this.authorizedUsers.indexOf(user);

      this.authorizedUsers.splice(idx, 1);
    },

    async save(buttonCB) {
      try {
        this.value.allowedPrincipalIds = this.authorizedUsers.reduce((ids, user) => {
          ids.push(user.id);

          return ids;
        }, []);
        await this.value.save({ validate: false });

        buttonCB(true);
      } catch (e) {
        buttonCB(false);
        this.error = e;
      }
    },

    goToEdit() {
      this.$router.push({ path: this.$route.path, query: { mode: _EDIT } });
      this.$emit('edit');
    },

    async disable() {
      try {
        await this.value.doAction('disable');

        this.$emit('disabled');
      } catch (e) {
        this.error = e;
      }
    }
  },
};
</script>

<template>
  <div>
    <div class="provider btn-tab selected col span-3">
      <span class="category">
        {{ value.authCategory }}
      </span>
      <h4>
        {{ value.nameDisplay }}
      </h4>
      <div class="controls">
        <a @click="goToEdit">
          <span class="icon icon-edit icon-sm"></span>
          {{ t('auth.edit') }}
        </a>
        <a @click="disable">
          <span class="icon icon-x"></span>
          {{ t('auth.disable') }}
        </a>
      </div>
    </div>
    <h2>{{ t('auth.siteAccess.title') }}</h2>

    <div class="row">
      <RadioGroup
        v-model="value.accessMode"
        :labels="[t('auth.siteAccess.unrestricted'), t('auth.siteAccess.restricted'), t('auth.siteAccess.required')]"
        :options="['unrestricted', 'restricted', 'required']"
      />
    </div>

    <div class="spacer" />

    <h3>{{ t('auth.siteAccess.authorizedUsers') }}</h3>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect :label="t('auth.siteAccess.principals')" :options="principals" option-label="loginName" @input="addUser" />

        <ul class="authorized-users">
          <li v-for="user in authorizedUsers" :key="user.id">
            <img v-if="user && user.avatarSrc" :src="user.avatarSrc" width="40" height="40" />
            <i v-else class="icon icon-user icon-3x" />
            <span>  {{ user.loginName }}</span>
            <button :disabled="authorizedUsers.length==1" class="btn btn-sm role-link" @click="removeUser(user)">
              {{ t('generic.remove') }}
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div class="text-center">
      <AsyncButton type="button" class="btn role-primary" mode="apply" @click="save" />
    </div>

    <Banner v-if="error" color="error" :label="error" />
  </div>
</template>

<style lang='scss'>
.authorized-users{
    list-style-type:none;
    padding-left: 0px;

    & li {
        padding: 20px 0 20px 0;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;

        & IMG{
            border-radius: 50%;
            margin-right: 10px;
       }

       & SPAN {
           flex-grow: 1;
       }
    }
}
</style>
