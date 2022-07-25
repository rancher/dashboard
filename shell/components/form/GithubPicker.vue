<script>
import SortableTable from '@shell/components/SortableTable';
import RadioButton from '@components/Form/Radio/RadioButton';
import debounce from 'lodash/debounce';
import { isArray } from '@shell/utils/array';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
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
        label: 'Chose',
      },
      {
        name:  'sha',
        label: 'SHA',
        value: 'sha',
      },
      {
        name:  'author',
        label: 'Author',
        value: 'author.login',
      },
      {
        name:  'message',
        label: 'Message',
        value: 'message',
      },
    ];

    return {
      loadingRecentRepos: true,
      loadingBranches:    true,
      loadingFiles:       true,
      loadingCommits:     true,

      hasError:       false,
      showSelections: false,
      oldUsername:    null,

      repos:    [],
      branches: [],
      commits:  [],

      selectedUsername: null,
      selectedRepo:     null,
      selectedBranch:   null,
      selectedCommit:   false,
      eventHeaders,
    };
  },

  computed: {},
  methods:  {
    reset() {
      this.selectedRepo = null;
      this.selectedBranch = null;
      this.selectedCommit = false;
    },
    async fetchRepos() {
      try {
        if (this.selectedUsername.length) {
          const res = await this.$store.dispatch('github/fetchRecentRepos', { username: this.selectedUsername });

          if (res.message) {
            this.hasError = res.message;
          }

          this.repos = res;

          // Reset selections once username changes
          if (this.oldUsername !== this.selectedUsername) {
            this.oldUsername = this.selectedUsername;

            return this.reset();
          }
        }
      } finally {
        this.loadingRecentRepos = false;
      }
    },

    async fetchBranches(val) {
      this.loadingBranches = true;

      try {
        const res = await this.$store.dispatch('github/fetchBranches', { repo: this.selectedRepo, username: this.selectedUsername });

        this.branches = res;
      } finally {
        this.loadingBranches = false;
      }
    },
    async fetchCommits() {
      this.loadingCommits = true;
      try {
        const res = await this.$store.dispatch('github/fetchCommits', {
          repo:     this.selectedRepo,
          username: this.selectedUsername,
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
      if (!commit) {
        return;
      }

      return commit.slice(0, 7);
    },
    final(commitId) {
      this.selectedCommit = this.commits.filter(ele => ele.sha === commitId)[0];

      if (this.selectedUsername && this.selectedRepo && this.selectedCommit) {
        const url = `${ this.selectedUsername }/${ this.selectedRepo }/commit/${ commitId }`;

        this.$emit('generateUrl', url, this.selectedUsername, this.selectedCommit);
        this.$emit('valid', true);
        this.showSelections = true;
      }

      return null;
    },
    async searchForResult(query) {
      try {
        if (!this.selectedRepo && query.length) {
          // Check if the result is already in the fetched list.
          const resultInCurrentState = some(this.repos, { name: query } );

          if (resultInCurrentState) {
            return;
          }

          // Search for specific repo under the username
          const res = await this.$store.dispatch('github/search', { repo: query, username: this.selectedUsername });

          if (res.message) {
            this.hasError = res.message;
          }

          this.repos = res;
        } else if (this.selectedRepo && !this.selectedBranch) {
          // Search for a specific branch under the repo
          const res = await this.$store.dispatch('github/search', {
            repo:     this.selectedRepo,
            branch:   query,
            username: this.selectedUsername,
          });

          if (res.message) {
            this.hasError = res.message;
            this.branches = [];
          }
          this.branches = res;
        } else {
          this.fetchRepos();
        }
      } finally {
        this.loadingBranches = false;
      }
    },
    onSearch: debounce(function(q) {
      this.searchForResult(q);
    }, 1000),
  },
};
</script>

<template>
  <div class="picker">
    <div class="row">
      <div class="spacer archive">
        <!-- <h3>{{ t('epinio.applications.steps.source.github.username.label') }}</h3> -->

        <template v-if="hasError">
          <!-- // TODO: Move to some kind of Alert Component -->
          Query returned: {{ t('epinio.applications.steps.source.github.errors.noRepos') }}
        </template>
        <template>
          <div class="spacer archive">
            <LabeledInput
              v-model="selectedUsername"
              data-testid="epinio_app-source_git-username"
              :tooltip="t('epinio.applications.steps.source.github.username.tooltip')"
              :label="t('epinio.applications.steps.source.github.username.inputLabel')"
              :required="true"
              :delay="500"
              @input="fetchRepos"
            />
          </div>
          <div class="spacer archive">
            <LabeledSelect
              v-if="repos.length && !hasError"
              v-model="selectedRepo"
              :required="true"
              :label="t('epinio.applications.steps.source.github.repo.inputLabel')"
              :options="prepareArray(repos)"
              :clearable="true"
              :searchable="true"
              :reduce="(e) => e"
              @search="onSearch"
              @input="fetchBranches"
            />
          </div>
          <!-- Deals with Branches  -->
          <div class="spacer archive">
            <LabeledSelect
              v-if="selectedRepo"
              v-model="selectedBranch"
              :required="true"
              :label="t('epinio.applications.steps.source.github.branch.inputLabel')"
              :options="prepareArray(branches)"
              :clearable="false"
              :reduce="(e) => e"
              :searchable="true"
              @search="onSearch"
              @input="fetchCommits"
            />
          </div>
          <!-- Deals with Commits, display & allow to pick from it  -->
          <div v-if="selectedBranch" class="spacer archive">
            <p>{{ t('epinio.applications.steps.source.github.commits.tooltip') }}</p>
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
            </SortableTable>

            <!-- Selection resume -->
            <template v-if="showSelections && selectedCommit && selectedBranch">
              <div class="separator">
                <div class="resumed">
                  <img ref="img" :src="selectedCommit.author.avatar_url" alt="" />
                  <div class="resumed-details">
                    <div class="label">
                      {{ t('epinio.applications.steps.source.github.details.tooltip') }}:
                    </div>
                    <div class="resumed-details-source">
                      <div>
                        <span class="label">{{ t('epinio.applications.steps.source.github.username.label') }}:</span>
                        {{ selectedCommit.author.login }}
                      </div>
                      <div>
                        <span class="label">{{ t('epinio.applications.steps.source.github.branch.label') }}: </span>
                        {{ selectedBranch }}
                      </div>
                      <div>
                        <span class="label">{{ t('epinio.applications.steps.source.github.commit.label') }} :</span>
                        <a class="text-link" :href="selectedCommit.html_url">
                          {{ trimCommit(selectedCommit.sha) }}
                        </a>
                      </div>
                    </div>
                    <div class="mt-10">
                      <span class="label">{{ t('epinio.applications.steps.source.github.commitMessage.label') }} </span>
                      <p class="mt-4">
                        {{ selectedCommit.commit.message }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>
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

  .spacer {
    width: 100%;
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
