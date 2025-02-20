<script>
import { _EDIT } from '@shell/config/query-params';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SSHKnownHosts from '@shell/components/form/SSHKnownHosts';
import { AUTH_TYPE, NORMAN, SECRET } from '@shell/config/types';
import { SECRET_TYPES } from '@shell/config/secret';
import { base64Encode } from '@shell/utils/crypto';
import { addObjects, insertAt } from '@shell/utils/array';
import { sortBy } from '@shell/utils/sort';
import {
  FilterArgs,
  PaginationFilterField,
  PaginationParamFilter,
} from '@shell/types/store/pagination.types';

export default {
  name: 'SelectOrCreateAuthSecret',

  emits: ['inputauthval', 'update:value'],

  components: {
    Banner,
    LabeledInput,
    LabeledSelect,
    SSHKnownHosts,
  },

  props: {
    mode: {
      type:    String,
      default: _EDIT,
    },

    preSelect: {
      type:    Object,
      default: null,
    },

    value: {
      type:    [String, Object],
      default: null,
    },

    inStore: {
      type:    String,
      default: 'cluster',
    },

    labelKey: {
      type:    String,
      default: 'selectOrCreateAuthSecret.label',
    },

    namespace: {
      type:     String,
      required: true,
    },

    /**
     * Limit the selection of an existing secret to the namespace provided
     */
    limitToNamespace: {
      type:    Boolean,
      default: true,
    },

    generateName: {
      type:    String,
      default: 'auth-',
    },

    allowNone: {
      type:    Boolean,
      default: true,
    },

    allowSsh: {
      type:    Boolean,
      default: true,
    },

    allowBasic: {
      type:    Boolean,
      default: true,
    },

    allowS3: {
      type:    Boolean,
      default: false,
    },

    allowRke: {
      type:    Boolean,
      default: false,
    },

    registerBeforeHook: {
      type:     Function,
      required: true,
    },

    hookName: {
      type:    String,
      default: 'registerAuthSecret'
    },

    appendUniqueIdToHook: {
      type:    Boolean,
      default: false
    },

    hookPriority: {
      type:    Number,
      default: 99,
    },

    vertical: {
      type:    Boolean,
      default: false,
    },

    /**
     * This component is used in MultiStep Process
     * So when user click through to final step and submit the form
     * This component get recreated therefore register `doCreate` as a hook each time
     * Also, the parent step component is not aware that credential is created
     *
     * This property is implement to prevent this issue and delegate it to parent component.
     */
    delegateCreateToParent: {
      type:    Boolean,
      default: false,
    },

    /**
     * Set to false to make a fresh http request to secrets every time. This can be used when secrets have already been used for
     * another purpose on the same page
     *
     * Set to true to cache the response
     */
    cacheSecrets: {
      type:    Boolean,
      default: false,
    },

    showSshKnownHosts: {
      type:    Boolean,
      default: false,
    },
  },

  async fetch() {
    if ( (this.allowSsh || this.allowBasic || this.allowRke) && this.$store.getters[`${ this.inStore }/schemaFor`](SECRET) ) {
      if (this.$store.getters[`${ this.inStore }/paginationEnabled`](SECRET)) {
        // Filter results via api (because we shouldn't be fetching them all...)
        this.filteredSecrets = await this.filterSecretsByApi();
      } else {
        // Cannot yet filter via api, so fetch all and filter later on
        this.allSecrets = await this.$store.dispatch(
          `${ this.inStore }/findAll`,
          { type: SECRET }
        );
      }
    }

    if ( this.allowS3 && this.$store.getters['rancher/canList'](NORMAN.CLOUD_CREDENTIAL) ) {
      // Avoid an async call and loading screen if already loaded by someone else
      if (this.$store.getters['rancher/haveAll'](NORMAN.CLOUD_CREDENTIAL)) {
        this.allCloudCreds = this.$store.getters['rancher/all'](NORMAN.CLOUD_CREDENTIAL);
      } else {
        this.allCloudCreds = await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });
      }
    } else {
      this.allCloudCreds = [];
    }

    if ( !this.value ) {
      this.publicKey = this.preSelect?.publicKey || '';
      this.privateKey = this.preSelect?.privateKey || '';
      this.sshKnownHosts = this.preSelect?.sshKnownHosts || '';
    }

    this.updateSelectedFromValue();
    this.update();
  },

  data() {
    return {
      allCloudCreds: [],

      allSecrets:      null,
      filteredSecrets: null,

      selected: null,

      filterByNamespace: this.namespace && this.limitToNamespace,

      publicKey:     '',
      privateKey:    '',
      sshKnownHosts: '',
      uniqueId:      new Date().getTime(), // Allows form state to be individually tracked if the form is in a list

      SSH:   AUTH_TYPE._SSH,
      BASIC: AUTH_TYPE._BASIC,
      S3:    AUTH_TYPE._S3,
      RKE:   AUTH_TYPE._RKE,
    };
  },

  computed: {
    secretTypes() {
      const types = [];

      if ( this.allowSsh ) {
        types.push(SECRET_TYPES.SSH);
      }

      if ( this.allowBasic ) {
        types.push(SECRET_TYPES.BASIC);
      }

      if ( this.allowRke ) {
        types.push(SECRET_TYPES.RKE_AUTH_CONFIG);
      }

      return types;
    },

    /**
     * Fitler secrets given their namespace and required secret type
     *
     * Convert secrets to list of options and suplement with custom entries
     */
    options() {
      let filteredSecrets = [];

      if (this.allSecrets) {
        // Fitler secrets given their namespace and required secret type
        filteredSecrets = this.allSecrets
          .filter((x) => this.filterByNamespace ? x.metadata.namespace === this.namespace : true
          )
          .filter((x) => {
            // Must match one of the required types
            if (
              this.secretTypes.length &&
              !this.secretTypes.includes(x._type)
            ) {
              return false;
            }

            return true;
          });
      } else if (this.filteredSecrets) {
        filteredSecrets = this.filteredSecrets;
      }

      let out = filteredSecrets.map((x) => {
        const {
          dataPreview, subTypeDisplay, metadata, id
        } = x;

        const label =
          subTypeDisplay && dataPreview ? `${ metadata.name } (${ subTypeDisplay }: ${ dataPreview })` : `${ metadata.name } (${ subTypeDisplay })`;

        return {
          label,
          group: metadata.namespace,
          value: id,
        };
      });

      if (this.allowS3) {
        const more = this.allCloudCreds
          .filter((x) => ['aws', 's3'].includes(x.provider))
          .map((x) => {
            return {
              label: `${ x.nameDisplay } (${ x.providerDisplay })`,
              group: 'Cloud Credentials',
              value: x.id,
            };
          });

        addObjects(out, more);
      }

      if ( !this.limitToNamespace ) {
        out = sortBy(out, 'group');
        if ( out.length ) {
          let lastGroup = '';

          for ( let i = 0 ; i < out.length ; i++ ) {
            if ( out[i].group !== lastGroup ) {
              lastGroup = out[i].group;

              insertAt(out, i, {
                kind:     'title',
                label:    this.t('selectOrCreateAuthSecret.namespaceGroup', { name: lastGroup }),
                disabled: true,
              });

              i++;
            }
          }
        }
      }

      if ( out.length ) {
        out.unshift({
          kind:     'title',
          label:    this.t('selectOrCreateAuthSecret.chooseExisting'),
          disabled: true
        });
      }
      if ( this.allowNone ) {
        out.unshift({
          label: this.t('generic.none'),
          value: AUTH_TYPE._NONE,
        });
      }

      if (this.allowSsh || this.allowS3 || this.allowBasic || this.allowRke) {
        out.unshift({
          label:    'divider',
          disabled: true,
          kind:     'divider'
        });
      }

      if ( this.allowSsh ) {
        out.unshift({
          label: this.t('selectOrCreateAuthSecret.createSsh'),
          value: AUTH_TYPE._SSH,
          kind:  'highlighted'
        });
      }

      if ( this.allowS3 ) {
        out.unshift({
          label: this.t('selectOrCreateAuthSecret.createS3'),
          value: AUTH_TYPE._S3,
          kind:  'highlighted'
        });
      }

      if ( this.allowBasic ) {
        out.unshift({
          label: this.t('selectOrCreateAuthSecret.createBasic'),
          value: AUTH_TYPE._BASIC,
          kind:  'highlighted'
        });
      }

      // Note here about order
      if ( this.allowRke ) {
        out.unshift({
          label: this.t('selectOrCreateAuthSecret.createRKE'),
          value: AUTH_TYPE._RKE,
          kind:  'highlighted'
        });
      }

      return out;
    },

    firstCol() {
      if ( this.vertical ) {
        return '';
      }

      if ( this.selected === AUTH_TYPE._SSH || this.selected === AUTH_TYPE._BASIC || this.selected === AUTH_TYPE._RKE || this.selected === AUTH_TYPE._S3 ) {
        return 'col span-4';
      }

      return 'col span-6';
    },

    moreCols() {
      if ( this.vertical ) {
        return 'mt-20';
      }

      return (this.selected === AUTH_TYPE._SSH) && this.showSshKnownHosts ? 'col span-3' : 'col span-4';
    }
  },

  watch: {
    selected:      'update',
    publicKey:     'updateKeyVal',
    privateKey:    'updateKeyVal',
    sshKnownHosts: 'updateKeyVal',
    value:         'updateSelectedFromValue',

    async namespace(ns) {
      if (ns && !this.selected.startsWith(`${ ns }/`)) {
        this.selected = AUTH_TYPE._NONE;
      }

      // if ns has changed and we're filtering by api... we need to re-fetch entries
      if (this.filteredSecrets && this.filterByNamespace) {
        this.filteredSecrets = await this.filterSecretsByApi();
      }
    },
  },

  created() {
    if (this.registerBeforeHook) {
      const hookName = this.appendUniqueIdToHook ? this.hookName + this.uniqueId : this.hookName;

      if (!this.delegateCreateToParent) {
        this.registerBeforeHook(this.doCreate, hookName, this.hookPriority);
      }
    } else {
      throw new Error('Before Hook is missing');
    }
  },

  methods: {
    updateSelectedFromValue() {
      let selected = this.preSelect?.selected || AUTH_TYPE._NONE;

      if ( this.value ) {
        if ( typeof this.value === 'object' ) {
          selected = `${ this.value.namespace }/${ this.value.name }`;
        } else if ( this.value.includes('/') || this.value.includes(':') ) {
          selected = this.value;
        } else if ( this.namespace ) {
          selected = `${ this.namespace }/${ this.value }`;
        } else {
          selected = this.value;
        }
      }

      this.selected = selected;
    },
    async filterSecretsByApi() {
      const findPageArgs = {
        // Of type ActionFindPageArgs
        namespaced: this.filterByNamespace ? this.namespace : '',
        pagination: new FilterArgs({
          filters: [
            PaginationParamFilter.createMultipleFields(
              this.secretTypes.map(
                (t) => new PaginationFilterField({
                  field: 'metadata.fields.1',
                  value: t,
                })
              )
            ),
          ],
        }),
      };

      if (this.cacheSecrets) {
        return await this.$store.dispatch(`${ this.inStore }/findPage`, {
          type: SECRET,
          opt:  findPageArgs,
        });
      }

      const url = this.$store.getters[`${ this.inStore }/urlFor`](
        SECRET,
        null,
        findPageArgs
      );
      const res = await this.$store.dispatch(`cluster/request`, { url });

      return res?.data || [];
    },

    updateKeyVal() {
      if ( ![AUTH_TYPE._SSH, AUTH_TYPE._BASIC, AUTH_TYPE._S3, AUTH_TYPE._RKE].includes(this.selected) ) {
        this.privateKey = '';
        this.publicKey = '';
        this.sshKnownHosts = '';
      }

      const value = {
        selected:   this.selected,
        privateKey: this.privateKey,
        publicKey:  this.publicKey,
      };

      if (this.sshKnownHosts) {
        value.sshKnownHosts = this.sshKnownHosts;
      }

      this.$emit('inputauthval', value);
    },

    update() {
      if ( (!this.selected || [AUTH_TYPE._SSH, AUTH_TYPE._BASIC, AUTH_TYPE._S3, AUTH_TYPE._RKE, AUTH_TYPE._NONE].includes(this.selected))) {
        this.$emit('update:value', null);
      } else if ( this.selected.includes(':') ) {
        // Cloud creds
        this.$emit('update:value', this.selected);
      } else {
        const split = this.selected.split('/');

        if ( this.limitToNamespace ) {
          this.$emit('update:value', split[1]);
        } else {
          const out = {
            namespace: split[0],
            name:      split[1]
          };

          this.$emit('update:value', out);
        }
      }

      this.updateKeyVal();
    },

    async doCreate() {
      if ( ![AUTH_TYPE._SSH, AUTH_TYPE._BASIC, AUTH_TYPE._S3, AUTH_TYPE._RKE].includes(this.selected) || this.delegateCreateToParent ) {
        return;
      }

      let secret;

      if ( this.selected === AUTH_TYPE._S3 ) {
        secret = await this.$store.dispatch(`rancher/create`, {
          type:               NORMAN.CLOUD_CREDENTIAL,
          s3credentialConfig: {
            accessKey: this.publicKey,
            secretKey: this.privateKey,
          },
        });
      } else {
        secret = await this.$store.dispatch(`${ this.inStore }/create`, {
          type:     SECRET,
          metadata: {
            namespace:    this.namespace,
            generateName: this.generateName
          },
        });

        let type, publicField, privateField;

        switch ( this.selected ) {
        case AUTH_TYPE._SSH:
          type = SECRET_TYPES.SSH;
          publicField = 'ssh-publickey';
          privateField = 'ssh-privatekey';
          break;
        case AUTH_TYPE._BASIC:
          type = SECRET_TYPES.BASIC;
          publicField = 'username';
          privateField = 'password';
          break;
        case AUTH_TYPE._RKE:
          type = SECRET_TYPES.RKE_AUTH_CONFIG;
          // Set the 'auth' key to be the base64 of the username and password concatenated with a ':' character
          secret.data = { auth: base64Encode(`${ this.publicKey }:${ this.privateKey }`) };
          break;
        default:
          throw new Error('Unknown type');
        }

        secret._type = type;

        // Set the data if not set by one of the specific cases above
        if (!secret.data) {
          secret.data = {
            [publicField]:  base64Encode(this.publicKey),
            [privateField]: base64Encode(this.privateKey),
          };

          // Add ssh known hosts data key - we will add a key with an empty value if the inout field was left blank
          // This ensures on edit of the secret, we allow the user to edit the known_hosts field
          if ((this.selected === AUTH_TYPE._SSH) && this.showSshKnownHosts) {
            secret.data.known_hosts = base64Encode(this.sshKnownHosts || '');
          }
        }
      }

      await secret.save();

      await this.$nextTick(() => {
        this.selected = secret.id;
      });

      return secret;
    },
  },
};
</script>

<template>
  <div
    class="select-or-create-auth-secret"
  >
    <div
      class="mt-20"
      :class="{'row': !vertical}"
    >
      <div :class="firstCol">
        <LabeledSelect
          v-model:value="selected"
          data-testid="auth-secret-select"
          :mode="mode"
          :label-key="labelKey"
          :loading="$fetchState.pending"
          :options="options"
          :selectable="option => !option.disabled"
        />
      </div>
      <template v-if="selected === SSH">
        <div :class="moreCols">
          <LabeledInput
            v-model:value="publicKey"
            data-testid="auth-secret-ssh-public-key"
            :mode="mode"
            type="multiline"
            label-key="selectOrCreateAuthSecret.ssh.publicKey"
          />
        </div>
        <div :class="moreCols">
          <LabeledInput
            v-model:value="privateKey"
            data-testid="auth-secret-ssh-private-key"
            :mode="mode"
            type="multiline"
            label-key="selectOrCreateAuthSecret.ssh.privateKey"
          />
        </div>
        <div
          v-if="showSshKnownHosts"
          class="col span-2"
        >
          <SSHKnownHosts
            v-model:value="sshKnownHosts"
            data-testid="auth-secret-known-ssh-hosts"
            :mode="mode"
          />
        </div>
      </template>
      <template v-else-if="selected === BASIC || selected === RKE">
        <Banner
          v-if="selected === RKE"
          color="info"
          :class="moreCols"
        >
          {{ t('selectOrCreateAuthSecret.rke.info', {}, true) }}
        </Banner>
        <div :class="moreCols">
          <LabeledInput
            v-model:value="publicKey"
            data-testid="auth-secret-basic-username"
            :mode="mode"
            label-key="selectOrCreateAuthSecret.basic.username"
          />
        </div>
        <div :class="moreCols">
          <LabeledInput
            v-model:value="privateKey"
            data-testid="auth-secret-basic-password"
            :mode="mode"
            type="password"
            label-key="selectOrCreateAuthSecret.basic.password"
          />
        </div>
      </template>
      <template v-else-if="selected === S3">
        <div :class="moreCols">
          <LabeledInput
            v-model:value="publicKey"
            data-testid="auth-secret-s3-public-key"
            :mode="mode"
            label-key="selectOrCreateAuthSecret.s3.accessKey"
          />
        </div>
        <div :class="moreCols">
          <LabeledInput
            v-model:value="privateKey"
            data-testid="auth-secret-s3-private-key"
            :mode="mode"
            type="password"
            label-key="selectOrCreateAuthSecret.s3.secretKey"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.select-or-create-auth-secret div.labeled-select {
  min-height: $input-height;
}
</style>
