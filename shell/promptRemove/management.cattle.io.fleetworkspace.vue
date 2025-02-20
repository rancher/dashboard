<script>
import { resourceNames } from '@shell/utils/string';
import { Banner } from '@components/Banner';
import { mapGetters, mapState } from 'vuex';
import { isEmpty } from 'lodash';
import { FLEET } from '@shell/config/types';

export default {
  name: 'PromptRemoveFleetWorkspacesDialog',

  emits: ['errors'],

  components: { Banner },

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
    },

    close: {
      type:     Function,
      required: true
    },

    doneLocation: {
      type:    Object,
      default: () => {}
    }
  },

  async fetch() {
    if (this.$store.getters['management/schemaFor']( FLEET.GIT_REPO )) {
      this.$store.dispatch('management/findAll', { type: FLEET.GIT_REPO }).then(() => {
        this.loading = false;
      });
    }
  },

  data() {
    return {
      loading: true,
      errors:  [],
    };
  },

  computed: {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),

    workspaceNames() {
      return this.toRemove.map((p) => p.nameDisplay);
    },

    workspacesHavingGitRepos() {
      const array = [];

      this.value.forEach((workspace) => {
        const count = workspace.repos.length;

        if (count > 0) {
          array.push({
            name: workspace.nameDisplay,
            count,
          });
        }
      });

      return array;
    },

    visible() {
      return this.workspacesHavingGitRepos.slice(0, 5);
    },

    showWarning() {
      return this.visible.length > 0;
    },
  },

  methods: {
    resourceNames,

    async remove(confirm) {
      let goTo;

      if (this.doneLocation) {
        goTo = { ...this.doneLocation };
      }

      try {
        await Promise.all(this.value.map((resource) => resource.remove()));

        if ( goTo && !isEmpty(goTo) ) {
          this.value?.[0]?.currentRouter().push(goTo);
        }
        this.close();
      } catch (err) {
        this.$emit('errors', err);
        confirm(false);
      }
    },
  }
};
</script>

<template>
  <div class="mt-10">
    <div class="mb-30">
      {{ t('promptRemove.attemptingToRemove', { type }) }} <span
        v-clean-html="resourceNames(workspaceNames, t)"
        class="description"
      />
    </div>
    <div class="body">
      <i
        v-if="loading"
        class="mr-5 icon icon-spinner icon-spin icon-lg"
      />
      <Banner
        v-else-if="showWarning"
        color="warning"
        class="warning"
      >
        <div class="content">
          <span v-clean-html="t('fleet.workspaces.remove.warning.part1')" />
          <div class="list">
            <li
              v-for="(ws, i) in visible"
              :key="i"
            >
              <span v-clean-html="t('fleet.workspaces.remove.warning.part2', { name: ws.name, count: ws.count }, true)" />
            </li>
            <span v-if="workspacesHavingGitRepos > visible">...</span>
          </div>
        </div>
      </Banner>
    </div>
    <Banner
      v-for="(error, i) in errors"
      :key="i"
      class=""
      color="error"
      :label="error"
    />
  </div>
</template>

<style lang='scss' scoped>
  .description {
    font-weight: 600;
  }

  .body {
    display: flex;
    justify-content: center;
  }

  .warning {
    .content {
      .list {
        padding: 5px;

        li span {
          position: relative;
          left: -5px;
        }
      }
    }
  }

  .actions {
    text-align: right;
  }
</style>
