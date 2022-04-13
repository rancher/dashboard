<script>
import { mapState, mapGetters } from 'vuex';
import { get, isEmpty } from '@shell/utils/object';
import Card from '@shell/components/Card';
import Checkbox from '@shell/components/form/Checkbox';
import { alternateLabel } from '@shell/utils/platform';
import { uniq } from '@shell/utils/array';
import AsyncButton from '@shell/components/AsyncButton';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CATALOG } from '@shell/config/types';

export default {
  components: {
    Card, Checkbox, AsyncButton
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
      removeComponent:     this.$store.getters['type-map/importCustomPromptRemove'](resource),
      chartsToRemoveIsApp: false,
      chartsDeleteCrd:     false
    };
  },
  computed:   {
    names() {
      return this.toRemove.map(obj => obj.nameDisplay).slice(0, 5);
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

    plusMore() {
      const remaining = this.toRemove.length - this.names.length;

      return this.t('promptRemove.andOthers', { count: remaining });
    },

    // if the current route ends with the ID of the resource being deleted, whatever page this is wont be valid after successful deletion: navigate away
    doneLocation() {
      // if deleting more than one resource, this is happening in list view and shouldn't redirect anywhere
      if (this.toRemove.length > 1) {
        return null;
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

    resourceNames() {
      return this.names.reduce((res, name, i) => {
        if (i >= 5) {
          return res;
        }
        res += `<b>${ name }</b>`;
        if (i === this.names.length - 1) {
          res += this.plusMore;
        } else {
          res += i === this.toRemove.length - 2 ? ' and ' : ', ';
        }

        return res;
      }, '');
    }
  },

  watch:    {
    showPromptRemove(show) {
      if (show) {
        const selected = this.toRemove[0];

        if (this.currentRouter?.currentRoute?.name === 'c-cluster-explorer-tools' &&
            selected.type === CATALOG.APP &&
            selected.spec?.chart?.metadata?.annotations[CATALOG_ANNOTATIONS.AUTO_INSTALL]) {
          this.chartsToRemoveIsApp = true;
        }

        this.$modal.show('promptRemove');

        let { resource } = this.$route.params;

        if (this.toRemove.length > 0) {
          resource = selected.type;
        }

        this.hasCustomRemove = this.$store.getters['type-map/hasCustomPromptRemove'](resource);

        this.removeComponent = this.$store.getters['type-map/importCustomPromptRemove'](resource);
      } else {
        this.$modal.hide('promptRemove');
      }
    },

    // check for any resources with a deletion prevention message,
    // if none found (delete is allowed), then check for any resources with a warning message
    toRemove(neu) {
      let message;
      const preventDeletionMessages = neu.filter(item => item.preventDeletionMessage);

      this.preventDelete = false;

      if (!!preventDeletionMessages.length) {
        this.preventDelete = true;
        message = preventDeletionMessages[0].preventDeletionMessage;
      } else {
        const warnDeletionMessages = neu.filter(item => item.warnDeletionMessage);

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
    close() {
      this.confirmName = '';
      this.error = '';
      this.chartsDeleteCrd = false;
      this.chartsToRemoveIsApp = false;
      this.$store.commit('action-menu/togglePromptRemove');
    },

    remove(btnCB) {
      if (this.hasCustomRemove && this.$refs?.customPrompt?.remove) {
        this.$refs.customPrompt.remove();

        return;
      }

      let goTo;

      if (this.doneLocation) {
        // doneLocation will recompute to undefined when delete request completes
        goTo = { ...this.doneLocation };
      }

      const serialRemove = this.toRemove.some(resource => resource.removeSerially);

      if (serialRemove) {
        this.serialRemove(goTo, btnCB);
      } else {
        this.parallelRemove(goTo, btnCB);
      }
    },

    async serialRemove(goTo, btnCB) {
      try {
        const spoofedTypes = this.getSpoofedTypes(this.toRemove);

        for (const resource of this.toRemove) {
          await resource.remove();
        }

        await this.refreshSpoofedTypes(spoofedTypes);

        if ( goTo && !isEmpty(goTo) ) {
          this.currentRouter.push(goTo);
        }
        btnCB(true);
        this.close();
      } catch (err) {
        this.error = err;
        btnCB(false);
      }
    },

    async parallelRemove(goTo, btnCB) {
      try {
        const spoofedTypes = this.getSpoofedTypes(this.toRemove);

        await Promise.all(this.toRemove.map(resource => resource.remove()));
        await this.refreshSpoofedTypes(spoofedTypes);

        if ( goTo && !isEmpty(goTo) ) {
          this.currentRouter.push(goTo);
        }
        btnCB(true);
        this.close();
      } catch (err) {
        this.error = err;
        btnCB(false);
      }
    },

    getSpoofedTypes(resources) {
      const uniqueResourceTypes = uniq(this.toRemove.map(resource => resource.type));

      return uniqueResourceTypes.filter(this.$store.getters['type-map/isSpoofed']);
    },

    // If spoofed we need to reload the values as the server can't have watchers for them.
    refreshSpoofedTypes(types) {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const promises = types.map(type => this.$store.dispatch(`${ inStore }/findAll`, { type, opt: { force: true } }, { root: true }));

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
  <modal
    class="remove-modal"
    name="promptRemove"
    :width="350"
    height="auto"
    styles="max-height: 100vh;"
    @closed="close"
  >
    <Card class="prompt-remove" :show-highlight-border="false">
      <h4 slot="title" class="text-default-text">
        {{ t('promptRemove.title') }}
      </h4>
      <div slot="body">
        <div class="mb-10">
          <template v-if="!hasCustomRemove">
            {{ t('promptRemove.attemptingToRemove', { type }) }} <span v-html="resourceNames"></span>
          </template>

          <template>
            <component
              :is="removeComponent"
              v-if="hasCustomRemove"
              ref="customPrompt"
              v-model="toRemove"
              v-bind="_data"
              :needs-confirm="needsConfirm"
              :value="toRemove"
              :names="names"
              :type="type"
            />
            <div v-if="needsConfirm" class="mt-10">
              <span
                v-html="t('promptRemove.confirmName', { nameToMatch }, true)"
              ></span>
            </div>
          </template>
        </div>
        <input v-if="needsConfirm" id="confirm" v-model="confirmName" type="text" />
        <div class="text-warning mb-10">
          {{ warning }}
        </div>
        <div class="text-error mb-10">
          {{ error }}
        </div>
        <div v-if="!needsConfirm" class="text-info mt-20">
          {{ protip }}
        </div>
        <Checkbox v-if="chartsToRemoveIsApp" v-model="chartsDeleteCrd" label-key="promptRemoveApp.removeCrd" class="mt-10 type" @input="chartAddCrdToRemove" />
      </div>
      <template #actions>
        <button class="btn role-secondary" @click="close">
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton mode="delete" class="btn bg-error ml-10" :disabled="deleteDisabled" @click="remove" />
      </template>
    </Card>
  </modal>
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

    .remove-modal {
        border-radius: var(--border-radius);
        overflow: scroll;
        max-height: 100vh;
        & ::-webkit-scrollbar-corner {
          background: rgba(0,0,0,0);
        }
    }

    .actions {
      text-align: right;
    }
    .card-actions {
      display: flex;
      justify-content: center;
    }
  }
</style>
