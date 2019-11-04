
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
        return {}
        ;
      }
    }
  },
  data() {
    const {
      match = {}, to = [{ uuid: randomStr() }], mirror = {}, rewrite = {}, redirect = {}, headers = {}, fault = {},
    } = this.spec;

    return {
      match,
      to,
      mirror,
      rewrite,
      redirect,
      headers,
      fault,
      mode:         'forwardOne',
      shouldFault:  false,
      shouldMirror: false
    };
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
  <div class="route" @input="changeRoute">
    <div class="section">
      <div class="header">
        <h4>
          Match
        </h4>
        <div class="position-mover">
          {{ position }}
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
      <div>
        <input id="forwardOne" v-model="mode" type="radio" value="forwardOne" />
        <label for="forwardOne"> Fordward to Service</label>
        <input id="forwardMany" v-model="mode" type="radio" value="forwardMany" />
        <label for="forwardMany"> Fordward to Multiple Services</label>
        <input id="redirect" v-model="mode" type="radio" value="redirect" />
        <label for="redirect"> Redirect</label>
      </div>
      <!-- <RadioGroup id="destination-radio" v-model="mode" :selected="0" :options="['forwardOne', 'forwardMany', 'redirect']" :labels="['Forward to Service', 'Forward to Multiple Services', 'Redirect to URL']" /> -->
      <div v-if="mode==='forwardOne'" class="row">
        <div class="col span-12">
          <Destination :is-weighted="false" :spec="to[0]" @input="change('to', $event, 0)" />
        </div>
      </div>
      <div v-if="mode=='forwardMany'" class="row">
        <div class="col span-12">
          <Destination
            v-for="(destination, i) in to"
            :key="destination.uuid"
            :is-weighted="true"
            :spec="destination"
            :can-remove="true"
            @input="change('to', $event, i)"
            @remove="remove('to', i)"
          />
          <button v-if="mode==='forwardMany'" class="btn btn-sm bg-primary " @click="addDestination">
            add destination
          </button>
        </div>
      </div>
      <div v-if="mode==='redirect'" class="row">
        <Redirect class="col span-12" :spec="redirect" @input="e=>change('redirect', e)" />
      </div>
    </div>
    <div class="header section">
      <div class="row">
        <h4 class="col span-12">
          Rewrite Request Headers
        </h4>
      </div>
      <div class="row">
        <Headers :enabled="mode!=='redirect'" class="col span-12" :spec="headers" @input="e=>change('headers', e)" />
      </div>
    </div>
    <div class="row">
      <!-- <Checkbox v-model="shouldMirror" label="Mirror" />
      <Checkbox v-model="shouldFault" label="Fault" /> -->
      <input id="shouldMirror" v-model="shouldMirror" type="checkbox" />
      <label for="shouldMirror">Mirror</label>
      <input id="shouldFault" v-model="shouldFault" type="checkbox" />
      <label for="shouldFault">Fault</label>
    </div>
    <div v-if="shouldMirror" class="row">
      <div class="col span-12">
        <Destination v-if="shouldMirror" :pick-version="false" :spec="mirror" :is-weighted="false" @input="e=>change('mirror', e)" />
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
    padding: 5px 10px 5px 10px;
    background-color: var(--login-bg);
    margin-bottom: 20px;

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
        & > div {
          margin-left: 5px;
          display: flex;
          flex-direction: column;
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
   #destination-radio {
     display: flex;
   }
    .row.inputs > *:not(button) {
      margin-right: 10px;
      flex: 1;
    }
</style>
