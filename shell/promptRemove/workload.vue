<script>
import { resourceNames } from '@shell/utils/string';
import { Banner } from '@components/Banner';
import ButtonDropdown from '@shell/components/ButtonDropdown';
import { mapGetters, mapState } from 'vuex';

export default {
  name: 'PromptRemoveWorkloadDialog',

  emits: ['errors'],

  components: { Banner, ButtonDropdown },

  props: {
    value: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    names: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    type: {
      type:     String,
      required: true
    },

    close: {
      type:     Function,
      required: true
    },
  },

  data() {
    return {
      errors:            [],
      propagationPolicy: 'Background',
      options:           [
        {
          label:       this.t('promptRemove.orphan'),
          value:       'Orphan',
          description: this.t('promptRemove.propagationPolicyOrphan'),
        },
        {
          label:       this.t('promptRemove.foreground'),
          value:       'Foreground',
          description: this.t('promptRemove.propagationPolicyForeground'),
        },
        {
          label:       this.t('promptRemove.background'),
          value:       'Background',
          description: this.t('promptRemove.propagationPolicyBackground'),
        }
      ],
    };
  },

  computed: {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),
    selectedPolicyDescription() {
      const opt = this.options.find((o) => o.value === this.propagationPolicy);

      return opt ? opt.description : '';
    }
  },

  methods: {
    resourceNames,
    select({ value }) {
      this.propagationPolicy = value;
    },
    async remove(confirm) {
      try {
        await Promise.all(this.value.map((resource) => resource.remove({ params: { propagationPolicy: this.propagationPolicy } })
        ));
        this.close();
      } catch (err) {
        this.$emit('errors', err);
        confirm(false);
      }
    }
  }
};
</script>

<template>
  <div class="mt-10">
    <div class="mb-30">
      {{ t('promptRemove.attemptingToRemove', { type }) }} <span
        v-clean-html="resourceNames(names, null, t)"
        class="body"
      />
    </div>
    <div class="my-5">
      <label>
        {{ t('promptRemove.propagationPolicyLabel') }}
      </label>
      <div class="mb-10" />
    </div>
    <ButtonDropdown
      :button-label="propagationPolicy"
      :dropdown-options="options"
      size="sm"
      @click-action="select"
    />
    <div class="policy-description mt-10">
      {{ selectedPolicyDescription }}
    </div>
    <Banner
      v-for="(error, i) in errors"
      :key="i"
      class=""
      color="error"
      :label="error"
    />
  </div>
</template>

<style lang='scss' scoped>
  .body {
    font-weight: 600;
  }
  .actions {
    text-align: right;
  }
</style>
