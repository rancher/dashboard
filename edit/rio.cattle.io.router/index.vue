<script>

import { get, cleanUp } from '@/utils/object';
import { randomStr } from '@/utils/string';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Rule from '@/edit/rio.cattle.io.router/Rule';
import Footer from '@/components/form/Footer';

export default {
  name:       'CruRouter',
  components: {
    Rule, NameNsDescription, Footer
  },
  mixins:     [CreateEditView],
  data() {
    let routes = [{ uuid: randomStr() }];

    if (get(this.value, 'spec.routes') ) {
      routes = this.value.spec.routes.map((route) => {
        return { ...route, uuid: randomStr() }
        ;
      }) || [{ uuid: randomStr() }];
    }

    return {
      routes,
      spec:       this.value.spec || {}
    };
  },
  computed: {
    namespace() {
      return this.value.metadata.namespace;
    },
    cleanedRoutes() {
      return this.routes.map(route => cleanUp(route));
    },
  },
  methods:  {
    addRouteSpec() {
      this.routes.push({ uuid: randomStr() });
    },
    saveRouter(buttonCB) {
      this.value.spec = { routes: this.cleanedRoutes };
      this.save(buttonCB);
    },
    change(type, value, index) {
      this[type].splice(index, 1, value);
    },
    reposition(oldIndex, newIndex) {
      if (newIndex >= 0 && newIndex < this.routes.length) {
        const moving = this.routes.splice(oldIndex, 1)[0];

        this.routes.splice(newIndex, 0, moving);
      }
    },
    remove(index) {
      this.routes.splice(index, 1);
    }
  }
};
</script>

<template>
  <form>
    <div class="row">
      <NameNsDescription
        :value="value"
        class="col span-12"
        :mode="mode"
        :register-before-hook="registerBeforeHook"
/>
    </div>
    <h2>Rules</h2>
    <div class="row">
      <div class="col span-12">
        <Rule
          v-for="(route, i) in routes"
          :key="route.uuid"
          :namespace="value.metadata.namespace"
          :position="i"
          class="col span-12"
          :spec="route"
          @delete="remove(i)"
          @up="reposition(i, i-1)"
          @down="reposition(i, i+1)"
          @input="e=>change('routes', e, i)"
        />
      </div>
    </div>
    <button :disabled="isView" type="button" class="btn role-tertiary add" @click="addRouteSpec">
      Add Rule
    </button>
    <Footer :mode="mode" :errors="errors" @save="saveRouter" @done="done" />
  </form>
</template>

<style>
  .footer-controls {
    justify-content: center;
    margin-right: 20px;
  }
  .returned-errors{
    color: red;
  }
</style>
