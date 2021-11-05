<script>
import { mapState } from 'vuex';
import Checkbox from '@/components/form/Checkbox';

export default {
  name: 'EpinioServicePromptRemove',

  components: { Checkbox },

  props: {
    value: {
      type:     Array,
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
    return { unbind: false };
  },

  computed: {
    ...mapState('action-menu', ['toRemove']),

    plusMore() {
      const remaining = this.toRemove.length - this.names.length;

      return this.t('promptRemove.andOthers', { count: remaining });
    },

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

  methods: {
    async remove(btnCB) {
      try {
        await Promise.all(this.toRemove.map(resource => resource.remove({ data: { unbind: this.unbind } })));
        this.$emit('done');
      } catch (err) {
        this.$emit('errors', err);
        btnCB(false);
      }
    }
  }
};
</script>

<template>
  <div class="mt-10 service">
    {{ t('promptRemove.attemptingToRemove', { type }) }} <span v-html="resourceNames"></span>
    <Checkbox v-model="unbind" class="mt-10" :label="t('epinio.services.promptRemove.unbind')" />
  </div>
</template>

<style lang='scss'>
.service {
  display: flex;
  flex-direction: column;
}
</style>
