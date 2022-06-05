<script>
import { mapState } from 'vuex';
import debounce from 'lodash/debounce';
import { findBy } from '@shell/utils/array';
import { EXTENDED_SCOPES } from '@shell/store/github';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export const FILE_PATTERNS = {
  dockerfile: /^Dockerfile(\..*)?$/i,
  riofile:    /^Riofile(\..*)?$/i,
  yaml:       /^.*\.ya?ml?$/i,
};

export default {
  components: { LabeledSelect },
  props:      {
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
    },

    fileKey: {
      type:    String,
      default: 'dockerfile',
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

  async mounted() {
    await this.fetchRepos();

    if ( this.value && this.value.repo ) {
      const repo = await this.$store.dispatch('github/fetchRepoByUrl', this.value.repo);

      if ( !repo ) {
        return;
      }

      this.selectRepo(repo);

      const branch = await this.$store.dispatch('github/fetchBranch', { repo, branch: this.value.branch });

      if ( !branch ) {
        return;
      }

      this.selectBranch(branch);

      const file = await this.$store.dispatch('github/fetchFile', {
        repo,
        branch,
        file: this.value.file || this.preferredFile
      });

      if ( !file ) {
        return;
      }

      this.selectFile(file);
    }
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
      if ( repo ) {
        this.fetchBranches(repo);
      }

      this.update();
    },

    selectBranch(branch) {
      this.selectedFile = null;
      this.selectedBranch = branch;
      if ( branch ) {
        this.fetchFiles(this.selectedRepo, branch);
      }
    },

    selectFile(file) {
      this.selectedFile = file;
      this.value.repo = this.selectedRepo.clone_url;
      this.value.branch = this.selectedBranch.name;
      delete this.value.revision;
      this.value[this.fileKey] = file.path;
      this.$emit('input', this.value);
    },

    async expandScope() {
      await this.$store.dispatch('github/forgetCache');
      this.$store.dispatch('auth/redirectTo', {
        provider: 'github',
        scopes:   EXTENDED_SCOPES,
        backTo:   this.$route.fullPath
      });
    },

    onSearchRepos(search, loading) {
      loading(true);
      this.queueSearchRepos(search, loading);
    },

    async searchRepos(search, loading) {
      const recent = await this.$store.dispatch('github/fetchRecentRepos');

      if ( !search ) {
        this.repos = recent;
        loading(false);

        return;
      }

      try {
        loading(true);

        const remote = await this.$store.dispatch('github/searchRepos', { search });
        let matchingRecent = [];

        if ( recent ) {
          matchingRecent = recent.filter((x) => {
            return x.full_name.toLowerCase().includes(search.toLowerCase()) &&
            !findBy(remote, 'full_name', x.full_name);
          });
        }

        this.repos = [...matchingRecent, ...remote];
      } catch (err) {
        this.repos = recent;
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

        if ( !this.selectedFile && this.preferredFile ) {
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
        <LabeledSelect
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
        </LabeledSelect>
      </div>
      <div class="col span-4">
        <LabeledSelect
          :disabled="!selectedRepo || loadingBranches"
          :placeholder="branchPlaceholder"
          :options="branches"
          label="name"
          :value="selectedBranch"
          :clearable="false"
          @input="selectBranch"
        >
        </LabeledSelect>
      </div>
      <div class="col span-4">
        <LabeledSelect
          :disabled="!selectedBranch"
          :placeholder="filePlaceholder"
          :options="files"
          label="path"
          :value="selectedFile"
          :clearable="false"
          @input="selectFile"
        >
        </LabeledSelect>
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
