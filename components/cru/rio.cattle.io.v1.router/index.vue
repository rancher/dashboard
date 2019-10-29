
<script>
/*
TODO
  -specify revision in destination

Spec
    - RouterSpec
        -Routes
            -RouteSpec
                Matches
                    - Match
                        Path - StringMatch
                                    exact
                                    prefix
                                    regex
                        Scheme - StringMatch
                        Method - StringMatch
                        Headers - StringMatch
                        Cookies - StringMatch
                        Port - int
                        From
                            -ServiceSource
                                Service - string
                                Stack - string
                                Revision - string
                Weighted Destination
                    Weight - int
                    Desination
                        service - string
                        namespace - string
                        revision - string
                        port - uint32
                Redirect
                    Host - string
                    Path - string
                Rewrite
                    Host - string
                    Path - string
                Headers - v1alpha3.HeaderOperations
                RouteTraffic
                    Fault
                        Percentage - int
                        DelayMillis - int
                        Abort
                            - HTTPStatus - int
                    Mirror
                    TimeoutMillis
                    Retry

Status
    - RouterStatus
        PublicDomains - []string
        Endpoints - []string
        Conditions []genericcondition.GenericCondition

*/
import { RIO, NAMESPACE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Route from '@/components/cru/rio.cattle.io.v1.router/Route';
export default {
  name:       'CruRouter',
  components: { Route, NameNsDescription },
  mixins:     [CreateEditView],
  data() {
    return {
      routes:     [],
      namespaces: [],
      spec:       this.value.spec || {}
    };
  },
  computed: {
    namespace() {
      return this.value.metadata.namespace;
    }
  },
  methods:  {
    addRouteSpec() {
      this.routes.push({});
    },
    async getNamespaces() {
      const namespaces = await this.$store.dispatch('cluster/findAll', { type: NAMESPACE });

      this.namespaces = JSON.parse(JSON.stringify(namespaces));
    },
    done() {
      console.log('done?');
    },
    saveRouter() {
      this.value.spec = { routes: this.routes };
      debugger;
      this.save(this.done);
    }
  }
};
</script>

<template>
  <div>
    <NameNsDescription :value="value" :mode="mode" />
    <button class="btn bg-primary" @click="addRouteSpec">
      add rule
    </button>
    <Route v-for="(route, i) in routes" :key="i" />
    <button @click="saveRouter">
      save
    </button>
  </div>
</template>
