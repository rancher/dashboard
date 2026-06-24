<script>
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import { exceptionToErrorsArray, stringify } from '@shell/utils/error';
import Questions from '@shell/components/Questions';
import { MANAGEMENT } from '@shell/config/types';
import { NODE_DRIVER_FIELD_HINTS } from '@shell/config/labels-annotations';
import { isEmpty } from '@shell/utils/object';

export default {
  emits: ['input'],

  components: {
    Loading, Banner, Questions
  },

  mixins: [CreateEditView],

  props: {
    credentialId: {
      type:     String,
      required: true,
    },

    provider: {
      type:     String,
      required: true,
    },

    disabled: {
      type:    Boolean,
      default: false
    },
  },

  async fetch() {
    this.errors = [];

    try {
      this.fields = await this.$store.getters['plugins/fieldsForDriver'](this.provider);
      const name = `rke-machine-config.cattle.io.${ this.provider }config`;

      if ( !this.fields ) {
        throw new Error(`Machine Driver config schema not found for ${ name }`);
      }
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }

    try {
      const driver = await this.$store.dispatch('management/find', { type: MANAGEMENT.NODE_DRIVER, id: this.provider } );
      const fieldHints = driver?.metadata?.annotations?.[NODE_DRIVER_FIELD_HINTS];
      let parsedHints;

      if (fieldHints) {
        parsedHints = JSON.parse(fieldHints);
      }
      if (parsedHints && !isEmpty(parsedHints)) {
        Object.keys(this.fields).forEach((fieldKey) => {
          if (parsedHints[fieldKey] && parsedHints[fieldKey].type) {
            this.fields[fieldKey].type = parsedHints[fieldKey].type;
          }
        });
      }
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }

    const normanType = this.$store.getters['plugins/credentialFieldForDriver'](this.provider);
    const normanSchema = this.$store.getters['rancher/schemaFor'](`${ normanType }credentialconfig`);

    if ( normanSchema ) {
      this.cloudCredentialKeys = Object.keys(normanSchema.resourceFields || {});
    } else {
      this.cloudCredentialKeys = await this.$store.getters['plugins/fieldNamesForDriver'](this.provider);
    }
  },

  data() {
    return {
      errors: null,
      fields: null,
    };
  },

  watch: {
    'credentialId'() {
      this.$fetch();
    },
  },

  methods: { stringify },
};
</script>

<template>
  <Loading
    v-if="$fetchState.pending"
    :delayed="true"
  />
  <template v-else>
    <div
      v-for="(err, idx) in errors"
      :key="idx"
    >
      <Banner
        color="error"
        :label="stringify(err)"
      />
    </div>
    <Questions
      v-if="fields"
      :value="value"
      :mode="mode"
      :tabbed="false"
      :source="fields"
      :ignore-variables="cloudCredentialKeys"
      :target-namespace="value.metadata.namespace"
      :disabled="disabled"
      @update:value="$emit('input', $event)"
    />
  </template>
</template>
