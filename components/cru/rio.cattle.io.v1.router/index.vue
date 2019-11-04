
<script>
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Rule from '@/components/cru/rio.cattle.io.v1.router/Rule';
export default {
  name:       'CruRouter',
  components: { Rule, NameNsDescription },
  mixins:     [CreateEditView],
  data() {
    let routes = [{}];

    if (this.value.spec) {
      routes = this.value.spec.routes || [{}];
    }

    return {
      moved: 0,
      routes,
      spec:       this.value.spec || {}
    };
  },
  computed: {
    namespace() {
      return this.value.metadata.namespace;
    },
  },
  methods:  {
    addRouteSpec() {
      this.routes.push({});
    },
    saveRouter() {
      this.value.spec = { routes: this.routes };
      this.save(this.done);
    },
    change(type, value, index) {
      this[type][index] = value;
    },
    reposition(oldIndex, newIndex) {
      const moving = this.routes.splice(oldIndex, 1)[0];

      this.routes.splice(newIndex, 0, moving);
      this.moved++;
    },
    done() {
      this.$router.push({ path: '/rio/routers' });
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <NameNsDescription class="col span-12" :value="value" :mode="mode" />
    </div>
    <h2>Rules</h2>
    <div class="row">
      <div class="col span-12">
        <Rule
          v-for="(route, i) in routes"
          :key="i + moved"
          :position="i"
          class="col span-12"
          :spec="route"
          @up="reposition(i, i-1)"
          @down="reposition(i, i+1)"
          @input="e=>change('routes', e, i)"
        />
      </div>
    </div>
    <button class="btn bg-primary" @click="addRouteSpec">
      + add rule
    </button>
    <div class=" row footer-controls">
      <button class="btn btn-lg bg-transparent border">
        Cancel
      </button>
      <button class="btn btn-lg bg-primary" @click="saveRouter">
        Deploy
      </button>
    </div>
  </div>
</template>

<style>
  .footer-controls {
    justify-content: center;
    margin-right: 20px;
  }
</style>
