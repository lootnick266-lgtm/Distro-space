<?php
//   1. Базовый класс для всех моделей (наследование)

abstract class BaseModel {
    protected $db;
    protected $table;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    //   2. Базовые CRUD методы
    public function create($data) {
        $fields = array_keys($data);
        $placeholders = '?' . str_repeat(',?', count($fields) - 1);
        
        $sql = "INSERT INTO {$this->table} (" . implode(',', $fields) . ") VALUES ($placeholders)";
        $stmt = $this->db->prepare($sql);
        
        $types = str_repeat('s', count($data));
        $values = array_values($data);
        
        $stmt->bind_param($types, ...$values);
        return $stmt->execute();
    }
    
    public function getAll() {
        $sql = "SELECT * FROM {$this->table} ORDER BY id DESC";
        $result = $this->db->getConnection()->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
    public function getById($id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }
    
    public function update($id, $data) {
        $set = [];
        foreach (array_keys($data) as $field) {
            $set[] = "$field = ?";
        }
        
        $sql = "UPDATE {$this->table} SET " . implode(',', $set) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        
        $types = str_repeat('s', count($data)) . 'i';
        $values = array_merge(array_values($data), [$id]);
        
        $stmt->bind_param($types, ...$values);
        return $stmt->execute();
    }
    
    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }
}
?>