export default {
  targetKind() {
    const spec = this.spec;

    if ( !spec ) {
      return 'unknown';
    }

    if ( spec.targetApp ) {
      if (spec.targetVersion) {
        return 'version';
      }

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
    const kind = `${ this.targetKind }`;

    switch ( kind ) {
    case 'service':
      return 'Service';
    case 'version':
      return 'Version';
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
    const kind = `${ this.targetKind }`;

    switch ( kind ) {
    case 'version':
      return `${ this.spec.targetApp }/${ this.spec.targetVersion }`;
    case 'service':
      return `${ this.spec.targetApp }`;
    case 'fqdn':
      return this.spec.fqdn;
    case 'ipaddress':
      return (this.spec.ipAddresses || []).join(', ');
    }

    return '';
  }
};
