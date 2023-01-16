<script>
import { mapState, mapGetters } from 'vuex';
import { HCI } from '../types';
import { isEmpty } from '@shell/utils/object';
import Parse from 'url-parse';
import { resourceNames } from '@shell/utils/string';

export default {
  name: 'HarvesterPromptRemove',

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
    }
  },

  data() {
    return {
      checkedList: [],
      checkAll:    true
    };
  },

  computed: {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),

    removeNameArr() {
      const out = {};

      this.value.forEach((crd) => {
        if (crd.type !== HCI.VM) {
          return;
        }
        const volumes = crd.spec.template.spec?.volumes || [];
        const names = volumes.filter(volume => volume.persistentVolumeClaim ).map((volume) => {
          if (volume.persistentVolumeClaim) {
            return volume.name;
          }
        });

        out[crd.id] = names;
      });

      return out;
    },

    plusMore() {
      const remaining = this.toRemove.length - this.names.length;

      return this.t('promptRemove.andOthers', { count: remaining });
    },
  },

  watch: {
    removeNameArr: {
      handler(neu) {
        if (this.value.length === 1) {
          const keys = Object.values(neu[this.value[0].id]);

          this.checkedList.unshift(keys[0]);
        }
      },
      deep:      true,
      immediate: true
    }
  },

  methods: {
    resourceNames,
    remove() {
      const parentComponent = this.$parent.$parent.$parent;

      let goTo;

      if (parentComponent.doneLocation) {
        // doneLocation will recompute to undefined when delete request completes
        goTo = { ...parentComponent.doneLocation };
      }

      Promise.all(this.value.map((resource) => {
        if (resource.type !== HCI.VM) { // maybe is VMI
          resource.remove();

          return;
        }

        let removedDisks = '';

        if (this.value.length > 1) {
          if (this.checkAll) {
            this.removeNameArr[resource.id].forEach((item) => {
              removedDisks += `removedDisks=${ item }&`;
            });
          }
        } else {
          this.checkedList.forEach((item) => {
            removedDisks += `removedDisks=${ item }&`;
          });
          removedDisks.replace(/&$/, '');
        }

        const parsed = Parse(resource.links.self);

        resource.remove({ url: `${ parsed.pathname }?${ removedDisks }propagationPolicy=Foreground` });
      })).then((results) => {
        if ( goTo && !isEmpty(goTo) ) {
          parentComponent.currentRouter.push(goTo);
        }
        parentComponent.close();
      }).catch((err) => {
        parentComponent.error = err;
      });
    }
  }
};
</script>

<template>
  <div class="mt-10">
    {{ t('promptRemove.attemptingToRemove', {type}) }}
    <span v-html="resourceNames(names, plusMore, t)"></span>

    <div class="mt-10">
      {{ t('harvester.virtualMachine.promptRemove.title') }}
    </div>
    <div v-if="value.length === 1">
      <span v-for="name in removeNameArr[value[0].id]" :key="name">
        <label class="checkbox-container mr-15"><input v-model="checkedList" type="checkbox" :label="name" :value="name" />
          <span
            class="checkbox-custom mr-5"
            role="checkbox"
          />
          {{ name }}
        </label>
      </span>
    </div>

    <div v-else>
      <label class="checkbox-container mr-15"><input v-model="checkAll" type="checkbox" />
        <span
          class="checkbox-custom mr-5"
          role="checkbox"
        />
        {{ t('harvester.virtualMachine.promptRemove.deleteAll') }}
      </label>
    </div>
  </div>
</template>
