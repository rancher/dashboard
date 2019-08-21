
<template>
  <div class="root">
    <header>
      <div class="header-left">
        <n-link to="/">
          <img src="~/assets/images/logo.svg" alt="logo" width="100%" />
        </n-link>
      </div>

      <div class="header-middle">
        <NamespacePicker />
      </div>

      <div class="header-right">
      </div>
    </header>

    <nav>
      <ul class="list-unstyled packages">
        <n-link v-for="pkg in packages" :key="pkg.name" :to="pkg.route" tag="li" class="package">
          <a>{{ pkg.label }}</a>
          <ul v-if="pkg.children" class="list-unstyled children">
            <n-link v-for="child in pkg.children" :key="child.route" :to="child.route" tag="li">
              <a>{{ child.label }}<span class="count">{{ child.count }}</span></a>
            </n-link>
          </ul>
        </n-link>
      </ul>
    </nav>

    <main>
      <nuxt />
    </main>
  </div>
</template>

<script>
import { THEME } from '~/store/prefs';
import { sortBy } from '~/utils/sort';
import NamespacePicker from '~/components/NamespacePicker';
import { groupsForCounts } from '~/utils/groups';

export default {
  components: { NamespacePicker },

  head() {
    const theme = this.$store.getters['prefs/get'](THEME);

    return { bodyAttrs: { class: `theme-${ theme }` } };
  },

  computed: {
    packages() {
      const namespaces = this.$store.getters['namespaces'] || [];
      const groups = groupsForCounts(this.$store.getters['v1/counts'], namespaces);

      const data = [
        /*
        {
          name:  'cluster',
          label: 'Cluster Info',
          route: '/cluster'
        },
        */
        ...sortBy(Object.values(groups), ['priority', 'label']),
      ];

      return data;
    }
  }
};
</script>

<style lang="scss" scoped>
  $header-height: 60px;
  $nav-width: 200px;
  $right-width: 100px;
  $logo-height: 40px;

  .root {
    display: grid;
    height: 100vh;
    grid-template-areas:
      "header header"
      "nav main";
    grid-template-columns: $nav-width auto;
    grid-template-rows: $header-height auto;
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

  NAV {
    grid-area: nav;
    position: relative;
    background-color: var(--nav-bg);
    padding: 0;
    overflow-y: auto;

    > UL {
      > LI {
          background-color: var(--nav-pkg);
          border-bottom: solid thin var(--border);

        > A {
          display: block;
          font-size: 14px;
          padding: 10px;
        }

        > UL {
          background-color: var(--nav-sub);

          > LI > A {
            display: block;
            font-size: 12px;
            padding: 10px 0 10px 20px;

            .count {
              float: right;
              padding-right: 10px;
            }
          }
        }

        &.nuxt-link-active > UL {
          background-color: var(--nav-cur-sub);

          > LI.nuxt-link-active {
            background-color: var(--nav-active);
          }
        }

        &.nuxt-link-exact-active > A {
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
  }
</style>
