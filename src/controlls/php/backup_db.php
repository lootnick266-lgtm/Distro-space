<?php
//   1. Скрипт автоматического бэкапа БД

require_once __DIR__ . '/config.php';

$user = new User();
if (!$user->isLoggedIn() || !$user->isAdmin()) {
    die('Доступ запрещён');
}

$backup_dir = SITE_PATH . 'backups/';
if (!is_dir($backup_dir)) {
    mkdir($backup_dir, 0755, true);
}

$filename = 'backup_' . DB_NAME . '_' . date('Y-m-d_H-i-s') . '.sql';
$filepath = $backup_dir . $filename;

$command = "mysqldump --user=" . DB_USER . " --password=" . DB_PASS . " --host=" . DB_HOST . " " . DB_NAME . " > " . $filepath;
exec($command, $output, $result_code);

if ($result_code === 0 && file_exists($filepath)) {
    // Удаляем старые бэкапы (старше 7 дней)
    $files = glob($backup_dir . '*.sql');
    foreach ($files as $file) {
        if (filemtime($file) < time() - 7 * 86400) {
            unlink($file);
        }
    }
    
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    readfile($filepath);
    exit;
} else {
    die('Ошибка создания бэкапа. Убедитесь, что mysqldump доступен в PATH.');
}
?>