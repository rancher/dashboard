<script>
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { SECRET_TYPES } from '@shell/config/secret';
import { FLEET, SECRET } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect';

const OPTIONS = { _NONE: '_none' };

export default {

  name: 'FleetOCIRegistrySecret',

  emits: ['update:value'],

  components: { LabeledSelect },

  props: {
    secret: {
      type:    String,
      default: '',
    },

    workspace: {
      type:    String,
      default: '',
    },

    mode: {
      type:    String,
      default: _EDIT
    },

    allowDefault: {
      type:    Boolean,
      default: true
    },

    inStore: {
      type:    String,
      default: 'management',
    },
  },

  async fetch() {
    const hash = await checkSchemasForFindAllHash({
      workspaces: {
        inStoreType:     'management',
        type:            FLEET.WORKSPACE,
        schemaValidator: (schema) => {
          return !!schema?.links?.collection;
        }
      },
      secrets: {
        inStoreType: 'management',
        type:        SECRET
      },
    }, this.$store);

    this.workspaces = hash.workspaces || [];
    this.secrets = hash.secrets || [];
  },

  data() {
    return {
      workspaces: [],
      secrets:    [],
    };
  },

  computed: {
    ociSecrets() {
      return this.secrets.filter((secret) => secret._type === SECRET_TYPES.FLEET_OCI_STORAGE &&
        secret.metadata?.annotations?.[FLEET_ANNOTATIONS.OCI_STORAGE_SECRET_GENERATED] !== 'true' &&
        secret.metadata?.namespace === this.workspace
      );
    },

    defaultSecret() {
      if (!this.allowDefault) {
        return null;
      }

      const workspace = this.workspaces.find((ws) => ws.id === this.workspace);

      const defaultSecretName = workspace?.metadata?.annotations?.[FLEET_ANNOTATIONS.OCI_STORAGE_SECRET_DEFAULT];

      return this.ociSecrets.find((secret) => secret.name === defaultSecretName);
    },

    secretsList() {
      if (this.defaultSecret) {
        return this.ociSecrets.filter((secret) => secret.id !== this.defaultSecret.id);
      }

      return this.ociSecrets;
    },

    options() {
      const out = [{
        label: this.t('generic.none'),
        value: OPTIONS._NONE
      }];

      if (this.defaultSecret) {
        out.push({
          label: `${ this.defaultSecret.name } (${ this.t('generic.default') })`,
          value: this.defaultSecret
        });
      }

      if (this.secretsList.length > 0) {
        out.push({
          kind:     'title',
          label:    this.t(`fleet.gitRepo.ociRegistrySecret.options.${ this.allowDefault ? 'chooseCustom' : 'chooseExisting' }`),
          disabled: true
        });

        this.secretsList.forEach((secret) => {
          out.push({
            label: secret.name,
            value: secret
          });
        });
      }

      return out;
    },

    selected() {
      if (this.secret === this.defaultSecret?.name) {
        return this.defaultSecret;
      }

      return this.secret || OPTIONS._NONE;
    },
  },

  watch: {
    workspace() {
      if (this.mode === _CREATE) {
        this.update(this.defaultSecret);
      }
    }
  },

  methods: {
    update(value) {
      this.$emit('update:value', value?.name);
    },
  }
};
</script>

<template>
  <LabeledSelect
    :label="t('fleet.gitRepo.ociRegistrySecret.label')"
    :mode="mode"
    :value="selected"
    :options="options"
    @update:value="update"
  />
</template>

<style lang="scss" scoped>
</style>
