import Vue from 'vue';

export default {

  applyDefaults() {
    return () => {
      Vue.set(
        this, 'spec', {
          host:          '',
          subsets:       [],
          trafficPolicy: {

            loadBalancer: {
              simple: 'ROUND_ROBIN',
              // consistentHash:
              // localityLbSetting:
            },
            connectionPool: {
              tcp:  {
                // maxConnections:
                // connectTimeout:
                // tcpKeepalive:
              },
              http: {
                // http1MaxPendingRequests:
                // http2MaxRequests:
                // maxRequestsPerConnection:
                // maxRetries:
                // idleTimeout:
                // h2UpgradePolicy:
                // useClientProtocol:

              },
            },
            outlierDetection: {
              // consecutiveGatewayErrors:
              // consecutive5xxErrors:
              // interval:
              // baseEjectionTime:
              // maxEjectionPercent:
              // minHealthPercent:
            },

            tls: {
              // mode:
              // clientCertificate:
              // privateKey:
              // caCertificates:
              // credentialName:
              // subjectAltNames:
              // sni:
            },
            // portLevelSettings:{
            // - port: '',
            //     number: 80
            //   loadBalancer: '',
            //     simple: LEAST_CONN
            // }

          }
        });
    };
  },
};
