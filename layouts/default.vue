
<template>
  <div class="root">
    <header>
      <n-link to="/">
        Left -- {{ $store.state.namespaces }}
      </n-link>

      <div class="header-right">
        Right
      </div>
    </header>

    <div class="middle">
      <nav>
        <NamespacePicker />
        <ul class="list-unstyled packages">
          <n-link v-for="pkg in packages" :key="pkg.name" :to="'/'+pkg.name" tag="li" class="package">
            <a>{{ pkg.label }}</a>
            <ul v-if="pkg.children" class="list-unstyled children">
              <n-link v-for="child in pkg.children" :key="child.route" :to="child.route" tag="li">
                <a>{{ child.label }} ({{ child.count }})</a></li>
              </n-link>
            </ul>
          </n-link>
        </ul>

        <div class="logo">
          <img src="~/assets/images/logo.svg" alt="logo" width="100%" />
        </div>
      </nav>

      <main>
        <nuxt />
      </main>
    </div>

    <footer>
      Footer stuff
    </footer>
  </div>
</template>

<script>
import { THEME } from '~/store/prefs';
import NamespacePicker from '~/components/NamespacePicker';

export default {
  components: { NamespacePicker },

  head() {
    const theme = this.$store.getters['prefs/get'](THEME);

    return { bodyAttrs: { class: `theme-${ theme }` } };
  },

  computed: {
    packages() {
      const namespaces = this.$store.getters['namespaces'] || [];

      const children = this.$store.getters['v1/counts'].map(res => ({
        label: res.label,
        count: matchingCounts(res, namespaces),
        route: `/explorer/${ res.id }/`

      })).filter(x => x.count > 0);

      const data = [
        {
          name:  'cluster',
          label: 'Cluster Info'
        },
        {
          name:     'explorer',
          label:    'Explorer',
          children,
        }
      ];

      return data;

      function matchingCounts(obj, namespaces) {
        if ( namespaces.includes('_all') ) {
          return obj.count;
        }

        if ( !obj.byNamespace ) {
          return 0;
        }

        let out = 0;

        for ( let i = 0 ; i < namespaces.length ; i++ ) {
          out += obj.byNamespace[namespaces[i]] || 0;
        }

        return out;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
  .root {
    display: flex;
    min-height: 100vh;
    flex-direction: column;
  }

  .middle {
    display: flex;
    flex: 1;
  }

  $header-height: 70px;
  $nav-width: 200px;

  HEADER {
    height: $header-height;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--header-bg);
    padding: 10px;

    .nav-user {
      margin: 0;
      display: flex;

      LI {
        list-style-type: none;
      }

      .btn {
        padding: 0;
      }
    }

    .header-right {
      display: flex;
      background-color: var(--header-bg);

      .nav-account {
        font-size: 3rem;
      }

      .nav-create {
        font-size: 3rem;
      }
    }
  }

  NAV {
    position: relative;
    background-color: var(--nav-bg);
    flex: 0 0 $nav-width;
    padding: 0;

    .logo {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: solid thin var(--border);
      padding: 20px;
    }

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

  MAIN {
    flex: 1;
    padding: 40px;
  }

  FOOTER {
    background-color: var(--footer-bg);
  }
</style>
