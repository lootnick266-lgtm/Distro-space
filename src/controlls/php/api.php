<?php
// Часть 1. REST API для работы с заявками и чатом

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/classes/ChatBot.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['route']) ? $_GET['route'] : '';

// Часть 2. Открытые эндпоинты
if ($path === 'health') {
    echo json_encode(['status' => 'ok', 'timestamp' => date('Y-m-d H:i:s')]);
    exit;
}

if ($path === 'knowledge_base') {
    try {
        $kb = new KnowledgeBase();
        $rules = $kb->getAll();
        echo json_encode($rules);
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Часть 3. Проверка сессии
if ($path === 'session') {
    echo json_encode([
        'logged_in' => isset($_SESSION['user_id']),
        'user_name' => $_SESSION['user_name'] ?? null,
        'user_role' => $_SESSION['user_role'] ?? null
    ]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Не авторизован']);
    exit;
}

$user = new User();

// Часть 4. Обработка чата
if ($path === 'chat' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['message'])) {
        echo json_encode(['success' => false, 'error' => 'Нет сообщения']);
        exit;
    }
    
    $bot = new ChatBot();
    $result = $bot->processMessage($_SESSION['user_id'], $input['message']);
    echo json_encode($result);
    exit;
}

// Часть 5. CRUD для заявок
$requestModel = new SupportRequest();

switch ($method) {
    case 'GET':
        if ($path === 'requests' && !isset($_GET['id'])) {
            if (!$user->isAdmin()) {
                http_response_code(403);
                echo json_encode(['error' => 'Доступ запрещен']);
                break;
            }
            $requests = $requestModel->getAllWithUsers();
            echo json_encode($requests);
        } 
        elseif ($path === 'requests' && isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $req = $requestModel->getById($id);
            if (!$user->isAdmin() && $req['user_id'] != $_SESSION['user_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Доступ запрещен']);
                break;
            }
            echo json_encode($req);
        }
        break;
        
    case 'POST':
        if ($path === 'requests') {
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $requestModel->createRequest($_SESSION['user_id'], $input['message'] ?? '');
            echo json_encode($result);
        }
        break;
        
    case 'PUT':
        if (preg_match('/requests\/(\d+)/', $path, $matches)) {
            if (!$user->isAdmin()) {
                http_response_code(403);
                echo json_encode(['error' => 'Доступ запрещен']);
                break;
            }
            $id = (int)$matches[1];
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $requestModel->updateStatus($id, $input['status'] ?? 'new', $input['admin_response'] ?? null);
            echo json_encode(['success' => $result]);
        }
        break;
        
    case 'DELETE':
        if (preg_match('/requests\/(\d+)/', $path, $matches)) {
            if (!$user->isAdmin()) {
                http_response_code(403);
                echo json_encode(['error' => 'Доступ запрещен']);
                break;
            }
            $id = (int)$matches[1];
            $result = $requestModel->delete($id);
            echo json_encode(['success' => $result]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Метод не разрешен']);
}
?>