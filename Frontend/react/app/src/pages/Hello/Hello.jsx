import { useState, useRef, useEffect } from 'react'
import Table from "../components/Table/Table"
import { useTheme } from '../components/Theme/ThemeContext'
import UserCard from "../components/UserCard/UserCard"
import Spinner from "../components/Spinner/Spinner"
import List from '../components/List/List'
import Accordion from '../components/Accordion/Accordion'
import Header from '../components/Header/Header'
import StatCard from '../components/StatCard/StatCard'
import Button from '../components/Button/Button'
import Alert from '../components/Alert/Alert'
import Badge from '../components/Badge/Badge'
import ProgressBar from '../components/ProgressBar/ProgressBar'

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ С ТЕМОЙ
// ============================================
export default function Hello() {
    const { theme, isDark, toggleTheme } = useTheme()
    const [users, setUsers] = useState([
        { id: 1, name: 'Анна Кузнецова', email: 'anna@example.com', age: 25, city: 'Москва', status: 'Активен', salary: 85000, department: 'Разработка', experience: 3 },
        { id: 2, name: 'Борис Смирнов', email: 'boris@example.com', age: 32, city: 'СПб', status: 'Неактивен', salary: 62000, department: 'Дизайн', experience: 7 },
        { id: 3, name: 'Виктор Петров', email: 'victor@example.com', age: 28, city: 'Казань', status: 'Активен', salary: 73000, department: 'Маркетинг', experience: 4 },
        { id: 4, name: 'Галина Иванова', email: 'galina@example.com', age: 35, city: 'Москва', status: 'В ожидании', salary: 91000, department: 'Финансы', experience: 10 },
        { id: 5, name: 'Дмитрий Соколов', email: 'dmitry@example.com', age: 29, city: 'Новосибирск', status: 'Активен', salary: 68000, department: 'Разработка', experience: 5 },
        { id: 6, name: 'Елена Морозова', email: 'elena@example.com', age: 27, city: 'Екатеринбург', status: 'Активен', salary: 79000, department: 'HR', experience: 3 },
        { id: 7, name: 'Иван Волков', email: 'ivan@example.com', age: 41, city: 'Нижний Новгород', status: 'Заблокирован', salary: 54000, department: 'Аутсорс', experience: 15 },
        { id: 8, name: 'Мария Лебедева', email: 'maria@example.com', age: 23, city: 'Москва', status: 'Активен', salary: 67000, department: 'Дизайн', experience: 1 },
    ])

    // ============================================
    // КОЛОНКИ ДЛЯ ТАБЛИЦЫ
    // ============================================
    const columns = [
        { accessorKey: 'name', header: 'Имя', size: 180, required: true },
        { accessorKey: 'age', header: 'Возраст', size: 80, editType: 'number', required: true },
        { accessorKey: 'city', header: 'Город', size: 140, required: true },
        {
            accessorKey: 'department',
            header: 'Отдел',
            size: 130,
            editType: 'select',
            options: ['Разработка', 'Дизайн', 'Маркетинг', 'Финансы', 'HR', 'Аутсорс'],
            required: true,
        },
        { accessorKey: 'experience', header: 'Опыт (лет)', size: 100, editType: 'number', required: true },
        {
            accessorKey: 'status',
            header: 'Статус',
            size: 130,
            editType: 'select',
            options: ['Активен', 'Неактивен', 'В ожидании', 'Заблокирован'],
            defaultValue: 'Активен',
            cell: ({ getValue }) => {
                const status = getValue()
                const map = {
                    'Активен': { class: 'status-active', emoji: '🟢' },
                    'Неактивен': { class: 'status-inactive', emoji: '🔴' },
                    'В ожидании': { class: 'status-pending', emoji: '🟡' },
                    'Заблокирован': { class: 'status-blocked', emoji: '⚫' },
                }
                const { class: cls, emoji } = map[status] || {}
                return <span className={`badge ${cls}`}>{emoji} {status}</span>
            },
            conditionalFormatting: (value, row, column) => {
                // value – значение ячейки (age)
                // row – вся строка данных
                if (row.age > row.experience) {
                    return { backgroundColor: '#ffcccc', color: '#900' }
                }
                return {}
            }
        },
        {
            accessorKey: 'salary',
            header: 'Зарплата',
            size: 140,
            editType: 'number',
            defaultValue: 50000,
            cell: ({ getValue }) => {
                const value = getValue()
                return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
            },
        },
    ]

    // ---------- КОЛОНКИ ТАБЛИЦЫ (обновлены с учётом zlims_id) ----------
    // const columns = [
    //     {
    //         accessorKey: 'id',
    //         header: 'ID',
    //         size: 70,
    //         enableEditing: false,
    //         enableSorting: true,
    //     },
    //     {
    //         accessorKey: 'name',
    //         header: 'имя',
    //         size: 80,
    //         editType: 'text',
    //     },
    //     {
    //         accessorKey: 'zlims_id',
    //         header: 'ZLIMS ID',
    //         size: 120,
    //         editType: 'text',
    //     },
    //     {
    //         accessorKey: 'some_number',
    //         header: 'Число (плохо когда красное)',
    //         size: 120,
    //         editType: 'number',
    //         conditionalFormatting: (value, row, column) => {
    //             if (value > 100) {
    //                 return { backgroundColor: '#ffcccc', color: '#900' }
    //             }
    //             return {}
    //         },
    //         aggregation: 'sum',
    //     },
    //     {
    //         accessorKey: 'descr',
    //         header: 'Описание',
    //         size: 300,
    //         editType: 'text',
    //     },
    //     {
    //         accessorKey: 'timestamp',
    //         header: 'Дата создания',
    //         size: 180,
    //         enableEditing: false,
    //         cell: ({ getValue }) => {
    //             const val = getValue()
    //             if (!val) return '—'
    //             return new Date(val).toLocaleString('ru-RU')
    //         },
    //     },
    //     {
    //         id: 'days_ago',
    //         header: 'Дней назад',
    //         size: 100,
    //         enableEditing: false,
    //         accessorFn: (row) => {
    //             if (!row.timestamp) return '—'
    //             const created = new Date(row.timestamp)
    //             const now = new Date()
    //             const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24))
    //             return diff
    //         },
    //         cell: ({ getValue }) => {
    //             const days = getValue()
    //             if (days === '—') return '—'
    //             return `${days} дн.`
    //         },
    //     },
    //     {
    //         id: 'full_info',
    //         header: 'zlims_id + some_number',
    //         size: 250,
    //         enableEditing: false,
    //         accessorFn: (row) => {
    //             return `${row.zlims_id || ''}_${row.some_number || 0}`
    //         },
    //     }
    // ]

    // ============================================
    // ОБРАБОТЧИКИ
    // ============================================
    const handleDataChange = (newData, meta) => {
        setUsers(newData)

        // meta содержит:
        // - id: ID измененной записи
        // - operation: 'edit' | 'delete' | 'add'
        // - data: сама запись (для edit/delete/add)
        // - column: имя колонки (только для inline-edit)
        // - value: новое значение (только для inline-edit)

        console.log('📊 Изменение данных:')
        console.log('  - ID:', meta?.id)
        console.log('  - Операция:', meta?.operation)
        console.log('  - Данные:', meta?.data)
        if (meta?.operation === 'edit' && meta?.column) {
            console.log('  - Колонка:', meta?.column)
            console.log('  - Новое значение:', meta?.value)
        }
        console.log('  - Всего записей:', newData.length)
    }

    const handleEditUser = (user) => {
        console.log('✏️ Редактировать:', user.name)
        alert(`Редактирование пользователя: ${user.name}`)
    }

    const handleDeleteUser = (user) => {
        console.log('🗑️ Удалить:', user.name)
        if (confirm(`Удалить пользователя ${user.name}?`)) {
            setUsers(prev => prev.filter(u => u.id !== user.id))
        }
    }

    const handleViewUser = (user) => {
        console.log('👁️ Просмотр:', user.name)
        alert(`Просмотр пользователя: ${user.name}`)
    }


    // ============================================
    // РАСЧЕТ СТАТИСТИКИ
    // ============================================
    const totalSalary = users.reduce((sum, u) => sum + u.salary, 0)
    const avgSalary = totalSalary / users.length
    const activeUsers = users.filter(u => u.status === 'Активен').length
    const departments = [...new Set(users.map(u => u.department))].length



    const accordionItems = [
        {
            id: 1,
            title: '📁 Проект "Альфа"',
            icon: '🚀',
            badge: 'Активен',
            badgeVariant: 'success',
            content: (
                <div>
                    <p><strong>Описание:</strong> Разработка основного продукта</p>
                    <p><strong>Статус:</strong> В работе</p>
                    <p><strong>Команда:</strong> 5 человек</p>
                    <div className="progress-item" style={{ marginTop: '8px' }}>
                        <div className="progress-item__label">
                            <span>Прогресс</span>
                            <span>75%</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill progress-fill--primary" style={{ width: '75%' }} />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 2,
            title: '📁 Проект "Бета"',
            icon: '🔬',
            badge: 'В ожидании',
            badgeVariant: 'warning',
            content: (
                <div>
                    <p><strong>Описание:</strong> Исследование новых технологий</p>
                    <p><strong>Статус:</strong> Планирование</p>
                    <p><strong>Команда:</strong> 3 человека</p>
                    <div className="progress-item" style={{ marginTop: '8px' }}>
                        <div className="progress-item__label">
                            <span>Прогресс</span>
                            <span>20%</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill progress-fill--warning" style={{ width: '20%' }} />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 3,
            title: '📁 Проект "Гамма"',
            icon: '🎯',
            badge: 'Завершен',
            badgeVariant: 'primary',
            content: (
                <div>
                    <p><strong>Описание:</strong> Запуск продукта на рынок</p>
                    <p><strong>Статус:</strong> Завершен</p>
                    <p><strong>Команда:</strong> 8 человек</p>
                    <div className="progress-item" style={{ marginTop: '8px' }}>
                        <div className="progress-item__label">
                            <span>Прогресс</span>
                            <span>100%</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill progress-fill--success" style={{ width: '100%' }} />
                        </div>
                    </div>
                </div>
            ),
        },
    ]

    const [items, setItems] = useState([
        {
            id: 1,
            label: 'Анна Кузнецова',
            subtext: 'anna@example.com • Разработка',
            icon: '👩‍💻',
            status: 'Активен',
            statusClass: 'status-active',
            badge: '3 года',
            badgeVariant: 'primary',
            meta: { Отдел: 'Разработка', Проекты: '5' }
        },
        {
            id: 2,
            label: 'Борис Смирнов',
            subtext: 'boris@example.com • Дизайн',
            icon: '👨‍🎨',
            status: 'Неактивен',
            statusClass: 'status-inactive',
            badge: '7 лет',
            badgeVariant: 'secondary',
            meta: { Отдел: 'Дизайн', Проекты: '3' }
        },
        {
            id: 3,
            label: 'Виктор Петров',
            subtext: 'victor@example.com • Маркетинг',
            icon: '📊',
            status: 'Активен',
            statusClass: 'status-active',
            badge: '4 года',
            badgeVariant: 'success',
            meta: { Отдел: 'Маркетинг', Проекты: '8' }
        },
        {
            id: 4,
            label: 'Галина Иванова',
            subtext: 'galina@example.com • Финансы',
            icon: '💰',
            status: 'В ожидании',
            statusClass: 'status-pending',
            badge: '10 лет',
            badgeVariant: 'warning',
            meta: { Отдел: 'Финансы', Проекты: '2' }
        },
    ])

    const handleItemClick = (item) => {
        console.log('Клик по элементу:', item)
    }

    const handleItemDelete = (item) => {
        setItems(prev => prev.filter(i => i.id !== item.id))
        console.log('Удален элемент:', item)
    }

    const handleItemEdit = (item) => {
        console.log('Редактирование элемента:', item)
        alert(`Редактирование: ${item.label}`)
    }

    // ============================================
    // СОСТОЯНИЕ ДЛЯ ПРОГРЕСС-БАРА
    // ============================================
    const [progress, setProgress] = useState(0)
    const [isRunning, setIsRunning] = useState(true)
    const intervalRef = useRef(null)

    // Функция обновления прогресса
    const updateProgress = () => {
        setProgress(prev => {
            const newValue = prev + 10
            if (newValue >= 100) {
                return 0 // Сбрасываем до 0
            }
            return newValue
        })
    }

    // Запуск интервала
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(updateProgress, 1000)
        } else {
            clearInterval(intervalRef.current)
        }

        return () => clearInterval(intervalRef.current)
    }, [isRunning])

    // Ручное управление
    const handleStart = () => setIsRunning(true)
    const handleStop = () => setIsRunning(false)
    const handleReset = () => {
        setProgress(0)
        setIsRunning(false)
    }

    // ============================================
    // РЕНДЕР
    // ============================================
    return (
        <>
            <Header />
            <div className={`app theme-transition`}>

                {/* 🔥 Sticky Header */}

                {/* ШАПКА С ПЕРЕКЛЮЧАТЕЛЕМ ТЕМЫ */}
                <header className="app__header">
                    <div className="app__header-left">
                        <h1 className="app__title">🎨 VSCode Design System</h1>
                        <p className="app__subtitle">Компоненты в стиле Visual Studio Code Dark Theme</p>
                    </div>
                </header>

                {/* ======================================== */}
                {/* ТАБЛИЦА */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">📊 Таблица</h2>
                    <Table
                        data={users}
                        columns={columns}
                        pageSize={10}
                        enableSelection
                        enableSorting
                        enableFiltering
                        enableGrouping
                        enablePagination
                        enableColumnVisibility
                        enableAddButton
                        enableExport
                        enableImport
                        onDataChange={handleDataChange}
                    />
                </section>

                {/* ======================================== */}
                {/* СТАТИСТИКА */}
                {/* ======================================== */}
                <div className="stats">
                    <StatCard icon="👥" label="Всего пользователей" value={users.length} color="var(--blue)" />
                    <StatCard icon="✅" label="Активных" value={activeUsers} color="var(--green)" />
                    <StatCard icon="💰" label="Средняя зарплата" value={new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(avgSalary)} color="var(--orange)" />
                    <StatCard icon="🏢" label="Отделов" value={departments} color="var(--pink)" />
                </div>

                <section className="section">
                    <h2 className="section__title">🔄 Спиннеры загрузки</h2>

                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Spinner size="sm" />
                            <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginTop: '8px' }}>Small</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Spinner size="md" variant="primary" />
                            <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginTop: '8px' }}>Medium</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Spinner size="lg" variant="success" label="Загрузка..." />
                            <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginTop: '8px' }}>Large с текстом</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Spinner size="xl" variant="danger" />
                            <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginTop: '8px' }}>XL</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Spinner size="md" variant="warning" />
                            <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginTop: '8px' }}>Warning</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Spinner size="md" variant="secondary" />
                            <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginTop: '8px' }}>Secondary</div>
                        </div>

                        {/* Белый спиннер (для темного фона) */}
                        <div style={{ textAlign: 'center', background: 'var(--bg-selected)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                            <Spinner size="md" variant="white" />
                            <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginTop: '8px' }}>White</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Spinner size="md" variant="secondary" type='bars' />
                            <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginTop: '8px' }}>Warning</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <Spinner size="md" variant="secondary" type='dots' />
                            <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginTop: '8px' }}>Warning</div>
                        </div>
                    </div>
                </section>

                {/* ======================================== */}
                {/* АЛЬТЕРНАТИВНЫЙ СПИННЕР С ДОТАМИ */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">🔵 Спиннер с точками</h2>

                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="spinner spinner--dots">
                            <div className="spinner__dot"></div>
                            <div className="spinner__dot"></div>
                            <div className="spinner__dot"></div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="spinner spinner--dots">
                                <div className="spinner__dot" style={{ background: 'var(--green)' }}></div>
                                <div className="spinner__dot" style={{ background: 'var(--green)' }}></div>
                                <div className="spinner__dot" style={{ background: 'var(--green)' }}></div>
                            </div>
                            <span style={{ color: 'var(--text-dark)', fontSize: '13px' }}>Загрузка данных...</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="spinner spinner--dots">
                                <div className="spinner__dot" style={{ background: 'var(--red)' }}></div>
                                <div className="spinner__dot" style={{ background: 'var(--red)' }}></div>
                                <div className="spinner__dot" style={{ background: 'var(--red)' }}></div>
                            </div>
                            <span style={{ color: 'var(--text-dark)', fontSize: '13px' }}>Обработка...</span>
                        </div>
                    </div>
                </section>

                {/* ======================================== */}
                {/* КНОПКИ */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">🔘 Кнопки</h2>
                    <div className="section__content">
                        <Button variant="primary" onClick={() => alert('Primary!')}>Primary</Button>
                        <Button variant="secondary" onClick={() => alert('Secondary!')}>Secondary</Button>
                        <Button variant="success" onClick={() => alert('Success!')}>✅ Success</Button>
                        <Button variant="danger" onClick={() => alert('Danger!')}>⚠️ Danger</Button>
                        <Button variant="warning" onClick={() => alert('Warning!')}>⚡ Warning</Button>
                        <Button variant="ghost" onClick={() => alert('Ghost!')}>👻 Ghost</Button>
                        <Button variant="link" onClick={() => alert('Link!')}>Link</Button>
                    </div>
                    <div className="section__content" style={{ marginTop: '8px' }}>
                        <Button variant="primary" size="sm" icon="➕">Small</Button>
                        <Button variant="primary" size="md" icon="✏️">Medium</Button>
                        <Button variant="primary" size="lg" icon="📦">Large</Button>
                        <Button variant="secondary" icon="🔍">Search</Button>
                        <Button variant="ghost" icon="⚙️">Settings</Button>
                    </div>
                </section>

                {/* ======================================== */}
                {/* ПОЛЯ ВВОДА */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">📝 Поля ввода</h2>
                    <div className="inputs">
                        <div className="input-group">
                            <label className="input-group__label">Обычное поле</label>
                            <input type="text" className="input" placeholder="Введите текст..." defaultValue="Пример текста" />
                        </div>
                        <div className="input-group">
                            <label className="input-group__label">Поле с иконкой</label>
                            <div className="input-wrapper">
                                <span className="input-wrapper__icon">🔍</span>
                                <input type="text" className="input input--with-icon" placeholder="Поиск..." />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-group__label">Выпадающий список</label>
                            <select className="select">
                                <option>Опция 1</option>
                                <option>Опция 2</option>
                                <option>Опция 3</option>
                                <option>Опция 4</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-group__label">Текстовое поле</label>
                            <textarea className="textarea textarea--glow" placeholder="Введите многострочный текст..." rows="3" />
                        </div>
                    </div>
                </section>

                {/* ======================================== */}
                {/* БЭЙДЖИ */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">🏷️ Бэйджи</h2>
                    <div className="section__content">
                        <Badge variant="primary">Primary</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="success">✅ Success</Badge>
                        <Badge variant="danger">⚠️ Danger</Badge>
                        <Badge variant="warning">⚡ Warning</Badge>
                        <Badge variant="info">ℹ️ Info</Badge>
                        <Badge variant="outline">Outline</Badge>
                    </div>
                </section>

                {/* ======================================== */}
                {/* АЛЕРТЫ */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">📢 Алerts</h2>
                    <Alert type="info" icon="ℹ️">
                        <strong>Информация:</strong> Это информационное сообщение для пользователя.
                    </Alert>
                    <Alert type="success" icon="✅">
                        <strong>Успех:</strong> Операция выполнена успешно!
                    </Alert>
                    <Alert type="warning" icon="⚠️">
                        <strong>Предупреждение:</strong> Пожалуйста, проверьте введенные данные.
                    </Alert>
                    <Alert type="error" icon="❌">
                        <strong>Ошибка:</strong> Произошла ошибка при выполнении операции.
                    </Alert>
                </section>

                {/* ======================================== */}
                {/* ПРОГРЕСС-БАРЫ */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">📊 Прогресс-бары</h2>
                    <div className="progress-list">
                        <ProgressBar variant="secondary" text="Загрузка данных" progress={75} />
                        <ProgressBar variant="success" text="Обработка" progress={45} />
                    </div>
                </section>


                {/* ======================================== */}
                {/* ПРОГРЕСС-БАРЫ С АНИМАЦИЕЙ */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">📊 Прогресс-бары (анимированные)</h2>

                    {/* Управление */}
                    <div className="progress-controls" style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary btn-sm" onClick={handleStart}>
                            ▶️ Старт
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handleStop}>
                            ⏸️ Стоп
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={handleReset}>
                            ⏹️ Сброс
                        </button>
                        <span style={{ color: 'var(--text-dark)', fontSize: '13px', display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                            Статус: {isRunning ? '🔄 Запущен' : '⏸️ Остановлен'}
                        </span>
                    </div>

                    {/* Прогресс-бар */}
                    <div className="progress-list">
                        <div className="progress-item">
                            <div className="progress-item__label">
                                <span>Загрузка данных</span>
                                <span style={{ fontWeight: 'bold', color: progress >= 80 ? 'var(--green)' : progress >= 50 ? 'var(--orange)' : 'var(--text)' }}>
                                    {progress}%
                                </span>
                            </div>
                            <div className="progress-track">
                                <div
                                    className={`progress-fill ${progress >= 80 ? 'progress-fill--success' :
                                        progress >= 50 ? 'progress-fill--warning' :
                                            'progress-fill--primary'
                                        }`}
                                    style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
                                />
                            </div>
                        </div>

                        {/* Дополнительный прогресс-бар для наглядности */}

                        <ProgressBar variant={`${progress >= 80 ? 'success' : progress >= 50 ? 'warning' : 'primary'}`} text="Обработка" progress={Math.min(progress + 15, 100)} />

                        <ProgressBar variant="secondary" text="Обработка" progress={Math.min(progress + 15, 100)} />
                    </div>
                </section>

                {/* ======================================== */}
                {/* КАРТОЧКИ ПОЛЬЗОВАТЕЛЕЙ */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">👥 Карточки пользователей</h2>
                    <div className="user-cards-grid">
                        {users.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                onView={handleViewUser}
                                onEdit={handleEditUser}
                                onDelete={handleDeleteUser}
                            />
                        ))}
                    </div>
                </section>

                {/* ======================================== */}
                {/* КОМПАКТНЫЕ КАРТОЧКИ */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">📦 Компактные карточки</h2>
                    <div className="user-cards-grid user-cards-grid--compact">
                        {users.slice(0, 4).map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                compact
                                onEdit={handleEditUser}
                                onDelete={handleDeleteUser}
                            />
                        ))}
                    </div>
                </section>

                {/* ======================================== */}
                {/* РАЗНЫЕ ВАРИАНТЫ КАРТОЧЕК */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">🎨 Варианты карточек</h2>
                    <div className="user-cards-grid">
                        {users.slice(0, 4).map((user, index) => {
                            const variants = ['accent', 'danger', 'success', 'inverted']
                            return (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    variant={variants[index % variants.length]}
                                    onEdit={handleEditUser}
                                    onDelete={handleDeleteUser}
                                />
                            )
                        })}
                    </div>
                </section>

                {/* ======================================== */}
                {/* СПИСОК */}
                {/* ======================================== */}


                <section className="section">
                    <h2 className="section__title">📋 Список (List)</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <h3 style={{ color: 'var(--text-dark)', fontSize: '13px', marginBottom: '8px' }}>
                                Стандартный список
                            </h3>
                            <List
                                items={items}
                                onItemClick={handleItemClick}
                                onItemDelete={handleItemDelete}
                                onItemEdit={handleItemEdit}
                            />
                        </div>
                        <div>
                            <h3 style={{ color: 'var(--text-dark)', fontSize: '13px', marginBottom: '8px' }}>
                                Компактный список
                            </h3>
                            <List
                                items={items.slice(0, 3)}
                                variant="compact"
                                onItemClick={handleItemClick}
                                onItemDelete={handleItemDelete}
                                selectable
                            />
                        </div>
                    </div>
                </section>

                {/* ======================================== */}
                {/* АККОРДЕОН */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">📂 Аккордеон (Accordion)</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <h3 style={{ color: 'var(--text-dark)', fontSize: '13px', marginBottom: '8px' }}>
                                Одиночное раскрытие
                            </h3>
                            <Accordion
                                items={accordionItems}
                                defaultOpen={[1]}
                            />
                        </div>
                        <div>
                            <h3 style={{ color: 'var(--text-dark)', fontSize: '13px', marginBottom: '8px' }}>
                                Множественное раскрытие
                            </h3>
                            <Accordion
                                items={accordionItems}
                                multiple
                                defaultOpen={[1, 2]}
                                variant="compact"
                            />
                        </div>
                    </div>
                </section>

                {/* ======================================== */}
                {/* КОМПАКТНЫЙ АККОРДЕОН */}
                {/* ======================================== */}
                <section className="section">
                    <h2 className="section__title">📂 Компактный аккордеон</h2>
                    <div style={{ maxWidth: '600px' }}>
                        <Accordion
                            items={accordionItems}
                            variant="compact"
                            iconPosition="right"
                            defaultOpen={[1]}
                        />
                    </div>
                </section>

                {/* ======================================== */}
                {/* ФУТЕР */}
                {/* ======================================== */}
                <footer className="footer">
                    <span>© 2024 VSCode Design System</span>
                    <span className="footer__divider">•</span>
                    <span>Сделано с ❤️</span>
                    <span className="footer__divider">•</span>
                    <span>Тема: {isDark ? '🌙 Темная' : '☀️ Светлая'}</span>
                    <span className="footer__divider">•</span>
                    <span className="footer__version">v1.0.0</span>
                </footer>
            </div>
        </>
    )
}
