<?php
//   1. Экспорт отчёта в HTML (для печати или сохранения в PDF)

require_once 'config.php';

$user = new User();
if (!$user->isLoggedIn()) {
    die('Доступ запрещён. Авторизуйтесь для просмотра отчёта.');
}

// Получение данных для отчёта
$support = new SupportRequest();
$bot = new ChatBot();
$logger = new Logger();

// Статистика по заявкам
$allRequests = $support->getAllWithUsers();
$totalRequests = count($allRequests);
$newRequests = 0;
$inProgressRequests = 0;
$completedRequests = 0;

foreach ($allRequests as $req) {
    if ($req['status'] === 'new') $newRequests++;
    if ($req['status'] === 'in_progress') $inProgressRequests++;
    if ($req['status'] === 'completed') $completedRequests++;
}

// Диалоги по дням (последние 7 дней)
$dialogsByDay = $bot->getDialogsByDay(7);

// Самые активные пользователи (по заявкам)
$userActivity = [];
foreach ($allRequests as $req) {
    $name = $req['user_name'];
    if (!isset($userActivity[$name])) {
        $userActivity[$name] = 0;
    }
    $userActivity[$name]++;
}
arsort($userActivity);
$topUsers = array_slice($userActivity, 0, 5, true);

// Последние 10 логов
$recentLogs = $logger->getAllLogs();
$recentLogs = array_slice($recentLogs, 0, 10);

// База знаний бота
$kb = new KnowledgeBase();
$rules = $kb->getAll();
?>