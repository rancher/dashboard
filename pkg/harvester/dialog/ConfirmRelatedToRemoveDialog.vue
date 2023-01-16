<script>
import { mapState } from 'vuex';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { alternateLabel } from '@shell/utils/platform';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import { Card } from '@components/Card';
import { escapeHtml } from '@shell/utils/string';
import CopyToClipboardText from '@shell/components/CopyToClipboardText';

/**
 * @name ConfirmRelatedToRemoveDialog
 * @description Dialog component to confirm the related resources before removing the resource.
 */
export default {
  name: 'ConfirmRelatedToRemoveDialog',

  components: {
    AsyncButton,
    Banner,
    Card,
    CopyToClipboardText
  },

  props: {
    /**
     * @property resources to be deleted.
     * @type {Resource[]} Array of the resource model's instance
     */
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return { errors: [], confirmName: '' };
  },

  computed: {
    ...mapState('action-menu', ['modalData']),

    warningMessageKey() {
      return this.modalData.warningMessageKey;
    },

    names() {
      return this.resources.map(obj => obj.nameDisplay).slice(0, 5);
    },

    resourceNames() {
      return this.names.reduce((res, name, i) => {
        if (i >= 5) {
          return res;
        }
        res += `<b>${ escapeHtml(name) }</b>`;
        if (i === this.names.length - 1) {
          res += this.plusMore;
        } else {
          res += i === this.resources.length - 2 ? ' and ' : ', ';
        }

        return res;
      }, '');
    },

    nameToMatch() {
      return this.resources[0].nameDisplay;
    },

    plusMore() {
      const remaining = this.resources.length - this.names.length;

      return this.t('promptRemove.andOthers', { count: remaining });
    },

    type() {
      const types = new Set(this.resources.reduce((array, each) => {
        array.push(each.type);

        return array;
      }, []));

      if (types.size > 1) {
        return this.t('generic.resource', { count: this.resources.length });
      }

      const schema = this.resources[0]?.schema;

      if ( !schema ) {
        return `resource${ this.resources.length === 1 ? '' : 's' }`;
      }

      return this.$store.getters['type-map/labelFor'](schema, this.resources.length);
    },

    deleteDisabled() {
      return this.confirmName !== this.nameToMatch;
    },

    protip() {
      return this.t('promptRemove.protip', { alternateLabel });
    },
  },

  methods: {
    escapeHtml,

    close() {
      this.confirmName = '';
      this.errors = [];
      this.$emit('close');
    },

    async remove(buttonDone) {
      try {
        await this.resources[0].remove();
        buttonDone(true);
        this.close();
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
        buttonDone(false);
      }
    }
  }
};
</script>

<template>
  <Card class="prompt-related" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text">
      {{ t('promptRemove.title') }}
    </h4>
    <div slot="body" class="pl-10 pr-10">
      <span
        v-html="t(warningMessageKey, { type, names: resourceNames }, true)"
      ></span>

      <div class="mt-10 mb-10">
        <span
          v-html="t('promptRemove.confirmName', { nameToMatch: escapeHtml(nameToMatch) }, true)"
        ></span>
      </div>
      <div class="mb-10">
        <CopyToClipboardText :text="nameToMatch" />
      </div>
      <input id="confirm" v-model="confirmName" type="text" />
      <div class="text-info mt-20">
        {{ protip }}
      </div>
      <Banner v-for="(error, i) in errors" :key="i" class="" color="error" :label="error" />
    </div>
    <template #actions>
      <button class="btn role-secondary mr-10" @click="close">
        {{ t('generic.cancel') }}
      </button>
      <AsyncButton mode="delete" class="btn bg-error ml-10" :disabled="deleteDisabled" @click="remove" />
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .actions {
    text-align: right;
  }
</style>
