
<script>
/*
TODO
  -specify revision in destination
  -option to define 'from service' as match string
  -header manipulation rules?

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
import Route from '@/components/cru/rio.cattle.io.v1.router/Route';
export default {
  components: { Route },
  mixins:     [CreateEditView],
  layout:     'unauthenticated',
  data() {
    return {
      routes:     [],
      namespaces: []
    };
  },
  computed: {},
  mounted() {
    // this.getNamespaces();
  },
  methods:  {
    addRouteSpec() {
      this.routes.push({});
    },
    async getNamespaces() {
      const namespaces = await this.$store.dispatch('cluster/findAll', { type: NAMESPACE });

      this.namespaces = JSON.parse(JSON.stringify(namespaces));
    },
  }
};
</script>

<template>
  <div>
    <button class="btn bg-primary" @click="addRouteSpec">
      add rule
    </button>
    <Route v-for="(route, i) in routes" :key="i" />
  </div>
</template>
