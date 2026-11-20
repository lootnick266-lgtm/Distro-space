<?php
// Runtime-only configuration. No credentials are embedded in the image.
foreach (['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'] as $name) {
    $value = getenv($name);
    if ($value === false || $value === '') {
        http_response_code(503);
        exit('Service configuration unavailable');
    }
    define($name, $value);
}
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
spl_autoload_register(static function ($name) {
    if (preg_match('/^[A-Za-z][A-Za-z0-9_]*$/D', $name)) {
        $path = __DIR__ . '/classes/' . $name . '.php';
        if (is_file($path)) require_once $path;
    }
});
