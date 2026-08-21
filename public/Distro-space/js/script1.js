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
if (logoImg && headerNav) {
  logoImg.addEventListener('click', (e) => {
    e.stopPropagation();
    headerNav.classList.toggle('active');
  });
}

const body = document.body;

function applyTheme(theme) {
  if (theme === 'dark') {
    body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
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

function showGifSpinner(form) {
  let spinnerContainer = form.querySelector('.gif-spinner-container');
  if (!spinnerContainer) {
    spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'gif-spinner-container';
    spinnerContainer.innerHTML = `
      <img src="assets/gif/Gif-loader.gif" alt="Загрузка..." class="gif-spinner-img">
      <span>Отправка...</span>
    `;
    form.appendChild(spinnerContainer);
  }
  spinnerContainer.style.display = 'flex';
}

function hideGifSpinner(form) {
  const spinnerContainer = form.querySelector('.gif-spinner-container');
  if (spinnerContainer) {
    spinnerContainer.style.display = 'none';
  }
}

const modal = document.getElementById('feedbackModal');
const feedbackBtn = document.querySelector('.header-feedback-btn');
const closeModalBtn = document.querySelector('.modal-close');

function openModal() {
  if (modal) modal.style.display = 'flex';
}

function closeModal() {
  if (modal) modal.style.display = 'none';
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
    
    showGifSpinner(modalForm);
    
    setTimeout(() => {
      alert(`Спасибо, ${name}! Мы свяжемся с вами в ближайшее время.`);
      modalForm.reset();
      hideGifSpinner(modalForm);
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
if (dropdownToggle && window.innerWidth <= 768) {
  dropdownToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const parent = dropdownToggle.closest('.dropdown');
    parent.classList.toggle('active');
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
  
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showGifSpinner(loginForm);
    setTimeout(() => {
      alert('Демо-вход выполнен (логика не реализована)');
      hideGifSpinner(loginForm);
      loginForm.reset();
    }, 1500);
  });
  
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!agreeCheckbox.checked) {
      alert('Подтвердите согласие с правилами');
      return;
    }
    showGifSpinner(registerForm);
    setTimeout(() => {
      alert('Регистрация успешна! (демо)');
      hideGifSpinner(registerForm);
      registerForm.reset();
      if (agreeCheckbox) agreeCheckbox.checked = false;
      if (registerSubmit) registerSubmit.disabled = true;
    }, 1500);
  });
}

const mainContactForm = document.querySelector('.contact-form');
if (mainContactForm) {
  mainContactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showGifSpinner(mainContactForm);
    setTimeout(() => {
      alert('Сообщение отправлено!');
      mainContactForm.reset();
      hideGifSpinner(mainContactForm);
    }, 1500);
  });
}

const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    window.location.href = 'auth.html';
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

if (document.getElementById('catalogGrid')) {
  const catalogDistros = [
    { id: 'ubuntu', name: 'Ubuntu Linux', category: 'beginner', based: 'Debian', officialUrl: 'https://ubuntu.com/download/desktop', icon: 'assets/images/ubuntu-svgrepo-com.svg', desc: 'Ubuntu — самый популярный дистрибутив для начинающих. Простой в установке, огромное сообщество, множество готовых программ. Идеален для повседневного использования, работы и учёбы.' },
    { id: 'linuxmint', name: 'Linux Mint', category: 'beginner', based: 'Ubuntu', officialUrl: 'https://linuxmint.com/download.php', icon: 'assets/images/linux-mint-svgrepo-com.svg', desc: 'Linux Mint — дистрибутив, который славится своей простотой и удобством. Похож на Windows, легко освоить. Отличный выбор для новичков и тех, кто ценит стабильность.' },
    { id: 'zorin', name: 'Zorin OS', category: 'beginner', based: 'Ubuntu', officialUrl: 'https://zorin.com/os/download/', icon: 'assets/images/zorin-svgrepo-com.svg', desc: 'Zorin OS — дистрибутив с интерфейсом, напоминающим Windows. Легко настраивается, работает быстро даже на старых компьютерах. Отличный выбор для перехода с Windows.' },
    { id: 'debian', name: 'Debian Linux', category: 'advanced', based: 'Independent', officialUrl: 'https://www.debian.org/download', icon: 'assets/images/debian-svgrepo-com.svg', desc: 'Debian — стабильный и надёжный дистрибутив, основа многих систем. Идеален для серверов и опытных пользователей, ценящих стабильность выше всего.' },
    { id: 'arch', name: 'Arch Linux', category: 'advanced', based: 'Independent', officialUrl: 'https://archlinux.org/download/', icon: 'assets/images/arch-linux-svgrepo-com.svg', desc: 'Arch Linux — дистрибутив для опытных пользователей, которые хотят собрать систему "под себя". Полный контроль, свежие версии программ, но требует знаний.' },
    { id: 'gentoo', name: 'Gentoo Linux', category: 'advanced', based: 'Independent', officialUrl: 'https://www.gentoo.org/downloads/', icon: 'assets/images/gentoo-svgrepo-com.svg', desc: 'Gentoo — для энтузиастов, любящих компилировать из исходников. Максимальная оптимизация под ваше железо. Требует времени и терпения.' },
    { id: 'fedora', name: 'Fedora Linux', category: 'advanced', based: 'Independent', officialUrl: 'https://fedoraproject.org/workstation/download', icon: 'assets/images/fedora-svgrepo-com.svg', desc: 'Fedora — современный дистрибутив от Red Hat. Свежие версии программ, отлично подходит для разработчиков и любителей новых технологий.' },
    { id: 'opensuse', name: 'openSUSE', category: 'advanced', based: 'Independent', officialUrl: 'https://www.opensuse.org/', icon: 'assets/images/opensuse-svgrepo-com.svg', desc: 'openSUSE — мощный дистрибутив с отличными инструментами настройки (YaST). Подходит и для начинающих, и для опытных пользователей.' },
    { id: 'kali', name: 'Kali Linux', category: 'special', based: 'Debian', officialUrl: 'https://www.kali.org/get-kali/', icon: 'assets/images/kalilinux-svgrepo-com.svg', desc: 'Kali Linux — специализированный дистрибутив для тестирования на проникновение. Содержит сотни инструментов для кибербезопасности.' },
    { id: 'parrot', name: 'Parrot OS', category: 'special', based: 'Debian', officialUrl: 'https://www.parrotsec.org/download/', icon: 'assets/images/parrot-svgrepo-com.svg', desc: 'Parrot OS — дистрибутив для безопасности, приватности и разработки. Включает инструменты для пентеста, анонимности и программирования.' },
    { id: 'tails', name: 'Tails', category: 'special', based: 'Debian', officialUrl: 'https://tails.net/download/index.ru.html', icon: 'assets/images/tails-svgrepo-com.svg', desc: 'Tails — дистрибутив для анонимности. Весь трафик идёт через Tor, не оставляет следов на компьютере. Идеален для конфиденциальной работы.' },
    { id: 'steamos', name: 'SteamOS', category: 'special', based: 'Arch', officialUrl: 'https://store.steampowered.com/steamos/download', icon: 'assets/images/steamos-svgrepo-com.svg', desc: 'SteamOS — дистрибутив от Valve для игр. Оптимизирован для запуска Steam и игр. Отличный выбор для игровой консоли или HTPC.' }
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
          <img src="${distro.icon}" alt="${distro.name}" loading="lazy" onerror="this.src='assets/images/linux.png'">
        </div>
        <h3 class="gallery-card-title">${distro.name}</h3>
        <p class="gallery-card-text">${distro.desc.substring(0, 100)}...</p>
        <div class="catalog-card-badge ${distro.category}">${distro.category === 'beginner' ? ' Для начинающих' : distro.category === 'advanced' ? ' Для опытных' : ' Специализированный'}</div>
        <button class="gallery-card-button button catalog-view-btn" data-id="${distro.id}">Подробнее</button>
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
              <div class="distro-modal-icon">
                <img id="distroModalIcon" src="assets/images/Logo.jpg" alt="Логотип" width="80">
              </div>
              <p id="distroModalDesc">Описание дистрибутива</p>
              <div class="distro-modal-info">
                <p><strong> Категория:</strong> <span id="distroModalCategory"></span></p>
                <p><strong> Основа:</strong> <span id="distroModalBased"></span></p>
              </div>
              <div class="distro-modal-buttons">
                <button class="distro-install-btn button" id="installViaInstaller"> Скачать через установщик</button>
                <button class="distro-official-btn button" id="goToOfficialSite"> Перейти на официальный сайт</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      modal = document.getElementById('distroModal');
      
      const modalClose = modal.querySelector('.distro-modal-close');
      if (modalClose) {
        modalClose.addEventListener('click', () => {
          modal.style.display = 'none';
        });
      }
      
      window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
          modal.style.display = 'none';
        }
      });
      
      const installBtn = document.getElementById('installViaInstaller');
      const officialBtn = document.getElementById('goToOfficialSite');
      
      if (installBtn) {
        installBtn.addEventListener('click', () => {
          const name = modal.dataset.currentName;
          if (name) {
            alert(`Установщик ${name} будет скачан автоматически.\n(Демо-режим: в реальном проекте здесь запускался бы установщик)`);
            modal.style.display = 'none';
          }
        });
      }
      
      if (officialBtn) {
        officialBtn.addEventListener('click', () => {
          const url = modal.dataset.currentUrl;
          if (url) {
            window.open(url, '_blank');
            modal.style.display = 'none';
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
    if (icon) icon.src = distro.icon;
    if (category) {
      const catText = distro.category === 'beginner' ? ' Для начинающих' : distro.category === 'advanced' ? ' Для опытных' : ' Специализированный';
      category.textContent = catText;
    }
    if (based) based.textContent = distro.based;
    
    modal.dataset.currentDistro = distro.id;
    modal.dataset.currentUrl = distro.officialUrl;
    modal.dataset.currentName = distro.name;
    
    modal.style.display = 'flex';
  }

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
    .gif-spinner-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      padding: 20px 30px;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      z-index: 2000;
      color: white;
      font-family: 'Raleway', sans-serif;
    }
    .gif-spinner-img {
      width: 60px;
      height: 60px;
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