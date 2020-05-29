<script>
import { isEmpty } from 'lodash';

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
          type: serviceType,
          externalName
        }
      } = row;
      const out = [];
      const isHeadless = clusterIP === 'None';
      const parsedClusterIp = !isEmpty(clusterIP) && !isHeadless ? `${ clusterIP }:` : '';
      let label = '';
      let link = '';

      // <CLUSTER_IP>:<PORT>/<PROTOCOL> > <TARGET PORT>
      if (isEmpty(ports)) {
        if (!isEmpty(parsedClusterIp)) {
          label = parsedClusterIp;
        } else if (serviceType === 'ExternalName' && !isEmpty(externalName)) {
          label = externalName;
          if (!isHeadless) {
            link = `<a href="${ label }" target="_blank" rel="noopener nofollow">${ label }</a>`;
          }
        }

        out.push({
          label,
          link,
        });
      } else {
        ports.forEach(( p ) => {
          const clusterIpAndPort = `${ parsedClusterIp }${ p.port }`;
          const protocol = p?.protocol ? ` /${ p.protocol }` : '';
          const targetPort = p?.targetPort ? ` > ${ p.targetPort }` : '';

          label = `${ clusterIpAndPort }${ protocol }${ targetPort }`;

          link = serviceType === 'ClusterIP' && !isEmpty(clusterIP) && !isHeadless ? `<a href="//${ clusterIP }/${ p.port }" target="_blank" rel="noopener nofollow">${ clusterIpAndPort }</a>${ protocol }${ targetPort }` : null;

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
