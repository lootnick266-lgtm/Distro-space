<?php
//   1. Класс чат-бота с базой знаний
require_once 'BaseModel.php';

class ChatBot extends BaseModel {
    protected $table = 'chat_messages';
    
    public function processMessage($user_id, $user_message) {
        $user = (new User())->getById($user_id);
        $user_name = $user ? $user['name'] : 'Пользователь';
        
        // Защита от XSS
        $user_message = htmlspecialchars($user_message, ENT_QUOTES, 'UTF-8');
        
        // Поиск ответа в базе знаний
        $bot_response = $this->findAnswer($user_message);
        
        // Сохранение диалога
        $this->create([
            'user_id' => $user_id,
            'message' => $user_message,
            'bot_response' => $bot_response
        ]);
        
        // Логирование
        $logger = new Logger();
        $logger->log($user_id, 'chat_message', "Сообщение: $user_message");
        
        return [
            'success' => true,
            'bot_response' => $bot_response,
            'user_name' => $user_name
        ];
    }
    
    private function findAnswer($user_message) {
        $message_lower = mb_strtolower($user_message);
        
        // Получаем все правила из базы знаний
        $kb = new KnowledgeBase();
        $rules = $kb->getAll();
        
        foreach ($rules as $rule) {
            $keywords = explode(',', $rule['keywords']);
            foreach ($keywords as $keyword) {
                $keyword = trim($keyword);
                if (strpos($message_lower, $keyword) !== false) {
                    return $rule['answer_text'];
                }
            }
        }
        
        // Если ответ не найден - формируем список возможных тем
        $topics = [];
        foreach ($rules as $rule) {
            $topics[] = $rule['keywords'];
        }
        $topics_list = implode(', ', array_slice($topics, 0, 5));
        
        return "Извините, я не смог распознать ваш запрос. Вот что я умею: " . $topics_list . ". Пожалуйста, переформулируйте вопрос.";
    }
    
    public function getUserDialogs($user_id) {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = ? ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
    // Статистика диалогов по дням (для дашборда)
    public function getDialogsByDay($days = 7) {
        $sql = "SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM {$this->table} 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $days);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}

//   2. Класс для управления базой знаний
class KnowledgeBase extends BaseModel {
    protected $table = 'bot_knowledge_base';
    
    public function addRule($keywords, $question_pattern, $answer_text, $priority = 0) {
        return $this->create([
            'keywords' => $keywords,
            'question_pattern' => $question_pattern,
            'answer_text' => $answer_text,
            'priority' => $priority
        ]);
    }
    
    public function updateRule($id, $keywords, $question_pattern, $answer_text, $priority = 0) {
        return $this->update($id, [
            'keywords' => $keywords,
            'question_pattern' => $question_pattern,
            'answer_text' => $answer_text,
            'priority' => $priority
        ]);
    }
}
?>