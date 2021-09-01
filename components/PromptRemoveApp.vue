<script>
import { mapState, mapGetters } from 'vuex';
import { CATALOG } from '@/config/types';
import { get, isEmpty } from '@/utils/object';
import Card from '@/components/Card';
import Checkbox from '@/components/form/Checkbox';
import { alternateLabel } from '@/utils/platform';
import { uniq } from '@/utils/array';
import AsyncButton from '@/components/AsyncButton';
import find from 'lodash/find';

export default {
  components: {
    Card,
    Checkbox,
    AsyncButton
  },

  async fetch() {
    this.allInstalled = await this.$store.dispatch('cluster/findAll', { type: CATALOG.APP });
  },

  data() {
    return {
      randomPosition:   Math.random(),
      confirmName:      '',
      error:            '',
      warning:          '',
      preventDelete:    false,
      deleteCrd:        false,
      allInstalled:     null
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

        name = name.slice(0, name.indexOf('-id'));

        if (params.namespace) {
          name = name.slice(0, name.indexOf('-namespace'));
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

    ...mapState('action-menu', ['showPromptRemoveApp', 'toRemove']),
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
    },

    checkForCrd() {
      if (this.allInstalled !== null) {
        const crd = this.allInstalled.find(installed => installed.metadata.name === `${ this.names }-crd`);

        if (crd) {
          return true;
        } else if (this.toRemove.length > 1 && find(this.toRemove, this.names.forEach(name => name))) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  },

  watch:    {
    showPromptRemoveApp(show) {
      if (show) {
        this.$modal.show('promptRemoveApp');
      } else {
        this.$modal.hide('promptRemoveApp');
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
      this.$store.commit('action-menu/togglePromptRemoveApp');
      this.deleteCrd = false;
    },

    addCrdToRemove() {
      const crd = this.allInstalled.find(res => res.metadata.name === `${ this.names }-crd`);

      if (crd) {
        this.toRemove.push(crd);
      } else if (!this.deleteCrd) {
        this.toRemove.pop();
      }
    },

    remove(btnCB) {
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
        this.deleteCrd = false;
      } catch (err) {
        this.error = err;
        btnCB(false);
        this.deleteCrd = false;
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
        this.deleteCrd = false;
      } catch (err) {
        this.error = err;
        btnCB(false);
        this.deleteCrd = false;
      }
    },

    getSpoofedTypes(resources) {
      const uniqueResourceTypes = uniq(this.toRemove.map(resource => resource.type));

      return uniqueResourceTypes.filter(this.$store.getters['type-map/isSpoofed']);
    },

    // If spoofed we need to reload the values as the server can't have watchers for them.
    refreshSpoofedTypes(types) {
      const promises = types.map(type => this.$store.dispatch('cluster/findAll', { type, opt: { force: true } }, { root: true }));

      return Promise.all(promises);
    }
  }
};
</script>

<template>
  <modal
    class="remove-modal"
    name="promptRemoveApp"
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
          {{ t('promptRemove.attemptingToRemove', { type }) }} <span v-html="resourceNames"></span>
          <div v-if="needsConfirm" class="mt-10">
            <span
              v-html="t('promptRemove.confirmName', { nameToMatch }, true)"
            ></span>
          </div>
        </div>
        <input v-if="needsConfirm" id="confirm" v-model="confirmName" type="text" />
        <div class="mb-10">
          {{ warning }}
        </div>
        <div class="text-error mb-10">
          {{ error }}
        </div>
        <div v-if="!needsConfirm" class="text-info mt-20">
          {{ protip }}
        </div>
        <Checkbox v-if="checkForCrd" v-model="deleteCrd" label-key="promptRemoveApp.removeCrd" class="mt-10 type" @input="addCrdToRemove" />
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
