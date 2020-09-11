export default {
  github() {
    const match = this.spec.repo.match(/^https?:\/\/github\.com\/(.*)(\.git)?$/);

    if ( match ) {
      return match[1];
    }

    return false;
  },

  repoIcon() {
    if ( this.github ) {
      return 'icon icon-github icon-lg';
    }
  },

  repoDisplay() {
    let repo = this.spec.repo;

    repo = repo.replace(/.git$/, '');
    repo = repo.replace(/^https:\/\//, '');

    if ( this.github ) {
      return this.github;
    }

    return repo;
  },

  commitDisplay() {
    return this.status?.commit?.substr(0, 7);
  },
};
