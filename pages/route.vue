<script>

/*
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
import LabeledInput from '@/components/form/LabeledInput';
import Route from '@/components/cru/rio.cattle.io.v1.route/Route';
export default {
  components: { Route },
  // layout:     'unauthenticated',
  data() {
    return {
      routes:         [],
      services:       ['service1', 'service2', 'service3'],
      namespaces:     ['default', 'here', 'there'],
      revisions:      ['v1', 'v2'],
      ports:          ['6969', '420'],
      selectedOption: ''

    };
  },
  methods: {
    addRoute() {
      this.routes.push({});
    },
    addMatch(i) {
      !this.routes[i].matches ? this.$set(this.routes[i], 'matches', [{}]) : this.routes[i].matches.push({});
    },
    addMatchstring(i, k) {
      const matchRule = this.routes[i].matches[k];

      for (const key in this.matchOpts) {
        if (!matchRule[key]) {
          matchRule[key] = '';

          return;
        }
      }
    },
    selectMatchOpt(option) {
      this.selectedOption = option;
    }
  }
};
</script>

<template>
  <div id="router">
    define router

    <div>
      <button class="btn bg-transparent " @click="addRoute">
        add route
      </button>
    </div>
    <Route v-for="(route, i) in routes" :key="i" class="inputs route" />

    <!-- <div v-if="routes[i].matches" class="column destinations">
      <v-select :searchable="false" :clearable="false" :options="services" placeholder="service"></v-select>
      <v-select placeholder="namespace" :searchable="false" :clearable="false" :options="namespaces"></v-select>
      <v-select placeholder="revisions" :searchable="false" :clearable="false" :options="revisions"></v-select>
      <v-select placeholder="ports" :searchable="false" :clearable="false" :options="ports"></v-select>
      <LabeledInput v-model="match" type="number" label="weight" />
    </div> -->
  </div>
</template>

<style lang='scss'>
    .route.inputs{
        border: 1px solid red;
        display: flex;
        & > * {
            border: 1px dashed blue;
        }
    }

    .match.inputs{
        border: 1px dashed yellow;
    }

    .column {
        width: 50%;
        padding: 3%;
        // &.between{
        //     widtH: 5%;
        // }
    }

    #router .v-select{
            flex-grow: 1;
            flex-basis: 0%;
            border: none;

            & .vs__dropdown-toggle {
                border: none;
            }
            & .vs__selected{
                position: absolute;
                top: 25%;
                color: var(--dropdown-text);
            }
        }
</style>
