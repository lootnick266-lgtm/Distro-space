--   1. Создание таблиц БД для чат-бота техподдержки

CREATE DATABASE IF NOT EXISTS `chatbot_support`;
USE `chatbot_support`;

-- Таблица пользователей (с ролью admin/user)
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(100) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `role` ENUM('user', 'admin') DEFAULT 'user',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заявок техподдержки
CREATE TABLE `support_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `admin_response` TEXT,
    `status` ENUM('new', 'in_progress', 'completed') DEFAULT 'new',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Таблица истории диалогов с ботом
CREATE TABLE `chat_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `bot_response` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Таблица базы знаний бота
CREATE TABLE `bot_knowledge_base` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `keywords` VARCHAR(255) NOT NULL,
    `question_pattern` VARCHAR(255),
    `answer_text` TEXT NOT NULL,
    `priority` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица логов действий пользователей
CREATE TABLE `logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT,
    `action` VARCHAR(255) NOT NULL,
    `details` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Индекс для ускорения поиска по ключевым словам
CREATE INDEX idx_keywords ON `bot_knowledge_base`(`keywords`);

--   2. Тестовые данные

-- Администратор (пароль: admin123)
INSERT INTO `users` (`email`, `password_hash`, `name`, `role`) VALUES
('admin@support.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Администратор', 'admin');

-- Обычные пользователи (пароль: 123456)
INSERT INTO `users` (`email`, `password_hash`, `name`, `role`) VALUES
('demo@support.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Алексей', 'user'),
('ivan@mail.ru', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Иван', 'user');

-- Тестовые заявки
INSERT INTO `support_requests` (`user_id`, `message`, `status`) VALUES
(2, 'Не подключается к API, выдает ошибку 500', 'new'),
(2, 'Как сбросить пароль? Не приходит письмо', 'in_progress'),
(3, 'Ошибка SQL при выполнении запроса', 'completed');

-- База знаний бота
INSERT INTO `bot_knowledge_base` (`keywords`, `question_pattern`, `answer_text`, `priority`) VALUES
('api,подключить,как подключить api', 'как подключить api', 'Для подключения API используйте POST-запрос на /api/v1/endpoint. Не забудьте заголовок Authorization: Bearer ваш_токен.', 10),
('sql,ошибка,ошибка sql', 'ошибка sql', 'Проверьте синтаксис, имена таблиц и кавычки. Включите отладку: error_reporting(E_ALL); mysqli_report(MYSQLI_REPORT_ERROR);', 10),
('php,валидация', 'php валидация', 'Используйте filter_var($email, FILTER_VALIDATE_EMAIL) и preg_match для телефона. Обязательно htmlspecialchars() для защиты от XSS.', 10),
('бот,привет', 'привет', 'Привет! Чем могу помочь по PHP, SQL или API?', 5),
('500,ошибка сервера', 'ошибка 500', 'Ошибка 500 часто из-за синтаксиса PHP или прав на файлы. Посмотрите логи error_log().', 10),
('пароль,сбросить пароль', 'сбросить пароль', 'Используйте форму восстановления пароля. Если не приходит письмо - проверьте спам или обратитесь в поддержку.', 8);

-- Логи (пример)
INSERT INTO `logs` (`user_id`, `action`, `details`) VALUES
(1, 'login', 'Администратор вошел в систему'),
(2, 'chat_message', 'Пользователь Алексей отправил сообщение боту');