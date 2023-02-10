<script>
import SortableTable from '@shell/components/SortableTable';
import RadioButton from '@components/Form/Radio/RadioButton';
import debounce from 'lodash/debounce';
import { isArray } from '@shell/utils/array';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import some from 'lodash/some';

export default {
  components: {
    LabeledSelect,
    SortableTable,
    RadioButton,
    LabeledInput,
  },

  props: {
    selection: {
      type:    Object,
      default: null
    }
  },
  data() {
    const commitsTableHeaders = [
      {
        name:  'index',
        label: this.t('githubPicker.tableHeaders.choose.label'),
        width: 60,
      }, {
        name:          'sha',
        label:         this.t('githubPicker.tableHeaders.sha.label'),
        width:         90,
        formatter:     'Link',
        formatterOpts: { urlKey: 'html_url' },
        value:         'sha'
      },
      {
        name:  'author',
        label: this.t('githubPicker.tableHeaders.author.label'),
        width: 190,
        value: 'author.login',
        sort:  'author.login',
      },
      {
        name:  'message',
        label: this.t('githubPicker.tableHeaders.message.label'),
        value: 'message',
        sort:  'message',
      },
      {
        name:        'date',
        width:       220,
        label:       this.t('githubPicker.tableHeaders.date.label'),
        value:       'date',
        sort:        ['date:desc'],
        formatter:   'Date',
        defaultSort: true,
      },
    ];

    return {
      loadingRecentRepos: true,
      loadingBranches:    true,
      loadingFiles:       true,
      loadingCommits:     true,

      hasError: {
        repo:    false,
        branch:  false,
        commits: false,
        message: null,
      },
      showSelections: false,
      oldUsername:    null,

      repos:    [],
      branches: [],
      commits:  [],

      selectedAccOrOrg: null,
      selectedRepo:     null,
      selectedBranch:   null,
      selectedCommit:   false,
      commitsTableHeaders,
    };
  },

  mounted() {
    // Keeps the selected repo/branch/commit when the user switches between steps
    if (this.selection) {
      this.selectedAccOrOrg = this.selection.usernameOrOrg;
      this.selectedRepo = this.selection.repo;
      this.selectedBranch = this.selection.branch;

      // API calls data
      this.repos = this.selection.sourceData.repos;
      this.branches = this.selection.sourceData.branches;
      this.commits = this.selection.sourceData.commits;
    }
  },
  computed: {
    preparedRepos() {
      return this.prepareArray(this.repos);
    },
    preparedBranches() {
      return this.prepareArray(this.branches);
    },
    preparedCommits() {
      return this.prepareArray(this.commits, true);
    },
  },
  methods: {
    reset() {
      this.selectedRepo = null;
      this.selectedBranch = null;
      this.selectedCommit = false;

      this.communicateReset();
    },
    communicateReset() {
      this.$emit('githubData', {
        selectedAccOrOrg: this.selectedAccOrOrg,
        repo:             this.selectedRepo,
        commitSha:        this.selectedCommit,
      });
    },
    async fetchRepos() {
      try {
        if (this.selectedAccOrOrg.length) {
          this.selectedRepo = null;

          const res = await this.$store.dispatch('github/fetchRecentRepos', { username: this.selectedAccOrOrg });

          this.repos = res;
          this.hasError.repo = false;
          this.resetFetchErrorMessage();

          // Reset selections once username changes
          if (this.oldUsername !== this.selectedAccOrOrg) {
            this.oldUsername = this.selectedAccOrOrg;

            // Resets state, just in case.
            this.communicateReset();

            return this.reset();
          }
        }
      } catch (error) {
        this.hasError.repo = true;
        this.hasError.message = error.message;
        this.selectedBranch = null;
      } finally {
        this.loadingRecentRepos = false;
      }
    },

    async fetchBranches() {
      this.loadingBranches = true;
      this.selectedBranch = null;
      this.selectedCommit = false;

      this.communicateReset();

      try {
        const res = await this.$store.dispatch('github/fetchBranches', { repo: this.selectedRepo, username: this.selectedAccOrOrg });

        this.branches = res;
        this.hasError.branch = false;
        this.resetFetchErrorMessage();
      } catch (error) {
        this.hasError.branch = true;
        this.hasError.message = error.message;
      } finally {
        this.loadingBranches = false;
      }
    },
    async fetchCommits() {
      this.loadingCommits = true;
      this.showSelections = false;
      this.selectedCommit = false;

      this.communicateReset();

      try {
        const res = await this.$store.dispatch('github/fetchCommits', {
          repo:     this.selectedRepo,
          username: this.selectedAccOrOrg,
          branch:   this.selectedBranch,
        });

        this.commits = res;
        this.resetFetchErrorMessage();
      } catch (error) {
        this.hasError.commits = true;
        this.hasError.message = error.message;
      } finally {
        this.loadingCommits = false;
      }
    },
    resetFetchErrorMessage() {
      this.hasError.message = null;
    },
    prepareArray(arr, commits) {
      if (!isArray(arr)) {
        return;
      }

      if (commits) {
        // Simplify the commits structure in the array

        return arr.reduce((acc, cur) => {
          acc.push({
            message:   cur.commit.message,
            html_url:  cur.html_url,
            sha:       this.trimCommit(cur.sha),
            commitId:  cur?.sha,
            author:    cur.author,
            isChecked: false,
            date:      cur?.commit.committer.date
          });

          return acc;
        }, []);
      }

      // Handles repos & branches
      const res = arr.reduce((acc, cur) => {
        acc.push(cur.name);

        return acc;
      }, []);

      return res;
    },
    trimCommit(commit) {
      return !!commit ? commit.slice(0, 7) : undefined;
    },
    final(commitId) {
      this.selectedCommit = this.commits.filter(ele => ele.sha === commitId)[0];

      if (this.selectedAccOrOrg && this.selectedRepo && this.selectedCommit) {
        this.$emit('githubData', {
          selectedAccOrOrg: this.selectedAccOrOrg,
          repo:             this.selectedRepo,
          branch:           this.selectedBranch,
          commitSha:        this.selectedCommit.sha,
          sourceData:       {
            repos:    this.repos,
            branches: this.branches,
            commits:  this.commits
          }

        });

        this.showSelections = true;
      }

      return null;
    },
    async searchForResult(query) {
      if (!query.length) {
        return;
      }

      if (!this.selectedBranch) {
        await this.searchRepo(query);
      } else {
        await this.searchBranch(query);
      }
    },
    async searchRepo(query) {
      try {
        if (query.length) {
        // Check if the result is already in the fetched list.
          const resultInCurrentState = some(this.repos, { name: query });

          if (!resultInCurrentState) {
          // Search for specific repo under the username
            const res = await this.$store.dispatch('github/search', { repo: query, username: this.selectedAccOrOrg });

            if (res.message) {
              this.hasError.repo = true;
            } else {
              if (res.length >= 1) {
                this.repos = res;
              } else {
                return this.repos;
              }

              this.hasError.repo = false;
            }
          } else {
            return resultInCurrentState;
          }
        }
      } catch (error) {
        // this.hasError.repo = true;
        this.hasError.message = `Could't find repository with the name of ${ query }`;
      }
    },
    async searchBranch(query) {
      const res = await this.$store.dispatch('github/search', {
        repo:     this.selectedRepo,
        branch:   query,
        username: this.selectedAccOrOrg,
      });

      if (res.message) {
        this.hasError.branch = true;
      } else {
        this.branches = res;
        this.hasError.branch = false;
      }
    },
    onSearch: debounce(function(q) {
      this.searchForResult(q);
    }, 1000),
    status(value) {
      return !value ? null : 'error';
    },
    reposRules() {
      return this.hasError.repo ? this.t('githubPicker.errors.noAccount') : null;
    },
    branchesRules() {
      return this.hasError.branch ? this.t('githubPicker.errors.noBranch') : null;
    },
  }
};
</script>

<template>
  <div class="picker">
    <div class="row">
      <div class="spacer">
        <LabeledInput
          v-model="selectedAccOrOrg"
          data-testid="epinio_app-source_git-username"
          :tooltip="t('githubPicker.username.tooltip')"
          :label="t('githubPicker.username.inputLabel')"
          :required="true"
          :rules="[reposRules]"
          :delay="500"
          :status="status(hasError.repo)"
          @input="fetchRepos"
        />
      </div>

      <div
        v-if="repos.length && !hasError.repo"
        class="spacer"
      >
        <LabeledSelect
          v-model="selectedRepo"
          :required="true"
          :label="t('githubPicker.repo.inputLabel')"
          :options="preparedRepos"
          :clearable="true"
          :searchable="true"
          :reduce="(e) => e"
          :rules="[branchesRules]"
          :status="status(hasError.repo)"
          @search="onSearch"
          @input="fetchBranches"
        />
      </div>
      <!-- Deals with Branches  -->
      <div
        v-if="selectedRepo"
        class="spacer"
      >
        <LabeledSelect
          v-model="selectedBranch"
          :required="true"
          :label="t('githubPicker.branch.inputLabel')"
          :options="preparedBranches"
          :clearable="false"
          :reduce="(e) => e"
          :searchable="true"
          :status="status(hasError.branch)"
          @search="onSearch"
          @input="fetchCommits"
        />
      </div>
      <!-- Deals with Commits, display & allow to pick from it  -->
      <div
        v-if="selectedBranch && commits.length"
        class="commits-table mt-20"
      >
        <SortableTable
          :rows="preparedCommits"
          :headers="commitsTableHeaders"
          mode="view"
          key-field="sha"
          :search="true"
          :paging="true"
          :table-actions="false"
          :row-actions="false"
          :rows-per-page="10"
        >
          <template #cell:index="{row}">
            <RadioButton
              :value="selectedCommit.sha"
              :val="row.commitId"
              @input="final($event, row.commitId)"
            />
          </template>

          <template #cell:author="{row}">
            <div class="sortable-table-avatar">
              <template v-if="row.author">
                <img
                  :src="row.author.avatar_url"
                  alt=""
                >
                <a
                  :href="row.author.html_url"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  {{ row.author.login }}
                </a>
              </template>
              <template v-else>
                {{ t('githubPicker.tableHeaders.author.unknown') }}
              </template>
            </div>
          </template>
        </SortableTable>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.picker {
  .row {
    display: flex;
    flex-direction: column;
    margin: 6px 0;
  }

  img {
    height: 30px;
    margin-right: 1rem;

    .labeled-input {
      width: 100%;
    }
  }

  .sortable-table-avatar {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    img {
      width: 30px;
      height: 30px;
      border-radius: var(--border-radius);
    }
  }

  .spacer {
    max-width: 700px;
  }

  .commits-table {
    max-width: 1400px;
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
