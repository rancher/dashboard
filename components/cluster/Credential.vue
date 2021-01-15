<script>
import Loading from '@/components/Loading';
import LabeledSelect from '@/components/form/LabeledSelect';
import { SECRET } from '@/config/types';

const _NEW = '_NEW';
const _NONE = '_NONE';

export default {
  components: { Loading, LabeledSelect },

  props: {
    value: {
      type:    String,
      default: null,
    },

    provider: {
      type:    String,
      default: null,
    },

    mode: {
      type:     String,
      required: true,
    }
  },

  async fetch() {
    this.allSecrets = await this.$store.dispatch('management/findAll', { type: SECRET });
  },

  data() {
    return {
      allSecrets:    null,
      nodeComponent: null,
      credentialId:  this.value || _NONE,
    };
  },

  computed: {
    _NEW() {
      return _NEW;
    },

    _NONE() {
      return _NONE;
    },

    options() {
      // @TODO better thing to filter secrets by, limit to matching provider
      const out = this.allSecrets.filter((obj) => {
        return obj.metadata.generateName === 'cc-';
      }).map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });

      if ( out.length ) {
        out.unshift({
          label: 'Create new...',
          value: _NEW,
        });

        out.unshift({
          label:    'Select a credential...',
          value:    _NONE,
          disabled: true,
        });
      }

      return out;
    },
  },

  watch: {
    credentialId(val) {
      if ( val === _NEW || val === _NONE ) {
        this.$emit('input', null);
      } else {
        this.$emit('input', val);
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="credentialId === _NEW || !options.length">
    Create new form...
  </div>
  <div v-else>
    <LabeledSelect
      v-model="credentialId"
      :label="t('cluster.credential.label')"
      :options="options"
      :mode="mode"
      :selectable="option => !option.disabled"
    />
  </div>
</template>
