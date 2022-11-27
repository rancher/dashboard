<script>
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { exceptionToErrorsArray } from '@shell/utils/error';

const DEFAULT_REVISION = 'v1';

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
    LabeledInput,
  },
  props: {
    resources: {
      type:     Array,
      required: true
    }
  },
  data() {
    return { errors: [], name: '' };
  },
  computed: {
    cluster() {
      if (this.resources?.length === 1) {
        const c = this.resources[0];

        return c;
      }

      return {};
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.templateName.focus();
    });
  },
  methods: {
    close() {
      this.$emit('close');
    },

    async apply(buttonDone) {
      try {
        await this.$store.dispatch('rancher/request', {
          url:    `/v3/clusters/${ escape(this.cluster.name) }?action=saveAsTemplate`,
          method: 'post',
          data:   {
            clusterTemplateName:         this.name,
            clusterTemplateRevisionName: DEFAULT_REVISION
          },
        });

        buttonDone(true);
        this.close();

        // Take the user to the RKE Templates view
        this.$router.replace({
          name:   'c-cluster-manager-pages-page',
          params: {
            cluster: 'local',
            page:    'rke-templates'
          }
        });
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
    class="prompt-restore"
    :show-highlight-border="false"
  >
    <h4
      slot="title"
      class="text-default-text"
      v-html="t('promptSaveAsRKETemplate.title', { cluster: cluster.displayName }, true)"
    />

    <div
      slot="body"
      class="pl-10 pr-10"
    >
      <form>
        <p class="pt-10 pb-10">
          {{ t('promptSaveAsRKETemplate.description') }}
        </p>
        <Banner
          color="warning"
          label-key="promptSaveAsRKETemplate.warning"
        />

        <LabeledInput
          ref="templateName"
          v-model="name"
          :label="t('promptSaveAsRKETemplate.name')"
          :required="true"
        />
      </form>
    </div>

    <div
      slot="actions"
      class="buttons"
    >
      <button
        class="btn role-secondary mr-10"
        @click="close"
      >
        {{ t('generic.cancel') }}
      </button>

      <AsyncButton
        mode="create"
        :disabled="name.length <= 0"
        @click="apply"
      />

      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
    </div>
  </Card>
</template>
<style lang='scss' scoped>
  .prompt-restore {
    margin: 0;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
</style>
