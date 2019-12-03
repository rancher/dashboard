export default {
  targetKind() {
    const spec = this.spec;

    if ( !spec ) {
      return 'unknown';
    }

    if ( spec.targetRouter && spec.targetNamespace ) {
      return 'router';
    }

    if ( spec.targetApp && spec.targetVersion && spec.targetNamespace ) {
      return 'version';
    }

    if ( spec.targetApp && spec.targetNamespace ) {
      return 'app';
    }

    return 'none';
  },

  kindDisplay() {
    // Satisfy eslint that it's a string...
    const kind = `${ this.targetKind }`;

    switch ( kind ) {
    case 'router':
      return 'Router';
    case 'version':
      return 'Service version';
    case 'app':
      return 'Service';
    case 'none':
      return 'None';
    }
  },

  targetDisplay() {
    // Satisfy eslint that it's a string...
    const kind = `${ this.targetKind }`;

    switch ( kind ) {
    case 'router':
      return `${ this.spec.targetNamespace }/${ this.spec.targetRouter }`;
    case 'version':
      return `${ this.spec.targetNamespace }/${ this.spec.targetApp }@${ this.spec.targetVersion }`;
    case 'app':
      return `${ this.spec.targetNamespace }/${ this.spec.targetApp }`;
    }

    return '';
  }

};
