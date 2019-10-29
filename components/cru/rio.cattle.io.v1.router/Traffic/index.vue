<script>
import ToggleSwitch from '@/components/form/ToggleSwitch';
import Destination from '@/components/cru/rio.cattle.io.v1.router/Destination';
import Checkbox from '@/components/form/Checkbox';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import Redirect from '@/components/cru/rio.cattle.io.v1.router/Traffic/Redirect';
import Rewrite from '@/components/cru/rio.cattle.io.v1.router/Traffic/Rewrite';
import Fault from '@/components/cru/rio.cattle.io.v1.router/Traffic/Fault';
import Headers from '@/components/cru/rio.cattle.io.v1.router/Traffic/Headers';
export default {
  components: {
    Destination, ToggleSwitch, Checkbox, Tab, Tabbed, Redirect, Rewrite, Fault, Headers
  },
  props: {
    spec: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const {
      mirror, fault, timeout, retry, redirect, rewrite, headers
    } = this.spec;

    return {
      shouldMirror:   !!this.spec.mirror,
      shouldFault:    !!this.spec.fault,
      shouldRewrite:  !!this.spec.rewrite,
      shouldRedirect: !!this.spec.redirect,
      mirror,
      fault,
      timeout,
      retry,
      redirect,
      rewrite,
      headers
    };
  },
  computed: {
    formatted() {
      const spec = { headers: this.headers };

      if (this.shouldRedirect) {
        spec['redirect'] = this.redirect;
      } else if (this.shouldRewrite) {
        spec['rewrite'] = this.rewrite;
      }
      if (this.shouldFault) {
        spec['fault'] = this.fault;
      }
      if (this.shouldMirror) {
        spec['mirror'] = this.mirror;
      }

      return spec;
    }
  },
  methods: {
    change(type, spec) {
      console.log(type, spec);
      this[type] = spec;
    },
    trafficChange() {
      this.$emit('input', this.formatted);
    }
  }
};
</script>

<template>
  <div id="route-traffic" @input="trafficChange" @change="trafficChange">
    <ToggleSwitch v-model="shouldRedirect" :on="shouldRedirect" class="redirect-toggle" :labels="['Forward', 'Redirect']" />
    <Redirect v-if="shouldRedirect" class="redirect" :spec="{...redirect}" @input="e=>change('redirect', e)" />
    <Tabbed default-tab="mirror">
      <Tab v-if="!shouldRedirect" name="rewrite" label="Rewrite">
        <Checkbox v-model="shouldRewrite" label="rewrite" />
        <Rewrite v-if="shouldRewrite" :spec="rewrite" @input="e=>change('rewrite', e)" />
      </Tab>
      <Tab name="mirror" label="Mirror">
        <Checkbox v-model="shouldMirror" label="mirror traffic" />
        <Destination v-if="shouldMirror" :spec="mirror" :is-weighted="false" @input="e=>change('mirror', e)" />
      </Tab>
      <Tab name="fault" label="Fault">
        <Checkbox v-model="shouldFault" label="include fault policy" />
        <Fault v-if="shouldFault" :spec="fault" @input="e=>change('fault', e)" />
      </Tab>
      <Tab name="headers" label="Headers">
        <Headers :spec="headers" @input="e=>change('headers', e)" />
      </Tab>
    </Tabbed>
  </div>
</template>

<style lang='scss'>
  #route-traffic {
    display: flex;
    flex-direction: column;

     & .redirect, .fault {
        display: flex;
        margin: 5px;
        & > * {
          margin-right: 5px;
          padding: 5px;
          max-width: 200px;
        }
      }
     & .redirect-toggle {
        margin: auto;
      }

  }
</style>
