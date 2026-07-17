<?php
// index.php - простой роутер
require_once __DIR__ . '/config.php';
// Получаем URL
$uri = $_SERVER['REQUEST_URI'];
$uri = strtok($uri, '?'); // отрезаем GET-параметры

// Если зашли на главную (/ или /index.html) - показываем indexbase
if ($uri == '/' || $uri == '/index.html') {
    readfile(__DIR__ . '/prototype/indexbase.html');
    exit;
}

// Если зашли на техподдержку
if ($uri == '/support' || $uri == '/support.html') {
    readfile(__DIR__ . '/index.html');
    exit;
}

// Если запрос к существующему файлу (CSS, JS, картинки) - отдаём его
$file = __DIR__ . $uri;
if (file_exists($file) && !is_dir($file)) {
    // Просто отдаём файл
    return false;
}

// Если ничего не подошло - 404
http_response_code(404);
echo "404 Страница не найдена";
