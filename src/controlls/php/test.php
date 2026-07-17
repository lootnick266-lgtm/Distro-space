<?php
//   1. Тестирование CRUD операций

require_once 'config.php';

echo "<h1>Тестирование системы чат-бота техподдержки</h1>";
echo "<pre>";

// Тест 1: Подключение к БД
echo "\n=== Тест 1: Подключение к БД ===\n";
try {
    $db = Database::getInstance();
    echo "OK: Подключение успешно\n";
} catch (Exception $e) {
    echo "FAIL: " . $e->getMessage() . "\n";
}

// Тест 2: Регистрация пользователя
echo "\n=== Тест 2: Регистрация пользователя ===\n";
$user = new User();
$result = $user->register('test@test.com', '123456', 'Тестовый Пользователь');
if ($result['success']) {
    echo "OK: Регистрация успешна\n";
} else {
    echo "INFO: " . $result['message'] . " (возможно уже существует)\n";
}

// Тест 3: Создание заявки
echo "\n=== Тест 3: Создание заявки ===\n";
$testUser = $user->getByEmail('test@test.com');
if ($testUser) {
    $support = new SupportRequest();
    $result = $support->createRequest($testUser['id'], 'Тестовое сообщение для проверки');
    if ($result['success']) {
        echo "OK: Заявка создана\n";
        $lastId = $db->getConnection()->insert_id;
    } else {
        echo "FAIL: " . $result['message'] . "\n";
    }
} else {
    echo "SKIP: Пользователь не найден\n";
}

// Тест 4: Получение всех заявок
echo "\n=== Тест 4: Получение всех заявок ===\n";
$requests = $support->getAll();
echo "OK: Найдено " . count($requests) . " заявок\n";

// Тест 5: Поиск заявок
echo "\n=== Тест 5: Поиск заявок ===\n";
$searchResult = $support->search('тестовое');
echo "OK: Найдено " . count($searchResult) . " заявок по запросу 'тестовое'\n";

// Тест 6: Обновление статуса
echo "\n=== Тест 6: Обновление статуса ===\n";
if (isset($lastId) && $lastId) {
    $result = $support->updateStatus($lastId, 'completed', 'Тестовый ответ');
    echo $result ? "OK: Статус обновлён\n" : "FAIL: Ошибка обновления\n";
}

// Тест 7: Удаление заявки
echo "\n=== Тест 7: Удаление заявки ===\n";
if (isset($lastId) && $lastId) {
    $result = $support->delete($lastId);
    echo $result ? "OK: Заявка удалена\n" : "FAIL: Ошибка удаления\n";
}

// Тест 8: Работа бота с базой знаний
echo "\n=== Тест 8: Работа бота ===\n";
$bot = new ChatBot();
$response = $bot->processMessage(1, 'как подключить api');
echo "Вопрос: 'как подключить api'\n";
echo "Ответ бота: " . substr($response['bot_response'], 0, 100) . "...\n";

echo "\n=== Тестирование завершено ===\n";
echo "</pre>";
?>