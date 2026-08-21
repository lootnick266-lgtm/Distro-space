<div align: "center">
<h2> Проект Distro-space. Создан для изучения и понимания администрирования, отказоустойчивости и работы сервисов.</h2>
<p>Стек и инструменты:</p>
</div>

<div align: "center">
<a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"></a>
<a href="https://go.dev/"><img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go"></a>
<a href="https://www.mysql.com/"><img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"></a>
<a href="https://ubuntu.com/"><img src="https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white" alt="Ubuntu"></a>
</div>

<div style=align: "center">
<img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square" alt="License">
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML"><img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"></a>
<a href="https://developer.mozilla.org/en-US/docs/Web/CSS"><img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"></a>
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"></a>
</div>

<div style=align: "center">
<a href="https://www.php.net/"><img src="https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP"></a>
<a href="https://obsidian.md/"><img src="https://img.shields.io/badge/Obsidian-7C3AED?style=for-the-badge&logo=obsidian&logoColor=white" alt="Obsidian"></a>
</div>

<div style=align: "center">
<a href="https://grafana.com/"><img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" alt="Grafana"></a>
<a href="https://prometheus.io/"><img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" alt="Prometheus"></a>
<a href="https://grafana.com/oss/loki/"><img src="https://img.shields.io/badge/Loki-545454?style=for-the-badge&logo=loki&logoColor=white" alt="Loki"></a>
</div>

# Сведения о сервисе

**Содержание проекта**
2 сайта

**1)  Distrospace** - сайт с тёмной темой, модальными окнами и встроенным плеером.  
**2)  Тех поддержка** - регистрация, вход в систему и чат-бот, отвечающий на ключевые слова.   

Сервис развёрнут в docker и docker compose  
Используются 14 контейнеров на данный момент.   

Функции контейнеров: 

- хранилище базы данных  
- запуск сервисов  
- мониторинг  
- логирование  
- проверка доступности  
- уведомления в мессенджеры  


**Проект распространяется под лицензией MIT**
[LICENSE](LICENSE)

**выбранные направления:**
<ul>
<li>Системное администрирование</li>
<li>DevOps</li>
<li>DBA</li>
</ul>

**Сам сервис состоит из:**
<ul>
<li>Web часть: nginx, html, css, js</li>
<li>Backend: php, go</li>
<li>Администрирование: docker, linux </li>
<li>Мониторинг: prometheus, Grafana, loki , Alertmanager</li>
</ul>

**Недостающие элементы в репозитории. Но используются в проекте:**

- Nginx.conf  
- .env 
- database.sql  


**Идея:**
- Создать сервис , который сможет выполнять базовые задачи и в углублённых сферах.
- получить опыт с простого интереса 

# Требования к системе

**Тестировалось на:**

- Ubuntu 26.04 live server
- 2 vCPU 4096MB 30GB SSD

# Быстрый старт: 

**Запуск сервиса:**

```bash
sudo docker compose up -d
```

**Выключение сервиса:**
```bash
docker compose down
```

**Проверка контейнеров:**
```bash
docker ps
```

**Для Grafana**

используются exporter'ы
<table border="1" cellpadding="5" style="border-collapse: collapse; text-align: left;">
  <tr style="background: darkorchid; color: white;">
    <th>Экспортер</th>
    <th>ID дашборда</th>
  </tr>
  <tr><td>Node Exporter</td><td>1860</td></tr>
  <tr><td>cAdvisor</td><td>14282</td></tr>
  <tr><td>Nginx Exporter</td><td>12708</td></tr>
  <tr><td>MySQL Exporter</td><td>7362</td></tr>
  <tr><td>Blackbox Exporter</td><td>13659</td></tr>
  <tr><td>Alertmanager</td><td>13895</td></tr>
  <tr><td>Prometheus</td><td>3662</td></tr>
</table>


