<?php
require_once __DIR__ . '/config.php';

$user = new User();
if (!$user->isLoggedIn() || !$user->isAdmin()) {
    http_response_code(403);
    exit('Доступ запрещён');
}
session_write_close();
ini_set('display_errors', '0');


$filepath = null;
$file = null;
$db = null;
$transaction = false;
try {
    $filepath = tempnam(sys_get_temp_dir(), 'support-backup-');
    if ($filepath === false) throw new RuntimeException('Cannot create temporary backup');
    if (!chmod($filepath, 0600)) throw new RuntimeException('Cannot protect backup');
    register_shutdown_function(static function () use ($filepath) {
        if (is_file($filepath)) unlink($filepath);
    });
    $file = fopen($filepath, 'wb');
    if ($file === false) throw new RuntimeException('Cannot open backup');
    $write = static function ($text) use ($file) {
        $length = strlen($text);
        for ($offset = 0; $offset < $length;) {
            $written = fwrite($file, substr($text, $offset));
            if ($written === false || $written === 0) throw new RuntimeException('Cannot write backup');
            $offset += $written;
        }
    };
    $quoteName = static function ($name) { return '`' . str_replace('`', '``', $name) . '`'; };
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $db->set_charset('utf8mb4');
    $db->query("SET SESSION time_zone = '+00:00'");
    $db->query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    $db->query('SET TRANSACTION READ ONLY');
    $db->query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
    $transaction = true;
    $tables = [];
    $result = $db->query('SHOW FULL TABLES');
    while ($row = $result->fetch_row()) {
        if ($row[1] !== 'BASE TABLE') throw new RuntimeException('Views require a full database backup');
        $tables[] = $row[0];
    }
    $write("-- SmartSupport SQL backup (tables and data)\n-- " . gmdate('c') . "\n");
    $write("SET NAMES utf8mb4;\nSET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;\nSET FOREIGN_KEY_CHECKS=0;\nSET @OLD_SQL_MODE=@@SQL_MODE;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\nSET @OLD_TIME_ZONE=@@TIME_ZONE;\nSET TIME_ZONE='+00:00';\n\n");
    foreach ($tables as $table) {
        $name = $quoteName($table);
        $create = $db->query('SHOW CREATE TABLE ' . $name)->fetch_row()[1];
        $write('DROP TABLE IF EXISTS ' . $name . ";\n" . $create . ";\n");
        $columns = [];
        $result = $db->query('SHOW COLUMNS FROM ' . $name);
        while ($column = $result->fetch_assoc()) {
            if (!preg_match('/(?:VIRTUAL|STORED) GENERATED/i', $column['Extra'])) $columns[] = $column['Field'];
        }
        if (!$columns) throw new RuntimeException('No exportable columns');
        $fields = implode(',', array_map($quoteName, $columns));
        $result = $db->query('SELECT ' . $fields . ' FROM ' . $name, MYSQLI_USE_RESULT);
        while ($row = $result->fetch_row()) {
            // Hex literals preserve text bytes and avoid SQL escaping ambiguities.
            $values = array_map(static function ($value) {
                return $value === null ? 'NULL' : "X'" . bin2hex($value) . "'";
            }, $row);
            $write('INSERT INTO ' . $name . ' (' . $fields . ') VALUES (' . implode(',', $values) . ");\n");
        }
        $result->free();
        $write("\n");
    }
    $db->commit();
    $transaction = false;
    $write("SET TIME_ZONE=@OLD_TIME_ZONE;\nSET SQL_MODE=@OLD_SQL_MODE;\nSET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;\n-- Backup completed\n");
    if (!fflush($file)) throw new RuntimeException('Cannot flush backup');
    fclose($file);
    $file = null;
    $size = filesize($filepath);
    if ($size === false || $size === 0) throw new RuntimeException('Empty backup');
    header('Content-Type: application/sql; charset=utf-8');
    header('Content-Disposition: attachment; filename="backup_' . date('Y-m-d_H-i-s') . '.sql"');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . $size);
    readfile($filepath);
} catch (Throwable $e) {
    if ($transaction && $db) { try { $db->rollback(); } catch (Throwable $ignored) {} }
    error_log('Database backup failed: ' . $e->getMessage());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Не удалось создать резервную копию. Подробности записаны в журнал PHP.';
    }
} finally {
    if (is_resource($file)) fclose($file);
    if ($filepath && is_file($filepath)) unlink($filepath);
}
