function objectToURIQueryString(query, prefix, connector) {
  return Object.keys(query).reduce((prev, key, index) => {
    if (index === 0 ) {
      prev += prefix === undefined ? '?' : prefix;
    } else {
      prev += connector || '&';
    }

    if (typeof query[key] === 'object') {
      const subQuery = objectToURIQueryString(query[key], '', ',');

      prev += `${ key }=${ encodeURIComponent(subQuery) }`;
    } else {
      prev += `${ key }=${ query[key] }`;
    }

    return prev;
  }, '');
}

export default {
  apiList({ dispatch }, { commitVal, url = null, headers = null } = {}) {
    return dispatch('rancher/request', { url, headers: headers || undefined }, { root: true });
  },
  loadMacvlans({ dispatch, commit }, { cluster, query }) {
    const queryStr = objectToURIQueryString(query);
    const url = `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets${ queryStr }`;

    return dispatch('apiList', { url } ).then((res) => {
      if (!query.continue) {
        commit('setMacvlanList', res.items || []);
      } else {
        commit('addMacvlanList', res.items || []);
      }

      const next = res.metadata?.continue;

      if (next) {
        dispatch('loadMacvlans', {
          cluster,
          query: {
            ...query,
            continue: next,
          }
        } );
      }
    });
  },
  loadExistedMasterMacvlan({ dispatch, commit }, { cluster, query }) {
    const queryStr = objectToURIQueryString(query);

    return dispatch('apiList', { url: `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets${ queryStr }` } ).then((res) => {
      commit('setExistedMasterMacvlan', res.items || []);
    });
  },
  loadMacvlanIps({ dispatch, commit }, { cluster, query }) {
    const queryStr = objectToURIQueryString(query);
    const url = `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/macvlanips${ queryStr }`;

    return dispatch('apiList', { url } ).then((res) => {
      if (!query.continue) {
        commit('setMacvlanIpList', res.items || []);
      } else {
        commit('addMacvlanIpList', res.items || []);
      }

      const next = res.metadata?.continue;

      if (next) {
        dispatch('loadMacvlanIps', {
          cluster,
          query: {
            ...query,
            continue: next,
          }
        });
      }
    });
  },
  loadMacvlan({ dispatch, commit }, { cluster, resource }) {
    return dispatch('apiList', { url: `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets/${ resource }` } ).then((res) => {
      commit('setMacvlan', res || {});

      return res;
    });
  },
  loadMacvlanPods({ dispatch, commit }, { cluster, query }) {
    const queryStr = objectToURIQueryString(query);

    return dispatch('apiList', { url: `/k8s/clusters/${ cluster }/api/v1/pods${ queryStr }` } ).then((res) => {
      // commit('setMacvlanPods', res.items || []);

      return res.items || [];
    });
  },
  createMacvlan(store, { cluster, params }) {
    const { dispatch } = this;

    return dispatch('management/request', {
      url:    `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets`,
      method: 'POST',
      data:   params,
    });
  },
  updateMacvlan(store, { cluster, params }) {
    const { dispatch } = this;

    return dispatch('management/request', {
      url:    `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets/${ params.metadata.name }`,
      method: 'PUT',
      data:   params,
    });
  },
  removeMacvlan({ commit }, { cluster, resource }) {
    const { dispatch } = this;

    dispatch('management/request', {
      url:    `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets/${ resource.metadata.name }`,
      method: 'DELETE',
    }).then(() => {
      commit('removeMacvlan', resource);
    });
  },
};
