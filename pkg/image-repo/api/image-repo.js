import AESEncrypt from '@shell/utils/aes-encrypt';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export const harborAPI = (spec = { harborVersion: '', harborServer: '' }) => {
  let { harborVersion, harborServer, store } = spec;
  let baseUrl = '';
  const request = {};
  const checkBaseUrl = () => {
    if (!baseUrl) {
      throw new Error('Base URL Can Not Be Empty');
    }
  };

  const factoryNewPromise = async(promise) => {
    try {
      const resp = await promise;

      return resp;
    } catch (error) {
      if (error?.errors?.length > 0 && error.errors[0]) {
        const errMessage = error.errors[0];

        store.dispatch('growl/warning', {
          title:   errMessage?.code,
          message: errMessage?.message
        }, { root: true });
        throw errMessage;
      }
      throw error;
    }
  };

  const updateBaseUrl = () => {
    baseUrl = `/meta/harbor/${ harborServer.replace('//', '/').replace(/\/+$/, '') }/api${ harborVersion === 'v1' || !harborVersion ? '' : `/${ harborVersion }` }`;
  };

  if (harborVersion && harborServer) {
    updateBaseUrl();
  }

  const getBaseUrl = () => {
    return baseUrl;
  };

  const fetchHarborServerUrl = async() => {
    const setting = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-server-url' });

    const url = setting.value;

    harborServer = url;

    return setting;
  };

  const setHarborServer = (url) => {
    harborServer = url;
  };
  const setHarborVersion = (version) => {
    harborVersion = version;
  };

  const getHarborServerIp = () => {
    const harborServerArr = harborServer?.split('//');
    const harborServerIp = (harborServerArr?.length ? harborServerArr[1] : '').replace(/\/+$/, '');

    return harborServerIp;
  };

  const fetchHarborVersion = async() => {
    let setting;

    try {
      setting = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-version' });
    } catch (err) {
      setting = await store.dispatch('management/create', {
        type: MANAGEMENT.SETTING, value: '', metadata: { name: 'harbor-version' }
      }, { root: true });
    }

    return setting;
  };

  const fetchInsecureSkipVerify = async() => {
    let setting;

    try {
      setting = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-insecure-skip-verify' });
    } catch (err) {
      setting = await store.dispatch('management/create', {
        type: MANAGEMENT.SETTING, value: '', metadata: { name: 'harbor-insecure-skip-verify' }
      }, { root: true });
    }

    return setting;
  };

  const initAPIRequest = async(version, serverURL) => {
    const promises = [];

    if (!version) {
      promises.push(fetchHarborVersion());
    } else {
      setHarborVersion(version);
    }

    if (!serverURL) {
      promises.push(fetchHarborServerUrl());
    } else {
      setHarborServer(serverURL);
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
    updateBaseUrl();
  };

  const fetchSystemInfo = () => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/systeminfo`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET'
    });
  };

  const removeProjects = (projectIds) => {
    checkBaseUrl();
    const promises = projectIds.map((id) => {
      const res = store.dispatch('management/request', {
        url:     `${ baseUrl }/projects/${ id }`,
        headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
        method:  'DELETE'
      });

      return factoryNewPromise(res);
    });

    return Promise.all(promises);
  };

  const createProject = (project) => {
    checkBaseUrl();

    const res = store.dispatch('management/request', {
      url:     `${ baseUrl }/projects`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    project
    });

    return factoryNewPromise(res);
  };

  const fetchProject = (id) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchAdminConfig = () => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/configurations`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchHarborUserInfo = () => {
    return store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-admin-auth' });
  };

  const addWhitelist = async(ip) => {
    const setting = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'whitelist-domain' });

    const wl = setting.value.split(',');

    wl.push(ip);
    const value = [...new Set(wl)].join(',');

    setting.value = value;

    return setting.save();
  };

  const removeHarborAccount = async() => { // for store.getters['auth/isAdmin'] user
    checkBaseUrl();
    const [serverSetting, authSetting, authModeSetting] = await Promise.all([
      store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-server-url' }),
      store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-admin-auth' }),
      store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-auth-mode' })
    ]);
    let versionSetting;

    try {
      versionSetting = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-version' });
    } catch (err) {
      versionSetting = await store.dispatch('management/create', {
        type: MANAGEMENT.SETTING, value: '', metadata: { name: 'harbor-version' }
      }, { root: true });
    }

    serverSetting.value = '';
    authSetting.value = '';
    authModeSetting.value = '';
    versionSetting.value = '';

    return Promise.all([serverSetting.save(), authSetting.save(), authModeSetting.save(), versionSetting.save()]);
  };

  const syncHarborAccount = (params) => {
    const data = { ...params };
    const disabledEncryption = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.DISABLE_PASSWORD_ENCRYPT);
    const p = data.password;

    if (p) {
      data.password = disabledEncryption?.value === 'true' ? p : AESEncrypt(p.trim());
    }
    const userId = store.getters['auth/me']?.id;

    return store.dispatch('management/request', {
      url:    `/v3/users/${ userId }?action=setharborauth`,
      method: 'POST',
      data
    });
  };

  const testEmailServer = (config) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/email/ping`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    config
    });
  };

  const updateAdminConfig = (config) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/configurations`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'PUT',
      data:    config
    });
  };

  const fetchLabels = (param) => {
    checkBaseUrl();
    const p = Object.keys(param).map((k) => `${ k }=${ param[k] }`);

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/labels?${ p.join('&') }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const updateLabel = (label) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/labels/${ label.id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'PUT',
      data:    label
    });
  };

  const createLabel = (label) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/labels`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    label
    });
  };

  const removeLabels = (labelIds) => {
    checkBaseUrl();
    const promises = labelIds.map((id) => store.dispatch('management/request', {
      url:     `${ baseUrl }/labels/${ id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'DELETE',
    }));

    return Promise.all(promises);
  };

  const fetchSchedule = () => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/system/gc/schedule`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const updateSchedule = (s) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/system/gc/schedule`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'PUT',
      data:    s
    });
  };

  const getProjectDetail = (id) => {
    checkBaseUrl();

    const res = store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });

    return factoryNewPromise(res);
  };

  const fetchRepo = (param) => {
    checkBaseUrl();
    const p = Object.entries(param).map((item) => `${ item[0] }=${ item[1] }`).join('&');

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories?${ p }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const deleteRepos = (names) => {
    checkBaseUrl();
    const promises = names.map((n) => {
      const params = n.split('/');

      if (params.length > 1) {
        const res = store.dispatch('management/request', {
          url:     `${ baseUrl }/projects/${ params[0] }/repositories/${ params[1] }`,
          headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
          method:  'DELETE',
        });

        return factoryNewPromise(res);
      }

      return new Promise();
    });

    return Promise.all(promises);
  };

  const fetchTags = (projectId, name) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories/${ name }/tags?detail=${ projectId }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const removeTags = (repo, tags) => {
    checkBaseUrl();
    const promises = tags.map((tag) => store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories/${ repo }/tags/${ tag }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'DELETE',
    }));

    return Promise.all(promises);
  };

  const addTagLabels = (repo, tag, labelIds) => {
    checkBaseUrl();

    return labelIds.map((labelId) => store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories/${ repo }/tags/${ tag }/labels`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    { id: labelId }
    }));
  };

  const removeTagLabels = (repo, tag, labelIds) => {
    checkBaseUrl();
    const promises = labelIds.map((labelId) => store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories/${ repo }/tags/${ tag }/labels/${ labelId }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'DELETE',
    }));

    return Promise.all(promises);
  };

  const setProjectPublic = (s, id) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'PUT',
      data:    s
    });
  };

  const fetchProjectsAndImages = (q) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/search?q=${ encodeURIComponent(q) }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const addProjectUser = (params, id) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }/members`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    params
    });
  };

  const projectChangeRole = (id, memeberIds, params) => {
    checkBaseUrl();
    const promises = memeberIds.map((memeberId) => store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }/members/${ memeberId }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    params
    }));

    return Promise.all(promises);
  };

  const projectDeleteMemberRole = (id, memeberIds) => {
    checkBaseUrl();
    const promises = memeberIds.map((memeberId) => store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }/members/${ memeberId }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'DELETE',
    }));

    return Promise.all(promises);
  };

  const fetchProjects = (p) => {
    checkBaseUrl();
    const params = Object.entries(p).filter((p) => p[1] !== '').map((p) => `${ p[0] }=${ p[1] }`).join('&');

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects?${ params }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchLogs = (p) => {
    checkBaseUrl();
    const params = Object.entries(p).filter((p) => p[1] !== '').map((p) => `${ p[0] }=${ p[1] }`).join('&');

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/logs?${ params }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchProjectSummary = (projectId) => {
    checkBaseUrl();

    const res = store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ projectId }/summary`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });

    return factoryNewPromise(res);
  };

  const fetchProjectImages = (projectName, param) => {
    checkBaseUrl();
    const p = Object.entries(param).map((item) => `${ item[0] }=${ item[1] }`).join('&');

    const res = store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ projectName }/repositories?${ p }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });

    return factoryNewPromise(res);
  };

  const fetchProjectMembersList = (projectId, p) => {
    checkBaseUrl();
    const params = Object.entries(p).map((p) => `${ p[0] }=${ p[1] }`).join('&');

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ projectId }/members?${ params }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchProjectLogs = (projectId, p) => {
    checkBaseUrl();
    const params = Object.entries(p).map((p) => `${ p[0] }=${ p[1] }`).join('&');

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ projectId }/logs?${ params }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const updateHarborPwd = (userId, params) => {
    const disabledEncryption = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.DISABLE_PASSWORD_ENCRYPT);
    const data = {
      ...params,
      newPassword: disabledEncryption?.value === 'true' ? params.oldPassword : AESEncrypt(params.newPassword.trim()),
      oldPassword: disabledEncryption?.value === 'true' ? params.oldPassword : AESEncrypt(params.oldPassword.trim())
    };

    return store.dispatch('management/request', {
      url:     `/v3/users/${ userId }?action=updateharborauth`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data
    });
  };
  const fetchCurrentHarborUser = () => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/users/current`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchProjectMembers = (projectId, entityName) => {
    checkBaseUrl();

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ projectId }/members?entityname=${ entityName }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const syncHarborUser = async(data) => {
    const url = await fetchHarborServerUrl();

    if (!url) {
      return;
    }

    return store.dispatch('management/request', {
      url:    `/v3/users?action=syncharboruser`,
      method: 'POST',
      data
    });
  };

  const fetchSystemInfoToTest = (url, version) => {
    const baseUrl = `/meta/harbor/${ url.replace('//', '/').replace(/\/+$/, '') }/api${ version === 'v1' || !version ? '' : `/${ version }` }`;

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/systeminfo`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const saveHarborAccount = async(url, u, p, v, systeminfo = {}) => {
    const authMode = systeminfo.auth_mode;
    const disabledEncryption = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.DISABLE_PASSWORD_ENCRYPT);

    const serverSettingP = store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-server-url' });
    const authSettingP = store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-admin-auth' });
    const authModeSettingP = store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-auth-mode' });
    let versionSettingP;

    try {
      versionSettingP = store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-version' });
    } catch (err) {
      versionSettingP = store.dispatch('management/create', {
        type: MANAGEMENT.SETTING, value: '', metadata: { name: 'harbor-version' }
      }, { root: true });
    }

    const [serverSetting,
      authSetting,
      authModeSetting,
      versionSetting
    ] = await Promise.all([
      serverSettingP,
      authSettingP,
      authModeSettingP,
      versionSettingP
    ]);

    await store.dispatch('management/request', {
      url:    `/v3/users?action=saveharborconfig`,
      method: 'POST',
      data:   {
        serverURL: url.replace(/\/+$/, ''),
        username:  u,
        password:  disabledEncryption?.value === 'true' ? p : AESEncrypt(p.trim()),
        version:   v,
      }
    });
    serverSetting.value = url.replace(/\/+$/, '');
    authSetting.value = u;
    versionSetting.value = v;
    authModeSetting.value = authMode;

    return Promise.all([serverSetting.save(), authSetting.save(), authModeSetting.save(), versionSetting.save()]);
  };

  request.fetchHarborServerUrl = fetchHarborServerUrl;
  request.fetchSystemInfo = fetchSystemInfo;
  request.removeProjects = removeProjects;
  request.createProject = createProject;
  request.fetchProject = fetchProject;
  request.fetchAdminConfig = fetchAdminConfig;
  request.fetchHarborUserInfo = fetchHarborUserInfo;
  request.addWhitelist = addWhitelist;
  request.removeHarborAccount = removeHarborAccount;
  request.syncHarborAccount = syncHarborAccount;
  request.testEmailServer = testEmailServer;
  request.updateAdminConfig = updateAdminConfig;
  request.fetchLabels = fetchLabels;
  request.updateLabel = updateLabel;
  request.createLabel = createLabel;
  request.removeLabels = removeLabels;
  request.fetchSchedule = fetchSchedule;
  request.updateSchedule = updateSchedule;
  request.getProjectDetail = getProjectDetail;
  request.fetchRepo = fetchRepo;
  request.deleteRepos = deleteRepos;
  request.fetchTags = fetchTags;
  request.removeTags = removeTags;
  request.addTagLabels = addTagLabels;
  request.removeTagLabels = removeTagLabels;
  request.setProjectPublic = setProjectPublic;
  request.fetchProjectsAndImages = fetchProjectsAndImages;
  request.addProjectUser = addProjectUser;
  request.projectChangeRole = projectChangeRole;
  request.projectDeleteMemberRole = projectDeleteMemberRole;
  request.fetchProjects = fetchProjects;
  request.fetchLogs = fetchLogs;
  request.fetchProjectSummary = fetchProjectSummary;
  request.fetchProjectImages = fetchProjectImages;
  request.fetchProjectMembersList = fetchProjectMembersList;
  request.fetchProjectLogs = fetchProjectLogs;
  request.updateHarborPwd = updateHarborPwd;
  request.fetchCurrentHarborUser = fetchCurrentHarborUser;
  request.fetchHarborVersion = fetchHarborVersion;
  request.fetchProjectMembers = fetchProjectMembers;
  request.syncHarborUser = syncHarborUser;
  request.fetchSystemInfoToTest = fetchSystemInfoToTest;
  request.saveHarborAccount = saveHarborAccount;
  request.setHarborServer = setHarborServer;
  request.setHarborVersion = setHarborVersion;
  request.initAPIRequest = initAPIRequest;
  request.fetchInsecureSkipVerify = fetchInsecureSkipVerify;
  request.getBaseUrl = getBaseUrl;
  request.updateBaseUrl = updateBaseUrl;
  request.getHarborServerIp = getHarborServerIp;

  return request;
};
