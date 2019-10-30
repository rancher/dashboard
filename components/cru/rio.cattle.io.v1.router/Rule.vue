
<script>
import Match from '@/components/cru/rio.cattle.io.v1.router/Match';
import Destination from '@/components/cru/rio.cattle.io.v1.router/Destination';
import Redirect from '@/components/cru/rio.cattle.io.v1.router/Redirect';
import RadioGroup from '@/components/form/RadioGroup';
import Headers from '@/components/cru/rio.cattle.io.v1.router/Headers';
import Checkbox from '@/components/form/Checkbox';
import Fault from '@/components/cru/rio.cattle.io.v1.router/Fault';
export default {
  components: {
    Match, Destination, RadioGroup, Redirect, Headers, Checkbox, Fault
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
      match = {}, to = [{}], mirror = {}, rewrite = {}, redirect = {}, headers = {}, fault = {},
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
    change(type, payload) {
      this.$set(this, type, payload);
    },
    addDestination() {
      this.to.push({});
    },
    isEmpty(obj) {
      return !Object.keys(obj).length;
    },
    changeRoute() {
      const out = {
        match:   this.match,
        mirror:  this.shouldMirror ? this.mirror : null,
        headers: this.headers,
        fault:   this.shouldFault ? this.fault : null
      };

      if (this.mode !== 'redirect') {
        out.to = this.to;
        if (!this.isEmpty(this.rewrite)) {
          out.rewrite = this.rewrite;
        }
      } else {
        out.redirect = this.redirect;
      }

      this.$emit('input', out);
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
            <button class="btn bg-transparent icon-btn icon icon-sort-up" @click="$emit('up')">
              {{ '' }}
            </button>
            <button class="btn bg-transparent icon-btn icon icon-sort-down" @click="$emit('down')">
              {{ '' }}
            </button>
          </div>
        </div>
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
      <RadioGroup id="destination-radio" v-model="mode" :selected="0" :options="['forwardOne', 'forwardMany', 'redirect']" :labels="['Forward to Service', 'Forward to Multiple Services', 'Redirect to URL']" />
      <div v-if="mode==='forwardOne'" class="row">
        <div class="col span-12">
          <Destination :is-weighted="false" :spec="to[0]" @input="change('to', 0, $event)" />
        </div>
      </div>
      <div v-if="mode=='forwardMany'" class="row">
        <div class="col span-12">
          <Destination v-for="(destination, i) in to" :key="i" :is-weighted="true" :spec="destination" @input="change('to', i, $event)" />
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
      <Checkbox v-model="shouldMirror" label="Mirror" />
      <Checkbox v-model="shouldFault" label="Fault" />
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
    padding: 10px 20px 10px 20px;
    background-color: var(--login-bg);
    margin-bottom: 20px;

    & .header{
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;

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
