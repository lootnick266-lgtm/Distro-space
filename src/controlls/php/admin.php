<?php
//   1. Административная панель (только логика)

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/classes/Database.php';

$user = new User();

// Проверка сессии для AJAX
if (isset($_GET['check_session'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'logged_in' => isset($_SESSION['user_id']),
        'user_name' => $_SESSION['user_name'] ?? null,
        'user_role' => $_SESSION['user_role'] ?? null
    ]);
    exit;
}

// Проверка авторизации и прав
if (!$user->isLoggedIn() || !$user->isAdmin()) {
    header('Location: /');
    exit;
}

// Обработка действий
$support = new SupportRequest();
$kb = new KnowledgeBase();
$logger = new Logger();

$message = '';
$error = '';

// Обработка POST запросов
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    switch ($_POST['action']) {
        case 'update_status':
            $result = $support->updateStatus(
                (int)$_POST['request_id'],
                $_POST['status'],
                $_POST['admin_response'] ?? null
            );
            if ($result) $message = 'Статус заявки обновлён';
            else $error = 'Ошибка обновления';
            break;
            
        case 'add_rule':
            $result = $kb->addRule(
                $_POST['keywords'],
                $_POST['question_pattern'],
                $_POST['answer_text'],
                (int)$_POST['priority']
            );
            if ($result) $message = 'Правило добавлено';
            else $error = 'Ошибка добавления';
            break;
            
        case 'delete_rule':
            $result = $kb->delete((int)$_POST['rule_id']);
            if ($result) $message = 'Правило удалено';
            else $error = 'Ошибка удаления';
            break;
    }
}

// Получение данных
$requests = $support->getAllWithUsers();
$rules = $kb->getAll();
$logs = $logger->getAllLogs();

$new_count = 0;
$completed_count = 0;
foreach ($requests as $r) {
    if ($r['status'] === 'new') $new_count++;
    if ($r['status'] === 'completed') $completed_count++;
}

$stats = [
    'total_requests' => count($requests),
    'new_requests' => $new_count,
    'completed_requests' => $completed_count,
    'total_rules' => count($rules)
];

// Передаём данные в HTML шаблон
#include 'admin/admin.html';
?>


<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Панель управления — Distro.space</title>
    <link rel="icon" id="siteFavicon" href="/assets/images/site-logo-light.jpg" data-light-href="/assets/images/site-logo-light.jpg" data-dark-href="/assets/images/site-logo-dark.jpg" type="image/jpeg">
    <link rel="stylesheet" href="/TechSupport/style.css?v=admin-1">
    <link rel="stylesheet" href="/TechSupport/assets/fontawesome/css/fontawesome.min.css">
    <link rel="stylesheet" href="/TechSupport/assets/fontawesome/css/solid.min.css">

</head>

<body class="admin-page">
    <header class="main-header">
        <div class="container header-container">
            <a class="logo admin-wordmark" href="/indexbase.html" aria-label="Distro.space — главная">
                <span class="wordmark" data-text="DISTRO.SPACE">DISTRO.<span class="highlight">SPACE</span></span>
            </a>
            <nav class="main-nav">
                <ul>
                    <li><a href="/">Главная</a></li>
                    <li><a href="/#chatLink">Чат с ботом</a></li>
                    <li><a href="/#faqLink">FAQ</a></li>
                    <li><a href="dashboard.php">Дашборд</a></li>
                    <li><a href="admin.php" style="color:#2c7da0; font-weight:bold;">Админ-панель</a></li>
                    <li><a href="/grafana/" target="_blank" rel="noopener noreferrer">Grafana</a></li>
                </ul>
            </nav>
            <div class="auth-buttons admin-account">
                <span class="admin-identity"><span class="admin-signal">ADMIN</span><span><?php echo htmlspecialchars($_SESSION['user_name']); ?></span></span>
                <button id="themeToggle" class="theme-toggle" type="button" aria-pressed="false" aria-label="Переключить тему"><i class="fas fa-moon" aria-hidden="true"></i><span>ТЕМА</span></button>
                <button onclick="window.location.href='auth.php?action=logout'" class="btn-outline">Выйти</button>
            </div>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <section class="admin-hero">
                <p class="admin-kicker"><span class="admin-signal-dot"></span> SMARTSUPPORT / CONTROL ROOM</p>
                <h1><span class="admin-glitch" data-text="Панель администратора">Панель администратора</span></h1>
                <p class="admin-hero-copy">Обращения, база знаний и журнал действий — в одном рабочем пространстве.</p>
                <div class="admin-hero-meta"><span>ПОЛЬЗОВАТЕЛЬ: <?php echo htmlspecialchars($_SESSION['user_name']); ?></span><span>ДОСТУП: ADMIN</span></div>
            </section>

            <?php if ($message): ?>
            <div class="success-notification">
                <?php echo $message; ?>
            </div>
            <?php endif; ?>
            <?php if ($error): ?>
            <div class="error-notification">
                <?php echo $error; ?>
            </div>
            <?php endif; ?>

            <!-- Статистика -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">
                        <?php echo $stats['total_requests']; ?>
                    </div>
                    <div>Всего заявок</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">
                        <?php echo $stats['new_requests']; ?>
                    </div>
                    <div>Новых</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">
                        <?php echo $stats['completed_requests']; ?>
                    </div>
                    <div>Завершённых</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">
                        <?php echo $stats['total_rules']; ?>
                    </div>
                    <div>Правил бота</div>
                </div>
            </div>

            <!-- Вкладки -->
            <div class="admin-tabs">
                <button class="tab-btn active" data-tab="requests">Заявки</button>
                <button class="tab-btn" data-tab="knowledge">База знаний бота</button>
                <button class="tab-btn" data-tab="logs">Логи действий</button>
                <button class="tab-btn" data-tab="export">Экспорт/Импорт</button>
            </div>

            <!-- Вкладка: Заявки -->
            <div id="tab-requests" class="tab-content active">
                <h2>Заявки техподдержки</h2>
                <div class="admin-table-wrap"><table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Пользователь</th>
                            <th>Сообщение</th>
                            <th>Статус</th>
                            <th>Дата</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($requests as $req): ?>
                        <tr>
                            <td>
                                <?php echo $req['id']; ?>
                            </td>
                            <td>
                                <?php echo htmlspecialchars($req['user_name']); ?>
                            </td>
                            <td>
                                <?php echo htmlspecialchars(substr($req['message'], 0, 50)); ?>...
                            </td>
                            <td>
                                <span class="status-badge-<?php echo $req['status']; ?>">
                                    <?php 
                                        $statuses = ['new' => 'Новая', 'in_progress' => 'В работе', 'completed' => 'Завершена'];
                                        echo $statuses[$req['status']];
                                    ?>
                                </span>
                            </td>
                            <td>
                                <?php echo $req['created_at']; ?>
                            </td>
                            <td>
                                <form method="POST" style="display:inline-block;">
                                    <input type="hidden" name="request_id" value="<?php echo $req['id']; ?>">
                                    <select name="status" onchange="this.form.submit()">
                                        <option value="new" <?php echo $req['status']==='new' ? 'selected' : '' ; ?>
                                            >Новая</option>
                                        <option value="in_progress" <?php echo $req['status']==='in_progress'
                                            ? 'selected' : '' ; ?>>В работе</option>
                                        <option value="completed" <?php echo $req['status']==='completed' ? 'selected'
                                            : '' ; ?>>Завершена</option>
                                    </select>
                                    <input type="hidden" name="action" value="update_status">
                                    <input type="text" name="admin_response" placeholder="Ответ пользователю" class="admin-response-input">
                                    <button type="submit" class="btn-small">Обновить</button>
                                </form>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table></div>
            </div>

            <!-- Вкладка: База знаний -->
            <div id="tab-knowledge" class="tab-content">
                <h2>База знаний бота</h2>
                <form method="POST" class="admin-rule-form">
                    <h3>Добавить новое правило</h3>
                    <div class="form-group"><label>Ключевые слова (через запятую)</label><input type="text"
                            name="keywords" required></div>
                    <div class="form-group"><label>Шаблон вопроса</label><input type="text" name="question_pattern">
                    </div>
                    <div class="form-group"><label>Ответ бота</label><textarea name="answer_text" rows="3"
                            required></textarea></div>
                    <div class="form-group"><label>Приоритет</label><input type="number" name="priority" value="0">
                    </div>
                    <input type="hidden" name="action" value="add_rule">
                    <button type="submit" class="btn-primary">Добавить правило</button>
                </form>

                <h3>Существующие правила</h3>
                <div class="admin-table-wrap"><table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Ключевые слова</th>
                            <th>Ответ</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($rules as $rule): ?>
                        <tr>
                            <td>
                                <?php echo $rule['id']; ?>
                            </td>
                            <td>
                                <?php echo htmlspecialchars($rule['keywords']); ?>
                            </td>
                            <td>
                                <?php echo htmlspecialchars(substr($rule['answer_text'], 0, 60)); ?>...
                            </td>
                            <td>
                                <form method="POST" style="display:inline;">
                                    <input type="hidden" name="rule_id" value="<?php echo $rule['id']; ?>">
                                    <input type="hidden" name="action" value="delete_rule">
                                    <button type="submit" class="btn-small"
                                        onclick="return confirm('Удалить правило?')">Удалить</button>
                                </form>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table></div>
            </div>

            <!-- Вкладка: Логи -->
            <div id="tab-logs" class="tab-content">
                <h2>Логи действий пользователей</h2>
                <div class="admin-table-wrap"><table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Пользователь</th>
                            <th>Действие</th>
                            <th>Детали</th>
                            <th>Дата</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($logs as $log): ?>
                        <tr>
                            <td>
                                <?php echo $log['id']; ?>
                            </td>
                            <td>
                                <?php echo htmlspecialchars($log['user_name'] ?? 'Гость'); ?>
                            </td>
                            <td>
                                <?php echo htmlspecialchars($log['action']); ?>
                            </td>
                            <td>
                                <?php echo htmlspecialchars($log['details'] ?? ''); ?>
                            </td>
                            <td>
                                <?php echo $log['created_at']; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table></div>
            </div>

            <!-- Вкладка: Экспорт/Импорт -->
            <div id="tab-export" class="tab-content">
                <h2>Экспорт и импорт данных</h2>
                <div class="export-import-grid">
                    <div class="export-card">
                        <h3><i class="fas fa-file-csv"></i> Экспорт в CSV</h3>
                        <p>Выгрузить все заявки в CSV-файл</p>
                        <a href="export_csv.php" class="btn-primary">Скачать CSV</a>
                    </div>

                    <div class="export-card">
                        <h3><i class="fas fa-upload"></i> Импорт из CSV</h3>
                        <p>Загрузить CSV-файл с заявками</p>
                        <form action="import_csv.php" method="POST" enctype="multipart/form-data">
                            <input type="file" name="csv_file" accept=".csv" required>
                            <button type="submit" class="btn-primary">Импортировать</button>
                        </form>
                    </div>

                    <div class="export-card">
                        <h3><i class="fas fa-database"></i> Бэкап базы данных</h3>
                        <p>Создать резервную копию БД</p>
                        <a href="backup_db.php" class="btn-primary">Создать бэкап</a>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="main-footer admin-footer">
        <div class="container footer-container">
            <div class="footer-col"><a class="footer-brand" href="/indexbase.html">Distro<span>.space</span></a><p>Рабочее пространство поддержки проекта.</p></div>
            <div class="footer-col"><h4>НАВИГАЦИЯ</h4><a href="/indexbase.html">Главная</a><a href="/TechSupport/">Техподдержка</a><a href="dashboard.php">Дашборд</a></div>
            <div class="footer-col"><h4>УПРАВЛЕНИЕ</h4><a href="admin.php">Панель администратора</a><a href="/grafana/" target="_blank" rel="noopener noreferrer">Мониторинг Grafana</a></div>
        </div>
        <div class="footer-bottom"><p class="footer-copyright">DISTRO.SPACE / ADMIN CONSOLE</p></div>
    </footer>

    <script>
        (() => {
            const button = document.getElementById('themeToggle');
            const favicon = document.getElementById('siteFavicon');
            const applyTheme = theme => {
                const dark = theme === 'dark';
                document.body.classList.toggle('dark-theme', dark);
                button.setAttribute('aria-pressed', String(dark));
                button.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
                button.innerHTML = `<i class="fas fa-${dark ? 'sun' : 'moon'}" aria-hidden="true"></i><span>${dark ? 'СВЕТЛАЯ' : 'ТЁМНАЯ'}</span>`;
                favicon.href = dark ? favicon.dataset.darkHref : favicon.dataset.lightHref;
            };
            const saved = localStorage.getItem('theme');
            applyTheme(saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
            button.addEventListener('click', () => {
                const next = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
                localStorage.setItem('theme', next);
                applyTheme(next);
            });
            window.addEventListener('storage', event => {
                if (event.key === 'theme') applyTheme(event.newValue || 'light');
            });
        })();

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
            });
        });
    </script>
</body>

</html>