<script>
import isEmpty from 'lodash/isEmpty';
import { cleanUp } from '@/utils/object';
import { randomStr } from '@/utils/string';
import Match from '@/edit/rio.cattle.io.router/Match';
import Destination from '@/edit/rio.cattle.io.router/Destination';
import Redirect from '@/edit/rio.cattle.io.router/Redirect';
import Headers from '@/edit/rio.cattle.io.router/Headers';
import Fault from '@/edit/rio.cattle.io.router/Fault';
import Checkbox from '@/components/form/Checkbox';
import { _VIEW } from '@/config/query-params';

export default {
  components: {
    Match, Destination, Redirect, Headers, Fault, Checkbox
  },

  props:      {
    mode: {
      type:     String,
      required: true,
    },

    position: {
      type:     Number,
      required: true
    },
    spec: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    namespace: {
      type:    String,
      default: null
    }
  },

  data() {
    const {
      match = {},
      to = [{ uuid: randomStr() }],
      mirror = {},
      rewrite = {},
      redirect = {},
      headers = {},
      fault = {},
    } = this.spec;

    let action = 'forwardMany';

    if (this.spec.redirect) {
      action = 'redirect';
    }

    return {
      match,
      to,
      mirror,
      rewrite,
      redirect,
      headers,
      fault,
      action,
      shouldFault:  !isEmpty(fault),
      shouldMirror: !isEmpty(mirror)
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
  },

  mounted() {
    this.changeRoute();
  },

  methods: {
    change(type, payload, index) {
      if (index >= 0) {
        this.$set(this[type], index, payload);
      } else {
        this.$set(this, type, payload);
      }
      this.changeRoute();
    },

    addDestination() {
      this.to.push({ uuid: randomStr() });
    },

    changeRoute() {
      let out = {
        match:   this.match,
        mirror:  this.shouldMirror ? this.mirror : {},
        headers: this.headers,
        fault:   this.shouldFault ? this.fault : {},
        uuid:    this.spec.uuid
      };

      if (this.action === 'redirect') {
        out.redirect = this.redirect;
      } else {
        out.to = this.to.map(destination => cleanUp(destination));
        if (!isEmpty(this.rewrite)) {
          out.rewrite = this.rewrite;
        }
      }

      out = cleanUp(out);
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
  <div class="route" @input="changeRoute">
    <div>
      <div class="header">
        <h4>
          Match
        </h4>
        <div class="position-mover">
          {{ position + 1 }}
          <div class="position-inputs">
            <button type="button" class="btn bg-transparent icon-btn icon icon-sort-up" @click="move('up')">
              {{ '' }}
            </button>
            <button type="button" class="btn bg-transparent icon-btn icon icon-sort-down" @click="move('down')">
              {{ '' }}
            </button>
          </div>
        </div>
        <button :disabled="isView" type="button" class="btn role-link" @click="$emit('delete')">
          REMOVE
        </button>
      </div>
      <div class="row mt-20">
        <Match
          v-model="match"
          :mode="mode"
          class="col span-12"
          :spec="match"
        />
      </div>
    </div>
    <hr class="divider">
    <div class="destination">
      <h4>Destination</h4>
      <div class="row">
        <div class="col span-12">
          <label class="radio">
            <input v-model="action" :disabled="isView" type="radio" value="forwardMany">
            Forward to a Service
          </label>

          <label class="radio">
            <input v-model="action" :disabled="isView" type="radio" value="redirect">
            HTTP Redirect
          </label>
        </div>
      </div>
      <div class="row">
        <template v-if="action!=='redirect'">
          <table class="inputs-table">
            <tr>
              <th class="input-col">
                App
              </th>
              <th class="input-col">
                Version
              </th>
              <th class="input-col sm">
                Port
              </th>
              <th v-if="to.length>1" class="input-col sm">
                Weight
              </th>
              <th class="input-col sm">
              </th>
            </tr>
            <Destination
              v-for="(destination, i) in to"
              :key="destination.uuid"
              :mode="mode"
              :namespace="namespace"
              :is-weighted="to.length>1"
              :spec="destination"
              :can-remove="to.length>1"
              @input="change('to', $event, i)"
              @remove="remove('to', i)"
            />
          </table>
        </template>
      </div>
      <div v-if="action==='forwardMany'" class="row">
        <button :disabled="isView" type="button" class="btn role-tertiary add" @click="addDestination">
          Add Destination
        </button>
      </div>
      <div v-if="action==='redirect'" class="row">
        <Redirect class="col span-12" :spec="redirect" @input="e=>change('redirect', e)" />
      </div>
    </div>
    <hr class="divider">
    <div v-if="action!=='redirect'" class="header section">
      <div class="row">
        <Headers class="col span-12" :enabled="action!=='redirect'" :spec="headers" @input="e=>change('headers', e)" />
      </div>
    </div>
    <div class="row">
      <Checkbox v-model="shouldMirror" type="checkbox" label="Mirror" />

      <Checkbox v-model="shouldFault" type="checkbox" label="Fault" />
    </div>
    <div v-if="shouldMirror" class="row">
      <div class="col span-12">
        <table class="inputs-table">
          <Destination
            v-if="shouldMirror"
            :mode="mode"
            show-placeholders
            :pick-version="false"
            :spec="mirror"
            :is-weighted="false"
            @input="e=>change('mirror', e)"
          />
        </table>
      </div>
    </div>
    <div class="row">
      <div v-if="shouldFault" class="col span-12">
        <Fault :spec="fault" @input="e=>change('fault', e)" />
      </div>
    </div>
  </div>
</template>

<style  lang='scss'>
  .route {
    margin-top: 20px;
    padding: 20px;
    background-color: var(--box-bg);
    margin-bottom: 20px;
    border-radius: 3px;

    .header {
      background: transparent;
    }

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
        padding: 10px 15px;
        background-color: var(--input-bg);
        border-radius: var(--border-radius);
        & > .position-inputs {
          margin-left: 10px;
          display: flex;
          flex-direction: column;
          position:relative;
          & button {
            height: 10px;
            font-size: 10px;
          }
          & button:focus {
            box-shadow: none;
          }
        }
      }
    }
  }
    .row.inputs > *:not(button) {
      margin-right: 10px;
      flex: 1;
      & .vs__dropdown-toggle {
        height: 100%
      }
    }
</style>
