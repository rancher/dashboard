<script>
import { get } from '@/utils/object';
import demoSpecs from '@/config/demo-stacks';

import Card from '@/components/Card';
export default {
  components: { Card },
  data() {
    return {
      demos: [
        {
          title:       'Create stack from GitHub',
          demo:        'stackFromGit',
          description: 'This is a demo rio script that will deploy a stack. ',
          createPath:  '/rio/stack/create'
        },
        {
          title:       'Deploy service with Dockerfile',
          demo:        'serviceFromGit',
          description: 'This is demostrate how to use a dockerfile inside the Add Service. ',
          createPath:  '/rio/services/create'

        },
        {
          title:       'Autoscaling',
          demo:        null,
          description: 'Coming Soon. ',
          createPath:  null

        },
        {
          title:       'Service Mesh',
          demo:        null,
          description: 'Coming Soon. ',
          createPath:  null

        }
      ]
    };
  },
  methods: {
    createDemo(index) {
      this.$router.push({ path: this.demos[index].createPath, query: { demo: this.demos[index].demo } });
    },
    repoUrl(demo) {
      const spec = demoSpecs[demo];

      return get(spec, 'build.repo');
    }
  }
};
</script>

<template>
  <div>
    <header>
      <h1>
        Discover Rio
      </h1>
      <br>
      <span class="subtitle">Deploy preconfigured sample snacks</span>
    </header>
    <div class="row">
      <div class="col span-6">
        <div class="cards">
          <Card
            v-for="(demo, i) in demos"
            :key="demo.title"
            :content="demo.description"
          >
            <template v-slot:title>
              <span>{{ demo.title }}</span>
              <a target="_blank" class="icon icon-download role-multi-action" :href="repoUrl(demo.demo)" />
            </template>
            <template v-slot:actions>
              <button class="btn role-multi-action" :disabled="!demo.demo" @click="e=>createDemo(i)">
                Deploy
              </button>
            </template>
          </Card>
        </div>
      </div>
      <div class="col span-6">
        <img src="~/assets/images/login-landscape.svg" alt="landscape" />
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
    .subtitle{
        margin-top: 20px;
    }
    .cards {
         margin-right: 20px;
        // width: 50%;
        display: grid;
        grid-template-columns:  50% 50%;
        grid-row-gap: 20px;
        grid-column-gap: 20px;
        & > * {
            align-content: center;
        }
        & span.icon{
            padding: 3px;
        }
    }
</style>
