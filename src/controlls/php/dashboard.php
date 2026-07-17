<?php
//   1. Дашборд со статистикой и графиками
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/classes/Database.php';

$user = new User();
if (!$user->isLoggedIn()) {
    header('Location: /');
    exit;
}

$isAdmin = $user->isAdmin();

// Получение статистики
$support = new SupportRequest();
$bot = new ChatBot();

// Статистика по заявкам
$allRequests = $support->getAllWithUsers();
$totalRequests = count($allRequests);

$newRequests = 0;
$inProgressRequests = 0;
$completedRequests = 0;

foreach ($allRequests as $r) {
    if ($r['status'] === 'new') {
        $newRequests++;
    } elseif ($r['status'] === 'in_progress') {
        $inProgressRequests++;
    } elseif ($r['status'] === 'completed') {
        $completedRequests++;
    }
}

// Диалоги по дням (последние 7 дней)
$dialogsByDay = $bot->getDialogsByDay(7);
$dialogDates = [];
$dialogCounts = [];

if ($dialogsByDay) {
    foreach ($dialogsByDay as $day) {
        $dialogDates[] = $day['date'];
        $dialogCounts[] = $day['count'];
    }
}

// Самые активные пользователи (по заявкам)
$userActivity = [];
foreach ($allRequests as $req) {
    $name = $req['user_name'];
    if (!isset($userActivity[$name])) {
        $userActivity[$name] = 0;
    }
    $userActivity[$name]++;
}

// Сортировка по убыванию
arsort($userActivity);
$topUsers = [];
$topUsersNames = [];
$topUsersCounts = [];
$i = 0;
foreach ($userActivity as $name => $count) {
    if ($i >= 5) break;
    $topUsers[$name] = $count;
    $topUsersNames[] = $name;
    $topUsersCounts[] = $count;
    $i++;
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Дашборд — SmartSupport</title>
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
    <header class="main-header">
        <div class="container header-container">
            <div class="logo"><i class="fas fa-robot"></i><span>Smart<span class="highlight">Support</span></span></div>
            <nav class="main-nav">
                <ul>
                    <li><a href="/">Главная</a></li>
                    <li><a href="/#chatLink">Чат с ботом</a></li>
                    <li><a href="/#faqLink">FAQ</a></li>
                    <?php if ($isAdmin): ?><li><a href="admin.php">Админ-панель</a></li><?php endif; ?>
                    <li><a href="dashboard.php" style="color:#2c7da0; font-weight:bold;">Дашборд</a></li>
                </ul>
            </nav>
            <div class="auth-buttons">
                <span class="user-greeting"><?php echo htmlspecialchars($_SESSION['user_name']); ?></span>
                <button onclick="window.location.href='auth.php?action=logout'" class="btn-outline">Выйти</button>
            </div>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <h1><i class="fas fa-chart-line"></i> Дашборд аналитики</h1>
            
            <div class="stats-dashboard">
                <div class="stat-card-dash"><div class="stat-number-dash"><?php echo $totalRequests; ?></div><div>Всего заявок</div></div>
                <div class="stat-card-dash"><div class="stat-number-dash"><?php echo $newRequests; ?></div><div>Новых заявок</div></div>
                <div class="stat-card-dash"><div class="stat-number-dash"><?php echo $completedRequests; ?></div><div>Завершённых</div></div>
                <div class="stat-card-dash"><div class="stat-number-dash"><?php echo count($topUsers); ?></div><div>Активных пользователей</div></div>
            </div>
            
            <div class="charts-grid">
                <div class="chart-container">
                    <h3>Диалоги с ботом по дням</h3>
                    <canvas id="dialogsChart" style="max-height: 300px;"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Самые активные пользователи (по заявкам)</h3>
                    <canvas id="usersChart" style="max-height: 300px;"></canvas>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.location.href='export_report.php'" class="btn-primary">
                    <i class="fas fa-file-pdf"></i> Скачать отчёт в PDF
                </button>
            </div>
        </div>
    </main>
    
    <footer class="main-footer">
        <div class="container footer-container">
            <div class="footer-col"><h4>SmartSupport</h4><p>Дашборд аналитики</p></div>
        </div>
    </footer>
    
   <script>
    // График диалогов по дням
    var ctx1 = document.getElementById('dialogsChart').getContext('2d');
    new Chart(ctx1, {
        type: 'line',
        data: {
            labels: <?php echo json_encode($dialogDates); ?>,
            datasets: [{
                label: 'Количество диалогов',
                data: <?php echo json_encode($dialogCounts); ?>,
                borderColor: '#2c7da0',
                backgroundColor: 'rgba(44,125,160,0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                }
            }
        }
    });
    
    // График активности пользователей
    var ctx2 = document.getElementById('usersChart').getContext('2d');
    new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: <?php echo json_encode($topUsersNames); ?>,
            datasets: [{
                label: 'Количество заявок',
                data: <?php echo json_encode($topUsersCounts); ?>,
                backgroundColor: '#2c7da0',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                }
            }
        }
    });
</script>
</body>
</html>