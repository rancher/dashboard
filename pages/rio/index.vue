<script>
import demos from '@/config/demos';

import Card from '@/components/Card';
export default {
  components: { Card },

  data() {
    return { demos };
  },

  methods: {
    createDemo(name) {
      this.$router.push({ path: this.demos[name].createPath, query: { demo: name } });
    },
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
      <span class="subtitle">Learn about our new features by creating preconfigured resources</span>
    </header>
    <div class="row">
      <div class="col span-6">
        <div class="cards">
          <Card
            v-for="(demo, name) in demos"
            :key="demo.title"
            :content="demo.description"
          >
            <template v-slot:title>
              <span class="text-primary">{{ demo.title }}</span>
              <a v-if="demo.spec" target="_blank" class="icon icon-external-link role-multi-action" :href="demo.spec.build.repo" />
            </template>
            <template v-slot:actions>
              <button class="btn role-primary btn-sm" :disabled="!demo.spec" @click="createDemo(name)">
                Start
              </button>
            </template>
          </Card>
        </div>
      </div>
      <div class="col span-6">
        <img src="~/assets/images/setup-step-one.svg" alt="landscape" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
    .subtitle {
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
