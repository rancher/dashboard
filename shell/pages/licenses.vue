<script>
import Loading from '@shell/components/Loading';
import SortableTable from '@shell/components/SortableTable';
import TabTitle from '@shell/components/TabTitle';
import Banner from '@components/Banner/Banner.vue';
import LicenseSlideIn from '@shell/components/LicenseSlideIn.vue';

// Build the URL relative to the deployed router base — e.g. `/licenses.json`
// at root, `/dashboard/licenses.json` when the app is served from /dashboard.
// `routerBase` is injected by webpack DefinePlugin and always ends in `/`.
const LICENSES_URL = `${ process.env.routerBase || '/' }licenses.json`;

export default {
  name: 'Licenses',

  components: {
    Banner, Loading, SortableTable, TabTitle
  },

  async fetch() {
    this.loading = true;
    this.notFound = false;
    this.errorStatus = null;
    try {
      const res = await fetch(LICENSES_URL);

      if (res.status === 404) {
        this.notFound = true;
      } else if (!res.ok) {
        this.errorStatus = res.status;
      } else {
        this.data = await res.json();
      }
    } catch (e) {
      this.errorStatus = e?.message || 'Network error';
    } finally {
      this.loading = false;
    }
  },

  data() {
    return {
      loading:     true,
      data:        null,
      notFound:    false,
      errorStatus: null,
      headers:     [
        {
          name:     'name',
          labelKey: 'about.licenses.table.package',
          value:    'name',
          sort:     ['name']
        },
        {
          name:     'license',
          labelKey: 'about.licenses.table.license',
          value:    'license',
          sort:     ['license', 'name'],
          width:    200
        }
      ]
    };
  },

  computed: {
    rows() {
      const pkgs = this.data?.packages || [];

      return pkgs.map((p, i) => ({
        ...p,
        _key:    `${ p.name }#${ i }`,
        license: p.license || 'unknown'
      }));
    },

    licensesMap() {
      return this.data?.licenses || {};
    }
  },

  methods: {
    openPanel(pkg) {
      const ref = pkg.licenseRef;
      const content = ref ? this.licensesMap[ref] : null;

      this.$store.commit('slideInPanel/open', {
        component:      LicenseSlideIn,
        componentProps: {
          packageName:  pkg.name,
          licenseId:    pkg.license,
          licenseField: pkg.licenseField || null,
          home:         pkg.home || null,
          content:      content || null,
          title:        pkg.name,
          width:        'wide'
        }
      });
    }
  }
};
</script>

<template>
  <Loading v-if="loading" />
  <div
    v-else
    class="licenses-page"
  >
    <div class="title-block mb-10">
      <h1 class="breadcrumb-title">
        <router-link
          :to="{ name: 'about' }"
          class="crumb"
        >
          {{ t('about.title') }}
        </router-link>
        <span class="separator">/</span>
        <TabTitle breadcrumb="vendor-only">
          {{ t('about.licenses.page.title') }}
        </TabTitle>
      </h1>
    </div>

    <Banner
      v-if="notFound"
      color="warning"
      :label="t('about.licenses.page.notFound', { file: 'licenses.json' })"
    />

    <Banner
      v-else-if="errorStatus"
      color="error"
      :label="t('about.licenses.page.error', { status: errorStatus })"
    />

    <template v-else>
      <p class="summary color-fg-muted mb-20">
        {{ t('about.licenses.page.hint') }}
      </p>

      <SortableTable
        :rows="rows"
        :headers="headers"
        key-field="_key"
        mode="view"
        :search="true"
        :paging="true"
        :row-actions="false"
        :table-actions="false"
        default-sort-by="name"
        class="licenses-table"
      >
        <template #col:name="{ row }">
          <td>
            <button
              type="button"
              class="btn role-link package-link"
              :aria-label="t('about.licenses.table.viewFor', { license: row.license, name: row.name })"
              @click="openPanel(row)"
            >
              {{ row.name }}
            </button>
          </td>
        </template>
      </SortableTable>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.licenses-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  .title-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .breadcrumb-title {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0;

    .crumb {
      color: var(--link);
    }

    .separator {
      color: var(--muted);
      font-weight: normal;
    }
  }

  .summary {
    font-size: 13px;
  }

  .package-link {
    padding: 0;
    height: auto;
    min-height: 0;
    line-height: inherit;
    text-align: left;
  }

  .licenses-table {
    margin-bottom: 16px;
  }
}
</style>
