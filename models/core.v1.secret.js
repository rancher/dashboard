const DISPLAY_TYPES = {
  Opaque:                                'Opaque',
  'kubernetes.io/service-account-token': 'Service Acct',
  'kubernetes.io/dockercfg':             'Dockercfg',
  'kubernetes.io/dockerconfigjson':      'Docker JSON',
  'kubernetes.io/basic-auth':            'Basic Auth',
  'kubernetes.io/ssh-auth':              'SSH',
  'kubernetes.io/tls':                   'TLS',
  'bootstrap.kubernetes.io/token':       'Bootstrap Token',
  'istio.io/key-and-cert':               'TLS (Istio)',
};

export default {
  keysDisplay() {
    const keys = [
      ...Object.keys(this.data || []),
      ...Object.keys(this.binaryData || [])
    ];

    if ( !keys.length ) {
      return '(none)';
    }

    // if ( keys.length >= 4 ) {
    //   return `${keys[0]}, ${keys[1]}, ${keys[2]} and ${keys.length - 3} more`;
    // }

    return keys.join(', ');
  },

  typeDisplay() {
    const mapped = DISPLAY_TYPES[this._type];

    if ( mapped ) {
      return mapped;
    }

    return (this._type || '').replace(/^kubernetes.io\//, '');
  },
};
