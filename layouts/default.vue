
<script>
import { mapGetters } from 'vuex';
import { addObject, removeObject } from '../utils/array';
import Accordion from '@/components/Accordion';
import ActionMenu from '@/components/ActionMenu';
import NamespacePicker from '@/components/NamespacePicker';
import { mapPref, THEME, EXPANDED_GROUPS } from '@/store/prefs';
import { explorerPackage, rioPackage } from '@/utils/packages';

export default {
  components: {
    Accordion, ActionMenu, NamespacePicker
  },

  head() {
    const theme = this.$store.getters['prefs/get'](THEME);

    return { bodyAttrs: { class: `theme-${ theme }` } };
  },

  computed: {
    ...mapGetters(['preloaded']),

    packages() {
      const namespaces = this.$store.getters['namespaces'] || [];
      const counts = this.$store.getters['v1/counts'];

      const explorer = explorerPackage(this.$router, counts, namespaces);
      const rio = rioPackage(this.$router, counts, namespaces);

      const out = [
        rio,
        explorer,
      ];

      return out.filter(x => !!x);
    },

    expandedGroups: mapPref(EXPANDED_GROUPS),
  },

  methods: {
    toggleGroup(route, expanded) {
      const groups = this.expandedGroups.slice();

      if ( expanded ) {
        addObject(groups, route);
      } else {
        removeObject(groups, route);
      }

      this.$store.commit('prefs/set', { key: EXPANDED_GROUPS, val: groups });
    },

    isExpanded(name) {
      return this.expandedGroups.includes(name);
    }
  }
};
</script>

<template>
  <div class="dashboard">
    <header>
      <div class="header-left">
        <n-link to="/">
          <img src="~/assets/images/logo.svg" alt="logo" width="100%" />
        </n-link>
      </div>

      <div class="header-middle">
      </div>

      <div class="header-right text-right">
        <nuxt-link :to="{name: 'prefs'}">
          <i class="icon icon-3x icon-gear" />
        </nuxt-link>
      </div>
    </header>

    <nav v-if="preloaded">
      <NamespacePicker class="mt-20 mb-0" />

      <div v-for="pkg in packages" :key="pkg.name" class="package">
        <h6>
          {{ pkg.label }}
        </h6>
        <Accordion
          v-for="collection in pkg.collections"
          :id="pkg.name + '_' + collection.name"
          :key="collection.name"
          :label="collection.label"
          :expanded="isExpanded"
          class="collection"
          @on-toggle="toggleGroup"
        >
          <template>
            <Accordion
              v-for="group in collection.groups"
              :id="pkg.name + '_' + collection.name + '_' + group.name"
              :key="group.name"
              :label="group.label"
              :expanded="isExpanded"
              class="group"
              @on-toggle="toggleGroup"
            >
              <template>
                <ul v-if="group.children" class="list-unstyled child">
                  <n-link v-for="child in group.children" :key="child.route" :to="child.route" tag="li" class="child">
                    <a>
                      <span class="label">{{ child.label }}</span>
                      <span class="count">{{ child.count }}</span>
                    </a>
                  </n-link>
                </ul>
              </template>
            </Accordion>
          </template>
        </Accordion>
        <ul v-if="pkg.children" class="list-unstyled child">
          <n-link v-for="child in pkg.children" :key="child.route" :to="child.route" tag="li" class="child">
            <a>
              <span class="label">{{ child.label }}</span>
              <span v-if="child.count" class="count">{{ child.count }}</span>
            </a>
          </n-link>
        </ul>
      </div>
    </nav>

    <main>
      <nuxt />
    </main>

    <ActionMenu />
  </div>
</template>

<style lang="scss" scoped>
  $header-height: 60px;
  $nav-width: 250px;
  $right-width: 100px;
  $logo-height: 40px;

  .dashboard {
    display: grid;
    height: 100vh;
    grid-template-areas:
      "header header"
      "nav main";
    grid-template-columns: $nav-width auto;
    grid-template-rows: $header-height auto;
  }

  .theme-picker {
    position: relative;
    top: 2px;

    .light {
      color: white !important;
    }

    .dark {
      color: black !important;
    }
  }

  HEADER {
    background-color: var(--header-bg);
    grid-area: header;
    display: grid;
    grid-template-areas: "header-left header-middle header-right";
    grid-template-columns: $nav-width auto $right-width;
  }

  .header-left {
    padding: 20px 10px 0;
    grid-area: header-left;
  }

  .header-middle {
    padding: 10px 0;
    grid-area: header-middle;
  }

  .header-right {
    padding: 10px;
    grid-area: header-right;
  }

  .collection  {
    &::v-deep > .body {
      margin-left: 10px;
      border-left: solid thin var(--border);
    }
  }

  NAV {
    grid-area: nav;
    position: relative;
    background-color: var(--nav-bg);
    padding: 0 10px;
    overflow-y: auto;

    .package:not(:first-child) {
      margin-top: 20px;
    }

    h6 {
      margin: 0;
    }

    ul {
      border-left: solid thin var(--border);
      margin-left: 10px;

      .child {
        width: calc(100% - 5px);
        position: relative;
        left: 2px;

        A {
          display: grid;
          grid-template-areas: "label count";
          grid-template-columns: auto 40px;

          font-size: 14px;
          padding: 10px 0 10px 10px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .label {
          grid-area: label;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .count {
          grid-area: count;
          font-size: 12px;
          text-align: right;
          justify-items: center;
          padding-right: 10px;
        }

        &.nuxt-link-active {
          background-color: var(--nav-active);
        }
      }
    }
  }

  .logo {
    grid-area: logo;
    text-align: center;
    border-top: solid thin var(--border);
    padding: 20px;
  }

  MAIN {
    grid-area: main;
    padding: 20px;
    overflow: auto;
  }
</style>
