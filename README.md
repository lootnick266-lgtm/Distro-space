<div align="center">

# Distro-space

**Проект для практики Linux-администрирования, Kubernetes, мониторинга и автоматизации развёртывания.**

<a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"></a>
<a href="https://kubernetes.io/"><img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes"></a>
<a href="https://go.dev/"><img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go"></a>
<a href="https://www.mysql.com/"><img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"></a>
<a href="https://ubuntu.com/"><img src="https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white" alt="Ubuntu"></a>

<a href="https://www.php.net/"><img src="https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP"></a>
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML"><img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"></a>
<a href="https://developer.mozilla.org/en-US/docs/Web/CSS"><img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"></a>
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"></a>
<a href="https://grafana.com/"><img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" alt="Grafana"></a>
<a href="https://prometheus.io/"><img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" alt="Prometheus"></a>

[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](LICENSE)

</div>

## О проекте

В проекте есть два веб-раздела и инфраструктура для их запуска.

- **Distro-space** — главная страница с каталогом дистрибутивов, модальными окнами и встроенным плеером. Файл: [public/Distro-space/indexbase.html](public/Distro-space/indexbase.html).
- **TechSupport** — вход, форма поддержки и чат-бот, который подбирает ответы по ключевым словам из базы знаний. Файл: [public/TechSupport/index.html](public/TechSupport/index.html).
- **Админ-панель** — просмотр обращений и управление правилами базы знаний.
- **Telegram alert bot** — отдельный Go-сервис, который принимает уведомления Alertmanager и пересылает их в Telegram. Это бот мониторинга, он не обслуживает чат на сайте.

У веб-части общая PHP/MySQL-сессия. Основная версия проекта находится в ветке `main` и развёрнута в k3s. Старые файлы Docker Compose и ветка `distro-space-docker` сохранены как материалы раннего MVP; текущий VPS через Compose не запускается.

Публичная версия: [https://distro-space.xyz](https://distro-space.xyz).

Проект распространяется под лицензией [MIT](LICENSE). Я делаю его, чтобы на практике разобраться в администрировании Linux, базах данных, Kubernetes, мониторинге и CI/CD.

## Текущий стек

| Задача | Инструменты |
| --- | --- |
| Веб-сервер | Nginx |
| Backend | PHP-FPM и Go |
| База данных | MySQL 8 |
| Оркестрация | k3s |
| Метрики и дашборды | Prometheus, Grafana |
| Оповещения | Alertmanager и Telegram alert bot |
| Экспорт метрик | Node Exporter, kube-state-metrics, cAdvisor, Nginx Exporter, MySQL Exporter, Blackbox Exporter |
| Автоматизация | Ansible и GitHub Actions |

Loki пока не входит в активный стек k3s. Файл его конфигурации остался от прежней Compose-версии.

## Требования к системе

Локальная VM для проверки проекта: Ubuntu Server 26.04 LTS, 2 vCPU, 4 ГиБ RAM и диск 30 ГиБ. Для установки на новый сервер Ansible проверяет Ubuntu 22.04 или новее, amd64 и не менее 3,8 ГиБ RAM без swap. Практичный запас для мониторинга — 6 ГиБ RAM и диск 40 ГиБ.

Установка k3s и мониторинга требует исходящего доступа к пакетным репозиториям, GitHub Releases, Helm chart repository и registry контейнеров. Локальные проверки CI можно подготовить заранее с нужными зависимостями и образами.

## Быстрый старт

### Проверить изменения локально

Нужны Bash, Python 3, PyYAML, Go 1.26, kubectl 1.31.5 и Docker. До запуска проверь, что Go-модули и образы для проверок уже доступны локально: скрипт проверки сам их не скачивает.

~~~bash
python3 -m pip install -r scripts/requirements-checks.txt
(cd VKAlerts && go mod download)
bash scripts/check.sh
~~~

Можно запустить одну группу:

~~~bash
bash scripts/check.sh --only go
bash scripts/check.sh --only ansible
~~~

Доступны группы `checker`, `secrets`, `yaml`, `php`, `go`, `monitoring` и `ansible`. Полный список проверок описан ниже в разделе [Локальные проверки и GitHub Actions](#локальные-проверки-и-github-actions).

### Обновить текущую версию на VPS

После push в `main` GitHub Actions запускает `Checks`. Если workflow завершился успешно, автоматически запускается `Deploy`. Ручной `kubectl apply` для обычного обновления не нужен.

Для Deploy в настройках репозитория должны быть заданы переменные `VPS_HOST` и `SITE_HOST` (а `VPS_USER` можно не задавать — по умолчанию используется `root`) и секреты `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `GHCR_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Сами значения секретов в README или исходники не добавляются.

Deploy собирает версионированные образы из очищенного build context, публикует их в приватный GHCR и обновляет существующие ресурсы k3s через Ansible. Он не очищает и не пересоздаёт БД. Подробнее — в разделе [GitHub Actions и автодеплой](#github-actions-и-автодеплой).

## Ресурсы приложения в k3s

Это ER-схема Kubernetes-ресурсов в namespace `distro-space`, а не общая архитектура проекта. Системные и мониторинговые ресурсы здесь не перечислены.

~~~mermaid
erDiagram
    NAMESPACE ||--o{ DEPLOYMENT : "содержит"
    NAMESPACE ||--o{ STATEFULSET : "содержит"
    NAMESPACE ||--o{ SERVICE : "содержит"
    NAMESPACE ||--o{ INGRESS : "содержит"
    NAMESPACE ||--o{ SECRET : "содержит"

    DEPLOYMENT ||--o{ REPLICASET : "управляет"
    REPLICASET ||--o{ POD : "создаёт"
    STATEFULSET ||--o{ POD : "управляет"
    POD ||--|{ CONTAINER : "содержит"
    CONTAINER }o--|| IMAGE : "запускает"

    SERVICE }o--o{ POD : "выбирает"
    INGRESS ||--|| SERVICE : "направляет к"
    STATEFULSET ||--o{ PVC : "создаёт запрос"
    POD }o--o{ PVC : "монтирует"
    POD }o--o{ SECRET : "использует"

    NAMESPACE {
        string name "distro-space"
    }
    DEPLOYMENT {
        string names "nginx, php, telegrambot"
        int nginxReplicas "2"
        int phpReplicas "1"
        int telegrambotReplicas "1"
    }
    STATEFULSET {
        string name "db"
        int replicas "1"
    }
    POD {
        string names "nginx, php, telegrambot, db-0"
    }
    CONTAINER {
        string names "nginx, php-fpm, telegrambot, mysql"
    }
    SERVICE {
        string names "nginx, php, db, telegrambot"
        string type "ClusterIP"
    }
    INGRESS {
        string name "distro-space"
        string class "traefik"
        string backend "nginx:80"
        string host "задаётся при развёртывании"
    }
    SECRET {
        string names "mysql credentials, telegram bot credentials"
    }
    PVC {
        string name "db-data-db-0"
        string size "5Gi"
        string storageClass "local-path"
    }
    IMAGE {
        string release "локальный тег или тег git-SHA"
    }
~~~

В локальных манифестах и на VPS могут использоваться разные имена образов: локальная VM работает с подготовленными локальными образами, а Deploy собирает для VPS образы с тегом конкретного commit SHA.

## Мониторинг

Prometheus собирает метрики кластера и приложения. Grafana подключается к Prometheus как к источнику данных. В k3s Prometheus, Grafana и Alertmanager устанавливаются chart `kube-prometheus-stack`; Nginx, MySQL и Blackbox Exporter задаются отдельно.

Для Grafana используются дашборды:

| Экспортер или сервис | ID дашборда |
| --- | ---: |
| Node Exporter | 1860 |
| cAdvisor | 14282 |
| Nginx Exporter | 12708 |
| MySQL Exporter | 7362 |
| Blackbox Exporter | 13659 |
| Alertmanager | 13895 |
| Prometheus | 3662 |
| K3s cluster monitoring | 15282 |

## Алерты и Telegram

Правила приложения находятся в [k3s/monitoring/distro-space-alerts.yaml](k3s/monitoring/distro-space-alerts.yaml), маршрутизация — в [k3s/monitoring/alertmanager-config.yml](k3s/monitoring/alertmanager-config.yml), Go-код бота — в [VKAlerts/TelegramAlertBot.go](VKAlerts/TelegramAlertBot.go). Каталог `VKAlerts` сохранил историческое имя.

Бот при старте отправляет **«Бот запущен!»**. Алерты и сообщения о восстановлении отправляются на русском. Сейчас настроены правила для недоступности сайта и MySQL, проблем целей мониторинга, остановки контейнера и частых перезапусков.

Alertmanager вызывает внутренний webhook бота по адресу `telegrambot.distro-space.svc.cluster.local:8080`. Бот отправляет сообщения через Telegram Bot API по HTTPS. Секреты токена и ID чата передаются через GitHub Secrets и Kubernetes Secret.

Локальные Go-тесты:

~~~bash
cd VKAlerts
GOPROXY=off GOSUMDB=off go test ./...
~~~

## Сетевые ограничения приложения

NetworkPolicy в `distro-space` по умолчанию закрывают входящий и исходящий трафик подов. В таблице перечислены разрешённые связи внутри кластера; DNS разрешён всем подам, а для Telegram bot отдельно открыт исходящий HTTPS.

| Источник | Назначение | Порт назначения / протокол |
| --- | --- | ---: |
| `kube-system` / Traefik | `distro-space` / Nginx | 80 |
| `monitoring` / Nginx Exporter | `distro-space` / Nginx | 80 |
| `monitoring` / Blackbox Exporter | `distro-space` / Nginx | 80 |
| `distro-space` / Nginx | `distro-space` / PHP-FPM | 9000 |
| `distro-space` / PHP-FPM | `distro-space` / MySQL | 3306 |
| `monitoring` / MySQL Exporter | `distro-space` / MySQL | 3306 |
| `monitoring` / Blackbox Exporter | `distro-space` / MySQL | 3306 |
| `monitoring` / Alertmanager | `distro-space` / Telegram bot | 8080 |
| `distro-space` / все поды | CoreDNS в `kube-system` | 53, TCP и UDP |

Telegram bot может отправлять HTTPS-запросы на публичные IPv4-адреса по TCP 443; локальные, частные и служебные диапазоны исключены. NetworkPolicy не фильтрует это соединение по доменному имени Telegram и не задаёт отдельные разрешения IPv6.

NetworkPolicy ограничивает трафик подов приложения, но не заменяет firewall узла и правила доступа к NodePort. Namespace `monitoring` и `kube-system` этими политиками не изолируются. Исходящая почта из PHP сейчас не настроена.

Файлы политик включены в [k3s/base/kustomization.yaml](k3s/base/kustomization.yaml). Если применять их вручную, сначала добавь разрешающие правила, затем default deny:

~~~bash
kubectl apply -f k3s/base/networkpolicy-allow.yaml
kubectl apply -f k3s/base/networkpolicy-default-deny.yaml
~~~

Удаление этих двух наборов правил возвращает namespace к прежнему состоянию без изоляции:

~~~bash
kubectl delete --ignore-not-found=true \
  -f k3s/base/networkpolicy-default-deny.yaml \
  -f k3s/base/networkpolicy-allow.yaml
~~~

## Локальные проверки и GitHub Actions

`bash scripts/check.sh` запускает проверки исходников и конфигураций. Они не подключаются к рабочей БД и не разворачивают ресурсы.

Проверяются:

- синтаксис shell и регрессионные тесты скриптов;
- поиск секретов в отслеживаемых Git-файлах;
- YAML и Kustomize;
- синтаксис PHP без исполнения приложения;
- Go-тесты и `go vet`;
- правила Prometheus и конфигурация Alertmanager;
- синтаксис Ansible и рендер шаблонов для двух режимов.

Контейнерные проверки запускаются без сети и с ограниченными правами. Локально должны быть доступны Docker и образы PHP, Prometheus и Alertmanager. GitHub Actions подготавливает инструменты, Go-модули и образы перед тем, как запустить те же проверки.

Workflow [Checks](.github/workflows/checks.yml) запускается на push, pull request и вручную. Ручной запуск с параметром `VPS_HOST` выполняет только проверку сетевой доступности VPS: проверяет SSH-баннер и HTTPS-доступ к GitHub/GHCR. Он не пытается войти по SSH и не запускает деплой.

Секрет-сканер работает по путям, которые Git отслеживает, и по известным шаблонам ключей и токенов; значения не выводятся в лог. Настоящие `.env`, `config.php`, Ansible inventory, Vault-файлы, приватные ключи и дампы БД в репозиторий не добавляются. Для примеров оставлены файлы с безопасными шаблонами.

## Проверка работающего k3s

Эта проверка выполняется отдельно на машине, у которой есть `kubectl` и доступ к кластеру:

~~~bash
bash scripts/health.sh
~~~

Скрипт проверяет готовность нод и подов, Nginx/PHP/MySQL/Telegram bot, страницы сайта и TechSupport, анонимную сессию PHP, защиту скачивания бэкапа, Prometheus, Grafana, Alertmanager, экспортёры и пять правил приложения.

Webhook Telegram bot проверяется GET-запросом без отправки сообщения; ожидаемый ответ — HTTP 405. Скрипт ничего не применяет и не перезапускает, в БД не пишет. Он не проверяет вход пользователя, браузерный интерфейс, доставку сообщения в Telegram или доступность Telegram API.

`health.sh` — smoke-проверка работающего кластера. Тесты самого health-скрипта находятся в `scripts/test_health.py` и входят в обычный `scripts/check.sh`.

## Интеграционная проверка NetworkPolicy

`python3 -B scripts/security.py` проверяет фактические сетевые правила в доступном k3s-кластере. В отличие от обычных CI-проверок, этот сценарий создаёт временные namespace и поды-слушатели, а затем проверяет разрешённые и запрещённые подключения.

Приложение, БД, рабочие тома и секреты в тестовые namespace не копируются. Проверки удаляют свои ресурсы после завершения; при принудительном завершении процесса очистка может не успеть выполниться. Перед ручным удалением сначала убедись, что namespace имеют метку тестового набора:

~~~bash
kubectl get namespaces -l security.distro-space/test-suite=networkpolicy
~~~

Нужны Python 3 с PyYAML, `kubectl` с правами создавать и удалять временные namespace/поды/NetworkPolicy и заранее загруженный образ `distro-nginx:1.9`. Скрипт не скачивает образ.

Проверка покрывает связи между Traefik, Nginx, PHP, MySQL, экспортёрами, Alertmanager и Telegram bot, а также несколько запрещённых направлений. Она не проверяет внешний HTTPS/API Telegram, IPv6 и firewall хоста. Автономные тесты логики этого сценария находятся в `scripts/test_security.py` и запускаются в Checks.

## Ansible и развёртывание

В репозитории есть два разных сценария:

- `ansible/site.yml` — первичная установка на отдельный новый сервер Ubuntu amd64: firewall, Fail2ban, k3s, Helm, приложение и мониторинг.
- `ansible/deploy.yml` — обновление уже подготовленного VPS. GitHub Actions запускает именно этот playbook; он не переинициализирует и не очищает БД.
- `ansible/validate.yml` — локальная проверка шаблонов без подключения к серверу или кластеру.
- `ansible/harden.yml` — отдельная настройка Fail2ban.

Используется `ansible-core 2.20.1`, k3s `v1.31.5+k3s1`, Helm `v3.22.1` и chart `kube-prometheus-stack 92.14.1`. Дополнительные Ansible Galaxy-коллекции не нужны.

Первичная установка рассчитана на выделенный сервер. Playbook отказывается работать с защищённой исходной VM и проверяет требования к ОС, архитектуре, памяти и swap. Он устанавливает входящие правила UFW для SSH/HTTP/HTTPS и Fail2ban для SSH: пять неудачных попыток за десять минут приводят к блокировке на пять часов.

Секреты первичной установки передаются через отдельный Ansible Vault-файл вне репозитория. Образец структуры переменных находится в [ansible/vault.example.yml](ansible/vault.example.yml), пример inventory — в [ansible/inventory.example.yml](ansible/inventory.example.yml). Перед запуском скопируй и настрой inventory:

~~~bash
cd ansible
cp inventory.example.yml inventory.yml
~~~

Затем укажи новый сервер, домен, ссылки на образы и внешний Vault-файл с секретами. По умолчанию первичная установка загружает образы из registry; сборку на сервере включает параметр distro_build_images. Inventory и Vault игнорируются Git. Не помещай реальные значения секретов в README, команды или шаблоны примеров.

Первичная установка создаёт пустую схему БД: пользователей, FAQ и обращения она не импортирует. Существующую БД можно восстановить только при явно заданном снимке для `site.yml`. Повторный GitHub Deploy работает в update-only режиме и не принимает снимок БД.

MySQL хранится на постоянном томе 5 GiB. Хранилище Grafana, Prometheus и Alertmanager в новой установке временное по умолчанию; его можно включить параметром `distro_monitoring_persistence`. Публикация Grafana для нового окружения не открывается автоматически.

Проверить Ansible без подключения к серверу:

~~~bash
cd /var/www/localhost
bash scripts/check.sh --only ansible
~~~

Первичную установку запускают только на подготовленном новом сервере после настройки inventory и внешнего Vault-файла:

~~~bash
cd ansible
ansible-playbook -i inventory.yml site.yml \
  -e @/absolute/path/deploy.vault.yml \
  --ask-vault-pass --ask-become-pass
~~~

На сервере при первой установке нужен интернет для APT, GitHub Releases, Helm chart repository и registry. Версии k3s и Helm проверяются по опубликованным SHA-256.

Terraform-конфигурации в репозитории пока нет. Текущий автодеплой использует GitHub Actions и Ansible.

## GitHub Actions и автодеплой

Workflow `Checks` проверяет каждый push и pull request. `Deploy` запускается после успешного `Checks`, только для push в `main`, и пропускает старый commit, если в ветке уже появился более новый.

На время запуска GitHub Actions хранит SSH-данные и Telegram/GHCR credentials во временных файлах с ограниченными правами и удаляет их после выполнения. Build context для образов собирается по allowlist: локальные `config.php`, `.env`, Vault и дампы БД в него не попадают.

Deploy собирает приватные образы с тегом вида `git-<commit SHA>` на VPS, отправляет их в GHCR и применяет приложение и мониторинг через Ansible. При повторном запуске того же commit данные MySQL не очищаются. Плейбук не меняет системный SSH-доступ и не выполняет миграцию БД.

Для Deploy нужны переменные репозитория:

| GitHub variable | Для чего |
| --- | --- |
| `VPS_HOST` | Публичный адрес VPS |
| `VPS_USER` | SSH-пользователь; по умолчанию `root` |
| `SITE_HOST` | Домен сайта; если не задан, используется адрес VPS |

И секреты:

| GitHub secret | Для чего |
| --- | --- |
| `DEPLOY_SSH_KEY` | Отдельный приватный SSH-ключ автодеплоя |
| `DEPLOY_KNOWN_HOSTS` | Доверенный host key VPS |
| `GHCR_TOKEN` | Доступ к приватным пакетам и публикация образов |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram alert bot |
| `TELEGRAM_CHAT_ID` | Чат, куда отправляются уведомления |

Значения секретов хранятся в настройках GitHub и сюда не копируются.

## Иерархия Ansible

Главный playbook первичной установки — `ansible/site.yml`. GitHub Deploy использует отдельный `ansible/deploy.yml`, чтобы обновлять существующий VPS без повторного bootstrap и действий с БД.

~~~mermaid
flowchart TD
    CHECKS["GitHub Actions: Checks"] -->|успешный push в main| DEPLOY["GitHub Actions: Deploy"]
    DEPLOY --> UPDATE["ansible/deploy.yml — update-only"]
    UPDATE --> PREFLIGHT["Проверка управляемого VPS и входных параметров"]
    UPDATE --> IMAGES["Buildah: сборка и публикация образов в GHCR"]
    UPDATE --> CREDS["Обновление registry и Telegram credentials"]
    UPDATE --> APP["Применение ресурсов приложения"]
    UPDATE --> MON["Обновление мониторинга и экспортёров"]
    UPDATE --> VERIFY["Health-проверка"]

    SITE["ansible/site.yml — первичная установка"] --> ROLE["Роль distro"]
    ROLE --> MAIN["tasks/main.yml"]
    MAIN --> FW["firewall.yml"]
    MAIN --> BAN["hardening.yml — Fail2ban"]
    MAIN --> BOOT["bootstrap.yml — k3s и Helm"]
    MAIN --> BUILD["images.yml — если включена сборка"]
    MAIN --> SECRET["credentials.yml"]
    MAIN --> APPLICATION["application.yml"]
    MAIN --> MONITOR["monitoring.yml"]
    MAIN --> VERIFY

    VALIDATE["ansible/validate.yml — локальная проверка шаблонов"] --> TEMPLATES["Два режима рендера без подключения к серверу"]
~~~

Роль `distro` и её шаблоны находятся в `ansible/roles/distro/`. Значения по умолчанию — в `defaults/main.yml`; задачи — в `tasks/`; шаблоны Kubernetes — в `templates/`; пустая схема новой БД — в `files/schema.sql`.
