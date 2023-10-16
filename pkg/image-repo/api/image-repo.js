import AESEncrypt from '@shell/utils/aes-encrypt';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export const harborAPI = (spec = { harborVersion: '', harborServer: '' }) => {
  let { harborVersion, harborServer, store } = spec;
  let baseUrl = '';
  const request = {};
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
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/systeminfo`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET'
    });
  };

  const removeProjects = (projectIds) => {
    const promises = projectIds.map((id) => store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'DELETE'
    }));

    return promises;
  };

  const createProject = (project) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    JSON.stringify(project)
    });
  };

  const fetchProject = (id) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchAdminConfig = () => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/configurations`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchHarborUserInfo = () => {
    return store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-admin-auth' });
  };

  const testHarborAccount = () => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/users/current`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const addWhitelist = async(ip) => {
    const setting = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'whitelist-domain' });

    const wl = setting.value.split(',');

    wl.push(ip);
    const value = [...new Set(wl)].join(',');

    setting.value = value;

    return setting.save();
  };

  const saveHarborAccount = async(url, u, p, v) => { // for store.getters['auth/isAdmin'] user
    const removeConfig = url === '' && u === '' && p === '';

    const serverSetting = store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-server-url' });
    const authSetting = store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-admin-auth' });
    const authModeSetting = store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-auth-mode' });
    let versionSetting;

    try {
      versionSetting = store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'harbor-version' });
    } catch (err) {
      versionSetting = store.dispatch('management/create', {
        type: MANAGEMENT.SETTING, value: '', metadata: { name: 'harbor-version' }
      }, { root: true });
    }

    if (removeConfig) {
      serverSetting.value = '';
      authSetting.vaue = '';
      authModeSetting.value = '';
      versionSetting.value = '';

      return Promise.all([serverSetting.save(), authSetting.save(), authModeSetting.save(), versionSetting.save()]);
    }

    const resp = await fetchSystemInfo();
    const data = resp.body || {};
    const authMode = data.auth_mode;

    const disabledEncryption = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.DISABLE_PASSWORD_ENCRYPT);

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
    authSetting.vaue = u;
    authModeSetting.value = authMode;
    versionSetting.value = v;

    return Promise.all([serverSetting.save(), authSetting.save(), authModeSetting.save(), versionSetting.save(), Promise.resolve({ harborSystemInfo: data })]);
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
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/email/ping`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    config
    });
  };

  const updateAdminConfig = (config) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/configurations`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'PUT',
      data:    config
    });
  };

  const fetchLabels = (param) => {
    const p = Object.keys(param).map((k) => `${ k }=${ param[k] }`);

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/labels?${ p.join('&') }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const updateLabel = (label) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/labels/${ label.id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'PUT',
      data:    label
    });
  };

  const createLabel = (label) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/labels`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    label
    });
  };

  const removeLabels = (labelIds) => {
    const promises = labelIds.map((id) => store.dispatch('management/request', {
      url:     `${ baseUrl }/labels/${ id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'DELETE',
    }));

    return Promise.all(promises);
  };

  const fetchSchedule = () => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/system/gc/schedule`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const updateSchedule = (s) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/system/gc/schedule`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'PUT',
      data:    s
    });
  };

  const getProjectDetail = (id) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchRepo = (param) => {
    const p = Object.entries(param).map((item) => `${ item[0] }=${ item[1] }`).join('&');

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories?${ p }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const deleteRepos = (names) => {
    const promises = names.map((n) => store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories/${ n }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'DELETE',
    }));

    return Promise.all(promises);
  };

  const fetchTags = (projectId, name) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories/${ name }/tags?detail=${ projectId }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const removeTags = (repo, tags) => {
    const promises = tags.map((tag) => store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories/${ repo }/tags/${ tag }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'DELETE',
    }));

    return Promise.all(promises);
  };

  const addTagLabels = (repo, tag, labelIds) => {
    return labelIds.map((labelId) => store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories/${ repo }/tags/${ tag }/labels`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    { id: labelId }
    }));
  };

  const removeTagLabels = (repo, tag, labelIds) => {
    const promises = labelIds.map((labelId) => store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories/${ repo }/tags/${ tag }/labels/${ labelId }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'DELETE',
    }));

    return Promise.all(promises);
  };

  const setProjectPublic = (s, id) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'PUT',
      data:    s
    });
  };

  const fetchProjectsAndImages = (q) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/search?q=${ encodeURIComponent(q) }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const addProjectUser = (params, id) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }/members`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    params
    });
  };

  const projectChangeRole = (id, memeberIds, params) => {
    const promises = memeberIds.map((memeberId) => store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }/members/${ memeberId }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'POST',
      data:    params
    }));

    return Promise.all(promises);
  };

  const projectDeleteMemberRole = (id, memeberIds) => {
    const promises = memeberIds.map((memeberId) => store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ id }/members/${ memeberId }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'DELETE',
    }));

    return Promise.all(promises);
  };

  const fetchProjects = (p) => {
    const params = Object.entries(p).filter((p) => p[1] !== '').map((p) => `${ p[0] }=${ p[1] }`).join('&');

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects?${ params }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchLogs = (p) => {
    const params = Object.entries(p).filter((p) => p[1] !== '').map((p) => `${ p[0] }=${ p[1] }`).join('&');

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/logs?${ params }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchProjectSummary = (projectId) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ projectId }/summary`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchProjectImages = (p) => {
    const params = Object.entries(p).map((p) => `${ p[0] }=${ p[1] }`).join('&');

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/repositories?${ params }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchProjectMembersList = (projectId, p) => {
    const params = Object.entries(p).map((p) => `${ p[0] }=${ p[1] }`).join('&');

    return store.dispatch('management/request', {
      url:     `${ baseUrl }/projects/${ projectId }/members?${ params }`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchProjectLogs = (projectId, p) => {
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
      newPassword: disabledEncryption?.value === 'true' ? params.oldPassword : AESEncrypt(params.oldPassword.trim()),
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
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/users/current`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const fetchProjectMembers = (projectId, entityName) => {
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

  const fetchConnectHarbor = (baseUrl) => {
    return store.dispatch('management/request', {
      url:     `${ baseUrl }/systeminfo`,
      headers: { 'X-API-Harbor-Admin-Header': store.getters['auth/isAdmin'] },
      method:  'GET',
    });
  };

  const saveHarborAccountWhenVersionOk = async(url, u, p, v, resp) => {
    const data = resp.body || {};
    const authMode = data.auth_mode;
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

    return Promise.all([serverSetting.save(), authSetting.save(), authModeSetting.save(), versionSetting.save(), Promise.resolve({ harborSystemInfo: data })]);
  };

  request.fetchHarborServerUrl = fetchHarborServerUrl;
  request.fetchSystemInfo = fetchSystemInfo;
  request.removeProjects = removeProjects;
  request.createProject = createProject;
  request.fetchProject = fetchProject;
  request.fetchAdminConfig = fetchAdminConfig;
  request.fetchHarborUserInfo = fetchHarborUserInfo;
  request.testHarborAccount = testHarborAccount;
  request.addWhitelist = addWhitelist;
  request.saveHarborAccount = saveHarborAccount;
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
  request.fetchConnectHarbor = fetchConnectHarbor;
  request.saveHarborAccountWhenVersionOk = saveHarborAccountWhenVersionOk;
  request.setHarborServer = setHarborServer;
  request.setHarborVersion = setHarborVersion;
  request.initAPIRequest = initAPIRequest;
  request.fetchInsecureSkipVerify = fetchInsecureSkipVerify;
  request.getBaseUrl = getBaseUrl;

  return request;
};
