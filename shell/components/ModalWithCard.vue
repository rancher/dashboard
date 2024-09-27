<script>
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import AppModal from '@shell/components/AppModal.vue';

export default {
  name: 'ModalWithCard',

  emits: ['close', 'finish'],

  components: {
    Card, Banner, AsyncButton, AppModal
  },

  props: {
    name: {
      type:     String,
      required: true
    },

    closeText: {
      type:    String,
      default: 'Close'
    },

    saveText: {
      type:    String,
      default: 'create'
    },

    width: {
      type:    [String, Number],
      default: '50%'
    },

    height: {
      type:    [String, Number],
      default: 'auto'
    },

    errors: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  methods: {
    hide() {
      this.$emit('close');
    },
  }
};

</script>

<template>
  <app-modal
    :name="name"
    :width="width"
    :click-to-close="false"
    :height="height"
    v-bind="$attrs"
    class="modal"
    data-testid="mvc__card"
    @close="$emit('finish', $event)"
  >
    <Card
      class="modal"
      :show-highlight-border="false"
    >
      <template #title>
        <h4 class="text-default-text">
          <slot name="title" />
        </h4>
      </template>

      <template #body>
        <slot name="content" />

        <div
          v-for="(err,idx) in errors"
          :key="idx"
        >
          <Banner
            class="banner"
            color="error"
            :label="err"
          />
        </div>
      </template>

      <template #actions>
        <slot name="footer">
          <div class="footer">
            <button
              class="btn role-secondary mr-20"
              @click.prevent="hide"
            >
              {{ closeText }}
            </button>

            <AsyncButton
              :mode="saveText"
              @click="$emit('finish', $event)"
            />
          </div>
        </slot>
      </template>
    </Card>
  </app-modal>
</template>

<style lang="scss" scoped>
.footer {
  width: 100%;
  display: flex;
  justify-content: center;
}

.banner {
  margin-bottom: 0px;
}
</style>

<style lang="scss">
.modal {
  border-radius: var(--border-radius);
  max-height: 100vh;

  &.card-container {
    box-shadow: none;
  }
}
</style>
