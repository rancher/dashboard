import { createApp } from 'vue';
import SteveModel from '@shell/plugins/steve/steve-class';
const vueApp = createApp({});

export default class DestinationRule extends SteveModel {
  applyDefaults() {
    this['spec'] = {host:          '',
      subsets:       [],
      trafficPolicy: {
        loadBalancer:   { simple: 'ROUND_ROBIN' },
        connectionPool: {
          tcp:  {},
          http: {},
        },
        outlierDetection: {},
        tls:              {},
      }};
  }
}
