<?php
//   1.  (регистрация, вход, проверка прав)

require_once 'BaseModel.php';

class User extends BaseModel {
    protected $table = 'users';
    
    public function register($email, $password, $name) {
        // Валидация
        if (empty($email) || empty($password) || empty($name)) {
            return ['success' => false, 'message' => 'Все поля обязательны'];
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Неверный формат email'];
        }
        
        if (strlen($password) < 4) {
            return ['success' => false, 'message' => 'Пароль должен быть не менее 4 символов'];
        }
        
        // Проверка существования email
        $checkSql = "SELECT id FROM users WHERE email = ?";
        $stmt = $this->db->prepare($checkSql);
        $stmt->bind_param('s', $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            return ['success' => false, 'message' => 'Email уже зарегистрирован'];
        }
        
        // Хеширование пароля
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        // Создание пользователя
        $result = $this->create([
            'email' => $email,
            'password_hash' => $password_hash,
            'name' => $name,
            'role' => 'user'
        ]);
        
        if ($result) {
            return ['success' => true, 'message' => 'Регистрация успешна'];
        }
        
        return ['success' => false, 'message' => 'Ошибка регистрации'];
    }
    
    public function login($email, $password) {
        $sql = "SELECT * FROM users WHERE email = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
            
            // Логирование входа
            $logger = new Logger();
            $logger->log($user['id'], 'login', 'Пользователь вошел в систему');
            
            return ['success' => true, 'user' => $user];
        }
        
        return ['success' => false, 'message' => 'Неверный email или пароль'];
    }
    
    public function logout() {
        session_destroy();
        return ['success' => true];
    }
    
    public function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }
    
    public function isAdmin() {
        return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
    }
    
    public function getCurrentUser() {
        if (!$this->isLoggedIn()) {
            return null;
        }
        return $this->getById($_SESSION['user_id']);
    }
    public function getByEmail($email) {
    $sql = "SELECT * FROM {$this->table} WHERE email = ?";
    $stmt = $this->db->prepare($sql);
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}
}
?>