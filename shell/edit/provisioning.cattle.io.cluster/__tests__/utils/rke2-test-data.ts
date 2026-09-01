export const rke2TestTable = [
  [
    {
      'rke2-calico':        {},
      'rke2-ingress-nginx': {
        controller: {
          extraArgs: {
            'enable-ssl-passthrough':      true,
            'watch-ingress-without-class': true
          }
        }
      }
    },
    {
      'rke2-calico':        {},
      'rke2-ingress-nginx': {
        controller: {
          extraArgs: {
            'enable-ssl-passthrough':      true,
            'watch-ingress-without-class': true
          }
        }
      }
    },
  ],
  [
    {
      'rke2-calico':        {},
      'rke2-ingress-nginx': {
        controller: {
          extraArgs: {
            'enable-ssl-passthrough':      true,
            'watch-ingress-without-class': true
          }
        }
      },
      'rke2-ingress-nginx-invalid': {
        controller: {
          extraArgs: {
            'enable-ssl-passthrough':      true,
            'watch-ingress-without-class': true
          }
        }
      }
    },
    {
      'rke2-calico':        {},
      'rke2-ingress-nginx': {
        controller: {
          extraArgs: {
            'enable-ssl-passthrough':      true,
            'watch-ingress-without-class': true
          }
        }
      }
    },
  ],
];
