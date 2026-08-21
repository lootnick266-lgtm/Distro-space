//   1. Глобальные переменные и состояние
let isLoggedIn = false;
let currentUser = null;

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
const startChatHero = document.getElementById('startChatHero');

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
    registerBtn.classList.add('hidden');
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
            registerBtn.classList.remove('hidden');
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
function showHeroSection() {
    heroSection.classList.remove('hidden');
    chatInterface.classList.add('hidden');
    faqSection.classList.add('hidden');
}

function showChatInterface() {
    if (!isLoggedIn) {
        showNotification('Войдите чтобы общаться с ботом');
        showModal('loginModal');
        return;
    }
    heroSection.classList.add('hidden');
    chatInterface.classList.remove('hidden');
    faqSection.classList.add('hidden');
}

function showFaqSection() {
    heroSection.classList.add('hidden');
    chatInterface.classList.add('hidden');
    faqSection.classList.remove('hidden');
    loadFaq();
}

//   7. Загрузка быстрых действий
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
    try {
        const data = await fetchAPI('/src/controlls/php/api.php?route=knowledge_base');
        if (data && data.length && !data.error) {
            faqGrid.innerHTML = '';
            data.forEach(rule => {
                const item = document.createElement('div');
                item.className = 'faq-item';
                item.innerHTML = `
                    <h3>${escapeHtml(rule.question_pattern || rule.keywords.split(',')[0])}</h3>
                    <p>${escapeHtml(rule.answer_text.substring(0, 150))}...</p>
                `;
                faqGrid.appendChild(item);
            });
        }
    } catch (e) {
        console.error('Ошибка загрузки FAQ');
        if (faqGrid) {
            faqGrid.innerHTML = '<div class="error-notification">Не удалось загрузить FAQ</div>';
        }
    }
}

//   9. Отправка сообщения боту
async function sendMessage() {
    if (!isLoggedIn) {
        showNotification('Войдите чтобы отправить сообщение');
        showModal('loginModal');
        return;
    }
    
    const message = userMessageInput.value.trim();
    if (!message) return;
    
    addUserMessage(message);
    userMessageInput.value = '';
    
    try {
        const response = await fetchAPI('/src/controlls/php/api.php?route=chat', {
            method: 'POST',
            body: JSON.stringify({ message: message })
        });
        
        if (response && response.success) {
            addBotMessage(response.bot_response);
        } else {
            addBotMessage('Произошла ошибка. Попробуйте позже.');
        }
    } catch (error) {
        addBotMessage('Ошибка соединения с сервером.');
    }
}

function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user-message';
    msgDiv.innerHTML = '<div class="bubble">' + escapeHtml(text) + '</div>';
    messagesList.appendChild(msgDiv);
    messagesList.scrollTop = messagesList.scrollHeight;
}

function addBotMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot-message';
    msgDiv.innerHTML = `
        <div class="avatar"><i class="fas fa-robot"></i></div>
        <div class="bubble">${escapeHtml(text)}</div>
    `;
    messagesList.appendChild(msgDiv);
    messagesList.scrollTop = messagesList.scrollHeight;
}

//   10. Проверка статуса API
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
    if (adminLink) adminLink.onclick = (e) => { e.preventDefault(); window.location.href = '/src/controlls/php/admin.php'; };
    if (startChatHero) startChatHero.onclick = showChatInterface;
    
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