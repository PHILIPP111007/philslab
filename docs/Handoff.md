# PhilsLab — Handoff

Последнее обновление: 21 августа 2026 г.

Этот документ предназначен для передачи проекта следующему разработчику или AI-агенту. Он описывает фактическую архитектуру, правила безопасных изменений, текущую реализацию авторизации/WebSocket, состояние таблиц и известные технические проблемы.

## 1. Назначение проекта

PhilsLab — лабораторный журнал с React-интерфейсом и двумя backend-сервисами:

- Django отвечает за API v1, авторизацию, миграции, административную панель и историческую часть доменной логики.
- FastAPI отвечает за API v2, CRUD лабораторных сущностей и современные endpoint-ы.
- React + Vite — frontend.
- SQLite используется в локальной разработке, PostgreSQL — в Docker/production-like окружении.

Главное архитектурное правило: Django и FastAPI работают с одной предметной областью и в production с одной базой. Изменение общей сущности необходимо проверять в Django-моделях, миграциях, SQLModel-моделях FastAPI и frontend payload-ах.

## 2. Структура репозитория

~~~text
Frontend/react/app/       React/Vite-приложение
Services/django/          Django project, API v1, auth, admin, WebSocket
Services/fastapi/         FastAPI project, API v2
dockerfiles/              Dockerfiles и nginx-конфигурация
docs/                     Документация проекта
graphify-out/             Сгенерированный индекс репозитория
Makefile                  Основные команды локальной разработки
docker-compose.yml        Django + FastAPI + PostgreSQL + nginx
AGENTS.md                 Инструкции для агентов и разработчиков
~~~

Исходный код и runtime-конфигурация важнее документации. graphify-out/graph.json — только навигационный индекс, его нельзя редактировать вручную.

При конфликте информации использовать следующий порядок:

1. исходный код и настройки запуска;
2. модели и Django migrations;
3. docs/;
4. graphify-out/;
5. старые примеры в README.md.

## 3. Адреса и порты

### Локальная разработка

| Сервис | Адрес |
|---|---|
| React/Vite | http://localhost:5173 |
| Django + WebSocket | http://localhost:1972 |
| FastAPI | http://localhost:1974 |
| FastAPI OpenAPI | http://localhost:1974/docs |
| Django admin | http://localhost:1972/admin_page/ |

Порты 1972 и 1974 являются актуальными. Старые значения 8000/8001 в старых документах использовать нельзя.

### Docker

Снаружи доступен nginx на http://localhost/. Внутри Docker backend-сервисы слушают порт 8080:

~~~text
/api/v1/      -> django:8080
/api/v2/      -> fastapi:8080
/ws/v1/       -> django:8080
/ws/v2/       -> fastapi:8080
/admin_page/  -> django:8080
/docs         -> fastapi:8080
/             -> React build
~~~

PostgreSQL работает внутри сети Docker на порту 5432. Volume pgdata нельзя удалять без явного запроса пользователя: это удалит локальные данные базы.

## 4. Установка и запуск

Из корня проекта:

~~~bash
make create_env
~~~

Команда создаёт Services/fastapi/.venv, Services/django/.venv и устанавливает npm-зависимости.

Запуск сервисов по отдельности:

~~~bash
make react       # Vite на 5173
make django      # Django/ASGI на 1972, makemigrations + migrate
make fastapi     # FastAPI на 1974
~~~

Полный Docker-стек:

~~~bash
docker compose up --build
~~~

Полезные команды:

~~~bash
make test             # FastAPI pytest с TESTING=1
make createsuperuser  # создать Django admin user
make shell            # Django shell
~~~

Для graphify используется отдельное окружение в корне проекта:

~~~bash
source /home/froschin/work/philslab/.venv/bin/activate
graphify extract . --code-only
~~~

После крупных изменений обновлять graphify можно только командой; graph.json вручную не исправлять.

## 5. Backend-архитектура

### Django

Основные места:

- Services/django/settings/ — настройки и ASGI entrypoint;
- Services/django/app/models/ — источник Django-моделей и миграций;
- Services/django/app/migrations/ — схема базы данных;
- Services/django/app/views/ — auth/API v1;
- Services/django/app/consumers/table.py — WebSocket редактора таблиц;
- Services/django/app/admin.py — административная панель.

Основные auth endpoint-ы:

~~~text
POST /api/v1/auth/users/
GET  /api/v1/auth/users/me/
POST /api/v1/token/login/
POST /api/v1/token/logout/
~~~

В проекте используется кастомная Django-модель app.User. Нельзя менять AUTH_USER_MODEL без отдельного плана миграции.

### FastAPI

Entry point: Services/fastapi/app/main.py.

Основные каталоги:

~~~text
app/views/         endpoint-ы
app/request_body/  Pydantic/SQLModel request schemas
app/models/        SQLModel-модели общей базы
app/services/      serializers и сервисная логика
app/enums/         перечисления
app/database.py    async engine и SessionDep
~~~

Все FastAPI endpoint-ы имеют prefix /api/v2. Доступ к сессии базы нужно получать через SessionDep. Авторизованный пользователь доступен во view через request.state.user; middleware извлекает Authorization: Token <token>.

Основные группы endpoint-ов:

~~~text
/api/v2/user/{username}/
/api/v2/users/
/api/v2/samples/
/api/v2/sample/{id}/
/api/v2/sample/material_types/
/api/v2/batches/
/api/v2/batch/{id}/...
/api/v2/protocols/
/api/v2/protocol/{id}/...
/api/v2/stages/
/api/v2/tasks/
/api/v2/task/{id}/...
/api/v2/departments/
~~~

FastAPI использует асинхронные SQLAlchemy/SQLModel-запросы. В development он подключается к SQLite-файлу Django через Services/fastapi/../django/db.sqlite3; в Docker/production используется PostgreSQL.

### Общие сущности

Доменная модель включает:

- User — владелец samples, batches и protocols; создатель/исполнитель tasks;
- Protocol и Stage — SOP и его этапы;
- Task и TaskStage — задача и копии этапов протокола;
- Batch и Sample — лабораторные образцы и партии;
- QueryHistory — универсальная история изменений User, Sample, Batch, Protocol,
  Stage и Task; для обратной совместимости у записей задач также сохраняется
  nullable-связь `task_id`;
- Token — DRF/FastAPI token;
- link tables для many-to-many: BatchSampleLink, TaskBatchLink, ProtocolStageLink, TaskStageLink.

SQLModel-таблицы должны сохранять имена Django-таблиц (app_*, authtoken_token). Переименовывать таблицы или foreign keys без проверки миграций обеих ORM нельзя.

### MaterialType

Тип материала образца реализован в Services/fastapi/app/enums/material_type.py и отдан frontend endpoint-ом:

~~~text
GET /api/v2/sample/material_types/
~~~

Текущие значения:

~~~text
Кровь, Ткань, ДНК, РНК, Белок, Клетки, Бактерии, Вирусы, Другое
~~~

В Samples.jsx эти значения используются для HTML select. При изменении enum нужно одновременно проверить FastAPI schema, Django-модель/migration, payload и таблицу Samples.

## 6. Frontend-архитектура

Frontend находится в Frontend/react/app/.

~~~text
src/API/Fetch.js           единая HTTP-обёртка
src/data/routes.jsx        public/private routes
src/data/constants.js      URL, ports, environment
src/data/enums.js           HTTP methods, API versions, enums
src/modules/token.js        token storage
src/modules/rememberPage.js сохранение последней страницы
src/hooks/                  auth и data hooks
src/pages/                  страницы и переиспользуемые компоненты
~~~

Все приватные routes должны содержать user.username в конце пути. Текущие примеры:

~~~text
/users/:username/
/samples/:username/
/batches/:username/
/batch/:id/:username/
/sample/:id/:username/
/task/:id/:username/
/admin_page/:username/
~~~

Ссылки /search/ и /warehouse/ на главной сейчас приводят к ErrorPage намеренно: эти маршруты ещё не реализованы и будут исправлены отдельно.

### Fetch

Не добавлять прямые fetch-вызовы в страницы, если запрос можно выполнить через src/API/Fetch.js.

~~~js
const response = await Fetch({
    api_version: APIVersion.V2,
    action: 'samples/',
    method: HttpMethod.GET,
})
~~~

Ожидаемый ответ содержит ok; ошибки могут находиться в error или detail. Для FormData нужно передавать is_uploading_file: true, иначе обёртка установит JSON Content-Type.

### Token storage

Frontend получает DRF token при login и сохраняет его через src/modules/token.js в localStorage. Все обычные API-запросы извлекают токен и отправляют:

~~~text
Authorization: Token <token>
~~~

Другие сайты не могут прочитать этот localStorage из-за same-origin policy. Однако любой XSS-код, выполненный в origin приложения, сможет прочитать токен. Поэтому нельзя вставлять непроверенный HTML/JS, секреты не должны попадать в URL, логи или репозиторий, а production должен использовать HTTPS и CSP.

## 7. WebSocket-редактор таблиц

Текущая реализация находится в Django, маршрут:

~~~text
ws/v1/table/<username>/
~~~

В development frontend подключается к ws://localhost:1972/ws/v1/; в production URL строится как ws:// или wss:// относительно текущего host.

Токен намеренно не передаётся в URL, чтобы он не оказался в browser history и URL-логах. После открытия WebSocket frontend отправляет первое сообщение:

~~~json
{
  "type": "authenticate",
  "token": "<token>",
  "table_name": "samples"
}
~~~

Сервер:

1. принимает соединение;
2. ожидает authenticate не дольше 5 секунд;
3. проверяет DRF token и активность пользователя;
4. проверяет, что user.username совпадает с username в URL;
5. проверяет имя таблицы по ^[a-z][a-z0-9_]{0,62}$;
6. только после этого добавляет соединение в группу редакторов.

После аутентификации поддерживаются действия:

~~~json
{"table_name": "samples", "action": "lock"}
{"table_name": "samples", "action": "release"}
~~~

Lock серверный и универсальный: таблица является ключом состояния, поэтому код не должен считать, что существует только samples. Снять lock может только соединение-владелец. release от другого пользователя игнорируется, а отключение другого соединения не снимает чужой lock.

Важно: registry lock сейчас хранится в памяти процесса, используется asyncio.Lock, а deployment рассчитан на один worker и in-memory channel layer. Для нескольких workers/реплик нужно перенести lock state в Redis или другую общую систему координации. Иначе разные workers будут видеть разные lock-и.

Frontend WebSocket реализован сейчас в Frontend/react/app/src/pages/Sample/Samples.jsx. При добавлении других таблиц нужно передавать собственный table_name и не копировать серверную логику с захардкоженным samples.

## 8. Table.jsx: аудит и текущая реализация

Центральный компонент таблиц: Frontend/react/app/src/pages/components/Table/Table.jsx.

Он поддерживает:

- local и lazy data;
- обычную и infinite-scroll пагинацию;
- sorting/filtering/grouping;
- column visibility/order/resize;
- row selection и cell selection;
- add/edit/delete;
- inline edit и empty row;
- CSV/Excel export;
- callback API через onDataChange и operation metadata.

Критические проблемы, исправленные в последнем рефакторинге:

- side effects (onDataChange, success callbacks, setPageIndex) были внутри setState updater и могли выполняться повторно при Strict Mode/concurrent rendering;
- редактирование ячейки использовало устаревшее замыкание data;
- массовое редактирование могло адресовать служебные и нередактируемые колонки;
- отключённая пагинация всё равно подключала pagination row model;
- lazy page count мог быть равен нулю, что давало некорректную навигацию;
- infinite scroll мог после смены фильтра снова добавить старый результат запроса;
- локальная таблица показывала totalRows=0, хотя данные были загружены;
- глобальный DOM id для batch input конфликтовал при наличии нескольких таблиц;
- изменение table.options.meta через effect было заменено на стабильный meta wrapper и ref актуального callback-а;
- одинаковые массивы строк не вызывают лишнее обновление локального состояния.

Контракт CRUD metadata:

~~~js
{ operation: 'edit', id, data }
{ operation: 'delete', id, data }
{ operation: 'add', id, data }
{ operation: 'batchEdit', updates }
~~~

Не помещать сетевые запросы внутрь callback-а setState. Сначала вычислить новое состояние, обновить таблицу, затем вызвать внешний callback.

## 9. Известные проблемы и технический долг

### Дублирующиеся initial lazy requests

Table.jsx вызывает onLazyLoad при монтировании lazy-таблицы. При этом AdminPage, Samples и Batches также имеют собственные initial useEffect/lazy state и могут выполнить второй такой же запрос. Это не блокирует работу, но создаёт лишний network traffic, лишние state updates и race condition между ответами.

Рекомендуемое решение — выбрать один источник initial loading: либо Table, либо страница. Не оставлять оба механизма активными.

### Общий frontend lint

На момент handoff:

- Table.jsx lint проходит без ошибок и выдаёт только предупреждение react-hooks/incompatible-library на useReactTable;
- npm run lint всего frontend остаётся красным: 36 ошибок и 9 предупреждений в других файлах;
- среди существующих проблем есть react-hooks/set-state-in-effect, react-refresh/only-export-components, unused variables и missing hook dependencies.

Это не следует автоматически исправлять в рамках backend/Table-задачи: сначала проверить поведение соответствующей страницы.

### React build warnings

npm run build проходит. Vite предупреждает о больших chunks, особенно Table/ExcelJS и графиках. При необходимости следует добавить code splitting или ленивую загрузку тяжёлых библиотек, но это отдельная задача.

### WebSocket scalability

In-memory lock registry нельзя использовать при нескольких workers/репликах. До перехода на Redis запускать Django WebSocket с одним worker.

### Нереализованные маршруты

/search/ и /warehouse/ пока намеренно отсутствуют в src/data/routes.jsx. Не считать это случайной поломкой при последующих аудитах.

## 10. Правила безопасных изменений

Перед изменением endpoint-а:

1. найти все frontend-вызовы через Fetch;
2. проверить request body и response shape;
3. проверить FastAPI request schema/view;
4. проверить соответствующую Django model и migration;
5. проверить права доступа пользователя;
6. проверить, нужен ли аналогичный API v1;
7. обновить документацию.

Перед изменением общей модели:

- не переименовывать app_* table без проверки обеих ORM;
- для Django-модели создать и проверить migration;
- проверить nullable/default/enum значения;
- проверить существующие данные SQLite и PostgreSQL;
- не коммитить локальные базы, .env, tokens или passwords.

Перед изменением React:

- использовать Fetch, notify.js, UserContext, AuthContext, token.js и rememberPage.js;
- сохранять username в приватных маршрутах;
- не дублировать UI-компоненты и CSS;
- для больших таблиц сохранять memoization и стабильные callbacks;
- не вызывать API из setState updater;
- предусмотреть abort/race handling для запросов, если параметры страницы могут быстро меняться.

## 11. Проверки перед handoff

Backend:

~~~bash
make test
~~~

Frontend:

~~~bash
cd Frontend/react/app
npm run lint
npm run build
~~~

Для API дополнительно проверить:

- Authorization: Token <token>;
- response ok/error/detail;
- ownership/access control;
- pagination, sorting, filtering;
- ошибки валидации и пустые результаты;
- работу обеих API-версий, если сущность используется в Django и FastAPI.

Для WebSocket проверить минимум два клиента:

1. пользователь A получает authenticated и успешно делает lock;
2. пользователь B видит владельца и не может перехватить lock;
3. release от B не снимает lock A;
4. disconnect B не снимает lock A;
5. disconnect A освобождает lock;
6. неправильный token, username или table name закрывают соединение;
7. токен отсутствует в URL.

Перед завершением работы:

~~~bash
git status --short
git diff --check
git diff
git diff --cached
~~~

Не использовать git reset --hard и не стирать пользовательские изменения. В текущем рабочем состоянии изменения Table.jsx отображаются как staged и unstaged (MM); перед коммитом их нужно осмотреть и намеренно объединить, не сбрасывая существующий index.

## 12. Рекомендуемый порядок следующих задач

1. Убрать дублирующую initial lazy-загрузку между Table и страницами AdminPage/Samples/Batches.
2. Добавить abort/race protection для быстрых смен фильтров и страниц.
3. Перенести WebSocket lock state в Redis перед переходом к нескольким workers.
4. Разобрать 36 frontend lint errors по группам, начиная с unused variables и реальных hook dependency bugs.
5. Добавить интеграционные тесты FastAPI CRUD и WebSocket ownership.
6. Разделить тяжёлые frontend chunks (exceljs, графики, крупные страницы).
7. Реализовать или удалить из главной страницы ссылки на /search/ и /warehouse/ после подтверждения бизнес-логики.
