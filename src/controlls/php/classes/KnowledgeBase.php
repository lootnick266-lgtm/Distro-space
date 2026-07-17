<?php
require_once 'BaseModel.php';

class KnowledgeBase extends BaseModel {
    protected $table = 'bot_knowledge_base';
    
    public function getAll() {
        $sql = "SELECT * FROM {$this->table} ORDER BY priority DESC";
        $result = $this->db->getConnection()->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
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
    
    public function delete($id) {
        return $this->deleteById($id);
    }
}
?>