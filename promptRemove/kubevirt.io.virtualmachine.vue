<script>
import { mapGetters } from 'vuex';
import { HCI } from '@/config/types';
import { isEmpty } from '@/utils/object';
import Parse from 'url-parse';

export default {
  name: 'PromptRemove',

  props: {
    value: {
      type:     Array,
      default: () => {
        return [];
      }
    },
  },

  data() {
    return {
      checkedList: [],
      checkAll:    true
    };
  },

  computed: {
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
    remove() {
      const parentCompnent = this.$parent.$parent.$parent;

      let goTo;

      if (parentCompnent.doneLocation) {
        // doneLocation will recompute to undefined when delete request completes
        goTo = { ...parentCompnent.doneLocation };
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
          parentCompnent.currentRouter.push(goTo);
        }
        parentCompnent.close();
      }).catch((err) => {
        parentCompnent.error = err;
      });
    }
  }
};
</script>

<template>
  <div class="mt-10">
    <span class="text-info">{{ t('harvester.virtualMachine.promptRemove.title') }}</span>
    <br />
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
