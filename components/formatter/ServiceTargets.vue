<script>
import { isEmpty } from 'lodash';
// import { escapeHtml } from '@/utils/string';

export default {
  props: {
    value: {
      type:     [Array, String],
      default: null,
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      required: true
    },
  },

  computed: {
    parsed() {
      const { row } = this;
      const {
        spec: {
          clusterIP = null,
          ports = [],
          type: serviceType
        }
      } = row;
      const out = [];
      const parsedClusterIp = !isEmpty(clusterIP) ? `${ clusterIP }:` : '';

      // <CLUSTER_IP>:<PORT>/<PROTOCOL> > <TARGET PORT>
      if (isEmpty(ports)) {
        if (!isEmpty(parsedClusterIp)) {
          out.push(parsedClusterIp);
        }
      } else {
        ports.forEach(( p ) => {
          const clusterIpAndPort = `${ parsedClusterIp }${ p.port }`;
          const protocol = p?.protocol ? ` /${ p.protocol }` : '';
          const targetPort = p?.targetPort ? ` > ${ p.targetPort }` : '';
          const label = `${ clusterIpAndPort }${ protocol }${ targetPort }`;

          // TODO - Should this be a relative link (//) as to avoid opening secure when it may not be?
          const link = serviceType === 'ClusterIP' && !isEmpty(clusterIP) ? `<a href="https://${ clusterIP }/${ p.port }" target="_blank" rel="noopener nofollow">${ clusterIpAndPort }</a>${ protocol }${ targetPort }` : null;

          out.push({
            label,
            link,
          });
        });
      }

      return out;
    },
  },
};
</script>>

<template>
  <div>
    <div v-for="( port, index ) in parsed" :key="index">
      <span v-if="port.link" v-html="port.link"></span>
      <span v-else>{{ port.label }}</span>
    </div>
  </div>
</template>
