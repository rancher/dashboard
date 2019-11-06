
<script>
import pickBy from 'lodash/pickBy';
import values from 'lodash/values';
import { randomStr } from '@/utils/string';
import { isEmpty } from '@/utils/object';
import Match from '@/components/cru/rio.cattle.io.v1.router/Match';
import Destination from '@/components/cru/rio.cattle.io.v1.router/Destination';
import Redirect from '@/components/cru/rio.cattle.io.v1.router/Redirect';
// import RadioGroup from '@/components/form/RadioGroup';
import Headers from '@/components/cru/rio.cattle.io.v1.router/Headers';
// import Checkbox from '@/components/form/Checkbox';
import Fault from '@/components/cru/rio.cattle.io.v1.router/Fault';
export default {
  components: {
    Match, Destination, Redirect, Headers, Fault
  },
  props:      {
    position: {
      type:     Number,
      required: true
    },
    spec: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const {
      match = {}, to = [{ uuid: randomStr() }], mirror = {}, rewrite = {}, redirect = {}, headers = {}, fault = {},
    } = this.spec;
    let mode = 'forwardOne';

    if (to.length > 1) {
      mode = 'forwardMany';
    } else if (this.spec.redirect) {
      mode = 'redirect';
    }

    return {
      match,
      to,
      mirror,
      rewrite,
      redirect,
      headers,
      fault,
      mode,
      shouldFault:  !isEmpty(fault),
      shouldMirror: !isEmpty(mirror)
    };
  },
  mounted() {
    this.changeRoute();
  },
  methods:  {
    change(type, payload, index) {
      if (index >= 0) {
        this.$set(this[type], index, payload);
      } else {
        this.$set(this, type, payload);
      }
    },
    addDestination() {
      this.to.push({ uuid: randomStr() });
    },
    changeRoute() {
      const out = {
        match:   this.match,
        mirror:  this.shouldMirror ? this.mirror : {},
        headers: this.headers,
        fault:   this.shouldFault ? this.fault : {}
      };

      if (this.mode !== 'redirect') {
        out.to = this.to.map(route => pickBy(route, (value, key) => {
          if (typeof value === 'object') {
            return !!values(value).length;
          } else {
            return key !== 'uuid';
          }
        }));
        if (!isEmpty(this.rewrite)) {
          out.rewrite = this.rewrite;
        }
      } else {
        out.redirect = this.redirect;
      }

      this.$emit('input', out);
    },
    move(direction) {
      this.$emit(direction);
    },
    remove(type, index) {
      this[type].splice(index, 1);
    }
  }
};
</script>

<template>
  <form class="route" @input="changeRoute">
    <div class="section">
      <div class="header">
        <h4>
          Match
        </h4>
        <div class="position-mover">
          {{ position + 1 }}
          <div class="position-inputs">
            <button class="btn bg-transparent icon-btn icon icon-sort-up" @click="move('up')">
              {{ '' }}
            </button>
            <button class="btn bg-transparent icon-btn icon icon-sort-down" @click="move('down')">
              {{ '' }}
            </button>
          </div>
        </div>
        <button class="btn role-link" @click="$emit('delete')">
          REMOVE
        </button>
      </div>
      <div class="row">
        <Match
          v-model="match"
          class="col span-12"
          :spec="match"
        />
      </div>
    </div>
    <div class="destination section">
      <div class="row">
        <h4>Destination</h4>
      </div>
      <div class="row">
        <div class="col span-12">
          <label class="radio">
              <input type="radio" value="forwardOne">
              Forward to Service
          </label>

          <label class="radio">
              <input type="radio" value="forwardMany">
              Forward to Multiple Services
          </label>

          <label class="radio">
              <input type="radio" value="redirect">
              Redirect
          </label>
        </div>
      </div>
      <div class="row">
        <template v-if="mode!=='redirect'">
          <table class="inputs-table">
            <tr>
              <th class="input-col">
                Service
              </th>
              <th class="input-col">
                Version
              </th>
              <th class="input-col sm">
                Port
              </th>
              <th v-if="mode==='forwardMany'" class="input-col sm">
                Weight
              </th>
              <th class="input-col sm">
              </th>
            </tr>
            <Destination
              v-for="(destination, i) in to"
              :key="destination.uuid"
              :placeholders="['xxxx', 'xxxx', 'xxxx', 'xxxx']"
              :is-weighted="mode==='forwardMany'"
              :spec="destination"
              :can-remove="to.length>1"
              @input="change('to', $event, i)"
              @remove="remove('to', i)"
            />
          </table>
        </template>
      </div>
      <div v-if="mode==='forwardMany'" class="row">
        <button class="btn btn-sm bg-primary " @click="addDestination">
          + ADD DESTINATION
        </button>
      </div>
      <div v-if="mode==='redirect'" class="row">
        <Redirect class="col span-12" :spec="redirect" @input="e=>change('redirect', e)" />
      </div>
    </div>
    <div v-if="mode!=='redirect'" class="header section">
      <div class="row">
        <h4 class="col span-12">
          Rewrite Request Headers
        </h4>
      </div>
      <div class="row">
        <Headers class="col span-12" :enabled="mode!=='redirect'" :spec="headers" @input="e=>change('headers', e)" />
      </div>
    </div>
    <div class="row">
    <label>
        <input v-model="shouldMirror" type="checkbox" />
        Mirror
    </label>

    <label class="ml-20">
        <input v-model="shouldFault" type="checkbox" />
        Fault
    </label>
    </div>
    <div v-if="shouldMirror" class="row">
      <div class="col span-12">
        <table class="inputs-table">
          <Destination v-if="shouldMirror" :pick-version="false" :spec="mirror" :is-weighted="false" @input="e=>change('mirror', e)" />
        </table>
      </div>
    </div>
    <div class="row">
      <div v-if="shouldFault" class="col span-12">
        <Fault :spec="fault" @input="e=>change('fault', e)" />
      </div>
    </div>
  </form>
</template>

<style  lang='scss'>
  .route {
    padding: 20px;
    background-color: var(--login-bg);
    margin-bottom: 20px;

    & .inputs-table {
      margin: 10px 0 10px 0;
      table-layout:fixed;

      & th {
        text-align: left;
        padding-bottom: 10px;
        color: var(--input-label);
        font-weight: normal;
      }
      & td {
        padding: 0  10px 10px 0;
        vertical-align:middle;
        & > * {
          height: 4em;
        }
      }
      & td.sm{
        width:100px;
      }
      & td:not(.sm) {
        width: 200px;
      }
    }

    & .header{
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;

      & H4 {
        flex-grow: 2;
      }

      & .position-mover {
        display: flex;
        align-items: center;
        padding: 5px;
        background-color: var(--input-bg);
        border-radius: var(--border-radius);
        & > .position-inputs {
          margin-left: 5px;
          display: flex;
          flex-direction: column;
          position:relative;
          & button {
            height: 10px;
          }
        }
      }
    }
  }

  .section {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border);

  }
    .row.inputs > *:not(button) {
      margin-right: 10px;
      flex: 1;
    }
</style>
