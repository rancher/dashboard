<script lang="ts">
import day from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Vue, { PropType } from 'vue';
import Application from '../models/applications';
import SimpleBox from '@shell/components/SimpleBox.vue';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '../types';
import ResourceTable from '@shell/components/ResourceTable.vue';
import PlusMinus from '@shell/components/form/PlusMinus.vue';
import { epinioExceptionToErrorsArray } from '../utils/errors';
import ApplicationCard from '@shell/components/cards/ApplicationCard.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import SortableTable from '@shell/components/SortableTable/index.vue';
import AppGitHubDeployment from '../components/application/AppGitHubDeployment.vue';
interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {
    SimpleBox,
    ConsumptionGauge,
    SortableTable,
    ResourceTable,
    PlusMinus,
    ApplicationCard,
    AppGitHubDeployment,
    Tabbed,
    Tab,
  },
  props: {
    value: {
      type:     Object as PropType<Application>,
      required: true
    },
    initialValue: {
      type:     Object as PropType<Application>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },
  fetch() {
    this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.SERVICE_INSTANCE });
    this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.CONFIGURATION });
    this.fetchRepoDetails();
  },
  data() {
    const appInstanceSchema = this.$store.getters[`${ EPINIO_PRODUCT_NAME }/schemaFor`](EPINIO_TYPES.APP_INSTANCE);
    const servicesSchema = this.$store.getters[`${ EPINIO_PRODUCT_NAME }/schemaFor`](EPINIO_TYPES.SERVICE_INSTANCE);
    const servicesHeaders: [] = this.$store.getters['type-map/headersFor'](servicesSchema);
    const configsSchema = this.$store.getters[`${ EPINIO_PRODUCT_NAME }/schemaFor`](EPINIO_TYPES.CONFIGURATION);
    const configsHeaders: [] = this.$store.getters['type-map/headersFor'](configsSchema);

    return {
      saving:        false,
      gitSource:     null,
      gitDeployment: {
        deployedCommit: null,
        commitsArray:   null,
      },
      appInstance: {
        schema:  appInstanceSchema,
        headers: this.$store.getters['type-map/headersFor'](appInstanceSchema),
      },
      services: {
        schema:  servicesSchema,
        headers: servicesHeaders.filter((h: any) => !['namespace', 'boundApps'].includes(h.name)),
      },
      configs: {
        schema:  configsSchema,
        headers: configsHeaders.filter((h: any) => !['namespace', 'boundApps', 'service'].includes(h.name)),
      },
      commitsTableHeaders: [{
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
      ]
    };
  },
  methods: {
    async updateInstances(newInstances: number) {
      this.$set(this, 'saving', true);
      try {
        this.value.configuration.instances = newInstances;
        await this.value.update();
        await this.value.forceFetch();
      } catch (err) {
        console.error(`Failed to scale Application: `, epinioExceptionToErrorsArray(err)); // eslint-disable-line no-console
      }
      this.$set(this, 'saving', false);
    },
    formatURL(str: string) {
      const matchGithub = str.match('^(https|git)(:\/\/|@)([^\/:]+)[\/:]([^\/:]+)\/(.+)(.git)*$');

      return `${ matchGithub?.[4] }/${ matchGithub?.[5] }`;
    },
    async fetchRepoDetails() {
      const envs = this.value?.envDetails;

      if (envs.appDeployment ) {
        const { usernameOrOrg, repo } = JSON.parse(envs.appDeployment);
        const res = await this.$store.dispatch('github/fetchRepoDetails', { username: usernameOrOrg, repo });

        const {
          // eslint-disable-next-line camelcase
          owner, description, created_at, updated_at, html_url, name
        } = res;

        this.gitSource = {
          owner,
          description,
          created_at,
          updated_at,
          html_url,
          name
        };

        const commit = this.value.sourceInfo?.details.filter((ele: { label: string; }) => ele.label === 'Revision')[0]?.value;

        if (commit) {
          this.gitDeployment.deployedCommit = {
            short: commit?.slice(0, 7),
            long:  commit
          };
        }
      }

      await this.fetchCommits();
    },
    async fetchCommits() {
      const envs = this.value?.envDetails;

      if (!envs.appDeployment) {
        return;
      }

      const { usernameOrOrg, repo, branch } = JSON.parse(envs.appDeployment);

      this.gitDeployment.commitsArray = await this.$store.dispatch('github/fetchCommits', {
        username: usernameOrOrg, repo, branch
      });
    },
    formatDate(date: string, from: boolean) {
      day.extend(relativeTime);

      return from ? day(date).fromNow() : day(date).format('DD MMM YYYY');
    },
    prepareArray(arr: []) {
      if (arr === null) {
        return;
      }

      if (arr.length) {
        return arr.reduce((acc: any, cur: any) => {
          acc.push({
            message:   cur.commit.message,
            html_url:  cur.html_url,
            sha:       cur.sha.slice(0, 7),
            commitId:  cur?.sha,
            author:    cur.author,
            isChecked: false,
            date:      cur?.commit.committer.date
          });

          return acc;
        }, []);
      }
    },
  },
  computed: {
    sourceIcon(): string {
      return this.value.sourceInfo?.icon || 'icon-epinio';
    },
    commitPosition() {
      if (!this.gitDeployment?.commitsArray && !this.gitDeployment.deployedCommit) {
        return;
      }

      let idx = null;

      if (this.gitDeployment.commitsArray) {
        this.gitDeployment.commitsArray.map((ele: { sha: any; }, i: number) => {
          if (ele.sha === this.gitDeployment.deployedCommit.long) {
            idx = i - 1;
          }
        });
      }

      if (!idx) {
        return idx;
      }

      return {
        text:     ( idx - 1) >= 0 ? `${ idx } ${ this.t('epinio.applications.gitSource.behindCommits') }` : this.t('epinio.applications.gitSource.latestCommit'),
        position: idx
      };
    }
  }
});
</script>

<template>
  <div class="content">
    <div class="application-details">
      <ApplicationCard>
        <!-- Icon slot -->
        <template v-slot:cardIcon>
          <i
            class="icon icon-fw"
            :class="sourceIcon"
          />
        </template>

        <!-- Routes links slot -->
        <template v-slot:top-left>
          <h1>Routes</h1>
          <ul>
            <li
              v-for="route in value.configuration.routes"
              :key="route.id"
            >
              <a
                v-if="value.state === 'running'"
                :key="route.id + 'a'"
                :href="`https://${route}`"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >{{ `https://${route}` }}</a>
              <span
                v-else
                :key="route.id + 'b'"
              >{{ `https://${route}` }}</span>
            </li>
          </ul>
        </template>

        <!-- <template v-slot:top-right>
        </template> -->

        <!-- Resources count slot -->
        <template v-slot:resourcesCount>
          <div>
            {{ value.envCount }} {{ t('epinio.applications.detail.counts.envVars') }}
          </div>
          <div>
            {{ value.serviceConfigurations.length }} {{ t('epinio.applications.detail.counts.services') }}
          </div>
          <div>
            {{ value.baseConfigurations.length }} {{ t('epinio.applications.detail.counts.config') }}
          </div>
        </template>
      </ApplicationCard>
    </div>

    <h3
      v-if="value.deployment"
      class="mt-20"
    >
      {{ t('epinio.applications.detail.deployment.label') }}
    </h3>

    <div
      v-if="value.deployment"
      class="deployment"
    >
      <!-- Source information -->
      <Tabbed>
        <Tab
          label-key="epinio.applications.detail.tables.overview"
          name="overview"
          :weight="3"
        >
          <div class="simple-box-row app-instances">
            <SimpleBox>
              <ConsumptionGauge
                :resource-name="t('epinio.applications.detail.deployment.instances')"
                :capacity="value.desiredInstances"
                :used="value.readyInstances"
                :used-as-resource-name="true"
                :color-stops="{ 70: '--success', 30: '--warning', 0: '--error' }"
              />
              <div class="scale-instances">
                <PlusMinus
                  class="mt-15 mb-10"
                  :value="value.desiredInstances"
                  :disabled="saving"
                  @minus="updateInstances(value.desiredInstances - 1)"
                  @plus="updateInstances(value.desiredInstances + 1)"
                />
              </div>

              <div class="deployment__origin__row">
                <hr class="mt-10 mb-10">
                <h4 class="mt-10 mb-10">
                  Metrics
                </h4>
                <div
                  v-if="gitSource"
                  class="stats"
                >
                  <div>
                    <h3>{{ t('tableHeaders.memory') }}</h3>
                    <ul>
                      <li> <span>Min: </span> {{ value.instanceMemory.min }}</li>
                      <li> <span>Max: </span>{{ value.instanceMemory.max }}</li>
                      <li><span>Avg: </span>{{ value.instanceMemory.avg }}</li>
                    </ul>
                  </div>
                  <div>
                    <h3>{{ t('tableHeaders.cpu') }}</h3>
                    <ul>
                      <li> <span>Min: </span> {{ value.instanceCpu.min }}</li>
                      <li> <span>Max: </span>{{ value.instanceCpu.max }}</li>
                      <li><span>Avg: </span>{{ value.instanceCpu.avg }}</li>
                    </ul>
                  </div>
                </div>

                <div
                  v-else
                  class="stats-table"
                >
                  <table class="mt-15">
                    <thead>
                      <tr>
                        <th />
                        <th>Min</th>
                        <th>Max</th>
                        <th>Avg</th>
                      </tr>
                    </thead>
                    <tr>
                      <td>{{ t('tableHeaders.memory') }}</td>
                      <td>{{ value.instanceMemory.min }}</td>
                      <td>{{ value.instanceMemory.max }}</td>
                      <td>{{ value.instanceMemory.avg }}</td>
                    </tr>
                    <tr>
                      <td>{{ t('tableHeaders.cpu') }}</td>
                      <td>{{ value.instanceCpu.min }}</td>
                      <td>{{ value.instanceCpu.max }}</td>
                      <td>{{ value.instanceCpu.avg }}</td>
                    </tr>
                  </table>
                </div>
              </div>
            </SimpleBox>
            <SimpleBox v-if="value.sourceInfo">
              <h4 class="mb-10">
                Deployment Details
              </h4>

              <div
                v-if="gitSource"
                class="repo-info"
              >
                <AppGitHubDeployment
                  :git-deployment="gitDeployment"
                  :git-source="gitSource"
                  :commit-position="commitPosition"
                />
              </div>
              <hr class="mt-10 mb-10">
              <div class="deployment__origin__list">
                <ul>
                  <li>
                    <h4>Origin</h4>
                    <span>{{ value.sourceInfo.label }}</span>
                  </li>

                  <li
                    v-for="d of value.sourceInfo.details"
                    :key="d.label"
                  >
                    <h4>{{ d.label }}</h4>
                    <span v-if="d.value && d.value.startsWith('http')">
                      <a
                        :href="d.value"
                        target="_blank"
                      >{{ formatURL(d.value) }}</a>
                    </span>
                    <span v-else-if="gitSource && d.value && d.value.match(/^[a-f0-9]{40}$/)">
                      <a
                        :href="`${gitSource.html_url}/commit/${d.value}`"
                        target="_blank"
                      >{{ d.value }}</a>
                    </span>
                    <span v-else>{{ d.value }}</span>
                  </li>

                  <li>
                    <h4>{{ t('epinio.applications.tableHeaders.deployedBy') }}</h4>
                    <span> {{ value.deployment.username }}</span>
                  </li>
                </ul>
              </div>
            </SimpleBox>
          </div>
        </Tab>
        <Tab
          v-if="gitSource"
          label-key="epinio.applications.detail.tables.githubCommits"
          name="githubCommits"
          :weight="2"
        >
          <SortableTable
            v-if="gitDeployment.commitsArray"
            :rows="prepareArray(gitDeployment.commitsArray)"
            :headers="commitsTableHeaders"
            mode="view"
            key-field="sha"
            :search="true"
            :paging="true"
            :table-actions="false"
            :row-actions="false"
            :rows-per-page="10"
          >
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
        </Tab>
      </Tabbed>
    </div>

    <h3 class="mt-20">
      {{ t('epinio.applications.detail.tables.label') }}
    </h3>

    <div>
      <Tabbed>
        <Tab
          label-key="epinio.applications.detail.tables.instances"
          name="instances"
          :weight="3"
        >
          <ResourceTable
            :schema="appInstance.schema"
            :headers="appInstance.headers"
            :rows="value.instances"
            :table-actions="false"
          />
        </Tab>
        <Tab
          label-key="epinio.applications.detail.tables.services"
          name="services"
          :weight="2"
        >
          <ResourceTable
            :schema="services.schema"
            :headers="services.headers"
            :rows="value.services"
            :namespaced="false"
            :table-actions="false"
          />
        </Tab>
        <Tab
          label-key="epinio.applications.detail.tables.configs"
          name="configs"
          :weight="1"
        >
          <ResourceTable
            :schema="configs.schema"
            :headers="configs.headers"
            :rows="value.baseConfigurations"
            :namespaced="false"
            :table-actions="false"
          />
        </Tab>
      </Tabbed>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content {
  max-width: 1280px;
}
.simple-box-row {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  grid-gap: 10px;

  @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
    grid-auto-flow: row;
  }
  .simple-box {
    width: 100%;
    ul {
      word-break: break-all;
    }
    &:not(:last-of-type) {
      margin-right: 20px;
    }
    .deployment__origin__row {
      display: flex;
      flex-direction: column;
      h4:first-of-type {
        font-weight: bold;
        margin-bottom: 0;
      }
      h4:last-of-type {
        word-break: break-all;
      }
      &:last-of-type {
        h4:last-of-type {
          margin-bottom: 0;
        }
      }
      thead {
        tr {
          th {
            text-align: left;
            color: var(--muted);
            font-weight: 300;
          }
        }
      }
    }

    .scale-instances {
      display: flex;
      align-items: center;

      .plus-minus {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
  .box {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    & h1,
    h3 {
      margin-left: 5;
    }
    h3 {
      flex: 1;
      display: flex;
    }
    &-two-cols {
      display: flex;
      h1 {
        font-size: 4.5rem;
        padding: 0 10px;
      }
      div {
        margin-top: 8px;
      }
    }
    &-timers {
      display: flex;
      flex-direction: column;
      h4 {
        font-size: 1.6rem;
      }
      div {
        width: 100%;
        display: flex;
        justify-content: space-between;
      }
    }
  }
}

.stats-table {
  display: flex;
  width: 100%;

  table {
    width: 100%;
  }
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 12px 0;
  position: relative;

  &::before {
    content: "";
    border-right: 1px solid var(--default);
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
  }

  & > div:nth-child(2) {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  h3 {
    font-size: 16px;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;

    li {
      list-style: none;
      font-size: 14px;
    }
  }

  // For the second div in stats, style the ul differently
  & > div:nth-child(2) ul {
    align-items: flex-end;
  }

}
.deployment__origin__list {
  ul {
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;

    li {
      margin: 5px;
      list-style: none;

      h4 {
        color: var(--default-text);
        font-weight: 300;
        font-size: 14px;
        margin: 0;
      }
    }
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
    margin-right: 10px;
  }
}
</style>
