import { NORMAN, MANAGEMENT } from '@/config/types';
import { addObject, findBy } from '@/utils/array';

export default {
  async fetch() {
    const NAME = this.$route.params.id;
    const originalModel = await this.$store.dispatch('rancher/find', {
      type: NORMAN.AUTH_CONFIG,
      id:   NAME,
      opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ NAME }`, force: true }
    });

    const serverUrl = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'server-url',
      opt:  { url: `/v1/{ MANAGEMENT.SETTING }/server-url` }
    });

    if ( serverUrl ) {
      this.serverSetting = serverUrl.value;
    }

    this.model = await this.$store.dispatch(`rancher/clone`, { resource: originalModel });
    if (NAME === 'shibboleth' && !this.model.openLdapConfig) {
      this.model.openLdapConfig = {};
      this.showLdap = false;
    }
  },

  computed: {
    me() {
      const out = findBy(this.principals, 'me', true);

      return out;
    },

    serverUrl() {
      if ( this.serverSetting ) {
        return this.serverSetting;
      } else if ( process.client ) {
        return window.location.origin;
      }

      return '';
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    displayName() {
      return this.t(`model.authConfig.provider.${ this.NAME }`);
    },

    NAME() {
      return this.$route.params.id;
    },

    AUTH_CONFIG() {
      return MANAGEMENT.AUTH_CONFIG;
    }
  },

  methods: {
    async save(btnCb) {
      this.errors = [];
      const wasEnabled = this.model.enabled;
      let obj = this.toSave;

      if (!obj) {
        obj = this.model;
      }

      try {
        if ( !wasEnabled ) {
          this.model.enabled = true;

          if (this.model.id === 'googleoauth' || this.model.id === 'github') {
            const code = await this.$store.dispatch('auth/test', { provider: this.model.id, body: this.model });

            this.model.enabled = true;
            obj.code = code;
          }

          await this.model.doAction('testAndApply', obj);

          // Reload principals to get the new ones from the provider
          this.principals = await this.$store.dispatch('rancher/findAll', {
            type: NORMAN.PRINCIPAL,
            opt:  { url: '/v3/principals', force: true }
          });

          this.model.allowedPrincipalIds = this.model.allowedPrincipalIds || [];
          if ( this.me && !this.model.allowedPrincipalIds.includes(this.me.id) ) {
            addObject(this.model.allowedPrincipalIds, this.me.id);
          }
        }

        if (this.model.configType === 'oauth') {
          await this.model.save();
          await this.reloadModel();
        }

        btnCb(true);
        if ( wasEnabled ) {
          this.done();
        }
        this.$router.applyQuery( { mode: 'view' } );
      } catch (err) {
        this.errors = [err];
        btnCb(false);
        this.model.enabled = wasEnabled;
      }
    },
  },
};
