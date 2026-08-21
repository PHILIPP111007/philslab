# Graph Report - philslab  (2026-08-21)

## Corpus Check
- 139 files · ~41,580 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 565 nodes · 1261 edges · 52 communities (28 shown, 24 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `528fb5fb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Fetch
- fastapi/app/models/__init__.py
- admin.py
- request_body/__init__.py
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
- @babel/core
- Table.jsx
- fastapi/app/services/__init__.py
- babel-plugin-react-compiler
- eslint-plugin-react-hooks
- @types/react-dom
- vite

## God Nodes (most connected - your core abstractions)
1. `Fetch()` - 34 edges
2. `rememberPage()` - 26 edges
3. `Task` - 21 edges
4. `User` - 17 edges
5. `Header()` - 15 edges
6. `User` - 15 edges
7. `Batch` - 15 edges
8. `serialize_batch()` - 15 edges
9. `serialize_task()` - 15 edges
10. `useDepartments()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Sample` --uses--> `MaterialType`  [INFERRED]
  Services/fastapi/app/models/sample.py → Services/fastapi/app/enums/material_type.py
- `Task` --uses--> `Priority`  [INFERRED]
  Services/fastapi/app/models/task.py → Services/fastapi/app/enums/priority.py
- `useAuth()` --calls--> `getToken()`  [EXTRACTED]
  Frontend/react/app/src/hooks/useAuth.js → Frontend/react/app/src/modules/token.js
- `AllBatches()` --calls--> `rememberPage()`  [EXTRACTED]
  Frontend/react/app/src/pages/Batch/AllBatches.jsx → Frontend/react/app/src/modules/rememberPage.js
- `MainPage()` --calls--> `rememberPage()`  [EXTRACTED]
  Frontend/react/app/src/pages/MainPage/MainPage.jsx → Frontend/react/app/src/modules/rememberPage.js

## Import Cycles
- None detected.

## Communities (52 total, 24 thin omitted)

### Community 0 - "Fetch"
Cohesion: 0.10
Nodes (49): Fetch(), parseResponse(), reportApiError(), buildSamplePayload(), nullableNumber(), nullableText(), DEVELOPMENT, DEVELOPMENT_DJANGO_FETCH_URL (+41 more)

### Community 1 - "fastapi/app/models/__init__.py"
Cohesion: 0.08
Nodes (43): ActionType, Enum, str, Тип действия в истории, Batch, SQLModel, Батч (партия) образцов., Количество подобразцов в батче. (+35 more)

### Community 2 - "admin.py"
Cohesion: 0.07
Nodes (29): AbstractBaseUser, PermissionsMixin, register, BatchAdmin, HistoryInline, ProtocolAdmin, QueryHistoryAdmin, Inline для истории задачи (+21 more)

### Community 3 - "request_body/__init__.py"
Cohesion: 0.07
Nodes (51): middleware, Response, Priority, Enum, str, attach_user_to_request(), Request, # TODO: add (+43 more)

### Community 4 - "views/department.py"
Cohesion: 0.32
Nodes (6): Departments, Enum, get_departments(), get, Request, Возвращает список доступных отделов (значения enum Departments).

### Community 5 - "dependencies"
Cohesion: 0.13
Nodes (15): exceljs, dependencies, exceljs, react, react-dom, react-hot-toast, react-plotly.js, react-router-dom (+7 more)

### Community 6 - "devDependencies"
Cohesion: 0.13
Nodes (15): eslint, @eslint/js, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-refresh, globals (+7 more)

### Community 7 - "views/batch.py"
Cohesion: 0.24
Nodes (22): BatchCreate, BatchUpdate, BaseModel, serialize_batch(), add_sample_to_batch(), add_task_to_batch(), create_batch(), delete_batch() (+14 more)

### Community 8 - "views/sample.py"
Cohesion: 0.13
Nodes (25): MaterialType, Enum, str, Допустимые типы биоматериала образца., BaseModel, Схема для создания нового образца., Схема для обновления образца., SampleCreate (+17 more)

### Community 9 - "views/task.py"
Cohesion: 0.14
Nodes (32): Any, Batch, Sample, _iso(), Stable response serializers for the FastAPI API. Keeping response construction…, Serialize a task and its already-loaded relationships. Samples are derived from…, serialize_batch_summary(), serialize_sample() (+24 more)

### Community 10 - "App.jsx"
Cohesion: 0.19
Nodes (9): App(), useAuth(), ProtectedRoute(), SuspenseLoading(), ThemeContext, ThemeProvider(), useTheme(), ThemeToggle() (+1 more)

### Community 11 - "TableEditorConsumer"
Cohesion: 0.12
Nodes (9): AsyncWebsocketConsumer, database_sync_to_async, TableEditorConsumer, Enum, WebSocketGroup, Create user: POST http://127.0.0.1:1972/api/v1/auth/users/ {"username":…, Use this endpoint to logout user (remove user authentication token)., TokenCreateView (+1 more)

### Community 32 - "package.json"
Cohesion: 0.29
Nodes (6): name, overrides, uuid, private, type, version

### Community 36 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 43 - "AGENTS.md — Instructions for Working with PhilsLab"
Cohesion: 0.04
Nodes (43): AGENTS.md — Instructions for Working with PhilsLab, Architecture and Routing, Backend Change Rules, Checks Before Handoff, Django, Domain Model, Environment Variables, FastAPI (+35 more)

### Community 45 - "Table.jsx"
Cohesion: 0.18
Nodes (17): numberContainsFilter(), renderAggregation(), Table(), textFilter(), EditableCell, getOptionLabel(), getOptionValue(), TableRow (+9 more)

## Knowledge Gaps
- **82 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Task` connect `fastapi/app/models/__init__.py` to `views/task.py`, `request_body/__init__.py`, `views/batch.py`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `Batch` connect `fastapi/app/models/__init__.py` to `views/sample.py`, `views/task.py`, `views/batch.py`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Protocol` connect `fastapi/app/models/__init__.py` to `views/task.py`, `request_body/__init__.py`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `Task` (e.g. with `Batch` and `Protocol`) actually correct?**
  _`Task` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `User` (e.g. with `Batch` and `Protocol`) actually correct?**
  _`User` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Fetch` be split into smaller, more focused modules?**
  _Cohesion score 0.0987460815047022 - nodes in this community are weakly interconnected._