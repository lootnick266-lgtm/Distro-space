<?php
//   1. Импорт заявок из CSV

require_once 'config.php';

$user = new User();
if (!$user->isLoggedIn() || !$user->isAdmin()) {
    die('Доступ запрещён');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['csv_file'])) {
    $file = $_FILES['csv_file']['tmp_name'];
    
    if (($handle = fopen($file, 'r')) !== false) {
        // Пропускаем BOM если есть
        $bom = fgets($handle, 3);
        if ($bom !== chr(0xEF).chr(0xBB).chr(0xBF)) {
            rewind($handle);
        }
        
        $headers = fgetcsv($handle, 1000, ',');
        $support = new SupportRequest();
        $imported = 0;
        
        while (($data = fgetcsv($handle, 1000, ',')) !== false) {
            $row = array_combine($headers, $data);
            if ($row && isset($row['Пользователь']) && isset($row['Сообщение'])) {
                // Находим пользователя по имени
                $db = Database::getInstance();
                $sql = "SELECT id FROM users WHERE name = ?";
                $stmt = $db->prepare($sql);
                $stmt->bind_param('s', $row['Пользователь']);
                $stmt->execute();
                $result = $stmt->get_result();
                $userRow = $result->fetch_assoc();
                
                if ($userRow) {
                    $support->createRequest($userRow['id'], $row['Сообщение']);
                    $imported++;
                }
            }
        }
        fclose($handle);
        
        echo "<h2>Импорт завершён</h2>";
        echo "<p>Импортировано заявок: $imported</p>";
        echo "<a href='admin.php'>Вернуться в админ-панель</a>";
        exit;
    }
}

echo "Ошибка загрузки файла";
?>