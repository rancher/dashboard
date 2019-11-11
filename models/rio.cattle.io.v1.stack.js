export default {
  isGithub() {
    return this.spec.build && this.spec.build.repo && this.spec.build.repo.startsWith('https://github.com');
  },

  repoDisplay() {
    const build = this.spec.build || {};
    const repo = build.repo || '';

    if ( this.isGithub ) {
      return repo.replace(/^https:\/\/github.com\//, '');
    }

    return repo;
  },

  branchDisplay() {
    const build = this.spec.build || {};
    const branch = build.branch || '';

    return branch || 'master';
  },
};
