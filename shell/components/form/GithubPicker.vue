<script>
import SortableTable from '@shell/components/SortableTable';
import RadioButton from '@components/Form/Radio/RadioButton';
import { NORMAN } from '@shell/config/types';
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

  data() {
    const eventHeaders = [
      {
        name:  'index',
        label: this.t('githubPicker.tableHeaders.choose.label'),
      },
      {
        name:  'sha',
        label: this.t('githubPicker.tableHeaders.sha.label'),
        value: 'sha',
      },
      {
        name:  'author',
        label: this.t('githubPicker.tableHeaders.author.label'),
        value: 'author.login',
      },
      {
        name:  'message',
        label: this.t('githubPicker.tableHeaders.message.label'),
        value: 'message',
      },
    ];

    return {
      loadingRecentRepos: true,
      loadingBranches:    true,
      loadingFiles:       true,
      loadingCommits:     true,

      hasError: {
        repo:     false,
        branch:   false,
        commits:  false,
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
      eventHeaders,
    };
  },

  computed: {
    defaultAvatar() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },
  },
  methods:  {
    reset() {
      this.selectedRepo = null;
      this.selectedBranch = null;
      this.selectedCommit = false;
    },
    async fetchRepos() {
      try {
        if (this.selectedAccOrOrg.length) {
          this.selectedRepo = null;

          const res = await this.$store.dispatch('github/fetchRecentRepos', { username: this.selectedAccOrOrg });

          if (res?.message) {
            this.hasError.repo = true;
          } else {
            this.repos = res;
            this.hasError.repo = false;
          }

          // Reset selections once username changes
          if (this.oldUsername !== this.selectedAccOrOrg) {
            this.oldUsername = this.selectedAccOrOrg;

            return this.reset();
          }
        }
      } finally {
        this.loadingRecentRepos = false;
      }
    },

    async fetchBranches() {
      this.loadingBranches = true;
      this.selectedBranch = null;
      this.selectedCommit = false;

      try {
        const res = await this.$store.dispatch('github/fetchBranches', { repo: this.selectedRepo, username: this.selectedAccOrOrg });

        if (res?.message) {
          this.hasError.branch = true;
        } else {
          this.branches = res;
          this.hasError.branch = false;
        }
      } finally {
        this.loadingBranches = false;
      }
    },
    async fetchCommits() {
      this.loadingCommits = true;
      this.showSelections = false;
      this.selectedCommit = false;

      try {
        const res = await this.$store.dispatch('github/fetchCommits', {
          repo:     this.selectedRepo,
          username: this.selectedAccOrOrg,
          branch:   this.selectedBranch,
        });

        this.commits = res;
      } finally {
        this.loadingCommits = false;
      }
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
        const url = `https://github.com/${ this.selectedAccOrOrg }/${ this.selectedRepo }`;

        this.$emit('generateUrl', url, this.selectedAccOrOrg, this.selectedCommit.sha);
        this.$emit('valid', true);
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
    resolveRemovedUser(author) {
      if (author) {
        return author;
      } else {
        return {
          login:      'User removed',
          avatar_url: this.defaultAvatar.avatarSrc
        };
      }
    }
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

      <div class="spacer">
        <LabeledSelect
          v-if="repos.length && !hasError.repo"
          v-model="selectedRepo"
          class="spacer"
          :required="true"
          :label="t('githubPicker.repo.inputLabel')"
          :options="prepareArray(repos)"
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
      <div class="spacer">
        <LabeledSelect
          v-if="selectedRepo"
          v-model="selectedBranch"
          class="spacer"
          :required="true"
          :label="t('githubPicker.branch.inputLabel')"
          :options="prepareArray(branches)"
          :clearable="false"
          :reduce="(e) => e"
          :searchable="true"
          :status="status(hasError.branch)"
          @search="onSearch"
          @input="fetchCommits"
        />
      </div>
      <!-- Deals with Commits, display & allow to pick from it  -->
      <div v-if="selectedBranch && commits.length" class="spacer">
        <SortableTable
          :rows="prepareArray(commits, true)"
          :headers="eventHeaders"
          mode="view"
          key-field="sha"
          :search="true"
          :paging="true"
          :table-actions="false"
          :row-actions="false"
          :rows-per-page="10"
        >
          <template #cell:index="{row}">
            <RadioButton :value="selectedCommit.sha" :val="row.commitId" @input="final($event, row.commitId)" />
          </template>

          <template #cell:sha="{row}">
            <a class="text-link" :href="row.html_url" target="_blank" rel="nofollow noopener noreferrer">{{ trimCommit(row.sha) }}</a>
          </template>
          <template #cell:author="{row}">
            <div class="sortable-table-avatar">
              <img :src="resolveRemovedUser(row.author).avatar_url" alt="" />
              {{ resolveRemovedUser( row.author).login }}
            </div>
          </template>
        </SortableTable>

        <!-- Selection resume -->
        <template v-if="showSelections && selectedCommit && selectedBranch">
          <div class="spacer">
            <div class="resumed">
              <img ref="img" :src="resolveRemovedUser(selectedCommit.author).avatar_url" alt="" />
              <div class="resumed-details">
                <div class="resumed-details-source">
                  <div>
                    <span class="label">{{ t('githubPicker.username.label') }}:</span>
                    <!-- {{ selectedCommit.author.login }} -->
                    {{ resolveRemovedUser( selectedCommit.author).login }}
                  </div>
                </div>
                <div>
                  <span class="label">{{ t('githubPicker.branch.label') }}: </span>
                  {{ selectedBranch }}
                </div>
                <div>
                  <span class="label">{{ t('githubPicker.commit.label') }} :</span>
                  <a class="text-link" :href="selectedCommit.html_url" target="_blank" rel="nofollow noopener noreferrer">
                    {{ trimCommit(selectedCommit.sha) }}
                  </a>
                </div>
              </div>
              <div class="mt-10">
                <span class="label">{{ t('githubPicker.commitMessage.label') }} </span>
                <p class="mt-4">
                  {{ selectedCommit.commit.message }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
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

  .resumed {
    display: flex;
    flex-direction: row;
    align-items: center;
    outline: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 10px;
    margin-top: 40px;
    transition: all 0.3s ease-in-out;

    .label {
      color: var(--input-label);
    }

    img {
      width: 60px;
      height: 60px;
      border-radius: var(--border-radius);
    }

    &-details {
      display: flex;
      padding: 10px 0;
      flex-direction: column;
      width: 100%;

      &-source {
        display: flex;
        flex-direction: row;
        margin-top: 10px;
        justify-content: space-between;
      }
    }
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
