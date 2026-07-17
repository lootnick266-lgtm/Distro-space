<?php
//   1. Конфигурация подключения к БД и глобальные настройки

define('DB_HOST', 'mysql_db');
define('DB_USER', 'root');
define('DB_PASS', '123456');
define('DB_NAME', 'chatbot_support');

define('SITE_URL', 'http://chatbot-techsupport/');
define('SITE_PATH', dirname(__FILE__) . '/');

// Настройки почты для OpenServer (sendmail)
ini_set('SMTP', 'smtp.mail.ru');  // замените на ваш SMTP если нужно
ini_set('smtp_port', 25);
ini_set('sendmail_from', 'noreply@smartsupport.com');

// Включение отображения ошибок (для отладки)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Автозагрузка классов
spl_autoload_register(function ($class_name) {
    $file = SITE_PATH . 'classes/' . $class_name . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

session_start();
?>