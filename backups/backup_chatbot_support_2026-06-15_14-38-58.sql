-- MySQL dump 10.13  Distrib 5.7.39, for Win64 (x86_64)
--
-- Host: localhost    Database: chatbot_support
-- ------------------------------------------------------
-- Server version	5.7.39-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bot_knowledge_base`
--

DROP TABLE IF EXISTS `bot_knowledge_base`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bot_knowledge_base` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `keywords` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_pattern` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `answer_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` int(11) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_keywords` (`keywords`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bot_knowledge_base`
--

LOCK TABLES `bot_knowledge_base` WRITE;
/*!40000 ALTER TABLE `bot_knowledge_base` DISABLE KEYS */;
INSERT INTO `bot_knowledge_base` VALUES (6,'пароль,сбросить пароль','сбросить пароль','Используйте форму восстановления пароля. Если не приходит письмо - проверьте спам или обратитесь в поддержку.',8,'2026-06-08 12:23:27'),(7,'не могу войти,войти,аккаунт','Не могу войти в аккаунт. Что делать?','Проверьте правильность ввода email и пароля. Используйте кнопку «Забыли пароль?»',0,'2026-06-09 19:25:18'),(8,'скачать дистрибутив,linux,установщик','Как скачать дистрибутив Linux через установщик?','Нажмите «Смотреть» на карточке дистрибутива, затем выберите «Скачать через установщик»',0,'2026-06-09 19:25:55'),(9,'флешка,не видит флешку','	Установщик не видит мою флешку','Проверьте подключение, перезапустите установщик от имени администратора',0,'2026-06-09 19:26:21'),(10,'подписка,оформить,оплата','Как оформить подписку?','Подписка оформляется в личном кабинете после регистрации',0,'2026-06-09 19:26:48'),(11,'удалить аккаунт','Как удалить аккаунт?','Напишите в поддержку через форму обратной связи с темой «Удаление аккаунта»',0,'2026-06-09 19:27:07');
/*!40000 ALTER TABLE `bot_knowledge_base` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `bot_response` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,1,'как подключить api','Для подключения API используйте POST-запрос на /api/v1/endpoint. Не забудьте заголовок Authorization: Bearer ваш_токен.','2026-06-08 15:10:39'),(2,1,'как подключить api','Для подключения API используйте POST-запрос на /api/v1/endpoint. Не забудьте заголовок Authorization: Bearer ваш_токен.','2026-06-09 12:18:03'),(3,1,'пароль','Используйте форму восстановления пароля. Если не приходит письмо - проверьте спам или обратитесь в поддержку.','2026-06-09 13:49:12'),(4,1,'500','Ошибка 500 часто из-за синтаксиса PHP или прав на файлы. Посмотрите логи error_log().','2026-06-09 16:24:57'),(5,1,'500','Ошибка 500 часто из-за синтаксиса PHP или прав на файлы. Посмотрите логи error_log().','2026-06-09 16:27:01'),(6,1,'ошибка sql','Проверьте синтаксис, имена таблиц и кавычки. Включите отладку: error_reporting(E_ALL); mysqli_report(MYSQLI_REPORT_ERROR);','2026-06-09 17:12:02'),(7,1,'как подключить api','Для подключения API используйте POST-запрос на /api/v1/endpoint. Не забудьте заголовок Authorization: Bearer ваш_токен.','2026-06-09 17:12:04'),(8,1,'сбросить пароль','Используйте форму восстановления пароля. Если не приходит письмо - проверьте спам или обратитесь в поддержку.','2026-06-09 17:12:19'),(9,1,'как сбросить пароль','Используйте форму восстановления пароля. Если не приходит письмо - проверьте спам или обратитесь в поддержку.','2026-06-09 17:13:41'),(10,1,'привет','Привет! Чем могу помочь по PHP, SQL или API?','2026-06-09 17:15:00'),(11,1,'сбросить пароль','Используйте форму восстановления пароля. Если не приходит письмо - проверьте спам или обратитесь в поддержку.','2026-06-09 17:15:28'),(12,1,'php валидация','Используйте filter_var($email, FILTER_VALIDATE_EMAIL) и preg_match для телефона. Обязательно htmlspecialchars() для защиты от XSS.','2026-06-09 17:15:36'),(13,1,'как подключить api','Для подключения API используйте POST-запрос на /api/v1/endpoint. Не забудьте заголовок Authorization: Bearer ваш_токен.','2026-06-09 19:24:38'),(14,1,'Как удалить аккаунт?','Напишите в поддержку через форму обратной связи с темой «Удаление аккаунта»','2026-06-09 19:27:12'),(15,1,'Как скачать дистрибутив Linux через установщик?','Нажмите «Смотреть» на карточке дистрибутива, затем выберите «Скачать через установщик»','2026-06-09 19:27:14'),(16,1,'ошибка 500','Ошибка 500 часто из-за синтаксиса PHP или прав на файлы. Посмотрите логи error_log().','2026-06-09 19:27:20'),(17,1,'как подключить api','Для подключения API используйте POST-запрос на /api/v1/endpoint. Не забудьте заголовок Authorization: Bearer ваш_токен.','2026-06-09 19:27:28'),(18,1,'привет','Привет! Чем могу помочь по PHP, SQL или API?','2026-06-09 19:30:37'),(19,4,'Как удалить аккаунт?','Напишите в поддержку через форму обратной связи с темой «Удаление аккаунта»','2026-06-09 19:36:44'),(20,1,'?','Извините, я не смог распознать ваш запрос. Вот что я умею: удалить аккаунт, подписка,оформить,оплата, флешка,не видит флешку, скачать дистрибутив,linux,установщик, не могу войти,войти,аккаунт. Пожалуйста, переформулируйте вопрос.','2026-06-11 10:29:53');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs`
--

LOCK TABLES `logs` WRITE;
/*!40000 ALTER TABLE `logs` DISABLE KEYS */;
INSERT INTO `logs` VALUES (1,1,'login','Администратор вошел в систему','2026-06-08 12:23:27'),(2,2,'chat_message','Пользователь Алексей отправил сообщение боту','2026-06-08 12:23:27'),(3,4,'login','Пользователь вошел в систему','2026-06-08 12:29:43'),(4,5,'create_support_request','Создана заявка: Тестовое сообщение для проверки','2026-06-08 15:10:39'),(5,1,'chat_message','Сообщение: как подключить api','2026-06-08 15:10:39'),(6,4,'login','Пользователь вошел в систему','2026-06-09 12:06:56'),(7,4,'login','Пользователь вошел в систему','2026-06-09 12:11:07'),(8,1,'login','Пользователь вошел в систему','2026-06-09 12:15:17'),(9,5,'create_support_request','Создана заявка: Тестовое сообщение для проверки','2026-06-09 12:18:03'),(10,1,'chat_message','Сообщение: как подключить api','2026-06-09 12:18:03'),(11,1,'login','Пользователь вошел в систему','2026-06-09 12:37:13'),(12,1,'login','Пользователь вошел в систему','2026-06-09 12:41:42'),(13,1,'login','Пользователь вошел в систему','2026-06-09 12:42:48'),(14,1,'login','Пользователь вошел в систему','2026-06-09 12:45:05'),(15,1,'login','Пользователь вошел в систему','2026-06-09 12:45:30'),(16,1,'login','Пользователь вошел в систему','2026-06-09 12:48:22'),(17,1,'login','Пользователь вошел в систему','2026-06-09 12:50:19'),(18,1,'login','Пользователь вошел в систему','2026-06-09 12:51:19'),(19,1,'login','Пользователь вошел в систему','2026-06-09 12:54:14'),(20,1,'login','Пользователь вошел в систему','2026-06-09 12:57:36'),(21,1,'login','Пользователь вошел в систему','2026-06-09 12:57:43'),(22,1,'login','Пользователь вошел в систему','2026-06-09 12:57:52'),(23,1,'login','Пользователь вошел в систему','2026-06-09 13:00:50'),(24,1,'login','Пользователь вошел в систему','2026-06-09 13:03:55'),(25,1,'login','Пользователь вошел в систему','2026-06-09 13:08:49'),(26,1,'login','Пользователь вошел в систему','2026-06-09 13:14:38'),(27,1,'login','Пользователь вошел в систему','2026-06-09 13:15:46'),(28,1,'login','Пользователь вошел в систему','2026-06-09 13:17:51'),(29,1,'login','Пользователь вошел в систему','2026-06-09 13:23:08'),(30,1,'login','Пользователь вошел в систему','2026-06-09 13:24:44'),(31,1,'login','Пользователь вошел в систему','2026-06-09 13:25:37'),(32,1,'login','Пользователь вошел в систему','2026-06-09 13:28:17'),(33,1,'login','Пользователь вошел в систему','2026-06-09 13:44:23'),(34,1,'chat_message','Сообщение: пароль','2026-06-09 13:49:12'),(35,1,'login','Пользователь вошел в систему','2026-06-09 15:48:55'),(36,1,'chat_message','Сообщение: 500','2026-06-09 16:24:57'),(37,1,'chat_message','Сообщение: 500','2026-06-09 16:27:01'),(38,1,'chat_message','Сообщение: ошибка sql','2026-06-09 17:12:02'),(39,1,'chat_message','Сообщение: как подключить api','2026-06-09 17:12:04'),(40,1,'chat_message','Сообщение: сбросить пароль','2026-06-09 17:12:19'),(41,1,'chat_message','Сообщение: как сбросить пароль','2026-06-09 17:13:41'),(42,1,'chat_message','Сообщение: привет','2026-06-09 17:15:00'),(43,1,'chat_message','Сообщение: сбросить пароль','2026-06-09 17:15:28'),(44,1,'chat_message','Сообщение: php валидация','2026-06-09 17:15:36'),(45,5,'create_support_request','Создана заявка: Тестовое сообщение для проверки','2026-06-09 19:24:38'),(46,1,'chat_message','Сообщение: как подключить api','2026-06-09 19:24:38'),(47,1,'chat_message','Сообщение: Как удалить аккаунт?','2026-06-09 19:27:12'),(48,1,'chat_message','Сообщение: Как скачать дистрибутив Linux через установщик?','2026-06-09 19:27:14'),(49,1,'chat_message','Сообщение: ошибка 500','2026-06-09 19:27:20'),(50,1,'chat_message','Сообщение: как подключить api','2026-06-09 19:27:28'),(51,1,'chat_message','Сообщение: привет','2026-06-09 19:30:37'),(52,4,'login','Пользователь вошел в систему','2026-06-09 19:36:35'),(53,4,'chat_message','Сообщение: Как удалить аккаунт?','2026-06-09 19:36:44'),(54,1,'login','Пользователь вошел в систему','2026-06-09 19:36:59'),(55,1,'login','Пользователь вошел в систему','2026-06-11 07:31:35'),(56,1,'login','Пользователь вошел в систему','2026-06-11 10:29:02'),(57,1,'chat_message','Сообщение: ?','2026-06-11 10:29:53'),(58,1,'login','Пользователь вошел в систему','2026-06-13 14:29:46'),(59,1,'login','Пользователь вошел в систему','2026-06-13 14:30:07'),(60,1,'login','Пользователь вошел в систему','2026-06-15 11:38:55');
/*!40000 ALTER TABLE `logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_requests`
--

DROP TABLE IF EXISTS `support_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `support_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_response` text COLLATE utf8mb4_unicode_ci,
  `status` enum('new','in_progress','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'new',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `support_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_requests`
--

LOCK TABLES `support_requests` WRITE;
/*!40000 ALTER TABLE `support_requests` DISABLE KEYS */;
INSERT INTO `support_requests` VALUES (1,2,'Не подключается к API, выдает ошибку 500',NULL,'new','2026-06-08 12:23:27','2026-06-08 12:23:27'),(2,2,'Как сбросить пароль? Не приходит письмо',NULL,'in_progress','2026-06-08 12:23:27','2026-06-08 12:23:27'),(3,3,'Ошибка SQL при выполнении запроса',NULL,'completed','2026-06-08 12:23:27','2026-06-08 12:23:27'),(4,5,'Тестовое сообщение для проверки','','new','2026-06-09 12:18:03','2026-06-09 16:25:12'),(5,5,'Тестовое сообщение для проверки',NULL,'new','2026-06-09 19:24:38','2026-06-09 19:24:38');
/*!40000 ALTER TABLE `support_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@support.com','$2y$10$FPbaKUbQvNGThAMgamnbeub1U8LuOL0WgE12e9OKjIrW/oVsD2NPG','Администратор','admin','2026-06-08 12:23:27'),(2,'demo@support.com','$2y$10$EoVYFpBZFAmRIQ4NJqE6bOIVBfXckJrPVAMASZ1IxKhw2x3hGrRFO','Алексей','user','2026-06-08 12:23:27'),(3,'ivan@mail.ru','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Иван','user','2026-06-08 12:23:27'),(4,'fordvaxa@gmail.com','$2y$10$Btz/8tD2DIFGrQ4vfSeYZO6n7grf5pJvYGVRLTJJNO8Aospi0v6yi','German','user','2026-06-08 12:29:31'),(5,'test@test.com','$2y$10$hMHkInDDkHyvNZE01SgM6.igUrMgoLk5UL3Y833lIgPsMiMNJN0wW','Тестовый Пользователь','user','2026-06-08 15:08:24'),(6,'myadmin@test.com','$2y$10$EoVYFpBZFAmRIQ4NJqE6bOIVBfXckJrPVAMASZ1IxKhw2x3hGrRFO','Мой Админ','admin','2026-06-09 12:06:14');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-15 14:38:58
