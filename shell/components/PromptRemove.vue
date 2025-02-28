<script>
import { shallowRef } from 'vue';
import { mapState, mapGetters } from 'vuex';
import { get, isEmpty } from '@shell/utils/object';
import { escapeHtml, resourceNames } from '@shell/utils/string';
import { Card } from '@components/Card';
import { Checkbox } from '@components/Form/Checkbox';
import { alternateLabel } from '@shell/utils/platform';
import { uniq } from '@shell/utils/array';
import AsyncButton from '@shell/components/AsyncButton';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CATALOG } from '@shell/config/types';
import { LabeledInput } from '@components/Form/LabeledInput';
import AppModal from '@shell/components/AppModal.vue';

export default {
  name: 'PromptRemove',

  components: {
    Card, Checkbox, AsyncButton, LabeledInput, AppModal
  },
  props: {
    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'prompt-remove'
    }
  },
  data() {
    const { resource } = this.$route.params;

    return {
      hasCustomRemove:     false,
      randomPosition:      Math.random(),
      confirmName:         '',
      error:               '',
      warning:             '',
      preventDelete:       false,
      removeComponent:     shallowRef(this.$store.getters['type-map/importCustomPromptRemove'](resource)),
      chartsToRemoveIsApp: false,
      chartsDeleteCrd:     false,
      showModal:           false,
    };
  },
  computed: {
    names() {
      return this.toRemove.map((obj) => obj.nameDisplay);
    },

    nameToMatchPosition() {
      const visibleNames = Math.min(5, this.names.length);
      const randomNamePos = Math.floor(this.randomPosition * visibleNames);

      return randomNamePos;
    },

    nameToMatch() {
      return this.names[this.nameToMatchPosition];
    },

    type() {
      const types = new Set(this.toRemove.reduce((array, each) => {
        array.push(each.type);

        return array;
      }, []));

      if (types.size > 1) {
        return this.t('generic.resource', { count: this.toRemove.length });
      }

      const schema = this.toRemove[0]?.schema;

      if ( !schema ) {
        return `resource${ this.toRemove.length === 1 ? '' : 's' }`;
      }

      return this.$store.getters['type-map/labelFor'](schema, this.toRemove.length);
    },

    selfLinks() {
      return this.toRemove.map((resource) => {
        return get(resource, 'links.self');
      });
    },

    needsConfirm() {
      const first = this.toRemove[0];

      return first?.confirmRemove;
    },

    // if the current route ends with the ID of the resource being deleted, whatever page this is wont be valid after successful deletion: navigate away
    doneLocation() {
      // if deleting more than one resource, this is happening in list view and shouldn't redirect anywhere
      if (this.toRemove.length > 1) {
        return null;
      }

      if (this.toRemove[0].doneOverride) {
        return this.toRemove[0].doneOverride;
      }

      const currentRoute = this.toRemove[0].currentRoute();
      const out = {};
      const params = { ...currentRoute.params };

      if (params.id && (params.id === this.toRemove[0]?.metadata?.name || params.id === this.toRemove[0].id)) {
        let { name = '' } = currentRoute;

        const idIndex = name.indexOf('-id');

        if (idIndex !== -1) {
          name = name.slice(0, idIndex);
        }

        if (params.namespace) {
          const namespaceIndex = name.indexOf('-namespace');

          if (namespaceIndex !== -1) {
            name = name.slice(0, namespaceIndex);
          }
          delete params.namespace;
        }
        delete params.id;

        out.params = params;
        out.name = name;
      }

      return out;
    },

    currentRouter() {
      // ...don't need a router if there's no route to go to
      if (!this.doneLocation) {
        return null;
      } else {
        return this.toRemove[0].currentRouter();
      }
    },

    protip() {
      return this.t('promptRemove.protip', { alternateLabel });
    },

    deleteDisabled() {
      const confirmFailed = this.needsConfirm && this.confirmName !== this.nameToMatch;

      return this.preventDelete || confirmFailed;
    },

    ...mapState('action-menu', ['showPromptRemove', 'toRemove']),
    ...mapGetters({ t: 'i18n/t' }),
  },

  watch: {
    showPromptRemove(show) {
      if (show) {
        const selected = this.toRemove[0];

        if (this.currentRouter?.currentRoute?.value?.name === 'c-cluster-explorer-tools' &&
            selected.type === CATALOG.APP &&
            selected.spec?.chart?.metadata?.annotations[CATALOG_ANNOTATIONS.AUTO_INSTALL]) {
          this.chartsToRemoveIsApp = true;
        }

        this.showModal = true;

        let { resource } = this.$route.params;

        if (this.toRemove.length > 0) {
          resource = selected.type;
        }

        this.hasCustomRemove = this.$store.getters['type-map/hasCustomPromptRemove'](resource);

        this.removeComponent = shallowRef(this.$store.getters['type-map/importCustomPromptRemove'](resource));
      } else {
        this.showModal = false;
      }
    },

    // check for any resources with a deletion prevention message,
    // if none found (delete is allowed), then check for any resources with a warning message
    toRemove(neu) {
      let message;
      const preventDeletionMessages = neu.filter((item) => item.preventDeletionMessage);

      this.preventDelete = false;

      if (!!preventDeletionMessages.length) {
        this.preventDelete = true;
        message = preventDeletionMessages[0].preventDeletionMessage;
      } else {
        const warnDeletionMessages = neu.filter((item) => item.warnDeletionMessage);

        if (!!warnDeletionMessages.length) {
          message = warnDeletionMessages[0].warnDeletionMessage;
        }
      }
      if (typeof message === 'function' ) {
        this.warning = message(this.toRemove);
      } else if (!!message) {
        this.warning = message;
      } else {
        this.warning = '';
      }
    }
  },

  methods: {
    resourceNames,
    escapeHtml,
    close() {
      this.confirmName = '';
      this.error = '';
      this.chartsDeleteCrd = false;
      this.chartsToRemoveIsApp = false;
      this.$store.commit('action-menu/togglePromptRemove');
    },

    async remove(btnCB) {
      if (this.doneLocation) {
        // doneLocation will recompute to undefined when delete request completes
        this.cachedDoneLocation = { ...this.doneLocation };
      }

      if (this.hasCustomRemove && this.$refs?.customPrompt?.remove) {
        let handled = this.$refs.customPrompt.remove(btnCB);

        // If the response is a promise, then wait for the promise
        if (handled && handled.then) {
          try {
            handled = await handled;
          } catch (err) {
            this.error = err;
            btnCB(false);

            return;
          }
        }

        // If the remove function for the custom dialog handled the request, it can return true or not return anything
        // if it returned false, then it wants us to continue with the deletion logic below - this is useful
        // where the custom dialog needs to delete additional resources - it handles those and retrurns false to get us
        // to delete the main resource
        if (handled === undefined || handled) {
          return;
        }
      }
      const serialRemove = this.toRemove.some((resource) => resource.removeSerially);

      if (serialRemove) {
        this.serialRemove(btnCB);
      } else {
        this.parallelRemove(btnCB);
      }
    },
    async serialRemove(btnCB) {
      try {
        const spoofedTypes = this.getSpoofedTypes(this.toRemove);

        for (const resource of this.toRemove) {
          await resource.remove();
        }

        await this.refreshSpoofedTypes(spoofedTypes);
        this.done();
      } catch (err) {
        this.error = err.message || err;
        btnCB(false);
      }
    },
    async parallelRemove(btnCB) {
      try {
        if (typeof this.toRemove[0].bulkRemove !== 'undefined') {
          await this.toRemove[0].bulkRemove(this.toRemove, {});
        } else {
          await Promise.all(this.toRemove.map((resource) => resource.remove()));
        }

        const spoofedTypes = this.getSpoofedTypes(this.toRemove);

        await this.refreshSpoofedTypes(spoofedTypes);

        this.done();
      } catch (err) {
        this.error = err.message || err;
        btnCB(false);
      }
    },
    done() {
      if ( this.cachedDoneLocation && !isEmpty(this.cachedDoneLocation) ) {
        this.currentRouter.push(this.cachedDoneLocation);
      }
      this.close();
    },
    getSpoofedTypes(resources) {
      const uniqueResourceTypes = uniq(this.toRemove.map((resource) => resource.type));

      return uniqueResourceTypes.filter(this.$store.getters['type-map/isSpoofed']);
    },

    // If spoofed we need to reload the values as the server can't have watchers for them.
    refreshSpoofedTypes(types) {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const promises = types.map((type) => this.$store.dispatch(`${ inStore }/findAll`, { type, opt: { force: true } }, { root: true }));

      return Promise.all(promises);
    },

    async chartAddCrdToRemove() {
      try {
        const res = await this.toRemove[0].relatedResourcesToRemove();

        if (!this.toRemove.includes(res)) {
          this.toRemove.push(res);
        } else if (!this.chartsDeleteCrd) {
          this.toRemove.pop(res);
        }
      } catch (err) {
        this.error = err;
        this.chartsDeleteCrd = false;
      }
    }
  }
};
</script>

<template>
  <app-modal
    v-if="showModal"
    custom-class="remove-modal"
    name="promptRemove"
    :width="400"
    height="auto"
    styles="max-height: 100vh;"
    @close="close"
  >
    <Card
      class="prompt-remove"
      :show-highlight-border="false"
    >
      <template #title>
        <h4 class="text-default-text">
          {{ t('promptRemove.title') }}
        </h4>
      </template>
      <template #body>
        <div class="mb-10">
          <template v-if="!hasCustomRemove">
            {{ t('promptRemove.attemptingToRemove', { type }) }} <span
              v-clean-html="resourceNames(names, t)"
            />
          </template>

          <component
            :is="removeComponent"
            v-if="hasCustomRemove"
            ref="customPrompt"
            v-model:value="toRemove"
            v-bind="$data"
            :close="close"
            :needs-confirm="needsConfirm"
            :value="toRemove"
            :names="names"
            :type="type"
            :done-location="doneLocation"
            @errors="e => error = e"
            @done="done"
          />
          <div
            v-if="needsConfirm"
            class="mt-10"
          >
            <span
              v-clean-html="t('promptRemove.confirmName', { nameToMatch: escapeHtml(nameToMatch) }, true)"
            />
          </div>
        </div>
        <LabeledInput
          v-if="needsConfirm"
          id="confirm"
          v-model:value="confirmName"
          v-focus
          :data-testid="componentTestid + '-input'"
          type="text"
          :aria-label="t('promptRemove.confirmName', { nameToMatch: escapeHtml(nameToMatch) })"
        >
          <div class="text-warning mb-10 mt-10">
            {{ warning }}
          </div>
          <div class="text-error mb-10 mt-10">
            {{ error }}
          </div>
          <div
            v-if="!needsConfirm"
            class="text-info mt-20"
          >
            {{ protip }}
          </div>
        </LabeledInput>
        <div v-else-if="!hasCustomRemove">
          <div
            v-if="warning"
            class="text-warning mb-10 mt-10"
          >
            {{ warning }}
          </div>
          <div
            v-if="error"
            class="text-error mb-10 mt-10"
          >
            {{ error }}
          </div>
        </div>
        <Checkbox
          v-if="chartsToRemoveIsApp"
          v-model:value="chartsDeleteCrd"
          label-key="promptRemoveApp.removeCrd"
          class="mt-10 type"
          @update:value="chartAddCrdToRemove"
        />
      </template>
      <template #actions>
        <button
          class="btn role-secondary"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
        <div class="spacer" />
        <AsyncButton
          mode="delete"
          class="btn bg-error ml-10"
          :disabled="deleteDisabled"
          :data-testid="componentTestid + '-confirm-button'"
          @click="remove"
        />
      </template>
    </Card>
  </app-modal>
</template>

<style lang='scss'>
  .prompt-remove {
    &.card-container {
      box-shadow: none;
    }
    #confirm {
      width: 90%;
      margin-left: 3px;
    }

    .actions {
      text-align: right;
    }

    .card-actions {
      display: flex;

      .spacer {
        flex: 1;
      }
    }
  }
</style>
