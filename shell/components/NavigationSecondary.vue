<script>
import { mapState, mapGetters } from 'vuex';
import { CATALOG } from '@shell/config/types';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { getVersionInfo } from '@shell/utils/version';
import Group from '@shell/components/nav/Group';

export default {
  components: { Group },
  computed:   {
    ...mapState(['managementReady', 'clusterReady']),
    ...mapGetters(['clusterId', 'isSingleProduct', 'isExplorer']),
    ...mapGetters({ locale: 'i18n/selectedLocaleLabel', availableLocales: 'i18n/availableLocales' }),

    showClusterTools() {
      return this.isExplorer &&
             this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO) &&
             this.$store.getters['cluster/canList'](CATALOG.APP);
    },

    showProductFooter() {
      if (this.isVirtualProduct) {
        return true;
      } else {
        return false;
      }
    },

    isVirtualProduct() {
      return this.$store.getters['currentProduct'].name === HARVESTER;
    },

    supportLink() {
      const product = this.$store.getters['currentProduct'];

      if (product?.supportRoute) {
        return { ...product.supportRoute, params: { ...product.supportRoute.params, cluster: this.clusterId } };
      }

      return { name: `c-cluster-${ product?.name }-support` };
    },

    displayVersion() {
      if (this.isSingleProduct?.getVersionInfo) {
        return this.isSingleProduct?.getVersionInfo(this.$store);
      }

      const { displayVersion } = getVersionInfo(this.$store);

      return displayVersion;
    },
  },
  props: {
    groups: {
      type:    Array,
      default: () => [],
    }
  },
  methods: {
    collapseAll() {
      this.$refs.groups.forEach((grp) => {
        grp.isExpanded = false;
      });
    },

    groupSelected(selected) {
      this.$refs.groups.forEach((grp) => {
        if (grp.canCollapse) {
          grp.isExpanded = (grp.group.name === selected.name);
        }
      });
    },
  }
};
</script>

<template>
  <nav
    v-if="clusterReady"
    class="side-nav"
  >
    <div class="nav">
      <template v-for="(g) in groups">
        <Group
          ref="groups"
          :key="g.name"
          id-prefix=""
          class="package"
          :group="g"
          :can-collapse="!g.isRoot"
          :show-header="!g.isRoot"
          @selected="groupSelected($event)"
          @expand="groupSelected($event)"
        />
      </template>
    </div>
    <n-link
      v-if="showClusterTools"
      tag="div"
      class="tools"
      :to="{name: 'c-cluster-explorer-tools', params: {cluster: clusterId}}"
    >
      <a
        class="tools-button"
        @click="collapseAll()"
      >
        <i class="icon icon-gear" />
        <span>{{ t('nav.clusterTools') }}</span>
      </a>
    </n-link>
    <div
      v-if="showProductFooter"
      class="footer"
    >
      <nuxt-link
        :to="supportLink"
        class="pull-right"
      >
        {{ t('nav.support', {hasSupport: true}) }}
      </nuxt-link>

      <span
        v-tooltip="{content: displayVersion, placement: 'top'}"
        class="clip version text-muted"
      >
        {{ displayVersion }}
      </span>

      <span v-if="isSingleProduct">
        <v-popover
          popover-class="localeSelector"
          placement="top"
          trigger="click"
        >
          <a
            data-testid="locale-selector"
            class="locale-chooser"
          >
            {{ locale }}
          </a>

          <template slot="popover">
            <ul
              class="list-unstyled dropdown"
              style="margin: -1px;"
            >
              <li
                v-for="(label, name) in availableLocales"
                :key="name"
                class="hand"
                @click="switchLocale(name)"
              >
                {{ label }}
              </li>
            </ul>
          </template>
        </v-popover>
      </span>
    </div>
    <div
      v-else
      class="version text-muted"
    >
      {{ displayVersion }}
    </div>
  </nav>
</template>

<style lang="scss" scoped>
  NAV .tools {
    display: flex;
    margin: 10px;
    text-align: center;

    A {
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 5px;
      color: var(--body-text);
      display: flex;
      justify-content: center;
      outline: 0;
      flex: 1;
      padding: 10px;

      &:hover {
        background: var(--nav-hover);
        text-decoration: none;
      }

      > I {
        margin-right: 4px;
      }
    }

    &.nuxt-link-active:not(:hover) {
      A {
        background-color: var(--nav-active);
      }
    }
  }

  NAV .version {
    cursor: default;
    margin: 0 10px 10px 10px;
  }

  NAV .footer {
    margin: 20px;

    display: flex;
    flex: 0;
    flex-direction: row;
    > * {
      flex: 1;
      color: var(--link);

      &:last-child {
        text-align: right;
      }

      &:first-child {
        text-align: left;
      }

      text-align: center;
    }

    .version {
      cursor: default;
      margin: 0px;
    }

    .locale-chooser {
      cursor: pointer;
    }
  }

  .side-nav {
    display: flex;
    flex-direction: column;
    .nav {
      flex: 1;
      overflow-y: auto;
    }
  }

</style>
