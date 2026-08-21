# 📘 Документация по фронтенду (React + Vite)

## 📁 Структура проекта

```
Frontend/react/app/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── API/                     # Работа с бэкендом
│   │   └── Fetch.js
│   ├── data/                    # Конфигурация
│   │   ├── constants.js
│   │   ├── enums.js
│   │   ├── context.js           # React Context (UserContext)
│   │   └── routes.jsx           # Маршруты приложения
│   ├── hooks/                   # Кастомные хуки
│   │   └── useAuth.js
│   ├── modules/                 # Утилиты
│   │   ├── notify.js
│   │   ├── token.js
│   │   └── rememberPage.js
│   ├── pages/                   # Страницы
│   │   ├── components/          # Переиспользуемые UI-компоненты
│   │   │   ├── Accordion/
│   │   │   ├── Alert/
│   │   │   ├── Badge/
│   │   │   ├── Button/
│   │   │   ├── Header/
│   │   │   ├── Table/
│   │   │   ├── ...
│   │   ├── AdminPage/
│   │   ├── Batch/
│   │   ├── Batches/
│   │   ├── Department/
│   │   ├── Login/
│   │   ├── MainPage/
│   │   ├── Protocol/
│   │   ├── Sample/
│   │   ├── Task/
│   │   └── User/
│   ├── App.jsx
│   └── main.jsx
└── public/
```

---

## 🧩 Переиспользуемые компоненты (UI Kit)

Все компоненты находятся в папке `src/pages/components/`. Они собраны по принципу **одна папка — один компонент** с файлами `.jsx` и `.css`.

### Основные компоненты:

| Компонент | Путь | Описание |
|-----------|------|----------|
| `Accordion` | `components/Accordion/Accordion.jsx` | Раскрывающийся список с возможностью множественного раскрытия. |
| `Alert` | `components/Alert/Alert.jsx` | Информационные/предупреждающие сообщения (типы: info, success, warning, error). |
| `Badge` | `components/Badge/Badge.jsx` | Метки с цветовыми вариантами (primary, secondary, success, danger, warning, info, outline). |
| `Button` | `components/Button/Button.jsx` | Кнопки с вариантами и размерами (sm, md, lg). Поддерживает иконки. |
| `LinkButton` | `components/LinkButton/LinkButton.jsx` | Кнопка-ссылка для навигации (использует `react-router-dom`). |
| `Header` | `components/Header/Header.jsx` | Шапка приложения с навигацией, темой и пользовательским меню. |
| `StatCard` | `components/StatCard/StatCard.jsx` | Карточка для статистики с иконкой, заголовком и значением. |
| `Table` | `components/Table/Table.jsx` | Мощная таблица на `@tanstack/react-table` с фильтрацией, сортировкой, пагинацией, экспортом, инлайн-редактированием. |
| `Spinner` | `components/Spinner/Spinner.jsx` | Индикатор загрузки. |
| `ProgressBar` | `components/ProgressBar/ProgressBar.jsx` | Прогресс-бар с вариантами (primary, success, danger, warning). |
| `SuspenseLoading` | `components/SuspenseLoading/SuspenseLoading.jsx` | Обёртка для React.lazy с отображением спиннера. |
| `ThemeToggle` | `components/Theme/ThemeToggle.jsx` | Переключатель тёмной/светлой темы. |
| `UserCard` | `components/UserCard/UserCard.jsx` | Карточка пользователя. |

### Как использовать компонент:

```jsx
import Button from '../components/Button/Button';

function MyPage() {
  return <Button variant="primary" size="sm" onClick={handleClick}>Нажми</Button>;
}
```

> **Важно:** всегда используйте готовые компоненты вместо создания собственных стилей. Это гарантирует единообразие интерфейса.

---

## 🌐 Работа с API (Fetch)

### Функция `Fetch`

Обёртка над `fetch` для всех запросов к бэкенду. Находится в `src/API/Fetch.js`.

**Сигнатура:**

```js
Fetch({
  api_version,      // APIVersion.V1 или APIVersion.V2
  action,          // строка — часть URL после /api/v{version}/
  method,          // HttpMethod.GET | POST | PUT | DELETE
  body,            // объект для POST/PUT (будет преобразован в JSON)
  token,           // опционально, если передан — используется вместо токена из хранилища
  is_uploading_file // boolean — если true, Content-Type не устанавливается (для FormData)
})
```

**Возвращает:** `Promise<Object>` — ответ от сервера (уже распарсенный JSON). В ответе всегда есть поле `ok` (boolean) и при ошибке — `error` или `detail`.

### Примеры использования

**GET-запрос:**

```js
import Fetch from '../../API/Fetch';
import { HttpMethod, APIVersion } from '../../data/enums';

const data = await Fetch({
  api_version: APIVersion.V2,
  action: 'users/',
  method: HttpMethod.GET,
});
if (data?.ok) {
  // работаем с data.data
}
```

**POST с телом:**

```js
const res = await Fetch({
  api_version: APIVersion.V2,
  action: 'task/',
  method: HttpMethod.POST,
  body: { name: 'Новая задача', priority: 'high' },
});
if (res?.ok) {
  notify_success('Задача создана');
}
```

**Загрузка файла:**

```js
const formData = new FormData();
formData.append('file', file);

const res = await Fetch({
  api_version: APIVersion.V2,
  action: 'upload/',
  method: HttpMethod.POST,
  body: formData,
  is_uploading_file: true,
});
```

### Обработка ошибок

- Если ответ имеет `ok: false`, функция вызовет `notify_error` с текстом ошибки.
- Ошибки сети логируются в консоль.
- Вы можете обрабатывать ошибки самостоятельно, проверяя `res?.ok`.

---

## 🔐 Аутентификация и токен

- Токен хранится в `localStorage` (или `sessionStorage`) через модуль `modules/token.js`.
- Функции: `getToken()`, `setToken(token)`, `removeToken()`.
- `Fetch` автоматически подставляет токен в заголовок `Authorization: Token <token>`, если он доступен.
- Для выхода из системы используйте `removeToken()` и перенаправление на страницу входа.

### UserContext

Контекст текущего пользователя определён в `data/context.js`. Содержит:
- `user` — объект с полями `id`, `username`, `first_name`, `last_name`, `email`, `department`, `descr`.
- `setUser` — функция для обновления.

**Использование:**

```js
import { useContext } from 'react';
import { UserContext } from '../../data/context';

const { user, setUser } = useContext(UserContext);
```

### Хуки для авторизации

- `useAuth()` — выполняет вход, получает токен и обновляет контекст.
- `useSetUser()` — загружает данные пользователя по `username` и сохраняет в контекст (используется на странице `User`).

### WebSocket

Редактор таблицы подключается по `/ws/v1/table/{username}/`. Токен не передаётся
в URL: после открытия соединения клиент отправляет его первым JSON-сообщением:

```js
ws.send(JSON.stringify({ type: 'authenticate', token }));
```

Сервер проверяет DRF-токен, активность пользователя и соответствие `username` в
маршруте. До успешной аутентификации соединение не входит в группу редакторов.

---

## 🧭 Маршрутизация (Routing)

Все маршруты приложения находятся в `src/data/routes.jsx`. Используется `react-router-dom` v6.

### Добавление новой страницы

1. Создайте папку в `src/pages/НазваниеСтраницы/` и внутри — `НазваниеСтраницы.jsx`.
2. Определите компонент (экспорт по умолчанию).
3. В `routes.jsx` импортируйте компонент и добавьте новый объект в массив `routes`:

```jsx
import NewPage from '../pages/NewPage/NewPage';

// внутри массива
{
  path: '/newpage/:username?',
  element: <NewPage />,
}
```

4. Если страница требует аутентификации — оберните в `ProtectedRoute` (компонент уже есть в роутинге).

> **Важно:** для страниц, где используется `params.username`, передавайте его в компоненте для запоминания страницы через `rememberPage`.

---

## 📦 Константы и перечисления

### `data/enums.js`

Хранит все перечисления, используемые на фронтенде:

```js
export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

export const APIVersion = {
  V1: '1',
  V2: '2',
};

export const Priority = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};
```

### `data/constants.js`

Глобальные константы, например, URL для разных сред:

```js
export const DEVELOPMENT = import.meta.env.VITE_DEVELOPMENT || '0';
export const PROD_FETCH_URL = import.meta.env.VITE_PROD_FETCH_URL || '';
export const DEVELOPMENT_DJANGO_FETCH_URL = import.meta.env.VITE_DEVELOPMENT_DJANGO_FETCH_URL || 'http://localhost:1972/';
export const DEVELOPMENT_FASTAPI_FETCH_URL = import.meta.env.VITE_DEVELOPMENT_FASTAPI_FETCH_URL || 'http://localhost:1974/';
```

---

## 🔔 Уведомления (`modules/notify.js`)

Обёртка над `react-hot-toast` для единообразного отображения уведомлений.

**Функции:**
- `notify(msg)` — обычное уведомление.
- `notify_success(msg)` — зелёное (успех).
- `notify_error(msg)` — красное (ошибка).

**Использование:**

```js
import { notify_success, notify_error } from '../../modules/notify';

if (data?.ok) {
  notify_success('Операция выполнена');
} else {
  notify_error(data?.error || 'Что-то пошло не так');
}
```

Каждый вызов автоматически удаляет предыдущие уведомления, чтобы не было нагромождения.

---

## 🚀 Запуск и сборка

Все команды для управления проектом собраны в корневом `Makefile`.

### Разработка (React)

```bash
make react
```

Эта команда:
- Переходит в папку `Frontend/react/app/`
- Устанавливает переменные окружения `VITE_DEVELOPMENT=1`, `VITE_PROD_SERVER_HOST=0.0.0.0`, `VITE_PROD_SERVER_PORT=80`
- Запускает `npm run dev` (Vite dev-сервер)

Сервер будет доступен по адресу `http://localhost:5173`.

### Обновление пакетов

```bash
make update_js_env
```

Выполняет `sudo npm update` в папке React-приложения.

### Установка зависимостей

Если вы впервые клонируете репозиторий, выполните:

```bash
make create_env
```

Это создаст виртуальные окружения для Django и FastAPI, а также установит npm-зависимости для React.

---

## 🧪 Стилизация

Все стили построены на CSS-переменных (см. `App.css`). Используйте существующие классы из документации [STYLES.md](STYLES.md). Для новых компонентов следуйте этой системе:

- Используйте БЭМ-нейминг: `.block__element--modifier`.
- Встраивайте переменные: `var(--bg)`, `var(--text)`, `var(--blue)` и т.д.
- Для анимаций используйте `var(--transition)`.

> Пример: если нужна карточка с заливкой, используйте класс `.section-filled` из основного CSS.

---

## 📌 Рекомендации по разработке

1. **Всегда используйте существующие UI-компоненты** — это экономит время и сохраняет единообразие.
2. **Для запросов к API используйте `Fetch`** — он уже обрабатывает токены и ошибки.
3. **Добавляйте новые маршруты только через `routes.jsx`** и проверяйте наличие `username` в URL.
4. **Храните все строковые константы и перечисления в `data/`**, чтобы избежать магических чисел.
5. **Уведомления отправляйте через `notify.js`** — это гарантирует единый стиль.
6. **Следуйте структуре папок** — каждая страница/компонент в отдельной папке со своим CSS.
7. **Используйте `React.memo()` и `useMemo` там, где это необходимо** для оптимизации таблиц и больших списков.

---

## 🔗 Полезные ссылки

- [React Router v6](https://reactrouter.com/home)
- [React Hot Toast](https://react-hot-toast.com/)
- [Vite](https://vitejs.dev/)

---

*Актуально на август 2026 г. При обновлении зависимостей или добавлении нового функционала дополняйте этот документ.*
