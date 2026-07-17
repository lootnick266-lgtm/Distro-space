<?php
//   1. Сокет-сервер для получения списка пользователей (запуск из командной строки)
// Команда: php socket-server.php

error_reporting(E_ALL);
set_time_limit(0);
ob_implicit_flush();

$host = '127.0.0.1';
$port = 9999;

// Создание сокета
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
if (!$socket) {
    die("Ошибка создания сокета: " . socket_strerror(socket_last_error()) . "\n");
}

// Привязка сокета
if (!socket_bind($socket, $host, $port)) {
    die("Ошибка привязки сокета: " . socket_strerror(socket_last_error($socket)) . "\n");
}

// Прослушивание
if (!socket_listen($socket, 5)) {
    die("Ошибка прослушивания: " . socket_strerror(socket_last_error($socket)) . "\n");
}

echo "Сокет-сервер запущен на $host:$port\n";

// Подключаем конфиг для работы с БД
require_once 'config.php';

while (true) {
    $client = socket_accept($socket);
    if (!$client) {
        echo "Ошибка принятия соединения: " . socket_strerror(socket_last_error($socket)) . "\n";
        continue;
    }
    
    $input = socket_read($client, 1024);
    $input = trim($input);
    echo "Получена команда: $input\n";
    
    if ($input === 'get_users') {
        // Получение списка пользователей из БД
        $user = new User();
        $users = $user->getAll();
        
        $response = json_encode([
            'status' => 'success',
            'command' => 'get_users',
            'data' => $users
        ]);
    } else {
        $response = json_encode([
            'status' => 'error',
            'message' => 'Неизвестная команда. Доступно: get_users'
        ]);
    }
    
    socket_write($client, $response, strlen($response));
    socket_close($client);
}

socket_close($socket);
?>