<?php
declare(strict_types=1);

session_start();
header('Cache-Control: no-store');

if (!isset($_SESSION['user_id']) || ($_SESSION['user_role'] ?? null) !== 'admin') {
    http_response_code(isset($_SESSION['user_id']) ? 403 : 401);
    exit;
}

http_response_code(204);
exit;
