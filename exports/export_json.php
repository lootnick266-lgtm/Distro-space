<?php
//   1. Экспорт одной заявки в JSON

require_once 'config.php';

$user = new User();
if (!$user->isLoggedIn()) {
    die('Доступ запрещён');
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$id) {
    die('ID не указан');
}

$support = new SupportRequest();
$request = $support->getById($id);

if (!$request) {
    die('Заявка не найдена');
}

// Проверка прав (админ или владелец)
if (!$user->isAdmin() && $request['user_id'] != $_SESSION['user_id']) {
    die('Доступ запрещён');
}

header('Content-Type: application/json');
header('Content-Disposition: attachment; filename="request_' . $id . '_' . date('Y-m-d') . '.json"');

echo json_encode($request, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>