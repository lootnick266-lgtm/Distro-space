<?php
//   1. Класс для работы с заявками техподдержки

require_once 'BaseModel.php';

class SupportRequest extends BaseModel {
    protected $table = 'support_requests';
    
    public function createRequest($user_id, $message) {
        if (empty($message)) {
            return ['success' => false, 'message' => 'Сообщение не может быть пустым'];
        }
        
        // Защита от XSS
        $message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
        
        $result = $this->create([
            'user_id' => $user_id,
            'message' => $message,
            'status' => 'new'
        ]);
        
        if ($result) {
            // Логирование
            $logger = new Logger();
            $logger->log($user_id, 'create_support_request', "Создана заявка: $message");
            
            return ['success' => true, 'message' => 'Заявка отправлена'];
        }
        
        return ['success' => false, 'message' => 'Ошибка создания заявки'];
    }
    
    public function getUserRequests($user_id) {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = ? ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
    public function updateStatus($id, $status, $admin_response = null) {
        $data = ['status' => $status];
        if ($admin_response !== null) {
            $data['admin_response'] = htmlspecialchars($admin_response, ENT_QUOTES, 'UTF-8');
        }
        
        $result = $this->update($id, $data);
        
        if ($result && $admin_response) {
            // Отправка email пользователю
            $this->sendEmailNotification($id, $status, $admin_response);
        }
        
        return $result;
    }
    
    private function sendEmailNotification($request_id, $status, $response) {
        $request = $this->getById($request_id);
        if (!$request) return;
        
        $user = (new User())->getById($request['user_id']);
        if (!$user) return;
        
        $to = $user['email'];
        $subject = 'Обновление статуса заявки поддержки';
        $message = "Здравствуйте, {$user['name']}!\n\n";
        $message .= "Ваша заявка #$request_id получила статус: $status\n";
        $message .= "Ответ администратора: $response\n\n";
        $message .= "Спасибо за обращение.\n";
        
        mail($to, $subject, $message, 'From: noreply@smartsupport.com');
    }
    
    // JOIN запрос: заявки + имена пользователей
    public function getAllWithUsers() {
        $sql = "SELECT sr.*, u.name as user_name, u.email as user_email 
                FROM {$this->table} sr 
                JOIN users u ON sr.user_id = u.id 
                ORDER BY sr.created_at DESC";
        $result = $this->db->getConnection()->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
    // Поиск заявок по ключевому слову
    public function search($keyword) {
        $keyword = '%' . $this->db->escapeString($keyword) . '%';
        $sql = "SELECT sr.*, u.name as user_name 
                FROM {$this->table} sr 
                JOIN users u ON sr.user_id = u.id 
                WHERE sr.message LIKE ? OR u.name LIKE ?
                ORDER BY sr.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ss', $keyword, $keyword);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}
?>