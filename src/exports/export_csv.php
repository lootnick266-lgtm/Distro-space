<?php
//   1. Экспорт всех заявок в CSV

require_once 'config.php';

$user = new User();
if (!$user->isLoggedIn() || !$user->isAdmin()) {
    die('Доступ запрещён');
}

$support = new SupportRequest();
$requests = $support->getAllWithUsers();

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="support_requests_' . date('Y-m-d') . '.csv"');

$output = fopen('php://output', 'w');
fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM для UTF-8
fputcsv($output, ['ID', 'Пользователь', 'Email', 'Сообщение', 'Статус', 'Ответ админа', 'Дата создания']);

foreach ($requests as $req) {
    fputcsv($output, [
        $req['id'],
        $req['user_name'],
        $req['user_email'],
        $req['message'],
        $req['status'],
        $req['admin_response'] ?? '',
        $req['created_at']
    ]);
}

fclose($output);
?>