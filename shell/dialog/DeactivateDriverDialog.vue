<script>
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { resourceNames } from '@shell/utils/string';
import { mapGetters } from 'vuex';

export default {
  emits: ['close'],

  components: {
    Card,
    AsyncButton,
    Banner,
  },

  props: {
    drivers: {
      type:     Array,
      required: true
    },
    driverType: {
      type:     String,
      required: true
    }
  },

  data() {
    return { errors: [] };
  },
  computed: {
    formattedText() {
      const namesSliced = this.drivers.map((obj) => obj.nameDisplay);
      const count = namesSliced.length;
      const remaining = namesSliced.length > 5 ? namesSliced.length - 5 : 0;

      const plusMore = this.t('drivers.deactivate.andOthers', { count: remaining });
      const names = resourceNames(namesSliced, this.t, { plusMore, endString: false });
      const warningDrivers = this.t('drivers.deactivate.warningDrivers', { names, count });

      return this.t('drivers.deactivate.warning', { warningDrivers, count });
    },
    ...mapGetters({ t: 'i18n/t' }),
  },
  methods: {
    resourceNames,
    close(buttonDone) {
      if (buttonDone && typeof buttonDone === 'function') {
        buttonDone(true);
      }
      this.$emit('close');
    },
    async apply(buttonDone) {
      try {
        await Promise.all(this.drivers.map(
          (driver) => this.$store.dispatch('rancher/request', {
            url:    `v3/${ this.driverType }/${ escape(driver.id) }?action=deactivate`,
            method: 'POST'
          })
        ));

        this.close(buttonDone);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }
  }
};
</script>
<template>
  <Card
    class="prompt-deactivate"
    :show-highlight-border="false"
    :data-testid="'prompt-deactivate'"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ t('drivers.deactivate.title') }}
      </h4>
    </template>

    <template #body>
      <div class="pl-10 pr-10">
        <div class="text info mb-10 mt-20">
          <span v-clean-html="formattedText" />
        </div>
        <Banner
          v-for="(err, i) in errors"
          :key="i"
          color="error"
          :label="err"
        />
      </div>
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
        mode="deactivate"
        class="btn bg-error ml-10"
        :data-testid="'deactivate-driver-confirm'"
        @click="apply"
      />
    </template>
  </Card>
</template>

<style lang='scss'>
  .prompt-deactivate {
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
