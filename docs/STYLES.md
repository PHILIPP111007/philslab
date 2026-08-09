## 📄 **STYLES.md** — Полный гайд по классам VSCode Design System

```markdown
# VSCode Design System — Style Guide

Полный справочник классов для компонентов в стиле Visual Studio Code Dark Theme.

---

## 📦 Базовые переменные

```css
--bg: #1e1e1e              /* Основной фон */
--bg-light: #252526        /* Светлый фон */
--bg-hover: #2a2d2e        /* Фон при наведении */
--bg-selected: #094771     /* Фон выделенного элемента */
--bg-active: #37373d       /* Фон активного элемента */

--border: #3c3c3c          /* Основная граница */
--border-light: #4a4a4a    /* Светлая граница */

--text: #cccccc            /* Основной текст */
--text-light: #d4d4d4      /* Светлый текст */
--text-dark: #858585       /* Тёмный текст */
--text-white: #ffffff      /* Белый текст */

--blue: #3794ff            /* Синий (акцент) */
--green: #4ec9b0           /* Зелёный (успех) */
--red: #f44747             /* Красный (ошибка) */
--orange: #ce9178          /* Оранжевый (предупреждение) */
--pink: #c586c0            /* Розовый */
--yellow: #dcdcaa          /* Жёлтый */

--radius-sm: 4px           /* Малое скругление */
--radius-md: 8px           /* Среднее скругление */
--radius-lg: 12px          /* Большое скругление */

--shadow: 0 8px 32px rgba(0, 0, 0, 0.6)  /* Тень */
--transition: 0.15s ease   /* Анимация */
```

---

## 🏗️ Структура приложения

### `.app`
Главный контейнер приложения.

```html
<div class="app">
  <!-- Контент -->
</div>
```

**Вложенные элементы:**
- `.app__title` — заголовок
- `.app__subtitle` — подзаголовок

---

## 📊 Статистика

### `.stats`
Контейнер для карточек статистики (grid-сетка).

```html
<div class="stats">
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
</div>
```

### `.stat-card`
Карточка статистики.

```html
<div class="stat-card">
  <div class="stat-card__icon">👥</div>
  <div class="stat-card__content">
    <div class="stat-card__label">Всего пользователей</div>
    <div class="stat-card__value">42</div>
  </div>
</div>
```

**CSS-переменная:** `--stat-color` — цвет левой границы.

---

## 🧩 Секции

### `.section`
Группировка контента.

```html
<section class="section">
  <h2 class="section__title">Заголовок секции</h2>
  <div class="section__content">
    <!-- Контент -->
  </div>
</section>
```

---

## 🔘 Кнопки (`.btn`)

### Базовое использование

```html
<button class="btn">Обычная кнопка</button>
```

### Варианты

| Класс | Описание |
|-------|----------|
| `btn-primary` | Синяя (основная) |
| `btn-secondary` | Серая (стандартная) |
| `btn-success` | Зелёная (успех) |
| `btn-danger` | Красная (опасное действие) |
| `btn-warning` | Оранжевая (предупреждение) |
| `btn-ghost` | Прозрачная |
| `btn-link` | Как ссылка |

### Размеры

| Класс | Размер |
|-------|--------|
| `btn-sm` | Маленькая (26px) |
| `btn-md` | Средняя (32px) — по умолчанию |
| `btn-lg` | Большая (40px) |

### С иконкой

```html
<button class="btn btn-primary">
  <span class="btn__icon">✏️</span>
  Редактировать
</button>
```

**Примеры:**
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">✅ Success</button>
<button class="btn btn-danger">⚠️ Danger</button>
<button class="btn btn-sm btn-primary">Маленькая</button>
<button class="btn btn-lg btn-primary">Большая</button>
<button class="btn btn-primary"><span class="btn__icon">🔍</span> Поиск</button>
```

---

## 📝 Поля ввода

### `.input` — текстовое поле

```html
<input type="text" class="input" placeholder="Введите текст..." />
```

**Модификаторы:**
- `.input--with-icon` — с иконкой (требует обёртку `.input-wrapper`)

### `.input-wrapper` — обёртка для поля с иконкой

```html
<div class="input-wrapper">
  <span class="input-wrapper__icon">🔍</span>
  <input type="text" class="input input--with-icon" placeholder="Поиск..." />
</div>
```

### `.textarea` — многострочное текстовое поле

```html
<textarea class="textarea" placeholder="Введите текст..." rows="3"></textarea>
```

**Модификаторы:**
- `.textarea--glow` — свечение при фокусе
- `.textarea--sm` — маленькое (60px)
- `.textarea--lg` — большое (120px)
- `.textarea--success` — зелёная граница
- `.textarea--error` — красная граница
- `.textarea--warning` — оранжевая граница
- `.textarea--pulse` — анимация пульсации
- `.textarea--code` — моноширинный шрифт (для кода)

### `.textarea-wrapper` — обёртка с подписью и счётчиком

```html
<div class="textarea-wrapper">
  <label class="textarea-wrapper__label">Описание</label>
  <textarea class="textarea" maxlength="200"></textarea>
  <div class="textarea-wrapper__counter">0 / 200</div>
</div>
```

**Модификаторы счётчика:**
- `.textarea-wrapper__counter--near-limit` — оранжевый (80%+)
- `.textarea-wrapper__counter--over-limit` — красный (превышен лимит)

### `.textarea-with-icon` — поле с иконкой

```html
<div class="textarea-with-icon">
  <span class="textarea-with-icon__icon">✏️</span>
  <textarea class="textarea" placeholder="Введите текст..."></textarea>
</div>
```

### `.select` — выпадающий список

```html
<select class="select">
  <option>Опция 1</option>
  <option>Опция 2</option>
</select>
```

---

## 🏷️ Бэйджи (`.badge`)

### Варианты

| Класс | Описание |
|-------|----------|
| `badge-primary` | Синий |
| `badge-secondary` | Серый |
| `badge-success` | Зелёный |
| `badge-danger` | Красный |
| `badge-warning` | Оранжевый |
| `badge-info` | Голубой |
| `badge-outline` | Прозрачный с границей |

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">✅ Готово</span>
<span class="badge badge-outline">Outline</span>
```

---

## 📢 Алерты (`.alert`)

```html
<div class="alert alert-info">
  <span class="alert__icon">ℹ️</span>
  <div>Информационное сообщение</div>
</div>
```

### Варианты

| Класс | Тип |
|-------|-----|
| `alert-info` | Информация |
| `alert-success` | Успех |
| `alert-warning` | Предупреждение |
| `alert-error` | Ошибка |

---

## 📊 Прогресс-бары

### `.progress-list` — список прогресс-баров

```html
<div class="progress-list">
  <div class="progress-item">
    <div class="progress-item__label">
      <span>Загрузка</span>
      <span>75%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill progress-fill--primary" style="width: 75%"></div>
    </div>
  </div>
</div>
```

### Типы заливки

| Класс | Цвет |
|-------|------|
| `progress-fill--primary` | Синий |
| `progress-fill--success` | Зелёный |
| `progress-fill--warning` | Оранжевый |
| `progress-fill--danger` | Красный |

---

## 🖱️ Контекстное меню (`.context-menu`)

```html
<div class="context-menu">
  <button class="context-menu__item">
    <span class="context-menu__icon">✏️</span>
    Редактировать
    <span class="context-menu__shortcut">Ctrl+E</span>
  </button>
  <div class="context-menu__separator"></div>
  <button class="context-menu__item context-menu__item--danger">
    <span class="context-menu__icon">🗑️</span>
    Удалить
  </button>
</div>
```

**Элементы:**
- `.context-menu__item` — пункт меню
- `.context-menu__item--danger` — опасный пункт (красный)
- `.context-menu__icon` — иконка
- `.context-menu__shortcut` — хоткей (справа)
- `.context-menu__separator` — разделитель

---

## 📋 Таблица (компонент Table)

### Структура

```html
<div class="table-container">
  <div class="table-toolbar">
    <div class="table-toolbar-left">
      <input class="table-search-input" placeholder="Поиск..." />
      <select class="table-select">
        <option>10 записей</option>
      </select>
    </div>
    <div class="table-toolbar-right">
      <button class="table-button-add">➕ Добавить</button>
      <button class="table-button">📊 Экспорт</button>
      <button class="table-button">📥 Импорт</button>
    </div>
  </div>

  <div class="table-column-visibility">
    <span class="table-visibility-label">Показать колонки:</span>
    <label class="table-visibility-checkbox">
      <input type="checkbox" /> Имя
    </label>
  </div>

  <div class="table-grouping-panel">
    <span class="table-grouping-label">Группировка:</span>
    <select class="table-select">
      <option>Без группировки</option>
    </select>
    <button class="table-small-button">✕ Очистить</button>
  </div>

  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th class="table-header">
            <div class="table-header-content">
              Имя
              <span class="table-header-sort-icon">↕</span>
            </div>
            <input class="table-header-filter" placeholder="Фильтр..." />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="table-row">
          <td class="table-cell">Анна</td>
        </tr>
        <tr class="table-row-selected">
          <td class="table-cell">Борис</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="table-footer">
    <div class="table-footer-info">
      Всего: <strong>42</strong> записей
      <span class="table-footer-selected">, выбрано: <strong>3</strong></span>
    </div>
    <div class="table-pagination">
      <button class="table-page-button">⟪</button>
      <button class="table-page-button">⟨</button>
      <span class="table-page-info">1 / 5</span>
      <button class="table-page-button">⟩</button>
      <button class="table-page-button">⟫</button>
    </div>
  </div>
</div>
```

---

## 🎯 Статусы в таблице

```html
<span class="badge status-active">🟢 Активен</span>
<span class="badge status-inactive">🔴 Неактивен</span>
<span class="badge status-pending">🟡 В ожидании</span>
<span class="badge status-blocked">⚫ Заблокирован</span>
```

---

## 📱 Адаптивность

Стили автоматически адаптируются под экраны:

| Размер | Медиа-запрос | Изменения |
|--------|--------------|-----------|
| Планшеты | `max-width: 768px` | Уменьшение отступов, колонки в столбец |
| Телефоны | `max-width: 480px` | Минимальные отступы, мелкий шрифт |

---

## 🚀 Быстрый старт

### 1. Подключите CSS

```html
<link rel="stylesheet" href="./App.css" />
```

### 2. Используйте компоненты

```html
<div class="app">
  <!-- Заголовок -->
  <h1 class="app__title">Моё приложение</h1>
  
  <!-- Кнопка -->
  <button class="btn btn-primary">Нажми меня</button>
  
  <!-- Поле ввода -->
  <input type="text" class="input" placeholder="Введите текст..." />
  
  <!-- Бэйдж -->
  <span class="badge badge-success">✅ Готово</span>
</div>
```

---

## 📦 Полный пример

```html
<div class="app">
  <h1 class="app__title">VSCode Design System</h1>
  
  <!-- Статистика -->
  <div class="stats">
    <div class="stat-card">
      <div class="stat-card__icon">👥</div>
      <div class="stat-card__content">
        <div class="stat-card__label">Пользователи</div>
        <div class="stat-card__value">42</div>
      </div>
    </div>
  </div>
  
  <!-- Кнопки -->
  <section class="section">
    <h2 class="section__title">Кнопки</h2>
    <div class="section__content">
      <button class="btn btn-primary">Primary</button>
      <button class="btn btn-secondary">Secondary</button>
      <button class="btn btn-success">Success</button>
    </div>
  </section>
  
  <!-- Поля -->
  <section class="section">
    <h2 class="section__title">Поля ввода</h2>
    <div class="inputs">
      <div class="input-group">
        <label class="input-group__label">Имя</label>
        <input type="text" class="input" placeholder="Введите имя..." />
      </div>
    </div>
  </section>
</div>
```

---

## 🔧 Кастомизация

Переопределите переменные в `:root`:

```css
:root {
  --blue: #your-color;
  --bg: #your-background;
  /* и т.д. */
}
```
