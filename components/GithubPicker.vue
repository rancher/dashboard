<script>
import { mapState } from 'vuex';
import { debounce } from 'lodash';
import { addParam, parseLinkHeader } from '@/utils/url';
import { addObjects, isArray } from '@/utils/array';
import { EXTENDED_SCOPES } from '@/store/auth';

const API_BASE = 'https://api.github.com/';

export default {
  props: {
    value: {
      type:     Object,
      required: true,
    },

    // filter files displayed in dropdown - default to .yml and Dockerfile files
    filePattern: {
      type:    RegExp,
      default: () => {
        return new RegExp('\.ya?ml$|^Dockerfile(\..*)?', 'i');
      }
    },
  },

  data() {
    return {
      scopes:      [],
      recentRepos: [],
      repos:       [],
      branches:    [],
      files:       [],

      loadingRecentRepos: true,
      loadingBranches:    true,
      loadingFiles:       true,

      selectedRepo:   null,
      selectedBranch: null,
      selectedFile:   null
    };
  },

  computed:   {
    hasPrivate() {
      return this.scopes.includes('repo');
    }
  },

  created() {
    this.queueSearchRepos = debounce(this.searchRepos, 300);
  },

  mounted() {
    this.fetchRepos();
  },

  methods: {
    selectRepo(repo) {
      this.selectedBranch = null;
      this.selectedRepo = repo;
      this.$emit('selectedRepo', repo);
      this.fetchBranches(repo);
    },

    selectBranch(branch) {
      this.selectedBranch = branch;
      this.$emit('selectedBranch', branch);
      this.fetchFiles(this.selectedRepo, branch);
    },

    selectFile(file) {
      this.selectedFile = file;
      this.$emit('selectedFile', file);
    },

    expandScope() {
      this.$store.dispatch('auth/redirectToGithub', {
        scopes: EXTENDED_SCOPES,
        backTo: this.$route.fullPath
      });
    },

    onSearchRepos(search, loading) {
      loading(true);
      this.queueSearchRepos(search, loading);
    },

    async searchRepos(search, loading) {
      if ( !search ) {
        this.repos = this.recentRepos;
        loading(false);

        return;
      }

      try {
        loading(true);
        const res = await this.apiList(`/search/repositories?q=${ escape(search) }`, { depaginate: false });

        this.repos = res;
      } catch (err) {
        this.repos = this.recentRepos;
      } finally {
        loading(false);
      }
    },

    async fetchRepos() {
      try {
        if ( !this.recentRepos.length) {
          const res = await this.apiList('/user/repos?sort=updated', { depaginate: false });

          this.recentRepos = res;
          this.repos = res.slice();
        }
      } finally {
        this.loadingRecentRepos = false;
      }
    },

    async fetchBranches(repo) {
      this.loadingBranches = true;

      const url = repo.branches_url.replace('{/branch}', '');

      const res = await this.apiList(url);

      this.branches = res;
      this.loadingBranches = false;
    },

    async fetchFiles(repo, branch) {
      let url = repo.trees_url.replace('{/sha}', `/${ branch.commit.sha }`);

      url = addParam(url, 'recursive', 1);

      const res = await this.apiList(url, { objectKey: 'tree' });

      this.files = res.filter(file => file.type === 'blob' && file.path.match(this.filePattern));
      this.loadingFiles = false;
    },

    proxifyUrl(url) {
      // Strip off absolute links to github API
      if ( url.startsWith(API_BASE) ) {
        url = url.substr(API_BASE.length);
      }

      // Add our proxy prefix
      url = `/v1/github/${ url.replace(/^\/+/, '') }`;

      // Less pages please
      addParam(url, 'per_page', 100);

      return url;
    },

    async apiList(url, { depaginate = true, onPageFn = null, objectKey = 'items' } = {}) {
      const out = [];

      url = this.proxifyUrl(url);

      while ( true ) {
        console.log('Github Request:', url);
        const res = await this.$store.dispatch('rancher/request', { url });
        const links = parseLinkHeader(res._headers['link']);
        const scopes = res._headers['x-oauth-scopes'];

        if ( scopes ) {
          this.scopes = scopes;
        }

        addObjects(out, isArray(res) ? res : res[objectKey]);

        if ( onPageFn ) {
          onPageFn(out);
        }

        if ( depaginate && links.next ) {
          url = this.proxifyUrl(links.next);
        } else {
          break;
        }
      }

      return out;
    },
  },
};

</script>

<template>
  <div class="picker">
    <div v-if="!hasPrivate && !loadingRecentRepos" class="expand-scope pb-20">
      <i class="icon icon-info" /> Showing only public repos.  <a
        href="#"
        class="text-primary bg-transparent"
        @click="expandScope"
      >
        Click here
      </a>
      to grant Rio access to read private repos.
    </div>
    <div class="row">
      <div class="col span-4">
        <v-select
          :placeholder="loadingRecentRepos ? 'Loading...' : 'Choose a Repository...'"
          :disabled="loadingRecentRepos"
          :options="repos"
          label="full_name"
          :value="selectedRepo"
          :clearable="false"
          @search="onSearchRepos"
          @input="selectRepo"
        >
          <template #spinner="{loading}">
            <span v-show="loading">
              <i class="icon icon-spinner icon-spin" /> Loading&hellip;
            </span>
          </template>
          <template #no-options>
            Type to search GitHub repositories
          </template>
          <template slot="option" slot-scope="option">
            <div class="d-center">
              <img :src="option.owner.avatar_url" />
              {{ option.full_name }}
            </div>
          </template>
          <template slot="selected-option" slot-scope="option">
            <div class="selected d-center">
              <img :src="option.owner.avatar_url" />
              {{ option.full_name }}
            </div>
          </template>
        </v-select>
      </div>
      <div class="col span-4">
        <v-select
          :disabled="!selectedRepo || loadingBranches"
          placeholder="Choose branch"
          :options="branches"
          label="name"
          :value="selectedBranch"
          :clearable="false"
          @input="selectBranch"
        >
        </v-select>
      </div>
      <div class="col span-4">
        <v-select
          :disabled="!selectedBranch"
          placeholder="Choose file"
          :options="files"
          label="path"
          :value="selectedFile"
          :clearable="false"
          @input="selectFile"
        >
        </v-select>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.picker {
  img {
    height: 30px;
    margin-right: 1rem;
  }

  .d-center {
    display: flex;
    align-items: center;
  }

  .selected img {
    width: auto;
    max-height: 23px;
    margin-right: 0.5rem;
  }

  .v-select .dropdown li {
    border-bottom: 1px solid rgba(112, 128, 144, 0.1);
  }

  .v-select .dropdown li:last-child {
    border-bottom: none;
  }

  .v-select .dropdown li a {
    padding: 10px 20px;
    width: 100%;
    font-size: 1.25em;
    color: #3c3c3c;
  }

  .v-select .dropdown-menu .active > a {
    color: #fff;
  }
}
</style>
