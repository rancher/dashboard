// Added by Verrazzano
import OamComponentHelper from '@pkg/mixins/oam-component-helper';

import { base64Decode, base64Encode } from '@shell/utils/crypto';

export default {
  mixins:   [OamComponentHelper],
  computed: {
    decodedData() {
      return this.getDecodedData();
    },
    setData() {
      return (key, value) => { // or (mapOfNewData)
        const isMap = key && typeof key === 'object';

        let data = this.getWorkloadField('data');

        if ( !data || isMap ) {
          data = {};
        }

        let neu;

        if ( isMap ) {
          neu = key;
        } else {
          neu = { [key]: value };
        }

        for ( const k in neu ) {
        // The key is quoted so that keys like '.dockerconfigjson' that contain dot don't get parsed into an object path
          data[k] = base64Encode(neu[k]);
        }

        this.setWorkloadFieldIfNotEmpty('data', data);
      };
    },
  },
  methods: {
    getDecodedData() {
      const out = {};

      for ( const k in this.getWorkloadField('data') || {} ) {
        out[k] = base64Decode(this.getWorkloadField('data')[k]);
      }

      return out;
    }
  }
};
