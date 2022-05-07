<script>
import Group from '@/components/nav/Group';
// import { getVersionInfo } from '@/utils/version';
// import { HCI } from '@/config/types';
// import { ucFirst } from '@/utils/string';
// import { sortBy } from '@/utils/sort';
// import { BASIC, FAVORITE, USED } from '@/store/type-map';
// import { addObjects, replaceWith, addObject } from '@/utils/array';
// import { NAME as EXPLORER } from '@/config/product/explorer';
// import { NAME as NAVLINKS } from '@/config/product/navlinks';
import sideNavData from './sideNavData';
import { getVersionInfo } from '@/utils/version';
import { NAME as HARVESTER } from '@/config/product/harvester';

export default {
  components: { Group },
  props:      {
    clusterReady: {
      type:    Boolean,
      default: true,
    },
  },
  data() {
    const clusterId = this.$route.params.cluster;
    const isVirtualProduct =
      this.$store.getters['currentProduct'].name === HARVESTER;
    const showProductFooter = !!isVirtualProduct;
    const product = this.$store.getters['currentProduct'].name;
    const supportLink = { name: `c-cluster-${ product }-support` };
    const { displayVersion } = getVersionInfo(this.$store);
    const isSingleVirtualCluster =
      this.$store.getters['isSingleVirtualCluster'];
    const selectedLocaleLabel = this.$store.getters['i18n/selectedLocaleLabel'];
    const availableLocales = this.$store.getters['i18n/availableLocales'];

    return {
      availableLocales,
      clusterId,
      displayVersion,
      groups:           sideNavData,
      isSingleVirtualCluster,
      selectedLocaleLabel,
      showClusterTools: true,
      showProductFooter,
      supportLink,
    };
  },
  methods: {
    groupSelected(selected) {
      this.$refs.groups.forEach((grp) => {
        if (grp.canCollapse) {
          grp.isExpanded = (grp.group.name === selected.name);
        }
      });
    },
    collapseAll() {
      this.$refs.groups.forEach((grp) => {
        grp.isExpanded = false;
      });
    },

  }
};
</script>
<template>
  <nav v-if="clusterReady" class="side-nav">
    <div class="nav">
      <template v-for="g in groups">
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
      :to="{ name: 'c-cluster-explorer-tools', params: { cluster: clusterId } }"
    >
      <a class="tools-button" @click="collapseAll()">
        <i class="icon icon-gear" />
        <span>{{ t("nav.clusterTools") }}</span>
      </a>
    </n-link>
    <div v-if="showProductFooter" class="footer">
      <nuxt-link :to="supportLink" class="pull-right">
        {{ t("nav.support", { hasSupport: true }) }}
      </nuxt-link>

      <span
        v-tooltip="{ content: displayVersion, placement: 'top' }"
        class="clip version text-muted"
      >
        {{ displayVersion }}
      </span>

      <span v-if="isSingleVirtualCluster">
        <v-popover
          popover-class="localeSelector"
          placement="top"
          trigger="click"
        >
          <a class="locale-chooser">
            {{ locale }}
          </a>

          <template slot="popover">
            <ul class="list-unstyled dropdown" style="margin: -1px">
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
    <div v-else class="version text-muted">
      {{ displayVersion }}
    </div>
  </nav>
</template>

<style lang="scss">
NAV {
  grid-area: nav;
  position: relative;
  background-color: var(--nav-bg);
  border-right: var(--nav-border-size) solid var(--nav-border);
  overflow-y: auto;

  H6,
  .root.child .label {
    margin: 0;
    letter-spacing: normal;
    line-height: initial;

    A {
      padding-left: 0;
    }
  }
}

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
</style>
