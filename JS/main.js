// ============================================
// 全局变量定义
// ============================================
var currentPage = 'page-home';
var articlesPerPage = 7;
var discoverArticlesPerPage = 6;
var currentArticlePage = 1;
var currentDiscoverPage = 1;
var currentFilter = 'all';
var DEFAULT_AVATAR_URL = '../IMG/tt.jpg';
var uploadedImages = [];
var myArticlesPage = 1;

// ============================================
// 应用初始化
// ============================================
function initApp() {
  DB.init();
  loadTheme();
  initCanvasBg();
  document.body.style.overflow = 'hidden';
  
  initAuthInputListeners();
  
  checkCommentsData();
}

function checkCommentsData() {
  const comments = DB.getComments();
  console.log('Comments data check:', {
    totalComments: comments.length,
    comments: comments.map(c => ({
      id: c.id,
      articleId: c.articleId,
      author: c.author,
      repliesCount: c.replies ? c.replies.length : 0,
      firstReply: c.replies && c.replies.length > 0 ? c.replies[0].content : null
    }))
  });
}

function initAuthInputListeners() {
  document.getElementById('authLoginUser')?.addEventListener('input', () => {
    hideFieldError('authLoginUser', 'loginUserError', 'loginUserErrorText');
  });
  document.getElementById('authLoginPass')?.addEventListener('input', () => {
    hideFieldError('authLoginPass', 'loginPassError', 'loginPassErrorText');
  });
  document.getElementById('authRegUser')?.addEventListener('input', () => {
    hideFieldError('authRegUser', 'regUserError', 'regUserErrorText');
  });
  document.getElementById('authRegPhone')?.addEventListener('input', () => {
    hideFieldError('authRegPhone', 'regPhoneError', 'regPhoneErrorText');
  });
  document.getElementById('authRegPass')?.addEventListener('input', () => {
    hideFieldError('authRegPass', 'regPassError', 'regPassErrorText');
  });
  document.getElementById('authRegConfirm')?.addEventListener('input', () => {
    hideFieldError('authRegConfirm', 'regConfirmError', 'regConfirmErrorText');
  });
}

function initMainApp() {
  initTypedSubtitle();
  renderTagCloud();
  renderCategories();
  renderArticles();
  renderDiscover();
  renderUserCard();
  renderWebInfo();
  renderLatestComments();
  renderMyArticles();
  renderSidebarCategories();
  renderSidebarArchives();
  initPublishForm();
  renderProfile();
  initDropdownHandlers();
}



// ============================================
// 音乐播放器
// ============================================
var musicPlayer = null;

function initMusicPlayer() {
  if (typeof APlayer === 'undefined') {
    setTimeout(initMusicPlayer, 500);
    return;
  }
  
  const musicList = [
    { name: '样YOUNG', url: '../MUSIC/样YOUNG.mp3' },
    { name: '蒲公英的约定', url: '../MUSIC/蒲公英的约定.mp3' },
    { name: '我怀念的', url: '../MUSIC/我怀念的.mp3' },
    { name: '赐我', url: '../MUSIC/赐我.mp3' },
    { name: '空空', url: '../MUSIC/空空.mp3' },
    { name: '大眠', url: '../MUSIC/大眠.mp3' },
    { name: '同花顺', url: '../MUSIC/同花顺.mp3' },
    { name: '遇见', url: '../MUSIC/遇见.mp3' },
    { name: '撒野', url: '../MUSIC/撒野.mp3' },
    { name: '春よ,来い', url: '../MUSIC/春よ,来い.mp3' },
    { name: 'Merry Christmas, Mr.Lawrence', url: '../MUSIC/Merry Christmas, Mr.Lawrence.mp3' },
    { name: '乌托邦', url: '../MUSIC/乌托邦.mp3' },
    { name: 'One Last Kiss', url: '../MUSIC/One Last Kiss.mp3' }
  ];
  
  musicPlayer = new APlayer({
    container: document.getElementById('musicPlayer'),
    fixed: true,
    mini: true,
    autoplay: false,
    theme: '#e3f2f5',
    loop: 'all',
    order: 'random',
    preload: 'auto',
    volume: 0.4,
    mutex: true,
    listFolded: true,
    listMaxHeight: 340,
    audio: musicList
  });
  
  setTimeout(function() {
    if (musicPlayer && musicPlayer.setMode) {
      musicPlayer.setMode('normal');
      setTimeout(function() {
        musicPlayer.setMode('mini');
      }, 100);
    }
  }, 500);
  
  setTimeout(function() {
    const listContainer = document.querySelector('#musicPlayer .aplayer-list');
    if (listContainer) {
      listContainer.addEventListener('wheel', function(e) {
        if ((e.deltaY > 0 && this.scrollTop >= this.scrollHeight - this.clientHeight) || 
            (e.deltaY < 0 && this.scrollTop <= 0)) {
          e.preventDefault();
        }
      }, { passive: false });
      listContainer.addEventListener('touchmove', function(e) {
        e.preventDefault();
      }, { passive: false });
    }
    
    

  }, 100);
}

// ============================================
// 下拉菜单处理
// ============================================
function initDropdownHandlers() {
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (!target.closest('.dropdown')) {
      hideAllDropdowns();
    }
  });
}

function toggleDropdown(navId) {
  const dropdown = document.getElementById('dropdown-' + navId.split('-')[1]);
  if (dropdown) {
    hideAllDropdowns();
    dropdown.style.display = 'block';
  }
}

function hideAllDropdowns() {
  const dropdowns = document.querySelectorAll('.dropdown-menu');
  dropdowns.forEach(d => d.style.display = 'none');
}

// ============================================
// 认证相关（登录/注册）
// ============================================
function hideAuthScreen() {
  const authScreen = document.getElementById('authScreen');
  if (authScreen) {
    authScreen.classList.add('hidden');
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 500);
  }
}

function showLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  const authScreen = document.getElementById('authScreen');
  
  if (authScreen) {
    authScreen.classList.add('hidden');
  }
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
  }
}

function runProgressAnimation(callback) {
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  let progress = 0;
  
  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        callback();
      }, 300);
    }
    
    if (progressFill) progressFill.style.width = progress + '%';
    if (progressText) progressText.textContent = Math.floor(progress) + '%';
  }, 100);
}

function showAuthForm() {
  const welcome = document.getElementById('authWelcome');
  const form = document.getElementById('authForm');
  
  if (welcome) welcome.style.display = 'none';
  if (form) {
    form.style.display = 'block';
    form.style.animation = 'fadeInUp 0.3s ease';
  }
}

function showFieldError(fieldId, errorId, textId, message) {
  const field = document.getElementById(fieldId);
  const errorIcon = document.getElementById(errorId);
  const errorText = document.getElementById(textId);
  
  if (field && field.parentElement) {
    field.parentElement.classList.add('error');
  }
  if (errorIcon) errorIcon.classList.add('show');
  if (errorText) errorText.textContent = message;
}

function hideFieldError(fieldId, errorId, textId) {
  const field = document.getElementById(fieldId);
  const errorIcon = document.getElementById(errorId);
  const errorText = document.getElementById(textId);
  
  if (field && field.parentElement) {
    field.parentElement.classList.remove('error');
  }
  if (errorIcon) errorIcon.classList.remove('show');
  if (errorText) errorText.textContent = '';
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.classList.remove('active');
    if ((tab === 'login' && btn.textContent === '登录') || 
        (tab === 'register' && btn.textContent === '注册')) {
      btn.classList.add('active');
    }
  });
  
  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  }
}

function doAuthLogin() {
  const username = document.getElementById('authLoginUser').value.trim();
  const password = document.getElementById('authLoginPass').value;
  
  hideFieldError('authLoginUser', 'loginUserError', 'loginUserErrorText');
  hideFieldError('authLoginPass', 'loginPassError', 'loginPassErrorText');
  
  let hasError = false;
  
  if (!username) {
    showFieldError('authLoginUser', 'loginUserError', 'loginUserErrorText', '请输入用户名');
    hasError = true;
  }
  
  if (!password) {
    showFieldError('authLoginPass', 'loginPassError', 'loginPassErrorText', '请输入密码');
    hasError = true;
  }
  
  if (hasError) return;
  
  const user = DB.getUserByNickname(username);
  if (!user) {
    showFieldError('authLoginUser', 'loginUserError', 'loginUserErrorText', '该用户不存在，请先注册');
    showFieldError('authLoginPass', 'loginPassError', 'loginPassErrorText', '');
    return;
  }
  
  if (user.password !== password) {
    showFieldError('authLoginPass', 'loginPassError', 'loginPassErrorText', '密码错误');
    return;
  }
  
  DB.setCurrentUser(user.username);
  showLoadingScreen();
  runProgressAnimation(() => {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    document.body.style.overflow = '';
    initMainApp();
    updateAuthNav();
    renderUserCard();
    renderMyArticles();
    showMusicPlayer();
  });
}

function doAuthRegister() {
  const username = document.getElementById('authRegUser').value.trim();
  const phone = document.getElementById('authRegPhone').value.trim();
  const password = document.getElementById('authRegPass').value;
  const confirm = document.getElementById('authRegConfirm').value;
  
  hideFieldError('authRegUser', 'regUserError', 'regUserErrorText');
  hideFieldError('authRegPhone', 'regPhoneError', 'regPhoneErrorText');
  hideFieldError('authRegPass', 'regPassError', 'regPassErrorText');
  hideFieldError('authRegConfirm', 'regConfirmError', 'regConfirmErrorText');
  
  let hasError = false;
  
  if (!username) {
    showFieldError('authRegUser', 'regUserError', 'regUserErrorText', '请输入用户名');
    hasError = true;
  } else if (DB.getUser(username)) {
    showFieldError('authRegUser', 'regUserError', 'regUserErrorText', '用户名已存在');
    hasError = true;
  }
  
  if (!phone) {
    showFieldError('authRegPhone', 'regPhoneError', 'regPhoneErrorText', '请输入手机号');
    hasError = true;
  }
  
  if (!password) {
    showFieldError('authRegPass', 'regPassError', 'regPassErrorText', '请输入密码');
    hasError = true;
  } else if (password.length < 6) {
    showFieldError('authRegPass', 'regPassError', 'regPassErrorText', '密码至少6位');
    hasError = true;
  }
  
  if (!confirm) {
    showFieldError('authRegConfirm', 'regConfirmError', 'regConfirmErrorText', '请再次输入密码');
    hasError = true;
  } else if (password !== confirm) {
    showFieldError('authRegPass', 'regPassError', 'regPassErrorText', '');
    showFieldError('authRegConfirm', 'regConfirmError', 'regConfirmErrorText', '两次输入的密码不一致');
    hasError = true;
  }
  
  if (hasError) return;
  
  DB.saveUser({ username, phone, password });
  DB.setCurrentUser(username);
  DB.saveProfile(username, {
    bio: '这家伙很懒，什么都没留下~',
    avatar: DEFAULT_AVATAR_URL,
    nickname: username,
    gender: '',
    birthday: '',
    hometown: '',
    stats: { articles: 0, tags: 0, categories: 0, likes: 0 }
  });
  
  showLoadingScreen();
  runProgressAnimation(() => {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    document.body.style.overflow = '';
    initMainApp();
    updateAuthNav();
    renderUserCard();
    showMusicPlayer();
  });
}

// ============================================
// 视觉效果（Canvas背景、打字机效果、主题切换）
// ============================================
function initCanvasBg() {
  const canvas = document.getElementById('canvas-bg');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let animationId;
  let particles = [];
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  function createParticles() {
    particles = [];
    const count = Math.floor((canvas.width * canvas.height) / 15000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }
  
  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const color = isDark ? '#ffffff' : '#333333';
    
    particles.forEach((p, i) => {
      p.x += p.speedX;
      p.y += p.speedY;
      
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      
      particles.forEach((p2, j) => {
        if (i !== j) {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = color;
            ctx.globalAlpha = (120 - distance) / 120 * 0.15;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
    });
    
    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(drawParticles);
  }
  
  resizeCanvas();
  createParticles();
  drawParticles();
  
  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });
  
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
  });
}

function initTypedSubtitle() {
  const subtitles = [
    '记录生活中的点滴与感悟',
    '在这里，遇见更好的自己',
    '每一个文字都是一段旅程',
    '分享知识，传递温暖',
    '用心书写生活的诗意'
  ];
  
  let index = 0;
  const subtitleElement = document.getElementById('heroSubtitle');
  
  function typeWriter(text, i = 0) {
    if (i < text.length) {
      subtitleElement.textContent = text.substring(0, i + 1);
      setTimeout(() => typeWriter(text, i + 1), 150);
    } else {
      setTimeout(() => eraseText(text), 2500);
    }
  }
  
  function eraseText(text, i = text.length) {
    if (i > 0) {
      subtitleElement.textContent = text.substring(0, i - 1);
      setTimeout(() => eraseText(text, i - 1), 70);
    } else {
      index = (index + 1) % subtitles.length;
      setTimeout(() => typeWriter(subtitles[index]), 800);
    }
  }
  
  if (subtitleElement) {
    setTimeout(() => typeWriter(subtitles[0]), 500);
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  const hour = new Date().getHours();
  const isNight = hour <= 6 || hour >= 18;
  if (savedTheme === undefined) {
    isNight ? switchNightMode() : switchLightMode();
  } else {
    savedTheme === 'dark' ? switchNightMode() : switchLightMode();
  }
}

function switchNightMode() {
  document.documentElement.setAttribute('data-theme', 'dark');
  localStorage.setItem('theme', 'dark');
}

function switchLightMode() {
  document.documentElement.setAttribute('data-theme', 'light');
  localStorage.setItem('theme', 'light');
}

function toggleTheme() {
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    switchLightMode();
  } else {
    switchNightMode();
  }
}

// ============================================
// 侧边栏分类和归档
// ============================================
function renderSidebarCategories() {
  const currentUser = DB.getCurrentUser();
  const categories = DB.getCategories();
  const container = document.getElementById('sidebarCategories');
  
  let userArticles = [];
  if (currentUser) {
    userArticles = DB.getArticlesByAuthor(currentUser);
  }
  
  container.innerHTML = categories.map(cat => {
    const count = userArticles.filter(a => a.categoryId === cat.id).length;
    return `
      <div class="comment-item" onclick="filterArticles('${cat.id}'); showPage('page-home')">
        <span class="comment-author">${cat.name}</span>
        <span class="comment-content">${count}篇</span>
      </div>
    `;
  }).join('');
}

function renderSidebarArchives() {
  const currentUser = DB.getCurrentUser();
  const container = document.getElementById('sidebarArchives');
  
  let groups = {};
  if (currentUser) {
    groups = DB.getArticlesGroupedByDateByAuthor(currentUser);
  }
  
  let html = '';
  for (const [date, articles] of Object.entries(groups)) {
    const [year, month] = date.split('-');
    html += `
      <div class="comment-item" onclick="showPage('page-archive')">
        <span class="comment-author">${year}年${month}月</span>
        <span class="comment-content">${articles.length}篇</span>
      </div>
    `;
  }
  
  container.innerHTML = html || '<div class="empty-state">暂无归档</div>';
}

// ============================================
// 页面导航和切换
// ============================================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
  currentPage = pageId;
  
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
  });
  const navId = 'nav-' + pageId.replace('page-', '');
  const navElement = document.getElementById(navId);
  if (navElement) {
    navElement.classList.add('active');
  }
  
  if (pageId === 'page-home') {
    renderArticles();
    renderLatestComments();
    renderMyArticles();
  } else if (pageId === 'page-discover') {
    renderDiscover(true);
  } else if (pageId === 'page-category') {
    showCategoryList();
  } else if (pageId === 'page-archive') {
    renderArchive();
  } else if (pageId === 'page-message') {
    renderMessages();
  }
}

function scrollToContent() {
  document.getElementById('homeContent').scrollIntoView({ behavior: 'smooth' });
}

function toggleMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.getElementById('navLinks');
  menuToggle.classList.toggle('open');
  navLinks.classList.toggle('show');
}

function openLogin() {
  document.getElementById('loginModal').classList.add('active');
}

function closeLogin() {
  document.getElementById('loginModal').classList.remove('active');
}

function goToRegister() {
  closeLogin();
  showPage('page-register');
}

function goToLogin() {
  showPage('page-home');
  setTimeout(() => openLogin(), 300);
}

function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  
  if (!username || !password) {
    if (username) {
      showFieldError('loginPass', '', '', '');
    }
    return;
  }
  
  const user = DB.getUserByNickname(username);
  if (user && user.password === password) {
    DB.setCurrentUser(user.username);
    closeLogin();
    updateAuthNav();
    renderUserCard();
    renderMyArticles();
    showMusicPlayer();
  } else {
    if (user) {
      showFieldError('loginPass', '', '', '');
    }
  }
}

function doRegister() {
  const username = document.getElementById('regUser').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPass').value;
  const confirm = document.getElementById('regConfirm').value;
  
  if (!username || !phone || !password || !confirm) {
    return;
  }
  
  if (password.length < 6) {
    return;
  }
  
  if (password !== confirm) {
    document.getElementById('mismatchText').textContent = '两次输入的密码不一致';
    document.getElementById('mismatchIcon').classList.add('show');
    return;
  }
  
  if (DB.getUser(username)) {
    return;
  }
  
  DB.saveUser({ username, phone, password });
  DB.setCurrentUser(username);
  DB.saveProfile(username, {
    bio: '这家伙很懒，什么都没留下~',
    avatar: DEFAULT_AVATAR_URL,
    nickname: username,
    gender: '',
    birthday: '',
    hometown: '',
    stats: { articles: 0, tags: 0, categories: 0, likes: 0 }
  });
  
  showPage('page-home');
  updateAuthNav();
  renderUserCard();
  showMusicPlayer();
}

function logout() {
  DB.clearCurrentUser();
  updateAuthNav();
  renderUserCard();
  renderMyArticles();
  hideMusicPlayer();
  
  const authScreen = document.getElementById('authScreen');
  if (authScreen) {
    authScreen.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function showMusicPlayer() {
  const frame = document.getElementById('aplayerFrame');
  if (frame) {
    frame.style.display = 'block';
  }
}

function hideMusicPlayer() {
  const frame = document.getElementById('aplayerFrame');
  if (frame) {
    frame.style.display = 'none';
  }
}

// ============================================
// 用户信息和权限
// ============================================
function getUserDisplayName() {
  const currentUser = DB.getCurrentUser();
  if (!currentUser) return '';
  const profile = DB.getProfile(currentUser);
  return profile.nickname || currentUser;
}

function isCurrentUserAuthor(authorName) {
  const currentUser = DB.getCurrentUser();
  if (!currentUser) return false;
  const displayName = getUserDisplayName();
  return authorName === currentUser || authorName === displayName;
}

// ============================================
// 文章点赞和收藏
// ============================================
function toggleArticleLike(articleId) {
  const currentUser = DB.getCurrentUser();
  if (!currentUser) {
    alert('请先登录');
    return;
  }
  
  const article = DB.getArticle(articleId);
  if (!article) return;
  
  const newLikes = (article.likes || 0) + 1;
  article.likes = newLikes;
  DB.saveArticle(article);
  
  document.querySelectorAll(`[data-like-id="${articleId}"]`).forEach(el => {
    el.innerHTML = `<i class="fas fa-heart"></i>点赞 ${newLikes}`;
  });
}

function toggleArticleFavorite(articleId) {
  const currentUser = DB.getCurrentUser();
  if (!currentUser) {
    alert('请先登录');
    return;
  }
  
  const isFavorited = DB.isFavorite(currentUser, articleId);
  if (isFavorited) {
    DB.removeFavorite(currentUser, articleId);
  } else {
    DB.saveFavorite(currentUser, articleId);
  }
  
  const newFavorited = !isFavorited;
  document.querySelectorAll(`[data-favorite-id="${articleId}"]`).forEach(el => {
    if (newFavorited) {
      el.classList.add('favorited');
    } else {
      el.classList.remove('favorited');
    }
  });
  
  if (currentPage === 'page-favorites') {
    renderFavorites();
  }
}

// ============================================
// 导航栏更新
// ============================================
function updateAuthNav() {
  const authNav = document.getElementById('authNav');
  const currentUser = DB.getCurrentUser();
  if (currentUser) {
    const displayName = getUserDisplayName();
    authNav.innerHTML = `
      <li class="dropdown" onclick="toggleDropdown('nav-user')">
        <a href="#" id="nav-user" onclick="event.preventDefault()">${displayName} ▼</a>
        <div class="dropdown-menu" id="dropdown-user">
          <a href="#" onclick="event.preventDefault(); event.stopPropagation(); showPage('page-favorites'); hideAllDropdowns(); renderFavorites()">我的收藏</a>
          <a href="#" onclick="event.preventDefault(); event.stopPropagation(); showPage('page-profile'); hideAllDropdowns()">我的主页</a>
          <a href="#" onclick="event.preventDefault(); event.stopPropagation(); logout(); hideAllDropdowns()">退出登录</a>
        </div>
      </li>
    `;
  } else {
    authNav.innerHTML = '<button class="login-btn" onclick="openLogin()">登录</button>';
  }
}

// ============================================
// 文章标签和分类筛选
// ============================================
function renderTagCloud() {
  const tags = DB.getTagCloud();
  const container = document.getElementById('tagCloudContainer');
  container.innerHTML = tags.map(tag => `
    <span class="tag-item ${currentFilter === tag.id ? 'active' : ''}" 
          onclick="filterArticles('${tag.id}')"
          style="color: ${tag.color}">
      ${tag.name} <span class="count">${tag.count}</span>
    </span>
  `).join('');
}

function renderCategories() {
  const categories = DB.getCategories();
  const filterBar = document.getElementById('filterBar');
  filterBar.innerHTML = `
    <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="filterArticles('all')">全部</button>
    ${categories.map(cat => `
      <button class="filter-btn ${currentFilter === cat.id ? 'active' : ''}" onclick="filterArticles('${cat.id}')">
        ${cat.name}
      </button>
    `).join('')}
  `;
}

function filterArticles(filter) {
  currentFilter = filter;
  currentArticlePage = 1;
  renderTagCloud();
  renderCategories();
  renderArticles();
}

// ============================================
// 文章列表展示（首页）
// ============================================
function renderArticles() {
  let articles = DB.getArticles();
  
  if (currentFilter !== 'all') {
    const tag = DB.getTag(currentFilter);
    if (tag) {
      articles = DB.getArticlesByTag(currentFilter);
    } else {
      articles = DB.getArticlesByCategory(currentFilter);
    }
  }
  
  articles = articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const start = (currentArticlePage - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const pageArticles = articles.slice(start, end);
  
  const container = document.getElementById('homeArticleList');
  const pagination = document.getElementById('pagination');
  
  if (pageArticles.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无文章</div>';
    pagination.innerHTML = '';
    return;
  }
  
  container.innerHTML = pageArticles.map(article => {
    const tags = DB.getTagsByIds(article.tags);
    const category = DB.getCategory(article.categoryId);
    const currentUser = DB.getCurrentUser();
    const displayName = getUserDisplayName();
    const isAuthor = currentUser && (article.author === currentUser || article.author === displayName);
    const isFavorited = currentUser && DB.isFavorite(currentUser, article.id);
    return `
      <div class="article-card animate-fade-in-up" onclick="showArticleDetail('${article.id}')">
        <div class="article-cover ${article.cover ? 'has-cover' : ''}">
          ${article.cover ? `<img src="${article.cover}" alt="${article.title}" onerror="this.style.display='none'; this.parentElement.classList.remove('has-cover');" />` : '<div class="cover-icon">📝</div>'}
        </div>
        <div class="article-info">
          <div class="article-title-row">
            <h3 class="article-title">${article.title}</h3>
            ${isAuthor ? `<span class="article-delete" onclick="event.stopPropagation(); deleteArticle('${article.id}')"><i class="fas fa-trash"></i>删除</span>` : ''}
          </div>
          <div class="article-meta">
            <span><i class="fas fa-user"></i>${article.author}</span>
            <span><i class="fas fa-calendar"></i>${article.createdAt}</span>
            ${category ? `<span><i class="fas fa-folder-open"></i>${category.name}</span>` : ''}
          </div>
          <p class="article-excerpt">${article.content}</p>
          <div class="article-footer">
            <div class="article-tags">
              ${tags.map(t => `<span class="article-tag">${t.name}</span>`).join('')}
            </div>
            <div class="article-stats">
              <span><i class="fas fa-eye"></i>浏览 ${article.views}</span>
              <span class="article-like-btn" data-like-id="${article.id}" onclick="event.stopPropagation(); toggleArticleLike('${article.id}')"><i class="fas fa-heart"></i>点赞 ${article.likes}</span>
              <span class="article-favorite-btn ${isFavorited ? 'favorited' : ''}" data-favorite-id="${article.id}" onclick="event.stopPropagation(); toggleArticleFavorite('${article.id}')"><i class="fas fa-bookmark"></i>收藏</span>
              <span><i class="fas fa-comment"></i>评论 ${DB.getCommentsByArticle(article.id).length}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  renderPagination(totalPages, currentArticlePage);
}

// ============================================
// 分页功能（首页文章）
// ============================================
function renderPagination(totalPages, currentPage) {
  const pagination = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let html = '<div class="pagination">';
  
  if (currentPage > 1) {
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})">上一页</button>`;
  }
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
  } else {
    html += `<button class="pagination-btn ${1 === currentPage ? 'active' : ''}" onclick="goToPage(1)">1</button>`;
    
    if (currentPage > 3) {
      html += '<span class="pagination-ellipsis">...</span>';
    }
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (currentPage < totalPages - 2) {
      html += '<span class="pagination-ellipsis">...</span>';
    }
    
    html += `<button class="pagination-btn ${totalPages === currentPage ? 'active' : ''}" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }
  
  if (currentPage < totalPages) {
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})">下一页</button>`;
  }
  
  html += '</div>';
  
  pagination.innerHTML = html;
}

function goToPage(page) {
  currentArticlePage = page;
  renderArticles();
}

// ============================================
// 收藏页面
// ============================================
function renderFavorites() {
  const currentUser = DB.getCurrentUser();
  if (!currentUser) {
    document.getElementById('favoritesList').innerHTML = '<div class="empty-state">请先登录查看收藏</div>';
    return;
  }
  
  const favorites = DB.getFavoritesByUser(currentUser);
  const articles = favorites.map(f => DB.getArticle(f.articleId)).filter(Boolean);
  
  const container = document.getElementById('favoritesList');
  
  if (articles.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无收藏</div>';
    return;
  }
  
  container.innerHTML = articles.map(article => {
    const tags = DB.getTagsByIds(article.tags);
    const displayName = getUserDisplayName();
    const isAuthor = currentUser && (article.author === currentUser || article.author === displayName);
    const isFavorited = DB.isFavorite(currentUser, article.id);
    return `
      <div class="discover-card animate-fade-in-up" onclick="showArticleDetail('${article.id}')">
        ${article.cover ? `<div class="discover-cover"><img src="${article.cover}" alt="${article.title}" /></div>` : ''}
        <div class="discover-author">${article.author} · ${article.createdAt}</div>
        <div class="discover-title-row">
          <h3 class="discover-title">${article.title}</h3>
          ${isAuthor ? `<span class="discover-delete" onclick="event.stopPropagation(); deleteArticle('${article.id}'); renderFavorites()"><i class="fas fa-trash"></i>删除</span>` : ''}
        </div>
        <p class="discover-excerpt">${article.content}</p>
        <div style="margin-top: 12px;">
          ${tags.map(t => `<span class="article-tag">${t.name}</span>`).join('')}
        </div>
        <div class="discover-stats">
          <span><i class="fas fa-eye"></i>浏览 ${article.views}</span>
          <span class="article-like-btn" data-like-id="${article.id}" onclick="event.stopPropagation(); toggleArticleLike('${article.id}')"><i class="fas fa-heart"></i>点赞 ${article.likes}</span>
          <span class="article-favorite-btn ${isFavorited ? 'favorited' : ''}" data-favorite-id="${article.id}" onclick="event.stopPropagation(); toggleArticleFavorite('${article.id}')"><i class="fas fa-bookmark"></i>收藏</span>
          <span><i class="fas fa-comment"></i>评论 ${DB.getCommentsByArticle(article.id).length}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// 发现页面
// ============================================
function renderDiscover() {
  const articles = DB.getArticles();
  
  const container = document.getElementById('discoverGrid');
  const loadMoreBtn = document.querySelector('.load-more-btn');
  
  if (articles.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无文章</div>';
    if (loadMoreBtn) {
      loadMoreBtn.textContent = '没有更多了';
      loadMoreBtn.disabled = true;
    }
    return;
  }
  
  const shuffledArticles = articles.sort(() => Math.random() - 0.5);
  const randomCount = Math.max(1, Math.min(Math.floor(Math.random() * 8) + 1, articles.length));
  const pageArticles = shuffledArticles.slice(0, randomCount);
  
  const articleHtml = pageArticles.map(article => {
    const tags = DB.getTagsByIds(article.tags);
    const currentUser = DB.getCurrentUser();
    const displayName = getUserDisplayName();
    const isAuthor = currentUser && (article.author === currentUser || article.author === displayName);
    const isFavorited = currentUser && DB.isFavorite(currentUser, article.id);
    return `
      <div class="discover-card animate-fade-in-up" onclick="showArticleDetail('${article.id}')">
        ${article.cover ? `<div class="discover-cover"><img src="${article.cover}" alt="${article.title}" /></div>` : ''}
        <div class="discover-author">${article.author} · ${article.createdAt}</div>
        <div class="discover-title-row">
          <h3 class="discover-title">${article.title}</h3>
          ${isAuthor ? `<span class="discover-delete" onclick="event.stopPropagation(); deleteArticle('${article.id}')"><i class="fas fa-trash"></i>删除</span>` : ''}
        </div>
        <p class="discover-excerpt">${article.content}</p>
        <div style="margin-top: 12px;">
          ${tags.map(t => `<span class="article-tag">${t.name}</span>`).join('')}
        </div>
        <div class="discover-stats">
          <span><i class="fas fa-eye"></i>浏览 ${article.views}</span>
          <span class="article-like-btn" data-like-id="${article.id}" onclick="event.stopPropagation(); toggleArticleLike('${article.id}')"><i class="fas fa-heart"></i>点赞 ${article.likes}</span>
          <span class="article-favorite-btn ${isFavorited ? 'favorited' : ''}" data-favorite-id="${article.id}" onclick="event.stopPropagation(); toggleArticleFavorite('${article.id}')"><i class="fas fa-bookmark"></i>收藏</span>
          <span><i class="fas fa-comment"></i>评论 ${DB.getCommentsByArticle(article.id).length}</span>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = articleHtml;
  
  if (loadMoreBtn) {
    loadMoreBtn.textContent = '加载更多';
    loadMoreBtn.disabled = false;
  }
}

function loadMoreDiscover() {
  renderDiscover();
}

// ============================================
// 文章详情页
// ============================================
function showArticleDetail(id) {
  const article = DB.getArticle(id);
  if (!article) return;
  
  article.views++;
  DB.saveArticle(article);
  
  const tags = DB.getTagsByIds(article.tags);
  const category = DB.getCategory(article.categoryId);
  const comments = DB.getCommentsByArticle(id);
  
  const detail = document.getElementById('articleDetail');
  const currentUser = DB.getCurrentUser();
  const displayName = getUserDisplayName();
  const isAuthor = currentUser && (article.author === currentUser || article.author === displayName);
  const isFavorited = currentUser && DB.isFavorite(currentUser, article.id);
  
  detail.innerHTML = `
    <h1 class="detail-title">${article.title}</h1>
    <div class="detail-meta">
      <span><i class="fas fa-user"></i>${article.author}</span>
      <span><i class="fas fa-calendar"></i>${article.createdAt}</span>
      ${category ? `<span><i class="fas fa-folder-open"></i>${category.name}</span>` : ''}
      <span><i class="fas fa-eye"></i>浏览 ${article.views}</span>
      <span class="detail-like-btn" data-like-id="${article.id}" onclick="event.stopPropagation(); toggleArticleLike('${article.id}')"><i class="fas fa-heart"></i>点赞 ${article.likes}</span>
      <span class="detail-favorite-btn ${isFavorited ? 'favorited' : ''}" data-favorite-id="${article.id}" onclick="event.stopPropagation(); toggleArticleFavorite('${article.id}')"><i class="fas fa-bookmark"></i>收藏</span>
      ${isAuthor ? `<span class="detail-delete" onclick="deleteArticle('${article.id}'); showPage('page-home')"><i class="fas fa-trash"></i>删除文章</span>` : ''}
    </div>
    ${article.cover ? `<div class="detail-cover"><img src="${article.cover}" alt="${article.title}" /></div>` : ''}
    <div class="detail-content">${article.content}</div>
    <div class="detail-tags">
      ${tags.map(t => `<span class="article-tag">${t.name}</span>`).join('')}
    </div>
    <div class="detail-comments">
      <h3>评论 (${comments.length})</h3>
      <div class="comment-list">
        ${comments.length === 0 ? '<div class="empty-state">暂无评论</div>' : comments.map(cm => `
          <div class="comment-item-detail">
            <div class="comment-header">
              <span class="comment-author-detail">${cm.author}</span>
              <span class="comment-time">${cm.createdAt}</span>
            </div>
            <div class="comment-content-detail">${cm.content}</div>
            <div class="comment-replies" id="replies-${cm.id}">
              ${cm.replies && cm.replies.length > 0 ? cm.replies.slice(0, 2).map(r => `
                <div class="reply-item">
                  <span class="reply-author">${r.author}</span>${r.replyTo ? ` 回复 ${r.replyTo}` : ''}: ${r.content}
                  <span class="reply-time">${r.createdAt}</span>
                  <span class="reply-like" onclick="toggleReplyLike('${cm.id}', '${r.id}')">
                    <i class="fas fa-heart"></i> 点赞 ${r.likes || 0}
                  </span>
                  <span class="reply-reply-btn" onclick="showReplyInput('${cm.id}', '${r.author}')">
                    <i class="fas fa-reply"></i> 回复
                  </span>
                  ${isCurrentUserAuthor(r.author) ? `<span class="reply-delete-btn" onclick="deleteReply('${cm.id}', '${r.id}', '${article.id}')">
                    <i class="fas fa-trash"></i> 删除
                  </span>` : ''}
                </div>
              `).join('') : ''}
              ${cm.replies && cm.replies.length > 2 ? `
                <div class="reply-expand-container" id="expand-container-${cm.id}">
                  <span class="reply-expand-btn" onclick="expandReplies('${cm.id}', 2, ${cm.replies.length})">展开更多</span>
                </div>
                <div class="reply-hidden" id="hidden-${cm.id}">
                  ${cm.replies.slice(2).map(r => `
                    <div class="reply-item">
                      <span class="reply-author">${r.author}</span>${r.replyTo ? ` 回复 ${r.replyTo}` : ''}: ${r.content}
                      <span class="reply-time">${r.createdAt}</span>
                      <span class="reply-like" onclick="toggleReplyLike('${cm.id}', '${r.id}')">
                        <i class="fas fa-heart"></i> 点赞 ${r.likes || 0}
                      </span>
                      <span class="reply-reply-btn" onclick="showReplyInput('${cm.id}', '${r.author}')">
                        <i class="fas fa-reply"></i> 回复
                      </span>
                      ${isCurrentUserAuthor(r.author) ? `<span class="reply-delete-btn" onclick="deleteReply('${cm.id}', '${r.id}', '${article.id}')">
                        <i class="fas fa-trash"></i> 删除
                      </span>` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
            <div class="reply-input-container" id="reply-input-${cm.id}" style="display:none;">
              <input type="text" class="reply-input" id="reply-input-text-${cm.id}" placeholder="回复 ${cm.author}..." onkeypress="if(event.key==='Enter')submitReply('${cm.id}')">
              <button class="reply-submit-btn" onclick="submitReply('${cm.id}')">发送</button>
            </div>
            <div class="comment-actions">
              <div class="comment-actions-left">
                <span class="comment-action-btn" onclick="toggleCommentLike('${cm.id}')">
                  <i class="fas fa-heart"></i> 点赞 ${cm.likes || 0}
                </span>
                <span class="comment-action-btn" onclick="showReplyInput('${cm.id}')">
                  <i class="fas fa-reply"></i> 回复
                </span>
                ${isCurrentUserAuthor(cm.author) ? `<span class="comment-action-btn" onclick="deleteComment('${cm.id}', '${article.id}')">
                  <i class="fas fa-trash"></i> 删除评论
                </span>` : ''}
              </div>
              <span class="comment-views">浏览 ${cm.views || Math.floor(Math.random() * 50)}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <input type="text" class="comment-input" id="commentInput" placeholder="写下你的评论...">
      <button class="message-btn" onclick="submitComment('${id}')">发表评论</button>
    </div>
  `;
  
  showPage('page-article-detail');
}

// ============================================
// 评论功能（文章评论）
// ============================================
function submitComment(articleId) {
  const content = document.getElementById('commentInput').value.trim();
  if (!content) {
    alert('请输入评论内容');
    return;
  }
  
  const currentUser = DB.getCurrentUser();
  if (!currentUser) {
    alert('请先登录');
    return;
  }
  
  const authorName = getUserDisplayName();
  
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  
  DB.saveComment({
    articleId,
    author: authorName,
    content,
    createdAt: dateStr,
    likes: 0,
    replies: []
  });
  
  document.getElementById('commentInput').value = '';
  showArticleDetail(articleId);
}

function toggleCommentLike(commentId) {
  const comments = DB.getComments();
  const comment = comments.find(c => c.id === commentId);
  if (comment) {
    comment.likes = (comment.likes || 0) + 1;
    DB.saveComment(comment);
    const likeBtn = document.querySelector(`[onclick="toggleCommentLike('${commentId}')"]`);
    if (likeBtn) {
      likeBtn.innerHTML = `<i class="fas fa-heart"></i> 点赞 ${comment.likes}`;
    }
  }
}

function deleteComment(commentId, articleId) {
  if (confirm('确定要删除这条评论吗？')) {
    DB.deleteComment(commentId);
    showArticleDetail(articleId);
  }
}

function expandReplies(commentId, currentIndex, totalCount) {
  const hiddenDiv = document.getElementById(`hidden-${commentId}`);
  const expandBtn = document.querySelector(`#expand-container-${commentId} .reply-expand-btn`);
  
  if (!hiddenDiv || !expandBtn) return;
  
  const replyItems = hiddenDiv.querySelectorAll('.reply-item');
  const newIndex = currentIndex + 2;
  
  for (let i = currentIndex - 2; i < Math.min(newIndex - 2, replyItems.length); i++) {
    if (replyItems[i]) {
      replyItems[i].style.display = 'block';
    }
  }
  
  if (newIndex >= totalCount) {
    expandBtn.textContent = '折叠';
    expandBtn.onclick = function() { collapseReplies(commentId); };
  } else {
    expandBtn.textContent = `展开更多 (${totalCount - newIndex})`;
    expandBtn.onclick = function() { expandReplies(commentId, newIndex, totalCount); };
  }
}

function collapseReplies(commentId) {
  const hiddenDiv = document.getElementById(`hidden-${commentId}`);
  const expandBtn = document.querySelector(`#expand-container-${commentId} .reply-expand-btn`);
  
  if (!hiddenDiv || !expandBtn) return;
  
  const comments = DB.getComments();
  const comment = comments.find(c => c.id === commentId);
  const totalCount = comment && comment.replies ? comment.replies.length : 0;
  
  const replyItems = hiddenDiv.querySelectorAll('.reply-item');
  replyItems.forEach(item => {
    item.style.display = 'none';
  });
  
  expandBtn.textContent = '展开更多';
  expandBtn.onclick = function() { expandReplies(commentId, 2, totalCount); };
}

function showReplyInput(commentId, replyTo) {
  const inputContainer = document.getElementById(`reply-input-${commentId}`);
  const input = document.getElementById(`reply-input-text-${commentId}`);
  
  if (inputContainer) {
    inputContainer.style.display = inputContainer.style.display === 'none' ? 'flex' : 'none';
  }
  
  if (input) {
    const comments = DB.getComments();
    const comment = comments.find(c => c.id === commentId);
    input.placeholder = replyTo ? `回复 ${replyTo}...` : `回复 ${comment ? comment.author : ''}...`;
    input.dataset.replyTo = replyTo || '';
  }
}

function submitReply(commentId) {
  const input = document.getElementById(`reply-input-text-${commentId}`);
  const content = input.value.trim();
  if (!content) {
    return;
  }
  
  const currentUser = DB.getCurrentUser();
  if (!currentUser) {
    alert('请先登录');
    return;
  }
  
  const replyTo = input.dataset.replyTo || '';
  
  const comments = DB.getComments();
  const comment = comments.find(c => c.id === commentId);
  
  console.log('submitReply debug:', {
    commentId,
    foundComment: comment ? comment.id : null,
    articleId: comment ? comment.articleId : null,
    repliesBefore: comment && comment.replies ? comment.replies.length : 0
  });
  
  if (comment) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const authorName = getUserDisplayName();
    
    if (!comment.replies) comment.replies = [];
    comment.replies.push({
      id: `${commentId}-${Date.now()}`,
      author: authorName,
      content,
      createdAt: dateStr,
      likes: 0,
      replyTo: replyTo
    });
    
    DB.saveComment(comment);
    
    const savedComments = DB.getComments();
    const savedComment = savedComments.find(c => c.id === commentId);
    console.log('submitReply after save:', {
      savedCommentId: savedComment ? savedComment.id : null,
      repliesAfter: savedComment && savedComment.replies ? savedComment.replies.length : 0,
      lastReplyContent: savedComment && savedComment.replies ? savedComment.replies[savedComment.replies.length-1].content : null
    });
    
    input.value = '';
    input.dataset.replyTo = '';
    input.parentElement.style.display = 'none';
    
    showArticleDetail(comment.articleId);
  }
}

function deleteReply(commentId, replyId, articleId) {
  if (confirm('确定要删除这条回复吗？')) {
    const comments = DB.getComments();
    const comment = comments.find(c => c.id === commentId);
    if (comment && comment.replies) {
      comment.replies = comment.replies.filter(r => r.id !== replyId);
      DB.saveComment(comment);
      showArticleDetail(articleId);
    }
  }
}

function toggleReplyLike(commentId, replyId) {
  const comments = DB.getComments();
  const comment = comments.find(c => c.id === commentId);
  if (comment && comment.replies) {
    const reply = comment.replies.find(r => r.id === replyId);
    if (reply) {
      reply.likes = (reply.likes || 0) + 1;
      DB.saveComment(comment);
      const likeBtn = document.querySelector(`[onclick="toggleReplyLike('${commentId}', '${replyId}')"]`);
      if (likeBtn) {
        likeBtn.innerHTML = `<i class="fas fa-heart"></i> 点赞 ${reply.likes}`;
      }
    }
  }
}

// ============================================
// 用户卡片（右侧栏）
// ============================================
function renderUserCard() {
  const currentUser = DB.getCurrentUser();
  const card = document.getElementById('userCard');
  
  if (currentUser) {
    const profile = DB.getProfile(currentUser);
    const userArticles = DB.getArticlesByAuthor(currentUser);
    
    let avatarHtml = '';
    if (profile.avatar) {
      avatarHtml = `<img src="${profile.avatar}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      avatarHtml = profile.nickname ? profile.nickname.charAt(0).toUpperCase() : currentUser.charAt(0).toUpperCase();
    }
    
    const usedCategories = new Set();
    const usedTags = new Set();
    userArticles.forEach(article => {
      if (article.categoryId) {
        usedCategories.add(article.categoryId);
      }
      if (article.tags && article.tags.length > 0) {
        article.tags.forEach(tagId => usedTags.add(tagId));
      }
    });
    
    card.innerHTML = `
      <div class="user-avatar" style="overflow:hidden;">${avatarHtml}</div>
      <div class="user-name">${profile.nickname || currentUser}</div>
      <div class="user-bio">${profile.bio}</div>
      <div class="user-stats">
        <div class="stat-item">
          <div class="stat-value">${userArticles.length}</div>
          <div class="stat-label">文章</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${usedTags.size}</div>
          <div class="stat-label">标签</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${usedCategories.size}</div>
          <div class="stat-label">分类</div>
        </div>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="user-avatar">?</div>
      <div class="user-name">游客</div>
      <div class="user-bio">登录后可以查看个人信息</div>
      <div class="user-stats">
        <div class="stat-item">
          <div class="stat-value">0</div>
          <div class="stat-label">文章</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">0</div>
          <div class="stat-label">标签</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">0</div>
          <div class="stat-label">分类</div>
        </div>
      </div>
    `;
  }
}

// ============================================
// 用户个人资料页面
// ============================================
function renderProfile() {
  const currentUser = DB.getCurrentUser();
  if (!currentUser) return;
  
  const profile = DB.getProfile(currentUser);
  const articles = DB.getArticlesByAuthor(currentUser);
  
  const avatarImg = document.getElementById('profileAvatarImg');
  const avatarText = document.getElementById('profileAvatarText');
  
  if (profile.avatar) {
    avatarImg.src = profile.avatar;
    avatarImg.style.display = 'block';
    avatarText.style.display = 'none';
  } else {
    avatarImg.style.display = 'none';
    avatarText.style.display = 'flex';
    avatarText.textContent = profile.nickname ? profile.nickname.charAt(0).toUpperCase() : currentUser.charAt(0).toUpperCase();
  }
  
  document.getElementById('profileUsername').textContent = profile.nickname || currentUser;
  document.getElementById('profileBio').textContent = profile.bio;
  document.getElementById('infoGender').textContent = profile.gender || '未设置';
  document.getElementById('infoBirthday').textContent = profile.birthday || '未设置';
  document.getElementById('infoHometown').textContent = profile.hometown || '未设置';
  
  document.getElementById('editNickname').value = profile.nickname || '';
  document.getElementById('editBio').value = profile.bio;
  document.getElementById('editGender').value = profile.gender || '';
  document.getElementById('editBirthday').value = profile.birthday || '';
  document.getElementById('editHometown').value = profile.hometown || '';
  
  document.getElementById('statArticles').textContent = articles.length;
  document.getElementById('statLikes').textContent = articles.reduce((sum, a) => sum + (a.likes || 0), 0);
  
  const allTags = new Set();
  articles.forEach(a => a.tags.forEach(t => allTags.add(t)));
  document.getElementById('statTags').textContent = allTags.size;
  
  document.getElementById('profileArticlesTitle').textContent = `我的文章(${articles.length})`;
}

function handleAvatarUpload() {
  const input = document.getElementById('avatarInput');
  const file = input.files[0];
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const profile = DB.getProfile(DB.getCurrentUser());
      DB.saveProfile(DB.getCurrentUser(), {
        ...profile,
        avatar: e.target.result
      });
      renderProfile();
      renderUserCard();
    };
    reader.readAsDataURL(file);
  }
}

function resetToDefaultAvatar() {
  const profile = DB.getProfile(DB.getCurrentUser());
  DB.saveProfile(DB.getCurrentUser(), {
    ...profile,
    avatar: DEFAULT_AVATAR_URL
  });
  renderProfile();
  renderUserCard();
}

function saveProfile() {
  const currentUser = DB.getCurrentUser();
  if (!currentUser) return;
  
  const nicknameInput = document.getElementById('editNickname');
  const nickname = nicknameInput.value.trim();
  const bio = document.getElementById('editBio').value.trim();
  const gender = document.getElementById('editGender').value;
  const birthday = document.getElementById('editBirthday').value;
  const hometown = document.getElementById('editHometown').value.trim();
  
  if (!nickname) {
    nicknameInput.style.borderColor = '#ff4757';
    nicknameInput.style.boxShadow = 'inset 2px 2px 0 rgba(255,71,87,0.1)';
    nicknameInput.placeholder = '昵称不能为空！';
    nicknameInput.addEventListener('input', function clearError() {
      nicknameInput.style.borderColor = '';
      nicknameInput.style.boxShadow = '';
      nicknameInput.placeholder = '昵称（必填）';
      nicknameInput.removeEventListener('input', clearError);
    });
    return;
  }
  
  const profile = DB.getProfile(currentUser);
  const oldNickname = profile.nickname || currentUser;
  
  DB.saveProfile(currentUser, {
    ...profile,
    nickname: nickname,
    bio: bio || '这家伙很懒，什么都没留下~',
    gender: gender,
    birthday: birthday,
    hometown: hometown
  });
  
  if (oldNickname !== nickname) {
    DB.migrateAuthorNamesForUser(currentUser, oldNickname, nickname);
    DB.migrateAuthorNamesForUser(currentUser, currentUser, nickname);
  }
  
  renderProfile();
  renderUserCard();
  updateAuthNav();
}

// ============================================
// 网站信息（右侧栏）
// ============================================
function renderWebInfo() {
  const articles = DB.getArticles();
  const comments = DB.getComments();
  const messages = DB.getMessages();
  
  const webInfo = document.getElementById('webInfo');
  webInfo.innerHTML = `
    <div class="webinfo-item">
      <span class="item-name">文章数目</span>
      <span class="item-count">${articles.length}</span>
    </div>
    <div class="webinfo-item">
      <span class="item-name">评论数目</span>
      <span class="item-count">${comments.length}</span>
    </div>
    <div class="webinfo-item">
      <span class="item-name">留言数目</span>
      <span class="item-count">${messages.length}</span>
    </div>
    <div class="webinfo-item">
      <span class="item-name">总浏览量</span>
      <span class="item-count">${articles.reduce((sum, a) => sum + a.views, 0)}</span>
    </div>
  `;
}

// ============================================
// 最新评论（右侧栏）
// ============================================
function renderLatestComments() {
  const currentUser = DB.getCurrentUser();
  const container = document.getElementById('latestComments');
  
  let comments = [];
  if (currentUser) {
    comments = DB.getCommentsOnArticlesByAuthor(currentUser).slice(0, 5);
  }
  
  container.innerHTML = comments.map(cm => {
    const article = DB.getArticle(cm.articleId);
    return `
      <div class="comment-item" onclick="showArticleDetail('${cm.articleId}')">
        <span class="comment-author">${cm.author}</span>
        <span class="comment-content">${cm.content}</span>
      </div>
    `;
  }).join('');
  
  if (comments.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无评论</div>';
  }
}

// ============================================
// 我的文章（右侧栏）
// ============================================
function renderMyArticles(page) {
  if (page !== undefined) {
    myArticlesPage = page;
  }
  
  const currentUser = DB.getCurrentUser();
  const container = document.getElementById('myArticles');
  const countSpan = document.getElementById('myArticlesCount');
  const paginationContainer = document.getElementById('myArticlesPagination');
  
  if (!currentUser) {
    container.innerHTML = '<div class="empty-state">登录后查看我的文章</div>';
    if (countSpan) countSpan.textContent = '';
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }
  
  const allArticles = DB.getArticlesByAuthor(currentUser);
  const totalCount = allArticles.length;
  
  if (countSpan) {
    countSpan.textContent = `(${totalCount})`;
  }
  
  const itemsPerPage = 2;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const start = (myArticlesPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const articles = allArticles.slice(start, end);
  
  container.innerHTML = articles.map(article => `
    <div class="comment-item" onclick="showArticleDetail('${article.id}')">
      <span class="comment-content">${article.title}</span>
    </div>
  `).join('');
  
  if (articles.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无文章</div>';
  }
  
  if (paginationContainer) {
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
    } else {
      let options = '';
      for (let i = 1; i <= totalPages; i++) {
        options += `<option value="${i}" ${i === myArticlesPage ? 'selected' : ''}>${i}</option>`;
      }
      paginationContainer.innerHTML = `
        <div class="my-articles-page-selector">
          第 <select onchange="renderMyArticles(parseInt(this.value))">${options}</select> 页 / 共 ${totalPages} 页
        </div>
      `;
    }
  }
}

// ============================================
// 文章发布（表单初始化、提交、图片上传）
// ============================================
function initPublishForm() {
  const categories = DB.getCategories();
  const select = document.getElementById('publishCategory');
  select.innerHTML = `
    <option value="">请选择分类</option>
    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
  `;
  
  const tags = DB.getTags();
  const tagSelector = document.getElementById('publishTags');
  tagSelector.innerHTML = tags.map(tag => `
    <button class="tag-option" onclick="togglePublishTag(this, '${tag.id}')">${tag.name}</button>
  `).join('');
}

function togglePublishTag(btn, tagId) {
  btn.classList.toggle('selected');
}

function handleCoverUpload() {
  const input = document.getElementById('publishCover');
  const files = input.files;
  if (!files || files.length === 0) return;
  
  const preview = document.getElementById('coverPreview');
  preview.style.display = 'flex';
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = function(e) {
      const isCover = uploadedImages.length === 0;
      uploadedImages.push(e.target.result);
      
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.dataset.isCover = isCover;
      item.innerHTML = `
        ${isCover ? '<span class="cover-badge">封面</span>' : ''}
        <img src="${e.target.result}" alt="图片预览">
        <button class="cover-remove-btn" onclick="removeUploadedImage(this, '${e.target.result}')">×</button>
      `;
      preview.appendChild(item);
    };
    reader.readAsDataURL(file);
  }
  input.value = '';
}

function removeUploadedImage(btn, imageData) {
  btn.parentElement.remove();
  uploadedImages = uploadedImages.filter(img => img !== imageData);
  
  const preview = document.getElementById('coverPreview');
  const items = preview.querySelectorAll('.preview-item');
  items.forEach((item, index) => {
    item.dataset.isCover = index === 0;
    const badge = item.querySelector('.cover-badge');
    if (index === 0) {
      if (!badge) {
        const newBadge = document.createElement('span');
        newBadge.className = 'cover-badge';
        newBadge.textContent = '封面';
        item.insertBefore(newBadge, item.firstChild);
      }
      item.querySelector('img').style.borderColor = '#f39c12';
    } else {
      if (badge) badge.remove();
      item.querySelector('img').style.borderColor = '';
    }
  });
  
  if (uploadedImages.length === 0) {
    preview.style.display = 'none';
  }
}

function deleteArticle(articleId) {
  if (confirm('确定要删除这篇文章吗？')) {
    DB.deleteArticle(articleId);
    
    if (currentPage === 'page-home') {
      renderArticles();
      renderLatestComments();
      renderMyArticles();
    } else if (currentPage === 'page-favorites') {
      renderFavorites();
    } else if (currentPage === 'page-discover') {
      renderDiscover();
    } else if (currentPage === 'page-article-detail') {
      showPage('page-home');
    }
    
    renderUserCard();
    renderWebInfo();
  }
}

function submitArticle() {
  const title = document.getElementById('publishTitle').value.trim();
  const categoryId = document.getElementById('publishCategory').value;
  const content = document.getElementById('publishContent').value.trim();
  
  const selectedTags = [];
  document.querySelectorAll('.tag-option.selected').forEach(btn => {
    const onclick = btn.getAttribute('onclick');
    const match = onclick.match(/togglePublishTag\(this, '([^']+)'\)/);
    if (match && match[1]) {
      selectedTags.push(match[1]);
    }
  });
  
  if (!title || !content) {
    alert('请填写标题和内容');
    return;
  }
  
  try {
    const currentUser = DB.getCurrentUser();
    const displayName = getUserDisplayName();
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    
    const cover = uploadedImages.length > 0 ? uploadedImages[0] : '';
    
    DB.saveArticle({
      title: title,
      content: content,
      author: displayName,
      categoryId: categoryId,
      tags: selectedTags,
      createdAt: dateStr,
      likes: 0,
      views: 0,
      cover: cover
    });
    
    document.getElementById('publishTitle').value = '';
    document.getElementById('publishContent').value = '';
    document.getElementById('publishCategory').value = '';
    document.querySelectorAll('.tag-option.selected').forEach(btn => btn.classList.remove('selected'));
    uploadedImages = [];
    document.getElementById('coverPreview').innerHTML = '';
    document.getElementById('coverPreview').style.display = 'none';
    
    showPage('page-home');
    renderArticles();
    renderMyArticles();
    renderUserCard();
    renderWebInfo();
    
    alert('文章发布成功！');
  } catch (error) {
    console.error('发布文章失败:', error);
    alert('发布文章失败，请检查控制台日志');
  }
}

// ============================================
// 分类页面
// ============================================
function showCategoryList() {
  const currentUser = DB.getCurrentUser();
  const categories = DB.getCategories();
  const container = document.getElementById('categoryList');
  const articleList = document.getElementById('categoryArticleList');
  const backBtn = document.getElementById('categoryBackBtn');
  
  container.style.display = 'grid';
  articleList.style.display = 'none';
  backBtn.style.display = 'none';
  
  let userArticles = [];
  if (currentUser) {
    userArticles = DB.getArticlesByAuthor(currentUser);
  }
  
  container.innerHTML = categories.map(cat => {
    const count = userArticles.filter(a => a.categoryId === cat.id).length;
    return `
      <div class="category-card" onclick="showCategoryArticles('${cat.id}')">
        <div class="category-name">${cat.name}</div>
        <div class="category-count">${count} 篇文章</div>
      </div>
    `;
  }).join('');
}

function showCategoryArticles(categoryId) {
  const category = DB.getCategory(categoryId);
  const currentUser = DB.getCurrentUser();
  let articles = [];
  if (currentUser) {
    const userArticles = DB.getArticlesByAuthor(currentUser);
    articles = userArticles.filter(a => a.categoryId === categoryId);
  }
  const container = document.getElementById('categoryList');
  const articleList = document.getElementById('categoryArticleList');
  const backBtn = document.getElementById('categoryBackBtn');
  
  container.style.display = 'none';
  articleList.style.display = 'block';
  backBtn.style.display = 'block';
  
  document.querySelector('.category-page .page-title').textContent = category ? category.name : '文章分类';
  
  articleList.innerHTML = articles.map(article => {
    const tags = DB.getTagsByIds(article.tags);
    const currentUser = DB.getCurrentUser();
    const displayName = getUserDisplayName();
    const isAuthor = currentUser && (article.author === currentUser || article.author === displayName);
    const isFavorited = currentUser && DB.isFavorite(currentUser, article.id);
    return `
      <div class="article-card animate-fade-in-up" onclick="showArticleDetail('${article.id}')">
        <div class="article-cover ${article.cover ? 'has-cover' : ''}">
          ${article.cover ? `<img src="${article.cover}" alt="${article.title}" />` : '<div class="cover-icon">📝</div>'}
        </div>
        <div class="article-info">
          <div class="article-title-row">
            <h3 class="article-title">${article.title}</h3>
            ${isAuthor ? `<span class="article-delete" onclick="event.stopPropagation(); deleteArticle('${article.id}')"><i class="fas fa-trash"></i>删除</span>` : ''}
          </div>
          <div class="article-meta">
            <span><i class="fas fa-user"></i>${article.author}</span>
            <span><i class="fas fa-calendar"></i>${article.createdAt}</span>
          </div>
          <p class="article-excerpt">${article.content}</p>
          <div class="article-footer">
            <div class="article-tags">
              ${tags.map(t => `<span class="article-tag">${t.name}</span>`).join('')}
            </div>
            <div class="article-stats">
              <span><i class="fas fa-eye"></i>浏览 ${article.views}</span>
              <span class="article-like-btn" data-like-id="${article.id}" onclick="event.stopPropagation(); toggleArticleLike('${article.id}')"><i class="fas fa-heart"></i>点赞 ${article.likes}</span>
              <span class="article-favorite-btn ${isFavorited ? 'favorited' : ''}" data-favorite-id="${article.id}" onclick="event.stopPropagation(); toggleArticleFavorite('${article.id}')"><i class="fas fa-bookmark"></i>收藏</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  if (articles.length === 0) {
    articleList.innerHTML = '<div class="empty-state">该分类下暂无文章</div>';
  }
}

// ============================================
// 文章归档页面
// ============================================
function renderArchive() {
  const currentUser = DB.getCurrentUser();
  let groups = {};
  if (currentUser) {
    groups = DB.getArticlesGroupedByDateByAuthor(currentUser);
  }
  const container = document.getElementById('archiveTimeline');
  
  let html = '';
  for (const [date, articles] of Object.entries(groups)) {
    const [year, month] = date.split('-');
    html += `
      <div class="archive-year">${year}年</div>
      <div class="archive-month">${month}月</div>
      ${articles.map(article => `
        <div class="archive-article" onclick="showArticleDetail('${article.id}')">
          <div class="archive-title">${article.title}</div>
          <div class="archive-date">${article.createdAt}</div>
        </div>
      `).join('')}
    `;
  }
  
  container.innerHTML = html || '<div class="empty-state">暂无归档文章</div>';
}

// ============================================
// 留言板页面
// ============================================
function renderMessages() {
  const messages = DB.getMessages();
  const container = document.getElementById('messageList');
  
  container.innerHTML = messages.map(msg => {
    const currentUser = DB.getCurrentUser();
    const isAuthor = currentUser && msg.author === getUserDisplayName();
    const replies = msg.replies || [];
    const currentUserDisplayName = getUserDisplayName();
    
    const allReplyHtml = replies.map((r, index) => `
      <div class="reply-item" id="msg-reply-${msg.id}-${index}" ${index >= 2 ? 'style="display:none;"' : ''}>
        <span class="reply-author">${r.author}</span>${r.replyTo ? ` 回复 ${r.replyTo}` : ''}: ${r.content}
        <span class="reply-time">${r.createdAt}</span>
        <span class="reply-like" onclick="toggleMessageReplyLike('${msg.id}', '${r.id}')">
          <i class="fas fa-heart"></i> 点赞 ${r.likes || 0}
        </span>
        <span class="reply-reply-btn" onclick="showMessageReplyInput('${msg.id}', '${r.author}')">
          <i class="fas fa-reply"></i> 回复
        </span>
        ${currentUser && r.author === currentUserDisplayName ? `<span class="reply-delete-btn" onclick="deleteMessageReply('${msg.id}', '${r.id}')">
          <i class="fas fa-trash"></i> 删除
        </span>` : ''}
      </div>
    `).join('');
    
    const showExpand = replies.length > 2;
    
    return `
      <div class="message-card">
        <div class="message-header">
          <span class="message-author">${msg.author}</span>
          <span class="message-time">${msg.createdAt}</span>
        </div>
        <div class="message-content">${msg.content}</div>
        <div class="message-replies">
          ${allReplyHtml}
          ${showExpand ? `
            <div class="reply-expand-container" id="msg-expand-${msg.id}">
              <span class="reply-expand-btn" onclick="expandMessageReplies('${msg.id}', ${replies.length})">展开更多</span>
            </div>
          ` : ''}
        </div>
        <div class="reply-input-container" id="msg-reply-input-${msg.id}" style="display:none;">
          <input type="text" class="reply-input" id="msg-reply-input-text-${msg.id}" placeholder="回复 ${msg.author}..." onkeypress="if(event.key==='Enter')submitMessageReply('${msg.id}')">
          <button class="reply-submit-btn" onclick="submitMessageReply('${msg.id}')">发送</button>
        </div>
        <div class="message-actions">
          <div class="message-actions-left">
            <span class="message-action-btn" onclick="toggleMessageLike('${msg.id}')"><i class="fas fa-heart"></i> 点赞 ${msg.likes || 0}</span>
            <span class="message-action-btn" onclick="showMessageReplyInput('${msg.id}')"><i class="fas fa-reply"></i> 回复</span>
            ${isAuthor ? `<span class="message-action-btn" onclick="deleteMessage('${msg.id}')"><i class="fas fa-trash"></i> 删除</span>` : ''}
          </div>
          <span class="message-views">浏览 ${msg.views || 0}</span>
        </div>
      </div>
    `;
  }).join('');
  
  if (messages.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无留言</div>';
  }
}

function submitMessage() {
  const content = document.getElementById('messageInput').value.trim();
  if (!content) {
    alert('请输入留言内容');
    return;
  }
  
  const currentUser = DB.getCurrentUser();
  if (!currentUser) {
    alert('请先登录');
    return;
  }
  
  const authorName = getUserDisplayName();
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  
  DB.saveMessage({
    author: authorName,
    content: content,
    createdAt: dateStr,
    likes: 0,
    views: 0,
    replies: []
  });
  
  document.getElementById('messageInput').value = '';
  renderMessages();
}

function toggleMessageLike(messageId) {
  const messages = DB.getMessages();
  const message = messages.find(m => m.id === messageId);
  if (message) {
    message.likes = (message.likes || 0) + 1;
    DB.saveMessage(message);
    renderMessages();
  }
}

function deleteMessage(messageId) {
  if (confirm('确定要删除这条留言吗？')) {
    DB.deleteMessage(messageId);
    renderMessages();
  }
}

function showMessageReplyInput(messageId, replyTo) {
  const inputContainer = document.getElementById(`msg-reply-input-${messageId}`);
  const input = document.getElementById(`msg-reply-input-text-${messageId}`);
  
  if (inputContainer.style.display === 'none') {
    inputContainer.style.display = 'block';
    if (replyTo) {
      input.placeholder = `回复 ${replyTo}...`;
      input.dataset.replyTo = replyTo;
    } else {
      input.dataset.replyTo = '';
    }
    input.focus();
  } else {
    inputContainer.style.display = 'none';
  }
}

function submitMessageReply(messageId) {
  const input = document.getElementById(`msg-reply-input-text-${messageId}`);
  const content = input.value.trim();
  if (!content) {
    alert('请输入回复内容');
    return;
  }
  
  const currentUser = DB.getCurrentUser();
  if (!currentUser) {
    alert('请先登录');
    return;
  }
  
  const replyTo = input.dataset.replyTo || '';
  const authorName = getUserDisplayName();
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  
  const messages = DB.getMessages();
  const message = messages.find(m => m.id === messageId);
  if (message) {
    if (!message.replies) message.replies = [];
    message.replies.push({
      id: Date.now().toString(),
      author: authorName,
      content: content,
      createdAt: dateStr,
      likes: 0,
      replyTo: replyTo
    });
    DB.saveMessage(message);
  }
  
  input.value = '';
  input.dataset.replyTo = '';
  renderMessages();
}

function deleteMessageReply(messageId, replyId) {
  if (confirm('确定要删除这条回复吗？')) {
    const messages = DB.getMessages();
    const message = messages.find(m => m.id === messageId);
    if (message && message.replies) {
      message.replies = message.replies.filter(r => r.id !== replyId);
      DB.saveMessage(message);
    }
    
    const allReplyItems = document.querySelectorAll(`[id^="msg-reply-${messageId}-"]`);
    const expandBtn = document.querySelector(`#msg-expand-${messageId} .reply-expand-btn`);
    
    let currentVisible = 0;
    allReplyItems.forEach(item => {
      if (item.style.display !== 'none') {
        currentVisible++;
      }
    });
    
    const replies = (message && message.replies) || [];
    const totalReplies = replies.length;
    
    const newReplyHtml = replies.map((r, index) => {
      const currentUser = DB.getCurrentUser();
      const currentUserDisplayName = getUserDisplayName();
      return `
        <div class="reply-item" id="msg-reply-${messageId}-${index}" ${index >= currentVisible ? 'style="display:none;"' : ''}>
          <span class="reply-author">${r.author}</span>${r.replyTo ? ` 回复 ${r.replyTo}` : ''}: ${r.content}
          <span class="reply-time">${r.createdAt}</span>
          <span class="reply-like" onclick="toggleMessageReplyLike('${messageId}', '${r.id}')">
            <i class="fas fa-heart"></i> 点赞 ${r.likes || 0}
          </span>
          <span class="reply-reply-btn" onclick="showMessageReplyInput('${messageId}', '${r.author}')">
            <i class="fas fa-reply"></i> 回复
          </span>
          ${currentUser && r.author === currentUserDisplayName ? `<span class="reply-delete-btn" onclick="deleteMessageReply('${messageId}', '${r.id}')">
            <i class="fas fa-trash"></i> 删除
          </span>` : ''}
        </div>
      `;
    }).join('');
    
    const messageReplies = document.querySelector(`#msg-expand-${messageId}`).parentElement;
    messageReplies.innerHTML = newReplyHtml;
    
    if (totalReplies > 2) {
      messageReplies.innerHTML += `
        <div class="reply-expand-container" id="msg-expand-${messageId}">
          <span class="reply-expand-btn" onclick="expandMessageReplies('${messageId}', ${totalReplies})">${currentVisible >= totalReplies ? '收起' : '展开更多'}</span>
        </div>
      `;
    }
  }
}

function toggleMessageReplyLike(messageId, replyId) {
  const messages = DB.getMessages();
  const message = messages.find(m => m.id === messageId);
  if (message && message.replies) {
    const reply = message.replies.find(r => r.id === replyId);
    if (reply) {
      reply.likes = (reply.likes || 0) + 1;
      DB.saveMessage(message);
      renderMessages();
    }
  }
}

function expandMessageReplies(messageId, totalReplies) {
  const expandBtn = document.querySelector(`#msg-expand-${messageId} .reply-expand-btn`);
  const visibleCount = document.querySelectorAll(`#msg-reply-${messageId}-[style*="display: block"], #msg-reply-${messageId}-[style*="display:block"]`).length;
  const allReplyItems = document.querySelectorAll(`[id^="msg-reply-${messageId}-"]`);
  
  let currentVisible = 0;
  allReplyItems.forEach((item, index) => {
    if (item.style.display !== 'none') {
      currentVisible++;
    }
  });
  
  if (expandBtn.textContent.includes('展开')) {
    const nextIndex = currentVisible;
    const endIndex = Math.min(nextIndex + 2, totalReplies);
    
    for (let i = nextIndex; i < endIndex; i++) {
      const item = document.getElementById(`msg-reply-${messageId}-${i}`);
      if (item) {
        item.style.display = 'block';
      }
    }
    
    const newVisible = Math.min(currentVisible + 2, totalReplies);
    
    if (newVisible >= totalReplies) {
      expandBtn.textContent = '收起';
    } else {
      expandBtn.textContent = '展开更多';
    }
  } else {
    for (let i = 2; i < totalReplies; i++) {
      const item = document.getElementById(`msg-reply-${messageId}-${i}`);
      if (item) {
        item.style.display = 'none';
      }
    }
    expandBtn.textContent = '展开更多';
  }
}
  
