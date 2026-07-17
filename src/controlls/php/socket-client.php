<?php
//   1. Сокет-клиент для отправки команды серверу
// Команда: php socket-client.php

error_reporting(E_ALL);

$host = '127.0.0.1';
$port = 9999;

// Создание сокета
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
if (!$socket) {
    die("Ошибка создания сокета: " . socket_strerror(socket_last_error()) . "\n");
}

// Подключение
$result = socket_connect($socket, $host, $port);
if (!$result) {
    die("Ошибка подключения: " . socket_strerror(socket_last_error($socket)) . "\n");
}

// Отправка команды
$command = "get_users";
socket_write($socket, $command, strlen($command));
echo "Отправлена команда: $command\n";

// Чтение ответа
$response = socket_read($socket, 4096);
echo "Ответ от сервера:\n";
print_r(json_decode($response, true));

socket_close($socket);
?>