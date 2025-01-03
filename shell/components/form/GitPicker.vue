<script lang="ts">
import { defineComponent, inject } from 'vue';
import SortableTable from '@shell/components/SortableTable/index.vue';
import RadioButton from '@components/Form/Radio/RadioButton.vue';
import debounce from 'lodash/debounce';
import { isArray } from '@shell/utils/array';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { GitUtils, Commit } from '@shell/utils/git';
import type { DebouncedFunc } from 'lodash';

interface commit {
  [key: string]: any,
  sha: string,
}
interface Data {
  hasError: {
    repo: boolean,
    branch: boolean,
    commits: boolean,
    branches?: unknown,
  },

  repos: object[],
  branches: object[],
  commits: commit[],

  selectedAccOrOrg: string | undefined,
  selectedRepo: object | undefined,
  selectedBranch: object | undefined,
  selectedCommit: Commit | null,
}

interface CommitHeader {
  name: string;
  label: string;
  width?: number;
  formatter?: string;
  formatterOpts?: { [key: string]: any };
  value?: string | string[];
  sort?: string | string[];
  defaultSort?: boolean;
}

interface NonReactiveProps {
  onSearchRepo: DebouncedFunc<(param: any) => Promise<any>> | undefined;
  onSearchBranch: DebouncedFunc<(param: any) => Promise<any>> | undefined;
  debounceTime: number;
}

const debounceTime = 1_000;

const provideProps: NonReactiveProps = {
  onSearchRepo:   undefined,
  onSearchBranch: undefined,
  debounceTime,
};

export default defineComponent({
  emits: ['change'],

  components: {
    LabeledSelect,
    SortableTable,
    RadioButton,
    LabeledInput,
  },

  props: {
    value: {
      type:    Object,
      default: null
    },

    type: {
      type:    String,
      default: null
    }
  },

  setup() {
    const onSearchRepo = inject('onSearchRepo', provideProps.onSearchRepo);
    const onSearchBranch = inject('onSearchBranch', provideProps.onSearchBranch);
    const debounceTime = inject('debounceTime', provideProps.debounceTime);

    return {
      onSearchRepo,
      onSearchBranch,
      debounceTime,
    };
  },

  data(): Data {
    return {
      hasError: {
        repo:    false,
        branch:  false,
        commits: false,
      },

      repos:    [],
      branches: [],
      commits:  [] as commit[],

      selectedAccOrOrg: undefined,
      selectedRepo:     undefined,
      selectedBranch:   undefined,
      selectedCommit:   null,
    };
  },

  created() {
    this.onSearchRepo = this.searchForResult(this.searchRepo);
    this.onSearchBranch = this.searchForResult(this.searchBranch);
  },

  watch: {
    value: {
      async handler(neu, old) {
        if (JSON.stringify(neu) === JSON.stringify(old)) {
          return;
        }
        if (neu?.type !== old?.type) {
          this.reset();
          await this.loadSourceCache(neu.selectedAccOrOrg, neu.selectedRepo, neu.selectedBranch, neu.selectedCommit);
        }
      },
      immediate: true,
      deep:      true,
    }
  },

  computed: {
    commitHeaders(): CommitHeader[] {
      return [
        {
          name:  'index',
          label: this.t(`gitPicker.${ this.type }.tableHeaders.choose.label`),
          width: 60,
        },
        {
          name:          'sha',
          label:         this.t(`gitPicker.${ this.type }.tableHeaders.sha.label`),
          width:         90,
          formatter:     'Link',
          formatterOpts: { urlKey: 'htmlUrl' },
          value:         'sha'
        },
        {
          name:  'author',
          label: this.t(`gitPicker.${ this.type }.tableHeaders.author.label`),
          width: 190,
          value: 'author.login',
          sort:  'author.login',
        },
        {
          name:  'message',
          label: this.t(`gitPicker.${ this.type }.tableHeaders.message.label`),
          value: 'message',
          sort:  'message',
        },
        {
          name:        'date',
          width:       220,
          label:       this.t(`gitPicker.${ this.type }.tableHeaders.date.label`),
          value:       'date',
          sort:        ['date:desc'],
          formatter:   'Date',
          defaultSort: true,
        },
      ];
    },

    preparedRepos(): unknown {
      return this.normalizeArray(this.repos, (item: any) => ({ id: item.id, name: item.name }));
    },

    preparedBranches(): unknown {
      return this.normalizeArray(this.branches, (item: any) => ({ id: item.id, name: item.name }));
    },

    preparedCommits(): Commit[] {
      return this.normalizeArray(this.commits, (c) => GitUtils[this.type].normalize.commit(c));
    },
    selectedCommitId(): string | undefined {
      return this.selectedCommit?.commitId;
    }
  },

  methods: {
    debounceRequest(callback: (param: any) => Promise<any>, timeout = debounceTime) {
      return debounce(async(param) => await callback(param), timeout);
    },

    searchForResult(callback: (query: string) => Promise<any>) {
      return this.debounceRequest(async(query: string) => {
        if (!query.length) {
          return;
        }

        return await callback(query);
      });
    },

    reset() {
      this.repos = [];
      this.selectedAccOrOrg = undefined;
      this.selectedRepo = undefined;
      this.selectedBranch = undefined;
      this.selectedCommit = null;

      this.communicateReset();
    },

    communicateReset() {
      this.$emit('change', {
        selectedAccOrOrg: this.selectedAccOrOrg,
        repo:             this.selectedRepo,
        commit:           this.selectedCommit,
      });
    },

    async loadSourceCache(accOrOrg: string, repo: { name: string}, branch: { name: string}, commit: { sha: string}) {
      this.selectedAccOrOrg = accOrOrg;
      if (this.selectedAccOrOrg) {
        await this.fetchRepos()
          .then(() => {
            if (this.repos.length && !this.hasError.repo) {
              this.selectedRepo = repo;

              return this.fetchBranches();
            }
          })
          .then(() => {
            if (this.branches.length && !this.hasError.branch) {
              if (branch?.name) {
                this.selectedBranch = branch;

                return this.fetchCommits();
              }
            }
          });

        const selectedCommit = this.commits?.find((c: commit) => {
          // Github has sha's
          // Gitlab has id's as sha's
          const sha = c.sha || c.id;

          return sha === commit.sha;
        });

        if (selectedCommit) {
          this.final(selectedCommit.sha || selectedCommit.id);
        }
      }
    },

    async fetchRepos() {
      this.repos = [];
      this.selectedRepo = undefined;
      this.selectedBranch = undefined;
      this.selectedCommit = null;

      this.communicateReset();

      if (this.selectedAccOrOrg?.length) {
        try {
          const res = await this.$store.dispatch(`${ this.type }/fetchRecentRepos`, { username: this.selectedAccOrOrg });

          this.repos = res;

          this.hasError.repo = false;
        } catch (error) {
          this.hasError.repo = true;
        }
      }
    },

    async fetchBranches() {
      this.selectedBranch = undefined;
      this.selectedCommit = null;

      this.communicateReset();

      try {
        const res = await this.$store.dispatch(`${ this.type }/fetchBranches`, { repo: this.selectedRepo, username: this.selectedAccOrOrg });

        this.branches = res;
        this.hasError.branch = false;
      } catch (error) {
        this.hasError.branch = true;
      }
    },

    async fetchCommits() {
      this.selectedCommit = null;

      this.communicateReset();

      try {
        const res = await this.$store.dispatch(`${ this.type }/fetchCommits`, {
          repo:     this.selectedRepo,
          username: this.selectedAccOrOrg,
          branch:   this.selectedBranch,
        });

        this.commits = res as commit[];

        this.hasError.branch = false;
      } catch (error) {
        this.hasError.commits = true;
      }
    },

    normalizeArray(elem: any, normalize: (v: any) => object) {
      const arr = isArray(elem) ? elem : [elem];

      return arr.map((item: any) => normalize(item));
    },

    final(commitId: string) {
      this.selectedCommit = this.preparedCommits.find((c: { commitId?: string }) => c.commitId === commitId) || null;

      if (this.selectedAccOrOrg && this.selectedRepo && this.selectedCommit?.commitId) {
        this.$emit('change', {
          selectedAccOrOrg: this.selectedAccOrOrg,
          repo:             this.selectedRepo,
          branch:           this.selectedBranch,
          commit:           this.selectedCommit.commitId,
          sourceData:       {
            repos:    this.repos,
            branches: this.branches,
            commits:  this.commits
          }

        });
      }
    },

    async searchRepo(query: string) {
      if (query.length) {
        // Check if the result is already in the fetched list.
        const resultInCurrentState = this.repos.filter((r: any) => r.name.startsWith(query));

        if (!resultInCurrentState.length) {
          // Search for specific repo under the username
          const res = await this.$store.dispatch(`${ this.type }/search`, {
            repo:     { id: query, name: query },
            username: this.selectedAccOrOrg
          });

          this.hasError.branches = !!res.hasError;

          if (!res.hasError) {
            if (res.length >= 1) {
              this.repos = res;
            }
          }
        } else {
          return resultInCurrentState;
        }
      }
    },

    async searchBranch(query: string) {
      const res = await this.$store.dispatch(`${ this.type }/search`, {
        repo:     this.selectedRepo,
        branch:   { name: query },
        username: this.selectedAccOrOrg,
      });

      this.hasError.branch = !!res.hasError;

      if (!this.hasError) {
        this.branches = res;
      }
    },

    status(value: boolean) {
      return value ? 'error' : undefined;
    },

    reposRules() {
      return this.hasError.repo ? this.t(`gitPicker.${ this.type }.errors.noAccount`) : null;
    },

    branchesRules() {
      return this.hasError.branch ? this.t(`gitPicker.${ this.type }.errors.noBranch`) : null;
    },

    /**
     * Show the page where the commit is, if any
     */
    onCommitsTableMounted() {
      const commitId = this.$route.query?.commit;

      if (commitId) {
        const table = this.$refs.commitsTable as unknown as {
          getPageByRow: (id: string | (string | null)[], callback: (commit: any) => any) => any;
          setPage: (page: any) => void;
        };
        const page = table?.getPageByRow(commitId, ({ commitId }: commit) => commitId);

        table?.setPage(page);
      }
    },
    selectReduction(e: unknown) {
      return e;
    }
  },
});
</script>

<template>
  <div class="picker">
    <div class="row">
      <div class="spacer">
        <LabeledInput
          v-model:value="selectedAccOrOrg"
          data-testid="git_picker-username-or-org"
          :tooltip="t(`gitPicker.${ type }.username.tooltip`)"
          :label="t(`gitPicker.${ type }.username.inputLabel`)"
          :required="true"
          :rules="[reposRules]"
          :delay="debounceTime"
          :status="status(hasError.repo)"
          @update:value="fetchRepos"
        />
      </div>

      <div
        v-if="repos.length && !hasError.repo"
        class="spacer"
      >
        <LabeledSelect
          v-model:value="selectedRepo"
          :required="true"
          :label="t(`gitPicker.${ type }.repo.inputLabel`)"
          :options="preparedRepos"
          :clearable="true"
          :searchable="true"
          :reduce="selectReduction"
          :rules="[reposRules]"
          :status="status(hasError.repo)"
          :option-label="'name'"
          @search="onSearchRepo"
          @update:value="fetchBranches"
        />
      </div>
      <!-- Deals with Branches  -->
      <div
        v-if="selectedRepo"
        class="spacer"
      >
        <LabeledSelect
          v-model:value="selectedBranch"
          :required="true"
          :label="t(`gitPicker.${ type }.branch.inputLabel`)"
          :options="preparedBranches"
          :clearable="false"
          :reduce="selectReduction"
          :searchable="true"
          :rules="[branchesRules]"
          :status="status(hasError.branch)"
          :option-label="'name'"
          @search="onSearchBranch"
          @update:value="fetchCommits"
        />
      </div>
      <!-- Deals with Commits, display & allow to pick from it  -->
      <div
        v-if="selectedBranch && preparedCommits.length"
        class="commits-table mt-20"
      >
        <SortableTable
          ref="commitsTable"
          :rows="preparedCommits"
          :headers="commitHeaders"
          mode="view"
          key-field="sha"
          :search="true"
          :paging="true"
          :table-actions="false"
          :row-actions="false"
          :rows-per-page="10"
          @hook:mounted="onCommitsTableMounted"
        >
          <template #cell:index="{row}">
            <RadioButton
              :value="selectedCommitId"
              :val="row.commitId"
              @update:value="final($event)"
            />
          </template>

          <template #cell:author="{row}">
            <div class="sortable-table-avatar">
              <template v-if="row.author">
                <img
                  :src="row.author.avatarUrl"
                  alt=""
                >
                <a
                  :href="row.author.htmlUrl"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  {{ row.author.name }}
                </a>
              </template>
              <template v-else>
                {{ t(`gitPicker.${ type }.tableHeaders.author.unknown`) }}
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
    margin: 0 1px;
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
