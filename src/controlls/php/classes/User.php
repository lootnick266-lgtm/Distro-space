<?php
//   1.  (регистрация, вход, проверка прав)

require_once 'BaseModel.php';

class User extends BaseModel {
    protected $table = 'users';
    
    private function countUnicodeCharacters($value) {
        $count = preg_match_all('/./us', $value, $matches);
        return $count === false ? null : $count;
    }

    public function register($email, $password, $name) {
        if (!is_string($email) || !is_string($password) || !is_string($name)) {
            return ['success' => false, 'message' => 'Проверьте введённые данные'];
        }

        $email = trim($email);
        $name = trim($name);
        if ($email === '' || $password === '' || $name === '') {
            return ['success' => false, 'message' => 'Все поля обязательны'];
        }

        if (strlen($email) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Укажите корректный email длиной не более 100 символов'];
        }

        $nameLength = $this->countUnicodeCharacters($name);
        if ($nameLength === null || $nameLength > 100) {
            return ['success' => false, 'message' => 'Имя должно быть не длиннее 100 символов'];
        }

        $passwordLength = $this->countUnicodeCharacters($password);
        if ($passwordLength === null || strpos($password, "\0") !== false) {
            return ['success' => false, 'message' => 'Пароль содержит недопустимые символы'];
        }
        if ($passwordLength < 8) {
            return ['success' => false, 'message' => 'Пароль должен содержать не менее 8 символов'];
        }
        if (strlen($password) > 72) {
            return ['success' => false, 'message' => 'Пароль не должен превышать 72 байта в UTF-8'];
        }

        $checkSql = "SELECT id FROM users WHERE email = ?";
        $stmt = $this->db->prepare($checkSql);
        $stmt->bind_param('s', $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            return ['success' => false, 'message' => 'Email уже зарегистрирован'];
        }

        $password_hash = password_hash($password, PASSWORD_DEFAULT);
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
        if (!is_string($email) || !is_string($password)) {
            return ['success' => false, 'message' => 'Неверный email или пароль'];
        }

        $email = trim($email);
        if ($email === '' || strlen($email) > 100 || strlen($password) > 72 || strpos($password, "\0") !== false) {
            return ['success' => false, 'message' => 'Неверный email или пароль'];
        }

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

            $logger = new Logger();
            $logger->log($user['id'], 'login', 'Пользователь вошел в систему');

            return ['success' => true, 'user' => [
                'id' => (int)$user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role']
            ]];
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