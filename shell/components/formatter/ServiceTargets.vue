<script>
import isEmpty from 'lodash/isEmpty';
import { CATTLE_PUBLIC_ENDPOINTS } from '@shell/config/labels-annotations';
import Endpoints from '@shell/components/formatter/Endpoints';
import has from 'lodash/has';
import { isMaybeSecure } from '@shell/utils/url';

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
        },
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
          let proxyUrl;

          const stringPort = p.port.toString();

          if (p?.protocol === 'TCP' && (stringPort.endsWith('80') || stringPort.endsWith('443'))) {
            if (isMaybeSecure(p.port, p?.protocol)) {
              proxyUrl = row.proxyUrl('https', p.port);
            } else {
              proxyUrl = row.proxyUrl('http', p.port);
            }
          }

          const clusterIpAndPort = proxyUrl ? `<a href="${ proxyUrl }" target="_blank" rel="noopener noreferrer nofollow">${ p?.name ? p.name : `${ parsedClusterIp }${ p.port }` }</a>` : `${ parsedClusterIp }${ p.port }`;
          const targetPort = p?.targetPort ? ` <span class="icon icon-endpoints_connected icon-lg"></span> ${ p.targetPort }` : '';
          const protocol = p?.protocol ? `/${ p.protocol }` : '';

          label = `${ clusterIpAndPort }${ targetPort }${ protocol }`;

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
    <div v-if="hasPublic" class="text-small">
      <Endpoints v-model="parsed" :row="{}" :col="{}" />
    </div>
    <div v-for="(port, index) in parsed" v-else :key="index" class="text-small">
      <span v-html="port.label"></span>
    </div>
  </div>
</template>
