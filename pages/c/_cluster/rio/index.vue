<script>
import demos from '@/config/demos';
import Card from '@/components/Card';
import { DEMO } from '@/config/query-params';
import InstallRedirect from '@/utils/install-redirect';
import { NAME, CHART_NAME } from '@/config/product/rio';

export default {
  components: { Card },
  middleware: InstallRedirect(NAME, CHART_NAME),

  data() {
    return { demos };
  },

  methods: {
    createDemo(name) {
      this.$router.push({
        name:   'c-cluster-resource-create',
        params: { resource: this.demos[name].resource },
        query:  { [DEMO]: name }
      });
    },
  }
};
</script>

<template>
  <div>
    <h1>
      Discover Rio
    </h1>
    <div class="row">
      <div class="col span-8">
        <div class="cards">
          <Card
            v-for="(demo, name) in demos"
            :key="demo.title"
            :content="demo.description"
          >
            <template v-slot:title>
              <h5><span>{{ demo.title }}</span></h5>
              <a v-if="demo.spec" target="_blank" class="icon icon-external-link flex-right" :href="demo.spec.build.repo" />
            </template>
            <template v-slot:actions>
              <button class="btn role-primary btn-sm" :disabled="!demo.spec" @click="createDemo(name)">
                Start
              </button>
            </template>
          </Card>
        </div>
      </div>
      <div class="col span-4">
        <img src="~/assets/images/pl/setup-step-one.svg" alt="landscape" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
    .subtitle {
        margin-top: 20px;
    }
    .cards {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
        & > * {
            align-content: center;
        }
        & span.icon{
            padding: 3px;
        }
    }
</style>
