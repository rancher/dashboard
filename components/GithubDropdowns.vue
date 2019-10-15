<script>
import { mapState } from 'vuex';
export default {
  props: {
    // filter files displayed in dropdown - default to .yml and Dockerfile files
    filePattern: {
      type:    RegExp,
      default: () => {
        new RegExp('^.*\.(yml)$|.*(Dockerfile)\..*', 'i');
      }
    },
    // page to redirect back to from GH
    path: {
      type:    String,
      default: ''
    }
  },
  data() {
    return {
      selectedRepo:   null,
      selectedBranch: null,
      selectedFile:   null
    };
  },
  computed:   {
    ...mapState('github', ['repositories', 'branches', 'files', 'scopes']),
    hasPrivate() {
      return this.scopes.includes('repo');
    }
  },
  mounted() {
    this.$store.dispatch('github/getRepositories', { page: 0 });
  },
  methods: {
    selectRepo(repo) {
      this.selectedBranch = null;
      this.selectedRepo = repo;
      this.$emit('selectedRepo', repo);
      this.$store.dispatch('github/getBranches', { repo });
    },
    selectBranch(branch) {
      this.selectedBranch = branch;
      this.$emit('selectedBranch', branch);
      this.$store.dispatch('github/getContents', {
        repo:        this.selectedRepo,
        branch:      this.selectedBranch,
        filePattern: this.filePattern
      });
    },
    selectFile(file) {
      this.$emit('selectedFile', file);
    },
    expandScope() {
      this.$store.dispatch('auth/redirectToGithub', { scopes: ['repo'], route: this.path } );
    }
  },
};

</script>

<template>
  <div>
    <div v-if="!hasPrivate" class="expand-scope">
      <a
        href="#"
        class="text-primary bg-transparent"
        @click="expandScope"
      >
        grant access to private repos
      </a>
    </div>
    <div class="repo-dropdown">
      <v-select
        placeholder="Choose repository"
        :options="repositories"
        label="name"
        :value="selectedRepo"
        :clearable="false"
        @input="selectRepo"
      >
      </v-select>
    </div>
    <div class="branch-dropdown">
      <v-select
        v-if="selectedRepo"
        placeholder="Choose branch"
        :options="branches"
        label="name"
        :value="selectedBranch"
        :clearable="false"
        @input="selectBranch"
      >
      </v-select>
    </div>
    <div class="file-dropdown">
      <v-select
        v-if="selectedBranch"
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
</template>
