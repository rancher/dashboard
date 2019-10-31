export default {
  kind() {
    const spec = this.spec;

    if ( spec.targetServiceName && spec.targetServiceNamespace ) {
      return 'service';
    }

    if ( spec.ipAddresses && spec.ipAddresses.length ) {
      return 'ipaddress';
    }

    if ( spec.fqdn ) {
      return 'fqdn';
    }

    return 'unknown';
  },

  kindDisplay() {
    // Satisfy eslint that it's a string...
    const kind = `${ this.kind }`;

    switch ( kind ) {
    case 'service':
      return 'Service';
    case 'ipaddress':
      return 'IP Address';
    case 'fqdn':
      return 'FQDN';
    case 'unknown':
      return '?';
    }
  },

  targetDisplay() {
    // Satisfy eslint that it's a string...
    const kind = `${ this.kind }`;

    switch ( kind ) {
    case 'service':
      return `${ this.spec.targetServiceName }/${ this.spec.targetServiceName }`;
    case 'fqdn':
      return this.spec.fqdn;
    case 'ipaddress':
      return (this.spec.ipAddresses || []).join(', ');
    }

    return '';
  }
};
