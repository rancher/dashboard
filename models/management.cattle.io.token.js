import day from 'dayjs';

export default {

  isUISession() {
    return () => {
      // Leave as a function such that it's not treated as a property
      const labels = this.metadata?.labels;
      const kind = labels ? labels['authn.management.cattle.io/kind'] : '';

      return kind === 'session';
    };
  },

  bulkRemove() {
    // There's no way to exclude the current users ui session from this bulk remove (which causes the session to expire, user logged out and
    // fail any subsequent api's to be removed). Do a best effort to move any ui session (user could be logged in via another
    // method/browser) to the back of the queue.
    return (resources = this) => this.$dispatch('promptRemove', resources.sort((a, b) => {
      if (a.isUISession() && !b.isUISession()) {
        return 1;
      }
      if (!a.isUISession() && b.isUISession()) {
        return -1;
      }

      return 0;
    }));
  },

  _availableActions() {
    return this._standardActions.reduce((res, action) => {
      if (action.action === 'viewInApi') {
        res.push(action);
      } else if (action.action === 'promptRemove') {
        res.push({
          ...action,
          bulkAction: 'bulkRemove',
        });
      }

      return res;
    }, []);
  },

  state() {
    const state = this.metadata?.state?.name || 'unknown';

    return this.isExpired ? 'expired' : state;
  },

  isExpired() {
    const expiry = day(this.expiresAt);

    return expiry.isBefore(day());
  }
};
