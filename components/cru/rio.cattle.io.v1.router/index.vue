
<script>

import values from 'lodash/values';
import pickBy from 'lodash/pickBy';
import { randomStr } from '@/utils/string';
// import { isEmpty } from '@/utils/object';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Rule from '@/components/cru/rio.cattle.io.v1.router/Rule';
import Footer from '@/components/form/Footer';

export default {
  name:       'CruRouter',
  components: {
    Rule, NameNsDescription, Footer
  },
  mixins:     [CreateEditView],
  data() {
    let routes = [{ uuid: randomStr() }];

    if (this.value.spec ) {
      routes = this.value.spec.map((route) => {
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
      return this.routes.map(route => pickBy(route, (value, key) => {
        if (typeof value === 'object') {
          return !!values(value).length;
        } else {
          return key !== 'uuid';
        }
      }));
    },
  },
  methods:  {
    addRouteSpec() {
      this.routes.push({ uuid: randomStr() });
    },
    saveRouter() {
      this.value.spec = this.cleanedRoutes;
      this.save(this.done);
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
  <div>
    <div class="row">
      <NameNsDescription class="col span-12" :value="value" :mode="mode" />
    </div>
    <h2>Rules</h2>
    <div class="row">
      <div class="col span-12">
        <Rule
          v-for="(route, i) in routes"
          :key="route.uuid"
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
    <button class="btn role-tertiary add" @click="addRouteSpec">
      <i class="icon icon-plus" />
      Add Rule
    </button>
    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </div>
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
