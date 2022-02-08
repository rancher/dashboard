<script>
import Loading from '@/components/Loading';
import { FLEET } from '@/config/types';

export default {
  name:       'ListGitRepo',
  components: { Loading },

  async fetch() {
    const store = this.$store;

    this.gitRepos = await store.dispatch(`management/findAll`, { type: FLEET.GIT_REPO });
    this.fleetWorkspaces = await store.dispatch(`management/findAll`, { type: FLEET.WORKSPACE });
  },

  data() {
    return {
      gitRepos:        null,
      fleetWorkspaces: null
    };
  },
  computed: {
    dashboardData() {
      const finalData = {};

      this.fleetWorkspaces.forEach((ws) => {
        const repos = this.gitRepos.filter(rep => rep.namespace === ws.id);

        if (repos.length) {
          if (!finalData[ws.id]) {
            finalData[ws.id] = [];
          }

          finalData[ws.id] = repos;
        }
      });

      return finalData;
    }
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <section v-else class="fleet-dashboard">
      <header>
        <div class="title">
          <h1>
            <t k="fleet.dashboard.pageTitle" />
          </h1>
        </div>
      </header>
      <ul>
        <li v-for="(ws, wsKey) in dashboardData" :key="wsKey">
          {{ wsKey }}
          <ul>
            <li v-for="(repo, ri) in ws" :key="ri">
              {{ repo.nameDisplay }}
            </li>
          </ul>
        </li>
      </ul>
    </section>
  </div>
</template>
