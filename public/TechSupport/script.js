//   1. Глобальные переменные и состояние
let isLoggedIn = false;
let currentUser = null;
let pendingAfterAuth = null;

// Share the Distro.space light/dark preference across pages.
const supportThemeButton = document.getElementById('themeToggle');
const supportThemeFavicon = document.getElementById('siteFavicon');
function applySupportTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    if (supportThemeButton) {
        supportThemeButton.setAttribute('aria-pressed', String(isDark));
        supportThemeButton.setAttribute('aria-label', isDark ? '\u0412\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0441\u0432\u0435\u0442\u043b\u0443\u044e \u0442\u0435\u043c\u0443' : '\u0412\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0442\u0451\u043c\u043d\u0443\u044e \u0442\u0435\u043c\u0443');
        supportThemeButton.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}" aria-hidden="true"></i><span>${isDark ? '\u0421\u0412\u0415\u0422\u041b\u0410\u042f' : '\u0422\u0401\u041c\u041d\u0410\u042f'}</span>`;
    }
    const faviconHref = isDark ? supportThemeFavicon?.dataset.darkHref : supportThemeFavicon?.dataset.lightHref;
    if (faviconHref) supportThemeFavicon.href = faviconHref;
}
const savedSupportTheme = localStorage.getItem('theme');
const initialSupportTheme = savedSupportTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applySupportTheme(initialSupportTheme);
supportThemeButton?.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    applySupportTheme(nextTheme);
});
window.addEventListener('storage', (event) => {
    if (event.key === 'theme') applySupportTheme(event.newValue || 'light');
});


// DOM элементы
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const supportModal = document.getElementById('supportModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userNameSpan = document.getElementById('userNameDisplay');
const adminLink = document.getElementById('adminLink');
const dashboardLink = document.getElementById('dashboardLink');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const supportForm = document.getElementById('supportForm');

const heroSection = document.getElementById('heroSection');
const chatInterface = document.getElementById('chatInterface');
const faqSection = document.getElementById('faqSection');
const homeLink = document.getElementById('homeLink');
const chatLink = document.getElementById('chatLink');
const faqLink = document.getElementById('faqLink');
const footerFaqLink = document.getElementById('footerFaqLink');
const startChatHero = document.getElementById('startChatHero');
const learnMoreBtn = document.getElementById('learnMoreBtn');

const sendMsgBtn = document.getElementById('sendMsgBtn');
const userMessageInput = document.getElementById('userMessageInput');
const messagesList = document.getElementById('messagesList');
const quickActionsDiv = document.getElementById('quickActions');
const faqGrid = document.getElementById('faqGrid');
const apiStatusSpan = document.getElementById('apiStatusIndicator');
const checkApiBtn = document.getElementById('checkApiBtn');
const supportRequestBtn = document.getElementById('supportRequestBtn');

//   2. Базовые функции
function showNotification(message, type = 'error') {
    const existing = document.querySelector('.error-notification, .success-notification');
    if (existing) existing.remove();
    
    const div = document.createElement('div');
    div.className = type === 'error' ? 'error-notification' : 'success-notification';
    div.textContent = message;
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(div, mainContent.firstChild);
    } else {
        document.body.insertBefore(div, document.body.firstChild);
    }
    
    setTimeout(() => div.remove(), 4000);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

//   3. API вызовы
async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Ответ не JSON:', text.substring(0, 200));
            throw new Error('Неверный формат ответа');
        }
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

//   4. Проверка сессии
async function checkSession() {
    try {
        const response = await fetch('/src/controlls/php/session_check.php', {
            credentials: 'same-origin'
        });
        if (!response.ok) {
            console.log('Сессия не активна');
            return;
        }
        const result = await response.json();
        console.log('Результат проверки сессии:', result);
        
        if (result.logged_in) {
            isLoggedIn = true;
            currentUser = { name: result.user_name, role: result.user_role };
            updateUIAfterLogin();
            loadQuickActions();
        }
    } catch (e) {
        console.log('Ошибка проверки сессии:', e);
        isLoggedIn = false;
    }
}

//   5. Авторизация и регистрация
async function handleLogin(email, password) {
    try {
        const response = await fetchAPI('/src/controlls/php/auth.php?action=login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response && response.success) {
            isLoggedIn = true;
            currentUser = { name: response.user.name, role: response.user.role };
            updateUIAfterLogin();
            closeModal('loginModal');
            showNotification('Добро пожаловать!', 'success');
            loadQuickActions();
            const nextSection = pendingAfterAuth;
            pendingAfterAuth = null;
            if (nextSection === 'chat') showChatInterface();
        } else {
            showNotification(response?.message || 'Ошибка входа');
        }
    } catch (error) {
        showNotification('Ошибка соединения с сервером');
    }
}

async function handleRegister(name, email, password) {
    try {
        const response = await fetchAPI('/src/controlls/php/auth.php?action=register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        
        if (response && response.success) {
            pendingAfterAuth = pendingAfterAuth || 'chat';
            showNotification('Регистрация успешна! Теперь войдите.', 'success');
            closeModal('registerModal');
            showModal('loginModal');
        } else {
            showNotification(response?.message || 'Ошибка регистрации');
        }
    } catch (error) {
        showNotification('Ошибка соединения с сервером');
    }
}

function updateUIAfterLogin() {
    loginBtn.classList.add('hidden');
    if (registerBtn) registerBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userNameSpan.classList.remove('hidden');
    userNameSpan.innerText = 'Привет, ' + (currentUser?.name || 'Пользователь');
    
    console.log('Роль пользователя:', currentUser?.role);
    
    // Показываем кнопки ТОЛЬКО если роль admin
    if (currentUser && currentUser.role === 'admin') {
        if (adminLink) {
            adminLink.classList.remove('hidden');
            console.log('Админ-панель показана');
        }
        if (dashboardLink) {
            dashboardLink.classList.remove('hidden');
            console.log('Дашборд показан');
        }
    } else {
        // Для не-админов скрываем
        if (adminLink) adminLink.classList.add('hidden');
        if (dashboardLink) dashboardLink.classList.add('hidden');
    }
    
    showChatInterface();
}

function logout() {
    fetchAPI('/src/controlls/php/auth.php?action=logout', { method: 'POST' })
        .then(() => {
            isLoggedIn = false;
            currentUser = null;
            loginBtn.classList.remove('hidden');
            if (registerBtn) registerBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            userNameSpan.classList.add('hidden');
            adminLink.classList.add('hidden');
            showHeroSection();
            showNotification('Вы вышли из системы', 'success');
        })
        .catch(() => {
            window.location.href = '/';
        });
}

//   6. Навигация
function scrollToSupportSection(section) {
    if (!section) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.requestAnimationFrame(() => section.scrollIntoView({ behavior, block: 'start' }));
}

function showHeroSection() {
    pendingAfterAuth = null;
    heroSection.classList.remove('hidden');
    chatInterface.classList.add('hidden');
    faqSection.classList.add('hidden');
    scrollToSupportSection(heroSection);
}

function showChatInterface() {
    if (!isLoggedIn) {
        pendingAfterAuth = 'chat';
        showNotification('??????? ????? ???????? ? ?????');
        showModal('loginModal');
        return;
    }
    pendingAfterAuth = null;
    heroSection.classList.add('hidden');
    chatInterface.classList.remove('hidden');
    faqSection.classList.add('hidden');
    scrollToSupportSection(chatInterface);
}

function showFaqSection() {
    pendingAfterAuth = null;
    heroSection.classList.add('hidden');
    chatInterface.classList.add('hidden');
    faqSection.classList.remove('hidden');
    loadFaq();
    scrollToSupportSection(faqSection);
}

async function loadQuickActions() {
    if (!quickActionsDiv) return;
    
    // Показываем быстрые кнопки только авторизованным
    if (!isLoggedIn) {
        quickActionsDiv.innerHTML = '<p style="padding:10px; color:#666;">Войдите, чтобы видеть быстрые вопросы</p>';
        return;
    }
    
    try {
        const data = await fetchAPI('/src/controlls/php/api.php?route=knowledge_base');
        if (data && data.length && !data.error) {
            quickActionsDiv.innerHTML = '';
            data.slice(0, 5).forEach(rule => {
                const keywords = rule.keywords.split(',')[0];
                const btn = document.createElement('button');
                btn.className = 'quick-btn';
                btn.textContent = keywords;
                btn.dataset.question = keywords;
                btn.onclick = () => {
                    userMessageInput.value = keywords;
                    sendMessage();
                };
                quickActionsDiv.appendChild(btn);
            });
        }
    } catch (e) {
        console.error('Ошибка загрузки быстрых действий:', e);
    }
}

//   8. Загрузка FAQ
async function loadFaq() {
    if (!faqGrid) return;
    const fallbackFaq = [
        { question: '\u041a\u0430\u043a \u0432\u044b\u0431\u0440\u0430\u0442\u044c \u043f\u0435\u0440\u0432\u044b\u0439 \u0434\u0438\u0441\u0442\u0440\u0438\u0431\u0443\u0442\u0438\u0432?', answer: '\u041e\u0442\u0442\u043e\u043b\u043a\u043d\u0438\u0442\u0435\u0441\u044c \u043e\u0442 \u0441\u0432\u043e\u0438\u0445 \u0437\u0430\u0434\u0430\u0447. Ubuntu \u0438 Linux Mint \u043f\u043e\u0434\u043e\u0439\u0434\u0443\u0442 \u0434\u043b\u044f \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0437\u043d\u0430\u043a\u043e\u043c\u0441\u0442\u0432\u0430, Debian \u2014 \u0434\u043b\u044f \u0441\u0442\u0430\u0431\u0438\u043b\u044c\u043d\u043e\u0439 \u043e\u0441\u043d\u043e\u0432\u044b. \u0421\u0440\u0430\u0432\u043d\u0438\u0442\u0435 \u0438\u0445 \u0432 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0435 Distro.space.' },
        { question: '\u041c\u043e\u0436\u043d\u043e \u043b\u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u043e\u0432\u0430\u0442\u044c Linux \u0431\u0435\u0437 \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0438?', answer: '\u0414\u0430. \u041c\u043d\u043e\u0433\u0438\u0435 \u0434\u0438\u0441\u0442\u0440\u0438\u0431\u0443\u0442\u0438\u0432\u044b \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u044e\u0442\u0441\u044f \u0432 Live-\u0440\u0435\u0436\u0438\u043c \u0441 USB-\u043d\u043e\u0441\u0438\u0442\u0435\u043b\u044f. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0441\u043e\u0432\u043c\u0435\u0441\u0442\u0438\u043c\u043e\u0441\u0442\u044c \u043e\u0431\u043e\u0440\u0443\u0434\u043e\u0432\u0430\u043d\u0438\u044f \u0438 \u0441\u0434\u0435\u043b\u0430\u0439\u0442\u0435 \u0440\u0435\u0437\u0435\u0440\u0432\u043d\u0443\u044e \u043a\u043e\u043f\u0438\u044e \u0432\u0430\u0436\u043d\u044b\u0445 \u0434\u0430\u043d\u043d\u044b\u0445.' },
        { question: '\u041f\u043e\u0434\u043e\u0439\u0434\u0451\u0442 \u043b\u0438 Kali Linux \u0434\u043b\u044f \u043e\u0431\u044b\u0447\u043d\u043e\u0433\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f?', answer: 'Kali \u0441\u043e\u0437\u0434\u0430\u043d \u0434\u043b\u044f \u0430\u0443\u0434\u0438\u0442\u0430 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u0438 \u0438 \u043d\u0435 \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0443\u0434\u043e\u0431\u043d\u044b\u043c \u0432\u044b\u0431\u043e\u0440\u043e\u043c \u0434\u043b\u044f \u043f\u0435\u0440\u0432\u043e\u0433\u043e Linux. \u0414\u043b\u044f \u043f\u043e\u0432\u0441\u0435\u0434\u043d\u0435\u0432\u043d\u043e\u0439 \u0440\u0430\u0431\u043e\u0442\u044b \u043b\u0443\u0447\u0448\u0435 \u0432\u0437\u044f\u0442\u044c \u0443\u043d\u0438\u0432\u0435\u0440\u0441\u0430\u043b\u044c\u043d\u044b\u0439 \u0434\u0438\u0441\u0442\u0440\u0438\u0431\u0443\u0442\u0438\u0432. \u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b \u0430\u0443\u0434\u0438\u0442\u0430 \u0442\u043e\u043b\u044c\u043a\u043e \u0441 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u0438\u044f.' },
        { question: '\u0413\u0434\u0435 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e \u0441\u043a\u0430\u0447\u0430\u0442\u044c \u043e\u0431\u0440\u0430\u0437 Linux?', answer: '\u041e\u0442\u043a\u0440\u043e\u0439\u0442\u0435 \u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0439 \u0441\u0430\u0439\u0442 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0433\u043e \u043f\u0440\u043e\u0435\u043a\u0442\u0430 \u0447\u0435\u0440\u0435\u0437 \u043a\u0430\u0442\u0430\u043b\u043e\u0433 Distro.space. \u0418\u0437\u0431\u0435\u0433\u0430\u0439\u0442\u0435 \u0437\u0435\u0440\u043a\u0430\u043b \u0438 \u043d\u0435\u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0445 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a\u043e\u0432.' }
    ];
    let data = await fetchAPI('/src/controlls/php/api.php?route=knowledge_base');
    if (!Array.isArray(data) || data.length === 0) data = fallbackFaq;
    faqGrid.innerHTML = '';
    data.forEach((rule) => {
        const item = document.createElement('article');
        item.className = 'faq-item';
        const question = document.createElement('h3');
        question.textContent = rule.question_pattern || (rule.keywords || '').split(',')[0] || '';
        const answer = document.createElement('p');
        const answerText = String(rule.answer_text || rule.answer || '');
        answer.textContent = answerText.length > 220 ? `${answerText.slice(0, 220)}...` : answerText;
        item.append(question, answer);
        faqGrid.appendChild(item);
    });
}

async function sendMessage() {
    if (!isLoggedIn) {
        showNotification('\u0412\u043e\u0439\u0434\u0438\u0442\u0435, \u0447\u0442\u043e\u0431\u044b \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435');
        showModal('loginModal');
        return;
    }
    const message = userMessageInput.value.trim();
    if (!message) return;
    addUserMessage(message);
    userMessageInput.value = '';
    const typingMessage = addTypingIndicator();
    if (sendMsgBtn) sendMsgBtn.disabled = true;
    try {
        const response = await fetchAPI('/src/controlls/php/api.php?route=chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
        const reply = response && response.success
            ? response.bot_response
            : '\u041f\u0440\u043e\u0438\u0437\u043e\u0448\u043b\u0430 \u043e\u0448\u0438\u0431\u043a\u0430. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043f\u043e\u0437\u0436\u0435.';
        await addBotMessage(reply, typingMessage);
    } catch (error) {
        await addBotMessage('\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u044f \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u043e\u043c.', typingMessage);
    } finally {
        if (sendMsgBtn) sendMsgBtn.disabled = false;
    }
}

function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user-message';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = String(text);
    msgDiv.appendChild(bubble);
    messagesList.appendChild(msgDiv);
    messagesList.scrollTop = messagesList.scrollHeight;
}

function addTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot-message bot-typing';
    msgDiv.innerHTML = '<div class="avatar"><i class="fas fa-robot" aria-hidden="true"></i></div><div class="bubble typing-bubble" role="status" aria-label="\u0411\u043e\u0442 \u043f\u0435\u0447\u0430\u0442\u0430\u0435\u0442"><span class="typing-dots"><i></i><i></i><i></i></span><span>BOT TYPING</span></div>';
    messagesList.appendChild(msgDiv);
    messagesList.scrollTop = messagesList.scrollHeight;
    return msgDiv;
}

function addBotMessage(text, typingMessage = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot-message';
    msgDiv.innerHTML = '<div class="avatar"><i class="fas fa-robot" aria-hidden="true"></i></div>';
    const bubble = document.createElement('div');
    bubble.className = 'bubble bot-reply';
    const reply = String(text || '');
    bubble.setAttribute('aria-label', reply);
    bubble.setAttribute('aria-hidden', 'true');
    msgDiv.appendChild(bubble);
    if (typingMessage && typingMessage.parentNode) typingMessage.replaceWith(msgDiv);
    else messagesList.appendChild(msgDiv);
    const chars = Array.from(reply);
    let position = 0;
    const chunkSize = chars.length > 240 ? 3 : 1;
    const delay = chars.length > 240 ? 12 : 18;
    return new Promise((resolve) => {
        const reveal = () => {
            position = Math.min(position + chunkSize, chars.length);
            bubble.textContent = chars.slice(0, position).join('');
            messagesList.scrollTop = messagesList.scrollHeight;
            if (position < chars.length) window.setTimeout(reveal, delay);
            else { bubble.removeAttribute('aria-hidden'); resolve(); }
        };
        reveal();
    });
}

async function checkApiStatus() {
    if (!apiStatusSpan) return;
    apiStatusSpan.innerHTML = 'Проверка...';
    try {
        const response = await fetch('/src/controlls/php/api.php?route=health', { method: 'GET' });
        if (response.ok) {
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                apiStatusSpan.innerHTML = 'API онлайн';
            } catch (e) {
                apiStatusSpan.innerHTML = 'API ошибка';
            }
        } else {
            apiStatusSpan.innerHTML = 'API недоступен';
        }
    } catch (e) {
        apiStatusSpan.innerHTML = 'Ошибка соединения';
    }
}

//   11. Модальные окна
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
    if (modalId === 'loginModal' && !isLoggedIn) pendingAfterAuth = null;
    
    // Очистка ошибок
    const errors = modal ? modal.querySelectorAll('.error-message') : [];
    errors.forEach(err => err.innerText = '');
}

//   12. Обработка формы обратной связи
if (supportRequestBtn) {
    supportRequestBtn.onclick = () => {
        if (!isLoggedIn) {
            showNotification('Войдите чтобы отправить заявку');
            showModal('loginModal');
            return;
        }
        showModal('supportModal');
    };
}

if (supportForm) {
    supportForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const subject = document.getElementById('supportSubject').value.trim();
        const message = document.getElementById('supportMessage').value.trim();
        
        // Валидация
        if (!subject) {
            document.getElementById('supportSubjectError').innerText = 'Введите тему';
            return;
        }
        if (!message) {
            document.getElementById('supportMessageError').innerText = 'Введите сообщение';
            return;
        }
        
        const fullMessage = `[${subject}]\n${message}`;
        
        try {
            const response = await fetchAPI('/src/controlls/php/api.php?route=requests', {
                method: 'POST',
                body: JSON.stringify({ message: fullMessage })
            });
            
            if (response && response.success) {
                showNotification('Заявка отправлена! Администратор свяжется с вами.', 'success');
                closeModal('supportModal');
                document.getElementById('supportSubject').value = '';
                document.getElementById('supportMessage').value = '';
            } else {
                showNotification('Ошибка отправки. Попробуйте позже.');
            }
        } catch (error) {
            showNotification('Ошибка соединения');
        }
    };
}

//   13. Закрытие модалок по клику на крестик
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
        const modalId = btn.getAttribute('data-modal');
        if (modalId) closeModal(modalId);
    };
});

window.onclick = (e) => {
    if (e.target.classList && e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
};

//   14. Инициализация
function init() {
    console.log('Инициализация приложения...');
    
    // Кнопки модалок
    if (loginBtn) loginBtn.onclick = () => showModal('loginModal');
    if (registerBtn) registerBtn.onclick = () => showModal('registerModal');
    if (logoutBtn) logoutBtn.onclick = logout;
    if (dashboardLink) dashboardLink.onclick = (e) => { e.preventDefault(); window.location.href = '/src/controlls/php/dashboard.php'; };
    
    // Навигация
    if (homeLink) homeLink.onclick = (e) => { e.preventDefault(); showHeroSection(); };
    if (chatLink) chatLink.onclick = (e) => { e.preventDefault(); showChatInterface(); };
    if (faqLink) faqLink.onclick = (e) => { e.preventDefault(); showFaqSection(); };
    if (footerFaqLink) footerFaqLink.onclick = (e) => { e.preventDefault(); showFaqSection(); };
    if (adminLink) adminLink.onclick = (e) => { e.preventDefault(); window.location.href = '/src/controlls/php/admin.php'; };
    if (startChatHero) startChatHero.onclick = showChatInterface;
    if (learnMoreBtn) learnMoreBtn.onclick = showFaqSection;
    
    // Чат
    if (sendMsgBtn) sendMsgBtn.onclick = sendMessage;
    if (userMessageInput) {
        userMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    // Проверка API
    if (checkApiBtn) checkApiBtn.onclick = checkApiStatus;
    checkApiStatus();
    
    // Формы
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value || '';
            const password = document.getElementById('loginPassword')?.value || '';
            handleLogin(email, password);
        };
    }
    
    if (registerForm) {
        registerForm.onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('regName')?.value || '';
            const email = document.getElementById('regEmail')?.value || '';
            const password = document.getElementById('regPassword')?.value || '';
            handleRegister(name, email, password);
        };
    }
    
    // Проверка сессии
    checkSession();

}

// Запуск после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
console.log('adminLink найден:', adminLink);
console.log('dashboardLink найден:', dashboardLink);

//   15. Подсказки в чате
let allTips = [];

async function loadTips() {
    try {
        const data = await fetchAPI('/src/controlls/php/api.php?route=knowledge_base');
        if (data && data.length && !data.error) {
            allTips = data;
            
            // Первые 4 вопроса показываем в сетке
            const firstFour = allTips.slice(0, 4);
            const tipsGrid = document.getElementById('tipsGrid');
            const moreList = document.getElementById('moreTipsList');
            
            if (tipsGrid) {
                tipsGrid.innerHTML = '';
                firstFour.forEach(tip => {
                    const question = tip.question_pattern || tip.keywords.split(',')[0];
                    const btn = document.createElement('button');
                    btn.className = 'tip-btn';
                    btn.textContent = question;
                    btn.onclick = () => {
                        userMessageInput.value = question;
                        sendMessage();
                    };
                    tipsGrid.appendChild(btn);
                });
            }
            
            // Остальные вопросы в "Ещё"
            if (moreList) {
                moreList.innerHTML = '';
                const remaining = allTips.slice(4);
                remaining.forEach(tip => {
                    const question = tip.question_pattern || tip.keywords.split(',')[0];
                    const btn = document.createElement('button');
                    btn.className = 'tip-btn';
                    btn.style.width = '100%';
                    btn.style.marginBottom = '6px';
                    btn.textContent = question;
                    btn.onclick = () => {
                        userMessageInput.value = question;
                        sendMessage();
                    };
                    moreList.appendChild(btn);
                });
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки подсказок:', e);
    }
}

// Кнопка "Ещё вопросы"
const showMoreBtn = document.getElementById('showMoreTipsBtn');
const moreTipsList = document.getElementById('moreTipsList');

if (showMoreBtn && moreTipsList) {
    showMoreBtn.onclick = () => {
        if (moreTipsList.classList.contains('hidden')) {
            moreTipsList.classList.remove('hidden');
            showMoreBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Скрыть';
        } else {
            moreTipsList.classList.add('hidden');
            showMoreBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Ещё вопросы';
        }
    };
}

// Вызываем загрузку подсказок при входе
// Добавьте в функцию updateUIAfterLogin:
 loadTips();