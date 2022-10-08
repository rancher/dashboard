<script>
import { mapState, mapGetters } from 'vuex';
import { Card } from '@components/Card';

export default {
  name: 'HarvesterHotUnplugModal',

  components: { Card },

  props: {
    resources: {
      type:     Array,
      required: true
    },
  },

  computed: {
    ...mapState('action-menu', ['modalData']),
    ...mapGetters({ t: 'i18n/t' }),

    actionResource() {
      return this.resources[0];
    },
  },

  methods: {
    ok() {
      this.modalData?.callback('ok');
      this.$emit('close');
    },
  }
};
</script>

<template>
  <Card ref="modal" name="modal" :show-highlight-border="false">
    <h4
      slot="title"
      class="text-default-text"
    >
      {{ t('generic.tip') }}
    </h4>

    <template #body>
      <p v-html="t(modalData.contentKey)"></p>
    </template>

    <div slot="actions" class="actions">
      <div class="buttons">
        <button type="button" class="btn role-secondary mr-10" @click="ok">
          {{ t('generic.ok') }}
        </button>
      </div>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.actions {
  width: 100%;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
