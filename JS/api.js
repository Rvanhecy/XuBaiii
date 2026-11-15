// ============================================
// 后端接口封装
// 作用：把服务端数据同步到本地缓存，并把本地写操作上报到服务端
// 设计原则：接口不可用时自动退回纯本地模式，页面功能不受影响
// ============================================
var API = (function () {
  // 前后端部署在同一个域名下时留空即可（会自动请求同域的 /api/*）
  // 若后端单独部署，把域名填这里（例如 https://xxx.edgeone.run）
  var PROD_BASE = '';

  function resolveBase() {
    if (location.protocol === 'file:') return 'http://localhost:3000';
    var host = location.hostname;
    var isLocal = host === 'localhost' || host === '127.0.0.1' ||
      /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
    if (isLocal) return 'http://' + host + ':3000';
    return PROD_BASE;
  }

  var BASE = resolveBase();
  var TOKEN_KEY = 'xubaiwu_token';
  var MIGRATED_KEY = 'xubaiwu_migrated_v1';
  var state = { online: false, refreshing: false };

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function authHeaders() {
    var token = getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function request(path, options) {
    options = options || {};

    var headers = Object.assign({ 'Content-Type': 'application/json' }, authHeaders(), options.headers || {});
    return fetch(BASE + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = new Error(data.error || ('请求失败（' + res.status + '）'));
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  // 写操作的“后台同步”：失败不打断界面，只打日志
  function push(path, method, body) {
    if (!state.online || !getToken()) return;
    request(path, { method: method, body: body }).catch(function (err) {
      console.warn('[API] 同步失败 ' + method + ' ' + path + '：' + err.message);
      if (err.status === 401) setToken('');
    });
  }

  // 启动时拉全量快照，灌进本地缓存
  function bootstrap() {
    return request('/api/snapshot')
      .then(function (snapshot) {
        state.online = true;
        DB.hydrate(snapshot);
        return snapshot;
      })
      .catch(function (err) {
        state.online = false;
        console.warn('[API] 后端不可用，已切换到本地模式：' + err.message);
        return null;
      });
  }

  function login(username, password) {
    return request('/api/auth/login', { method: 'POST', body: { username: username, password: password } })
      .then(function (res) {
        setToken(res.token);
        state.online = true;
        return res;
      });
  }

  function register(payload) {
    return request('/api/auth/register', { method: 'POST', body: payload })
      .then(function (res) {
        setToken(res.token);
        state.online = true;
        return res;
      });
  }

  function logout() {
    push('/api/auth/logout', 'POST');
    setToken('');
  }

  // 把本地已有的数据做成迁移包（用户名密码是明文，服务端会重新哈希）
  function captureLocal() {
    return {
      users: DB.getUsers(),
      articles: DB.getArticles(),
      comments: DB.getComments(),
      messages: DB.getMessages(),
      profiles: DB.getProfiles(),
      favorites: DB.getFavorites()
    };
  }

  function migrate(payload) {
    return request('/api/migrate', { method: 'POST', body: payload }).then(function (res) {
      localStorage.setItem(MIGRATED_KEY, '1');
      return res;
    });
  }

  function needsMigration(payload) {
    if (localStorage.getItem(MIGRATED_KEY)) return false;
    return (payload.articles || []).length > 0 || (payload.users || []).length > 0;
  }

  // 切回标签页时静默刷新数据，让用户能看到别人新发的内容
  function startAutoRefresh() {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible' || !state.online || state.refreshing) return;
      var active = document.activeElement;
      if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return;

      state.refreshing = true;
      request('/api/snapshot')
        .then(function (snapshot) {
          DB.hydrate(snapshot);
          if (typeof window.onRemoteDataRefreshed === 'function') {
            window.onRemoteDataRefreshed();
          }
        })
        .catch(function () { state.online = false; })
        .then(function () { state.refreshing = false; });
    });
  }

  return {
    get base() { return BASE; },
    get online() { return state.online; },
    get token() { return getToken(); },
    bootstrap: bootstrap,
    login: login,
    register: register,
    logout: logout,
    push: push,
    captureLocal: captureLocal,
    migrate: migrate,
    needsMigration: needsMigration,
    startAutoRefresh: startAutoRefresh
  };
})();

window.API = API;
