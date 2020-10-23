<script>
import { mapState, mapGetters } from 'vuex';
import { get, isEmpty } from '@/utils/object';
import { NAMESPACE, RIO } from '@/config/types';
import Card from '@/components/Card';
import { alternateLabel } from '@/utils/platform';
import LinkDetail from '@/components/formatter/LinkDetail';

export default {
  components: { Card, LinkDetail },
  data() {
    return { confirmName: '', error: '' };
  },
  computed:   {
    names() {
      return this.toRemove.map(obj => obj.nameDisplay).slice(0, 5);
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

      if ( !first ) {
        return false;
      }
      const type = first.type;

      return (type === NAMESPACE || type === RIO.STACK) && this.toRemove.length === 1;
    },

    preventDeletionMessage() {
      const toRemoveWithWarning = this.toRemove.filter(tr => tr?.preventDeletionMessage);

      if (toRemoveWithWarning.length === 0) {
        return null;
      }

      return toRemoveWithWarning[0].preventDeletionMessage;
    },

    isDeleteDisabled() {
      return !!this.preventDeletionMessage;
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

    ...mapState('action-menu', ['showPromptRemove', 'toRemove']),
    ...mapGetters({ t: 'i18n/t' })
  },

  watch:    {
    showPromptRemove(show) {
      if (show) {
        this.$modal.show('promptRemove');
      } else {
        this.$modal.hide('promptRemove');
      }
    }
  },

  methods: {
    close() {
      this.confirmName = '';
      this.error = '';
      this.$store.commit('action-menu/togglePromptRemove');
    },

    remove() {
      if (this.needsConfirm && this.confirmName !== this.names[0]) {
        this.error = 'Resource names do not match';
        // if doneLocation is defined, redirect after deleting
      } else {
        let goTo;

        if (this.doneLocation) {
          // doneLocation will recompute to undefined when delete request completes
          goTo = { ...this.doneLocation };
        }

        const serialRemove = this.toRemove.some(resource => resource.removeSerially);

        if (serialRemove) {
          this.serialRemove(goTo);
        } else {
          this.parallelRemove(goTo);
        }
      }
    },

    async serialRemove(goTo) {
      try {
        for (const resource of this.toRemove) {
          await resource.remove();
        }

        if ( goTo && !isEmpty(goTo) ) {
          this.currentRouter.push(goTo);
        }

        this.close();
      } catch (err) {
        this.error = err;
      }
    },

    parallelRemove(goTo) {
      Promise.all(this.toRemove.map(resource => resource.remove())).then((results) => {
        if ( goTo && !isEmpty(goTo) ) {
          this.currentRouter.push(goTo);
        }

        this.close();
      }).catch((err) => {
        this.error = err;
      });
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
    styles="background-color: var(--nav-bg); border-radius: var(--border-radius); max-height: 100vh;"
  >
    <Card>
      <h4 slot="title" class="text-default-text">
        Are you sure?
      </h4>
      <div slot="body">
        <div class="mb-10">
          {{ t('promptRemove.attemptingToRemove', {type}) }} <template v-for="(resource, i) in names">
            <template v-if="i<5">
              <LinkDetail :key="resource" :value="resource" :row="toRemove[i]" @click.native="close" />
              <span v-if="i===names.length-1" :key="resource+2">{{ plusMore }}</span><span v-else :key="resource+1">{{ i === toRemove.length-2 ? ', and ' : ', ' }}</span>
            </template>
          </template>
          <span v-if="needsConfirm" :key="resource">Re-enter its name below to confirm:</span>
        </div>
        <input v-if="needsConfirm" id="confirm" v-model="confirmName" type="text" />
        <span class="text-warning">{{ preventDeletionMessage }}</span>
        <span class="text-error">{{ error }}</span>
        <span v-if="!needsConfirm" class="text-info mt-20">{{ protip }}</span>
      </div>
      <template slot="actions">
        <button class="btn role-secondary" @click="close">
          Cancel
        </button>
        <button class="btn bg-error" :disabled="isDeleteDisabled" @click="remove">
          Delete
        </button>
      </template>
    </Card>
  </modal>
</template>

<style lang='scss'>
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
</style>
