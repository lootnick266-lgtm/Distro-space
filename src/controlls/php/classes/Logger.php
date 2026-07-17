<?php
//   1. Класс для логирования действий пользователей

require_once 'BaseModel.php';

class Logger extends BaseModel {
    protected $table = 'logs';
    
    public function log($user_id, $action, $details = null) {
        return $this->create([
            'user_id' => $user_id,
            'action' => $action,
            'details' => $details
        ]);
    }
    
    public function getUserActivity($user_id) {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = ? ORDER BY created_at DESC LIMIT 50";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
    public function getAllLogs() {
        $sql = "SELECT l.*, u.name as user_name 
                FROM {$this->table} l 
                LEFT JOIN users u ON l.user_id = u.id 
                ORDER BY l.created_at DESC 
                LIMIT 100";
        $result = $this->db->getConnection()->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}
?>