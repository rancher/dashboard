<script>
import { mapState } from 'vuex';
import { debounce } from 'lodash';
import { findBy } from '../utils/array';
import { EXTENDED_SCOPES } from '@/store/github';

export const FILE_PATTERNS = {
  'dockerfile': /^Dockerfile(\..*)?$/i,
  'yaml':       /^.*\.ya?ml?$/i,
};

export default {
  props: {
    value: {
      type:     Object,
      required: true,
    },

    // Filter files displayed in dropdown by keys in FILE_PATTERNS
    filePattern: {
      type:    String,
      default: null,
    },

    preferredFile: {
      type:    String,
      default: null,
    }
  },

  data() {
    return {
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
    ...mapState({
      scopes:      state => state.github.scopes,
      recentRepos: state => state.github.repos,
    }),

    hasPrivate() {
      return this.scopes.includes('repo');
    },

    repoPlaceholder() {
      if ( this.loadingRecentRepos ) {
        return 'Loading...';
      } else {
        return 'Select a Repository...';
      }
    },

    branchPlaceholder() {
      if ( this.selectedRepo ) {
        if ( this.loadingBranches ) {
          return 'Loading...';
        } else {
          return 'Select a Branch...';
        }
      } else {
        return 'Select a Repository First';
      }
    },

    filePlaceholder() {
      if ( this.selectedBranch ) {
        if ( this.loadingFiles ) {
          return 'Loading...';
        } else {
          return 'Select a File...';
        }
      } else {
        return 'Select a Branch First';
      }
    }
  },

  created() {
    this.queueSearchRepos = debounce(this.searchRepos, 300);
  },

  mounted() {
    this.fetchRepos();
  },

  methods: {
    update() {
      if ( this.selectedRepo && this.selectedBranch && this.selectedFile ) {
        // Do something
      }
    },

    selectRepo(repo) {
      this.selectedFile = null;
      this.selectedBranch = null;
      this.selectedRepo = repo;
      this.fetchBranches(repo);
      this.update();
    },

    selectBranch(branch) {
      this.selectedFile = null;
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

        const res = await this.$store.dispatch('github/searchRepos', { search });

        this.repos = res;
      } catch (err) {
        this.repos = this.recentRepos;
      } finally {
        loading(false);
      }
    },

    async fetchRepos() {
      try {
        const res = await this.$store.dispatch('github/fetchRecentRepos');

        this.repos = res;
      } finally {
        this.loadingRecentRepos = false;
      }
    },

    async fetchBranches(repo) {
      this.loadingBranches = true;

      try {
        const res = await this.$store.dispatch('github/fetchBranches', { repo: this.selectedRepo });

        this.branches = res;

        if ( !this.selectedBranch ) {
          const master = findBy(this.branches, 'name', 'master');

          if ( master ) {
            this.selectBranch(master);
          }
        }
      } finally {
        this.loadingBranches = false;
      }
    },

    async fetchFiles(repo, branch) {
      try {
        const res = await this.$store.dispatch('github/fetchFiles', {
          repo:    this.selectedRepo,
          branch:  this.selectedBranch,
          pattern: FILE_PATTERNS[(this.filePattern || '').toLowerCase()],
        });

        this.files = res;

        if ( !this.selecteeFile && this.preferredFile ) {
          const file = findBy(this.files, 'path', this.preferredFile);

          if ( file ) {
            this.selectFile(file);
          }
        }
      } finally {
        this.loadingFiles = false;
      }
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
          :placeholder="repoPlaceholder"
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
          :placeholder="branchPlaceholder"
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
          :placeholder="filePlaceholder"
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
