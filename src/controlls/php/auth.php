<?php
//   1. Обработка авторизации и регистрации (отдельный файл)

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/classes/User.php';

header('Content-Type: application/json');

$user = new User();
$action = isset($_GET['action']) ? $_GET['action'] : '';

$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'register':
        $result = $user->register(
            $input['email'] ?? '',
            $input['password'] ?? '',
            $input['name'] ?? ''
        );
        echo json_encode($result);
        break;
        
    case 'login':
        $result = $user->login(
            $input['email'] ?? '',
            $input['password'] ?? ''
        );
        echo json_encode($result);
        break;
        
    case 'logout':
        $result = $user->logout();
        echo json_encode($result);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Неверное действие']);
}
?>