<script>
import isEmpty from 'lodash/isEmpty';
import { CATTLE_PUBLIC_ENDPOINTS } from '@/config/labels-annotations';
import has from 'lodash/has';
import Endpoints from '@/components/formatter/Endpoints';

export default {
  components: { Endpoints },
  props:      {
    value: {
      type:    [Array, String],
      default: null,
    },
    row: {
      type:     Object,
      required: true,
    },
    col: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    hasPublic() {
      const { metadata: { annotations = {} } } = this.row;

      if (!isEmpty(annotations) && has(annotations, CATTLE_PUBLIC_ENDPOINTS)) {
        return true;
      }

      return false;
    },
    parsed() {
      const { row, hasPublic } = this;
      const {
        metadata: { annotations = {} },
        spec: {
          clusterIP = null, ports = [], type: serviceType, externalName
        }
      } = row;
      const out = [];
      const isHeadless = serviceType === 'ClusterIP' && clusterIP === 'None';
      const parsedClusterIp =
        !isEmpty(clusterIP) && !isHeadless ? `${ clusterIP }:` : '';
      let label = '';
      const link = '';

      if (hasPublic) {
        return annotations[CATTLE_PUBLIC_ENDPOINTS];
      }

      // <CLUSTER_IP>:<PORT>/<PROTOCOL> > <TARGET PORT>
      if (isEmpty(ports)) {
        if (!isEmpty(parsedClusterIp)) {
          label = parsedClusterIp;
        } else if (serviceType === 'ExternalName' && !isEmpty(externalName)) {
          label = externalName;
        }

        out.push({
          label,
          link,
        });
      } else {
        ports.forEach((p) => {
          const clusterIpAndPort = `${ parsedClusterIp }${ p.port }`;
          const protocol = p?.protocol ? ` /${ p.protocol }` : '';
          const targetPort = p?.targetPort ? ` > ${ p.targetPort }` : '';

          label = `${ clusterIpAndPort }${ protocol }${ targetPort }`;

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
    <div v-if="hasPublic">
      <Endpoints v-model="parsed" :row="{}" :col="{}" />
    </div>
    <div v-for="(port, index) in parsed" v-else :key="index">
      <span v-if="port.link" v-html="port.link"></span>
      <span v-else>{{ port.label }}</span>
    </div>
  </div>
</template>
