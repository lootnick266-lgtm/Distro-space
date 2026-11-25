const burger = document.querySelector('.burger');
const headerNav = document.querySelector('.header-nav');

if (burger && headerNav) {
  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    headerNav.classList.toggle('active');
  });

  document.addEventListener('click', (event) => {
    if (headerNav.classList.contains('active') && 
        !headerNav.contains(event.target) && 
        !burger.contains(event.target)) {
      headerNav.classList.remove('active');
    }
  });
}

const logoImg = document.querySelector('.header-logo-img');
const faviconLink = document.getElementById('siteFavicon');
if (logoImg && headerNav) {
  logoImg.addEventListener('click', (e) => {
    e.stopPropagation();
    headerNav.classList.toggle('active');
  });
}

const body = document.body;

function applyTheme(theme) {
  const isDark = theme === 'dark';
  body.classList.toggle('dark-theme', isDark);

  const logoSource = isDark ? logoImg?.dataset.darkSrc : logoImg?.dataset.lightSrc;
  const faviconSource = isDark ? faviconLink?.dataset.darkHref : faviconLink?.dataset.lightHref;
  if (logoSource) logoImg.src = logoSource;
  if (faviconSource) faviconLink.href = faviconSource;

  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function toggleTheme() {
  if (body.classList.contains('dark-theme')) {
    applyTheme('light');
  } else {
    applyTheme('dark');
  }
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  applyTheme('dark');
} else if (savedTheme === 'light') {
  applyTheme('light');
} else {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) applyTheme('dark');
  else applyTheme('light');
}

const dropdownThemeToggle = document.getElementById('dropdownThemeToggle');
if (dropdownThemeToggle) {
  dropdownThemeToggle.addEventListener('click', (e) => {
    e.preventDefault();
    toggleTheme();
  });
}

function showLoadingStatus(form) {
  let status = form.querySelector('.form-loading-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'form-loading-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Отправка...';
    form.appendChild(status);
  }
  status.hidden = false;
  status.style.display = 'inline-block';
}

function hideLoadingStatus(form) {
  const status = form.querySelector('.form-loading-status');
  if (status) {
    status.hidden = true;
    status.style.display = 'none';
  }
}

const modal = document.getElementById('feedbackModal');
const feedbackBtn = document.querySelector('.header-feedback-btn');
const closeModalBtn = document.querySelector('.modal-close');

function setModalOpen(modalElement, isOpen) {
  if (!modalElement) return;
  modalElement.style.display = isOpen ? 'flex' : 'none';
  modalElement.classList.toggle('modal-vhs-open', isOpen);
}
function openModal() {
  if (modal) setModalOpen(modal, true);
}

function closeModal() {
  if (modal) setModalOpen(modal, false);
}

if (feedbackBtn) feedbackBtn.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

const modalForm = document.getElementById('modalFeedbackForm');
if (modalForm) {
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const inputs = modalForm.querySelectorAll('input');
    if (inputs.length < 3) {
      alert('Ошибка: в форме меньше 3 полей');
      return;
    }
    
    const name = inputs[0].value.trim();
    const phone = inputs[1].value.trim();
    const email = inputs[2].value.trim();
    
    if (!name) {
      alert('Пожалуйста, заполните поле "Имя"');
      return;
    }
    if (!phone) {
      alert('Пожалуйста, заполните поле "Телефон"');
      return;
    }
    if (!email) {
      alert('Пожалуйста, заполните поле "Email"');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      alert('Введите корректный Email (пример: name@site.com)');
      return;
    }
    if (phone.length < 6) {
      alert('Введите корректный номер телефона (минимум 6 цифр)');
      return;
    }
    
    showLoadingStatus(modalForm);
    
    setTimeout(() => {
      alert(`Спасибо, ${name}! Мы свяжемся с вами в ближайшее время.`);
      modalForm.reset();
      hideLoadingStatus(modalForm);
      closeModal();
    }, 1500);
  });
}

const accordionHeaders = document.querySelectorAll('.accordion-header');
if (accordionHeaders.length) {
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      item.classList.toggle('active');
    });
  });
}

const dropdownToggle = document.querySelector('.dropdown-toggle');
if (dropdownToggle) {
  dropdownToggle.addEventListener('click', (e) => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      e.preventDefault();
      dropdownToggle.closest('.dropdown')?.classList.toggle('active');
    }
  });
}
const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
const registerTab = document.querySelector('.auth-tab[data-tab="register"]');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const agreeCheckbox = document.querySelector('.agree-checkbox');
const registerSubmit = registerForm ? registerForm.querySelector('.auth-submit') : null;

if (loginTab && registerTab && loginForm && registerForm) {
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  });
  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });
  
  if (agreeCheckbox && registerSubmit) {
    agreeCheckbox.addEventListener('change', () => {
      registerSubmit.disabled = !agreeCheckbox.checked;
    });
  }
  
}

const mainContactForm = document.querySelector('.contact-form');
if (mainContactForm) {
  mainContactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showLoadingStatus(mainContactForm);
    setTimeout(() => {
      alert('Сообщение отправлено!');
      mainContactForm.reset();
      hideLoadingStatus(mainContactForm);
    }, 1500);
  });
}

let aboutExpanded = false;
const aboutMoreBtn = document.getElementById('aboutMoreBtn');
const aboutFullText = document.getElementById('aboutFullText');

if (aboutMoreBtn && aboutFullText) {
  aboutMoreBtn.addEventListener('click', () => {
    if (!aboutExpanded) {
      aboutFullText.classList.add('show');
      aboutMoreBtn.innerText = 'Скрыть';
    } else {
      aboutFullText.classList.remove('show');
      aboutMoreBtn.innerText = 'Узнать больше';
    }
    aboutExpanded = !aboutExpanded;
  });
}

if (document.getElementById('catalogGrid') || document.querySelector('[data-distro]')) {
  const catalogDistros = [
    { id:'ubuntu',name:'Ubuntu Linux',category:'beginner',based:'Debian',officialUrl:'https://ubuntu.com/download/desktop',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/Ubuntu_logo_black-orange.png',desc:'Ubuntu — дружелюбный дистрибутив для повседневной работы и учёбы. У него простая установка, большое сообщество и широкий выбор программ.' },
    { id:'linuxmint',name:'Linux Mint',category:'beginner',based:'Ubuntu',officialUrl:'https://linuxmint.com/download.php',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/The_Linux_Mint_Logo.svg',desc:'Linux Mint предлагает привычное рабочее окружение и простое освоение. Хороший вариант для перехода с Windows и повседневных задач.' },
    { id:'zorin',name:'Zorin OS',category:'beginner',based:'Ubuntu',officialUrl:'https://zorin.com/os/download/',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/Zorin-os-logo.png',desc:'Zorin OS рассчитана на удобный переход с Windows: интерфейс настраивается, а базовые задачи доступны сразу после установки.' },
    { id:'debian',name:'Debian Linux',category:'advanced',based:'Independent',officialUrl:'https://www.debian.org/download',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/Debian_logo.png',desc:'Debian известен стабильной основой и большим архивом пакетов. Его используют на рабочих станциях и серверах.' },
    { id:'arch',name:'Arch Linux',category:'advanced',based:'Independent',officialUrl:'https://archlinux.org/download/',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/ArchLinux.png',desc:'Arch Linux даёт контроль над составом системы и свежими пакетами. Установка и настройка требуют самостоятельной работы.' },
    { id:'gentoo',name:'Gentoo Linux',category:'advanced',based:'Independent',officialUrl:'https://www.gentoo.org/downloads/',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/Gentoo-icon.png',desc:'Gentoo позволяет гибко собирать систему под свои требования. Подходит тем, кто хочет глубоко разбираться в настройке Linux.' },
    { id:'fedora',name:'Fedora Linux',category:'advanced',based:'Independent',officialUrl:'https://fedoraproject.org/workstation/download',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/Fedora-logo.png',desc:'Fedora предлагает современные версии программ и технологий в настольной системе от сообщества Fedora и Red Hat.' },
    { id:'opensuse',name:'openSUSE',category:'advanced',based:'Independent',officialUrl:'https://www.opensuse.org/',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/OpenSUSE_Logo.svg',desc:'openSUSE сочетает инструменты настройки, включая YaST, и несколько вариантов системы для разных сценариев использования.' },
    { id:'kali',name:'Kali Linux',category:'special',based:'Debian',officialUrl:'https://www.kali.org/get-kali/',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/Kali-2.0-website-logo-300x90.png',desc:'Kali Linux создан для тестирования безопасности и содержит инструменты аудита. Используй его только на системах, на проверку которых есть разрешение.' },
    { id:'parrot',name:'Parrot OS',category:'special',based:'Debian',officialUrl:'https://www.parrotsec.org/download/',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/Parrot_OS_logo%2C_2023.svg',desc:'Parrot OS объединяет инструменты для безопасности, приватности и разработки. Доступны разные редакции под свои задачи.' },
    { id:'tails',name:'Tails',category:'special',based:'Debian',officialUrl:'https://tails.net/download/index.ru.html',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/Tails-logo-flat.svg',desc:'Tails — переносимая система, ориентированная на приватность. Она направляет сетевые соединения через Tor и рассчитана на запуск с USB-носителя.' },
    { id:'steamos',name:'SteamOS',category:'special',based:'Arch',officialUrl:'https://store.steampowered.com/steamos/download',icon:'https://commons.wikimedia.org/wiki/Special:FilePath/SteamOS_wordmark.svg',desc:'SteamOS — система Valve для игровых устройств и Steam. Её доступность и совместимость зависят от поддерживаемого оборудования.' }
  ];

  function renderCatalog(filter = 'all') {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    const filtered = filter === 'all' 
      ? catalogDistros 
      : catalogDistros.filter(d => d.category === filter);

    grid.innerHTML = filtered.map(distro => `
      <div class="gallery-card catalog-card" data-id="${distro.id}" data-category="${distro.category}">
        <div class="gallery-image">
          <img src="${distro.icon}" alt="${distro.name}" loading="lazy" onerror="this.hidden=true">
        </div>
        <h3 class="gallery-card-title">${distro.name}</h3>
        <p class="gallery-card-text">${distro.desc.substring(0, 100)}...</p>
        <div class="catalog-card-badge ${distro.category}">${distro.category === 'beginner' ? 'Для начинающих' : distro.category === 'advanced' ? 'Для опытных' : 'Специализированный'}</div><button class="gallery-card-button button catalog-view-btn" data-id="${distro.id}">Подробнее</button>
      </div>
    `).join('');

    document.querySelectorAll('.catalog-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const distro = catalogDistros.find(d => d.id === id);
        if (distro) openDistroModal(distro);
      });
    });
  }

  function openDistroModal(distro) {
    let modal = document.getElementById('distroModal');
    
    if (!modal) {
      const modalHTML = `
        <div class="distro-modal" id="distroModal">
          <div class="distro-modal-content">
            <div class="distro-modal-header">
              <h3 class="distro-modal-title" id="distroModalTitle">Ubuntu Linux</h3>
              <span class="distro-modal-close">&times;</span>
            </div>
            <div class="distro-modal-body">
              <div class="distro-modal-icon"><img id="distroModalIcon" src="https://commons.wikimedia.org/wiki/Special:FilePath/Ubuntu_logo_black-orange.png" onerror="this.hidden=true" alt="Логотип" width="80"></div>
              <p id="distroModalDesc">Описание дистрибутива</p>
              <div class="distro-modal-info">
                <p><strong>Категория:</strong> <span id="distroModalCategory"></span></p>
                <p><strong>Основа:</strong> <span id="distroModalBased"></span></p>
              </div>
              <div class="distro-modal-buttons">
                <button class="distro-install-btn button" id="installViaInstaller">Загрузить дистрибутив</button>
                <button class="distro-official-btn button" id="goToOfficialSite">Официальный сайт</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      modal = document.getElementById('distroModal');
    }

    if (modal.dataset.bound !== 'true') {
      modal.dataset.bound = 'true';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'distroModalTitle');
      const modalClose = modal.querySelector('.distro-modal-close');
      if (modalClose) {
        modalClose.tabIndex = 0;
        modalClose.setAttribute('role', 'button');
        modalClose.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); modalClose.click(); }
        });
        modalClose.addEventListener('click', () => {
          setModalOpen(modal, false);
          if (modal.opener) modal.opener.focus();
        });
      }
      
      window.addEventListener('click', (e) => {
        if (e.target === modal) { setModalOpen(modal, false); if (modal.opener) modal.opener.focus(); }
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
          setModalOpen(modal, false);
          if (modal.opener) modal.opener.focus();
        }
      });
      
      const installBtn = document.getElementById('installViaInstaller');
      const officialBtn = document.getElementById('goToOfficialSite');
      
      if (installBtn) {
        installBtn.addEventListener('click', () => {
          const name = modal.dataset.currentName;
          if (name) {
            alert("Установщик " + name + " будет скачан автоматически. В демо-режиме загрузка не подключена.");
            setModalOpen(modal, false);
          }
        });
      }
      
      if (officialBtn) {
        officialBtn.addEventListener('click', () => {
          const url = modal.dataset.currentUrl;
          if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
            setModalOpen(modal, false);
          }
        });
      }
    }
    
    const title = document.getElementById('distroModalTitle');
    const desc = document.getElementById('distroModalDesc');
    const icon = document.getElementById('distroModalIcon');
    const category = document.getElementById('distroModalCategory');
    const based = document.getElementById('distroModalBased');
    
    if (title) title.textContent = distro.name;
    if (desc) desc.textContent = distro.desc;
    if (icon) { icon.hidden = false; icon.onerror = () => { icon.hidden = true; }; icon.src = distro.icon; }
    if (category) { const catText = distro.category === 'beginner' ? 'Для начинающих' : distro.category === 'advanced' ? 'Для опытных' : 'Специализированный'; category.textContent = catText; }
    if (based) based.textContent = distro.based;
    
    modal.dataset.currentDistro = distro.id;
    modal.dataset.currentUrl = distro.officialUrl;
    modal.dataset.currentName = distro.name;
    
    modal.opener = document.activeElement;
    setModalOpen(modal, true);
    const closeButton = modal.querySelector('.distro-modal-close');
    if (closeButton) closeButton.focus();
  }

  document.querySelectorAll('[data-distro]').forEach(button => {
    button.addEventListener('click', () => {
      const distro = catalogDistros.find(item => item.id === button.dataset.distro);
      if (distro) openDistroModal(distro);
    });
  });

  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        renderCatalog(filter);
      });
    });
  }

  renderCatalog();
}

if (!document.querySelector('#distroModalStyles')) {
  const modalStyles = document.createElement('style');
  modalStyles.id = 'distroModalStyles';
  modalStyles.textContent = `
    .distro-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 1001;
      justify-content: center;
      align-items: center;
    }
    .distro-modal-content {
      background: white;
      max-width: 500px;
      width: 90%;
      border-radius: 20px;
      overflow: hidden;
      animation: modalFadeIn 0.3s;
    }
    body.dark-theme .distro-modal-content {
      background: #1e1e1e;
    }
    .distro-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 25px;
      border-bottom: 1px solid #eee;
      background: #fff;
    }
    body.dark-theme .distro-modal-header {
      background: #1e1e1e;
      border-bottom-color: #444;
    }
    .distro-modal-title {
      font-size: 1.8rem;
      color: black;
      margin: 0;
    }
    body.dark-theme .distro-modal-title {
      color: white;
    }
    .distro-modal-close {
      font-size: 2rem;
      cursor: pointer;
      color: #666;
      transition: color 0.3s;
    }
    .distro-modal-close:hover {
      color: darkorchid;
    }
    .distro-modal-body {
      padding: 25px;
    }
    .distro-modal-body p {
      color: #333;
      line-height: 1.6;
      margin-bottom: 25px;
    }
    body.dark-theme .distro-modal-body p {
      color: #ccc;
    }
    .distro-modal-icon {
      text-align: center;
      margin-bottom: 20px;
    }
    .distro-modal-icon img {
      background: #f0f0f0;
      border-radius: 20px;
      padding: 10px;
    }
    body.dark-theme .distro-modal-icon img {
      background: #2a2a2a;
    }
    .distro-modal-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 12px;
      margin: 20px 0;
    }
    body.dark-theme .distro-modal-info {
      background: #2a2a2a;
    }
    .distro-modal-info p {
      margin: 8px 0;
    }
    .distro-modal-buttons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    .distro-install-btn,
    .distro-official-btn {
      flex: 1;
      text-align: center;
      padding: 12px 20px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-family: 'Raleway', sans-serif;
      font-weight: 600;
      transition: all 0.3s;
    }
    .distro-install-btn {
      background-color: darkorchid;
      color: white;
    }
    .distro-install-btn:hover {
      background-color: plum;
      transform: scale(1.02);
    }
    .distro-official-btn {
      background-color: transparent;
      border: 2px solid darkorchid;
      color: darkorchid;
    }
    .distro-official-btn:hover {
      background-color: darkorchid;
      color: white;
    }
    body.dark-theme .distro-official-btn {
      border-color: plum;
      color: plum;
    }
    body.dark-theme .distro-official-btn:hover {
      background-color: plum;
      color: #1e1e1e;
    }
    .success-animation {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #4caf50;
      color: white;
      padding: 15px 25px;
      border-radius: 12px;
      z-index: 2000;
      font-family: 'Raleway', sans-serif;
      animation: fadeInOut 2s;
    }
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(20px); }
      20% { opacity: 1; transform: translateY(0); }
      80% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-20px); }
    }
  `;
  document.head.appendChild(modalStyles);
}

function showSuccess(message) {
  const div = document.createElement('div');
  div.className = 'success-animation';
  div.textContent = message || '✓ Успешно отправлено!';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}

(() => {
  const api = '/src/controlls/php/';
  const labels = {
    login: 'Вход',
    logout: 'Выйти',
    error: 'Ошибка связи с сервером'
  };
  async function request(action, data = {}) {
    const response = await fetch(api + 'auth.php?action=' + action, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    let result;
    try { result = await response.json(); } catch (_) { throw new Error(labels.error); }
    if (!response.ok || !result.success) throw new Error(result.message || labels.error);
    return result;
  }
  for (const action of ['login', 'register']) {
    const form = document.getElementById(action + 'Form');
    if (!form) continue;
    const message = document.createElement('p'); message.setAttribute('role', 'alert'); form.appendChild(message);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const agree = form.querySelector('.agree-checkbox');
      if (!form.reportValidity() || (agree && !agree.checked) || form.dataset.pending === 'true') return;
      const button = form.querySelector('[type="submit"]');
      form.dataset.pending = 'true'; button.disabled = true; message.textContent = '';
      const data = Object.fromEntries(new FormData(form));
      try {
        await request(action, data);
        if (action === 'register') await request('login', { email: data.email, password: data.password });
        window.location.assign('/indexbase.html');
      } catch (error) { message.textContent = error.message || labels.error; }
      finally { form.dataset.pending = 'false'; button.disabled = !!agree && !agree.checked; }
    });
  }
  const header = document.querySelector('.header-container');
  if (!header) return;
  let actions = header.querySelector('.header-actions');
  if (!actions) { actions = document.createElement('div'); actions.className = 'header-actions'; header.appendChild(actions); }
  let login = document.getElementById('loginBtn');
  if (!login) { login = document.createElement('button'); login.id = 'loginBtn'; login.className = 'button'; actions.prepend(login); }
  let loggedIn = false;
  login.textContent = labels.login;
  login.onclick = () => window.location.assign(loggedIn ? '/TechSupport/' : '/auth.html');
  const logout = document.createElement('button'); logout.type = 'button'; logout.className = 'button';
  logout.textContent = labels.logout; logout.hidden = true; actions.appendChild(logout);
  const nav = header.querySelector('.header-nav-list');
  if (nav && !nav.querySelector('a[href="/TechSupport/"]')) {
    const item = document.createElement('li'); item.className = 'headernav-item';
    const link = document.createElement('a'); link.href = '/TechSupport/'; link.textContent = 'TechSupport';
    item.appendChild(link); nav.appendChild(item);
  }
  async function refresh() {
    try {
      const response = await fetch(api + 'session_check.php', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error(labels.error);
      const session = await response.json(); loggedIn = !!session.logged_in;
      login.textContent = loggedIn ? 'Аккаунт: ' + session.user_name : labels.login;
      login.classList.toggle('account-active', loggedIn);
      login.setAttribute('aria-label', login.textContent);
      logout.hidden = !loggedIn;
    } catch (error) { console.error(labels.error, error); }
  }
  logout.onclick = async () => {
    logout.disabled = true;
    try { await request('logout'); await refresh(); }
    catch (error) { alert(error.message || labels.error); }
    finally { logout.disabled = false; }
  };
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  refresh();
})();