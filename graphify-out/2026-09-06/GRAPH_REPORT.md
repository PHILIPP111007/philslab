# Graph Report - philslab  (2026-08-21)

## Corpus Check
- 144 files · ~46,067 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 628 nodes · 1425 edges · 62 communities (37 shown, 25 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `97b2f351`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Fetch
- fastapi/app/models/__init__.py
- admin.py
- add_history
- views/department.py
- dependencies
- devDependencies
- views/batch.py
- views/sample.py
- views/task.py
- App.jsx
- TableEditorConsumer
- ApiConfig
- main
- uvicorn.sh
- 0001_initial.py
- 0002_task_department.py
- 0003_alter_queryhistory_action_type.py
- 0004_alter_task_options_remove_task_stages_taskstage.py
- 0005_alter_taskstage_options.py
- 0006_remove_sample_zlims_id_sample_material_type_and_more.py
- 0007_alter_task_options.py
- 0008_alter_sample_sample_index.py
- 0009_task_batches.py
- 0010_batchsubsample_subsample.py
- 0011_batch_subsamples_delete_batchsubsample.py
- 0012_remove_task_samples.py
- 0013_remove_batch_subsamples_remove_sample_name_and_more.py
- django/app/services/__init__.py
- granian.sh
- package.json
- scripts
- AGENTS.md — Instructions for Working with PhilsLab
- PhilsLab — Handoff
- Table.jsx
- fastapi/app/services/__init__.py
- babel-plugin-react-compiler
- eslint-plugin-react-hooks
- @types/react-dom
- vite
- 📘 Документация по фронтенду (React + Vite)
- AGENTS.md
- 🔐 Аутентификация и токен
- attach_user_to_request
- 🚀 Запуск и сборка
- 🌐 Работа с API (Fetch)
- Backend Change Rules
- 🧩 Переиспользуемые компоненты (UI Kit)
- 0014_queryhistory_generic_entity.py
- @rolldown/plugin-babel

## God Nodes (most connected - your core abstractions)
1. `Fetch()` - 36 edges
2. `add_history()` - 32 edges
3. `rememberPage()` - 26 edges
4. `Task` - 21 edges
5. `TableEditorConsumer` - 19 edges
6. `QueryHistory` - 17 edges
7. `User` - 17 edges
8. `snapshot()` - 16 edges
9. `Header()` - 15 edges
10. `Batch` - 15 edges

## Surprising Connections (you probably didn't know these)
- `QueryHistory` --uses--> `ActionType`  [INFERRED]
  Services/fastapi/app/models/query_history.py → Services/fastapi/app/enums/action_type.py
- `Sample` --uses--> `MaterialType`  [INFERRED]
  Services/fastapi/app/models/sample.py → Services/fastapi/app/enums/material_type.py
- `Task` --uses--> `Priority`  [INFERRED]
  Services/fastapi/app/models/task.py → Services/fastapi/app/enums/priority.py
- `Protocol` --uses--> `Stage`  [INFERRED]
  Services/fastapi/app/models/protocol.py → Services/fastapi/app/models/stage.py
- `useAuth()` --calls--> `getToken()`  [EXTRACTED]
  Frontend/react/app/src/hooks/useAuth.js → Frontend/react/app/src/modules/token.js

## Import Cycles
- None detected.

## Communities (62 total, 25 thin omitted)

### Community 0 - "Fetch"
Cohesion: 0.09
Nodes (53): Fetch(), parseResponse(), reportApiError(), buildSamplePayload(), nullableNumber(), nullableText(), DEVELOPMENT, DEVELOPMENT_DJANGO_FETCH_URL (+45 more)

### Community 1 - "fastapi/app/models/__init__.py"
Cohesion: 0.09
Nodes (36): Batch, SQLModel, Батч (партия) образцов., Количество подобразцов в батче., BatchSampleLink, SQLModel, Связь Batch - Subsample (многие ко многим), Protocol (+28 more)

### Community 2 - "admin.py"
Cohesion: 0.07
Nodes (30): AbstractBaseUser, PermissionsMixin, register, BatchAdmin, HistoryInline, ProtocolAdmin, QueryHistoryAdmin, Inline для истории задачи (+22 more)

### Community 3 - "add_history"
Cohesion: 0.06
Nodes (65): ActionType, QueryHistory, ActionType, Enum, str, Тип действия в истории, Priority, Enum (+57 more)

### Community 4 - "views/department.py"
Cohesion: 0.32
Nodes (6): Departments, Enum, get_departments(), get, Request, Возвращает список доступных отделов (значения enum Departments).

### Community 5 - "dependencies"
Cohesion: 0.13
Nodes (15): exceljs, dependencies, exceljs, react, react-dom, react-hot-toast, react-plotly.js, react-router-dom (+7 more)

### Community 6 - "devDependencies"
Cohesion: 0.13
Nodes (15): @babel/core, eslint, @eslint/js, eslint-plugin-react-refresh, devDependencies, @babel/core, eslint, @eslint/js (+7 more)

### Community 7 - "views/batch.py"
Cohesion: 0.24
Nodes (22): BatchCreate, BatchUpdate, BaseModel, serialize_batch(), add_sample_to_batch(), add_task_to_batch(), create_batch(), delete_batch() (+14 more)

### Community 8 - "views/sample.py"
Cohesion: 0.13
Nodes (25): MaterialType, Enum, str, Допустимые типы биоматериала образца., BaseModel, Схема для создания нового образца., Схема для обновления образца., SampleCreate (+17 more)

### Community 9 - "views/task.py"
Cohesion: 0.14
Nodes (32): Batch, Sample, _iso(), Any, Stable response serializers for the FastAPI API. Keeping response construction…, Serialize a task and its already-loaded relationships. Samples are derived from…, serialize_batch_summary(), serialize_sample() (+24 more)

### Community 10 - "App.jsx"
Cohesion: 0.19
Nodes (9): App(), useAuth(), ProtectedRoute(), SuspenseLoading(), ThemeContext, ThemeProvider(), useTheme(), ThemeToggle() (+1 more)

### Community 11 - "TableEditorConsumer"
Cohesion: 0.10
Nodes (9): AsyncWebsocketConsumer, database_sync_to_async, TableEditorConsumer, Enum, WebSocketGroup, Create user: POST http://127.0.0.1:1972/api/v1/auth/users/ {"username":…, Use this endpoint to logout user (remove user authentication token)., TokenCreateView (+1 more)

### Community 32 - "package.json"
Cohesion: 0.29
Nodes (6): name, overrides, uuid, private, type, version

### Community 36 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 43 - "AGENTS.md — Instructions for Working with PhilsLab"
Cohesion: 0.17
Nodes (12): AGENTS.md — Instructions for Working with PhilsLab, Architecture and Routing, Checks Before Handoff, Domain Model, Environment Variables, Frontend Change Rules, Graphify, Installation and Running (+4 more)

### Community 44 - "PhilsLab — Handoff"
Cohesion: 0.07
Nodes (26): 10. Правила безопасных изменений, 11. Проверки перед handoff, 12. Рекомендуемый порядок следующих задач, 1. Назначение проекта, 2. Структура репозитория, 3. Адреса и порты, 4. Установка и запуск, 5. Backend-архитектура (+18 more)

### Community 45 - "Table.jsx"
Cohesion: 0.18
Nodes (18): numberContainsFilter(), renderAggregation(), rowsAreEqual(), Table(), textFilter(), EditableCell, getOptionLabel(), getOptionValue() (+10 more)

### Community 52 - "📘 Документация по фронтенду (React + Vite)"
Cohesion: 0.18
Nodes (11): `data/constants.js`, `data/enums.js`, Добавление новой страницы, 📘 Документация по фронтенду (React + Vite), 📦 Константы и перечисления, 🧭 Маршрутизация (Routing), 🔗 Полезные ссылки, 📌 Рекомендации по разработке (+3 more)

### Community 53 - "AGENTS.md"
Cohesion: 0.36
Nodes (3): PhilsLab, 📄 **STYLES.md** — Полный гайд по классам VSCode Design System, PhilsLab

### Community 54 - "🔐 Аутентификация и токен"
Cohesion: 0.40
Nodes (5): UserContext, WebSocket, 🔐 Аутентификация и токен, История изменений сущностей, Хуки для авторизации

### Community 55 - "attach_user_to_request"
Cohesion: 0.40
Nodes (5): middleware, Response, attach_user_to_request(), Request, Middleware to store user in request context

### Community 56 - "🚀 Запуск и сборка"
Cohesion: 0.50
Nodes (4): 🚀 Запуск и сборка, Обновление пакетов, Разработка (React), Установка зависимостей

### Community 57 - "🌐 Работа с API (Fetch)"
Cohesion: 0.50
Nodes (4): Обработка ошибок, Примеры использования, 🌐 Работа с API (Fetch), Функция `Fetch`

### Community 58 - "Backend Change Rules"
Cohesion: 0.67
Nodes (3): Backend Change Rules, Django, FastAPI

### Community 59 - "🧩 Переиспользуемые компоненты (UI Kit)"
Cohesion: 0.67
Nodes (3): Как использовать компонент:, Основные компоненты:, 🧩 Переиспользуемые компоненты (UI Kit)

## Knowledge Gaps
- **108 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+103 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `add_history()` connect `add_history` to `views/sample.py`, `fastapi/app/models/__init__.py`, `views/task.py`, `views/batch.py`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Task` connect `fastapi/app/models/__init__.py` to `views/task.py`, `add_history`, `views/batch.py`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `User` connect `admin.py` to `TableEditorConsumer`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `Task` (e.g. with `Batch` and `Protocol`) actually correct?**
  _`Task` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _108 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Fetch` be split into smaller, more focused modules?**
  _Cohesion score 0.09443665264142123 - nodes in this community are weakly interconnected._
- **Should `fastapi/app/models/__init__.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09288824383164006 - nodes in this community are weakly interconnected._