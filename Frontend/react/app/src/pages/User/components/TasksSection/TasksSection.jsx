import './TasksSection.css'
import { useState, useEffect, use, useMemo } from 'react'
import { UserContext } from '../../../../data/context.js'
import Fetch from '../../../../API/Fetch'
import { HttpMethod, APIVersion } from '../../../../data/enums'
import Accordion from '../../../components/Accordion/Accordion'
import Button from '../../../components/Button/Button'
import Badge from '../../../components/Badge/Badge'
import ProgressBar from '../../../components/ProgressBar/ProgressBar'
import LinkButton from '../../../components/LinkButton/LinkButton'

export default function TasksSection() {
    const { user } = use(UserContext)
    const [assignedTasks, setAssignedTasks] = useState([])
    const [createdTasks, setCreatedTasks] = useState([])
    const [archivedTasks, setArchivedTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('assigned')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [showStepsModal, setShowStepsModal] = useState(null)
    const [showHistoryModal, setShowHistoryModal] = useState(null)
    const [showProtocolModal, setShowProtocolModal] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        assigned_to: '',
        deadline: '',
        priority: 'medium',
        samples: [],
        protocol: '',
        department: '',
    })
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        assigned_to_id: '',
        deadline: '',
        priority: 'medium',
        protocol_id: '',
        is_completed: false,
        department: '',
    })
    const [protocols, setProtocols] = useState([])
    const [users, setUsers] = useState([])

    // Состояние сортировки
    const [sortOptions, setSortOptions] = useState([
        { field: 'priority', direction: 'desc' },
    ])
    const availableSortFields = [
        { value: 'created_at', label: '📅 Дата создания' },
        { value: 'priority', label: '⭐ Приоритет' },
        { value: 'deadline', label: '⏰ Срок' },
    ]

    // Загрузка задач
    const loadAssignedTasks = async () => {
        try {
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `tasks/?assigned_to=${user.id}`,
                method: HttpMethod.GET,
            })
            if (data?.ok && data?.data) {
                setAssignedTasks(data.data)
            } else {
                setAssignedTasks([])
            }
        } catch (error) {
            console.error('Ошибка загрузки назначенных задач:', error)
            setAssignedTasks([])
        }
    }

    const loadCreatedTasks = async () => {
        try {
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `tasks/?created_by=${user.id}`,
                method: HttpMethod.GET,
            })
            if (data?.ok && data?.data) {
                // Исключаем архивированные
                const active = data.data.filter(task => !task.is_archived)
                setCreatedTasks(active)
            } else {
                setCreatedTasks([])
            }
        } catch (error) {
            console.error('Ошибка загрузки созданных задач:', error)
            setCreatedTasks([])
        }
    }

    const loadArchivedTasks = async () => {
        try {
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `tasks/archived/`,
                method: HttpMethod.GET,
            })
            if (data?.ok && data?.data) {
                setArchivedTasks(data.data)
            } else {
                setArchivedTasks([])
            }
        } catch (error) {
            console.error('Ошибка загрузки архивированных задач:', error)
            setArchivedTasks([])
        }
    }

    const loadProtocols = async () => {
        try {
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: 'protocols/',
                method: HttpMethod.GET,
            })
            if (data?.ok && data?.data) {
                setProtocols(data.data)
            }
        } catch (error) {
            console.error('Ошибка загрузки протоколов:', error)
            setProtocols([])
        }
    }

    const loadUsers = async () => {
        try {
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: 'users/',
                method: HttpMethod.GET,
            })
            if (data?.ok && data?.data) {
                setUsers(data.data)
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error)
            setUsers([])
        }
    }

    useEffect(() => {
        if (user.id) {
            setLoading(true)
            Promise.all([
                loadAssignedTasks(),
                loadCreatedTasks(),
                loadArchivedTasks(),
                loadProtocols(),
                loadUsers()
            ]).finally(() => setLoading(false))
        }
    }, [user.id])

    // Создание задачи
    const handleCreateTask = async () => {
        const taskData = {
            name: formData.name,
            description: formData.description,
            deadline: formData.deadline || null,
            priority: formData.priority,
            assigned_to_id: formData.assigned_to ? parseInt(formData.assigned_to) : null,
            protocol_id: formData.protocol ? parseInt(formData.protocol) : null,
            sample_ids: formData.samples || [],
            department: formData.department || '',
        }

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'tasks/',
            method: HttpMethod.POST,
            body: taskData,
        })
        if (data?.ok) {
            setShowCreateModal(false)
            setFormData({
                name: '',
                description: '',
                assigned_to: '',
                deadline: '',
                priority: 'medium',
                samples: [],
                protocol: '',
                department: '',
            })
            loadAssignedTasks()
            loadCreatedTasks()
        } else {
            console.error('Ошибка создания задачи:', data)
            alert(data?.error || 'Ошибка создания задачи')
        }
    }

    // Редактирование задачи
    const handleEditTask = (task) => {
        setEditingTask(task)
        setEditFormData({
            name: task.name || '',
            description: task.description || '',
            assigned_to_id: task.assigned_to?.id || '',
            deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
            priority: task.priority || 'medium',
            protocol_id: task.protocol?.id || '',
            is_completed: task.is_completed || false,
            department: task.department || '',
        })
        setShowEditModal(true)
    }

    const handleSaveEdit = async () => {
        const updateData = {
            name: editFormData.name,
            description: editFormData.description,
            deadline: editFormData.deadline || null,
            priority: editFormData.priority,
            assigned_to_id: editFormData.assigned_to_id ? parseInt(editFormData.assigned_to_id) : null,
            protocol_id: editFormData.protocol_id ? parseInt(editFormData.protocol_id) : null,
            is_completed: editFormData.is_completed,
            department: editFormData.department || '',
        }

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${editingTask.id}/`,
            method: HttpMethod.PUT,
            body: updateData,
        })
        if (data?.ok) {
            setShowEditModal(false)
            setEditingTask(null)
            loadAssignedTasks()
            loadCreatedTasks()
            alert('✅ Задача обновлена!')
        } else {
            console.error('Ошибка обновления задачи:', data)
            alert(data?.error || 'Ошибка обновления задачи')
        }
    }

    // Архивирование
    const handleArchiveTask = async (taskId) => {
        if (!confirm('📦 Вы уверены, что хотите архивировать эту задачу?')) return

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/archive/`,
            method: HttpMethod.POST,
        })
        if (data?.ok) {
            loadAssignedTasks()
            loadCreatedTasks()
            loadArchivedTasks()
            alert('✅ Задача архивирована!')
        } else {
            console.error('Ошибка архивации:', data)
            alert(data?.error || 'Ошибка архивации задачи')
        }
    }

    // Переключение статуса выполнения задачи
    const handleToggleComplete = async (taskId, currentStatus) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/`,
            method: HttpMethod.PUT,
            body: { is_completed: !currentStatus },
        })
        if (data?.ok) {
            loadAssignedTasks()
            loadCreatedTasks()
            alert('✅ Статус задачи обновлен!')
        } else {
            console.error('Ошибка обновления статуса:', data)
            alert(data?.error || 'Ошибка обновления статуса')
        }
    }

    const handleUnarchiveTask = async (taskId) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/unarchive/`,
            method: HttpMethod.POST,
        })
        if (data?.ok) {
            loadAssignedTasks()
            loadCreatedTasks()
            loadArchivedTasks()
            alert('✅ Задача разархивирована!')
        } else {
            console.error('Ошибка разархивации:', data)
            alert(data?.error || 'Ошибка разархивации задачи')
        }
    }

    // Переключение этапа
    const toggleStage = async (taskId, stageId, completed) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/stage/${stageId}/`,
            method: HttpMethod.PUT,
            body: { is_completed: completed },
        })
        if (data?.ok) {
            loadAssignedTasks()
            loadCreatedTasks()
        }
    }

    // Форматирование даты
    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // Цвет приоритета
    const getPriorityColor = (priority) => {
        const colors = {
            critical: 'danger',
            high: 'warning',
            medium: 'info',
            low: 'secondary',
        }
        return colors[priority] || 'secondary'
    }

    // Функция сортировки
    const applySort = (tasks) => {
        if (!tasks || tasks.length === 0) return tasks
        if (sortOptions.length === 0) return tasks

        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

        const sorted = [...tasks].sort((a, b) => {
            for (const sort of sortOptions) {
                const { field, direction } = sort
                const multiplier = direction === 'asc' ? 1 : -1

                let aVal = a[field]
                let bVal = b[field]

                if (aVal == null && bVal == null) continue
                if (aVal == null) return multiplier * 1
                if (bVal == null) return multiplier * -1

                if (field === 'priority') {
                    const aIdx = priorityOrder[aVal] ?? 99
                    const bIdx = priorityOrder[bVal] ?? 99
                    if (aIdx !== bIdx) return (aIdx - bIdx) * multiplier
                } else if (field === 'created_at' || field === 'deadline') {
                    const aDate = new Date(aVal)
                    const bDate = new Date(bVal)
                    const aTime = isNaN(aDate.getTime()) ? null : aDate.getTime()
                    const bTime = isNaN(bDate.getTime()) ? null : bDate.getTime()
                    if (aTime == null && bTime == null) continue
                    if (aTime == null) return multiplier * 1
                    if (bTime == null) return multiplier * -1
                    if (aTime !== bTime) return (aTime - bTime) * multiplier
                } else {
                    const aStr = String(aVal).toLowerCase()
                    const bStr = String(bVal).toLowerCase()
                    if (aStr !== bStr) {
                        return aStr.localeCompare(bStr) * multiplier
                    }
                }
            }
            return 0
        })
        return sorted
    }

    const toggleSort = (field) => {
        setSortOptions(prev => {
            const existing = prev.find(s => s.field === field)
            if (existing) {
                if (existing.direction === 'asc') {
                    return prev.map(s => s.field === field ? { ...s, direction: 'desc' } : s)
                } else {
                    return prev.filter(s => s.field !== field)
                }
            } else {
                return [...prev, { field, direction: 'asc' }]
            }
        })
    }

    const resetSort = () => {
        setSortOptions([])
    }

    const sortedAssigned = useMemo(() => applySort(assignedTasks), [assignedTasks, sortOptions])
    const sortedCreated = useMemo(() => applySort(createdTasks), [createdTasks, sortOptions])
    const sortedArchived = useMemo(() => applySort(archivedTasks), [archivedTasks, sortOptions])

    // Построение элементов Accordion
    const buildAccordionItems = (tasks, isCreatedTab = false) => {
        return tasks.map((task) => {
            const stages = task.stages || []
            const progress = stages.length
                ? Math.round((stages.filter(s => s.is_completed).length / stages.length) * 100)
                : 0
            const stagesCount = stages.length

            return {
                id: task.id,
                title: (
                    <div className="tasks-accordion__title">
                        <span className={`tasks-accordion__task-name ${task.is_archived ? 'tasks-accordion__task-name--archived' : ''}`}>
                            {task.is_archived && '📦 '}
                            {task.name}
                        </span>
                        {task.is_archived && (
                            <Badge variant="secondary">Архивирована</Badge>
                        )}
                        <Badge variant={getPriorityColor(task.priority)}>
                            {task.priority || 'medium'}
                        </Badge>
                        {task.protocol && (
                            <Badge variant="info">{task.protocol.code}</Badge>
                        )}
                    </div>
                ),
                icon: task.is_archived ? '📦' : '📋',
                badge: task.is_archived ? 'Архив' : (task.is_completed ? 'Завершена' : 'Активна'),
                badgeVariant: task.is_archived ? 'secondary' : (task.is_completed ? 'success' : 'warning'),
                content: (
                    <div className="tasks-accordion__content">
                        <div className="tasks-accordion__row">
                            <span className="tasks-accordion__label">📝 Описание:</span>
                            <span>{task.description || '—'}</span>
                        </div>
                        <div className="tasks-accordion__row">
                            <span className="tasks-accordion__label">🏢 Отдел:</span>
                            <span>{task.department || '—'}</span>
                        </div>
                        <div className="tasks-accordion__row">
                            <span className="tasks-accordion__label">👤 От кого:</span>
                            <span>
                                {task.created_by?.first_name || ''} {task.created_by?.last_name || ''}
                                {task.created_by?.username ? ` (@${task.created_by.username})` : ''}
                            </span>
                        </div>
                        <div className="tasks-accordion__row">
                            <span className="tasks-accordion__label">👤 Исполнитель:</span>
                            <span>
                                {task.assigned_to?.first_name || ''} {task.assigned_to?.last_name || ''}
                                {task.assigned_to?.username ? ` (@${task.assigned_to.username})` : 'Не назначен'}
                            </span>
                        </div>
                        <div className="tasks-accordion__row">
                            <span className="tasks-accordion__label">📅 Срок:</span>
                            <span>{formatDate(task.deadline)}</span>
                        </div>
                        <div className="tasks-accordion__row">
                            <span className="tasks-accordion__label">📌 Приоритет:</span>
                            <Badge variant={getPriorityColor(task.priority)}>
                                {task.priority || 'medium'}
                            </Badge>
                        </div>
                        <div className="tasks-accordion__row">
                            <span className="tasks-accordion__label">📄 Протокол:</span>
                            <span>
                                {task.protocol ? (
                                    <strong>{task.protocol.code} - {task.protocol.name}</strong>
                                ) : 'Не выбран'}
                            </span>
                        </div>
                        <div className="tasks-accordion__row">
                            <span className="tasks-accordion__label">📋 Этапов:</span>
                            <span>{stagesCount}</span>
                        </div>
                        <div className="tasks-accordion__row">
                            <span className="tasks-accordion__label">📦 Батчи:</span>
                            <span>
                                {task.batches && task.batches.length > 0 ? (
                                    task.batches.map(batch => (
                                        <LinkButton
                                            key={batch.id}
                                            to={`/batch/${batch.id}`}
                                            style={{ marginRight: '8px' }}
                                        >
                                            {batch.name || `#${batch.id}`}
                                        </LinkButton>
                                    ))
                                ) : (
                                    'Нет'
                                )}
                            </span>
                        </div>
                        <div className="tasks-accordion__row">
                            <span className="tasks-accordion__label">📊 Прогресс:</span>
                            <div style={{ flex: 1, maxWidth: '200px' }}>
                                <ProgressBar
                                    variant={progress === 100 ? 'success' : 'primary'}
                                    progress={progress}
                                    showLabel={false}
                                />
                            </div>
                            <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-dark)' }}>
                                {progress}%
                            </span>
                        </div>

                        <div className="tasks-accordion__actions">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowStepsModal(task.id)}
                            >
                                📋 Шаги ({stagesCount})
                            </Button>

                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowHistoryModal(task.id)}
                            >
                                📜 История
                            </Button>

                            <LinkButton
                                to={`/batches/${user.username}/`}
                            >
                                📎 Образцы ({task.samples?.length || 0})
                            </LinkButton>

                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowProtocolModal(task.id)}
                                disabled={!task.protocol}
                            >
                                📄 Протокол
                            </Button>

                            {!task.is_archived && (
                                <Button
                                    variant={task.is_completed ? 'success' : 'secondary'}
                                    size="sm"
                                    onClick={() => handleToggleComplete(task.id, task.is_completed)}
                                >
                                    {task.is_completed ? '✅ Выполнена' : '⬜ Отметить выполненной'}
                                </Button>
                            )}

                            {isCreatedTab && (
                                <>
                                    {!task.is_archived && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleEditTask(task)}
                                        >
                                            ✏️ Редактировать
                                        </Button>
                                    )}
                                    {task.is_archived ? (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleUnarchiveTask(task.id)}
                                        >
                                            📂 Разархивировать
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleArchiveTask(task.id)}
                                        >
                                            📦 Архивировать
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ),
            }
        })
    }

    return (
        <div className="tasks-section">
            <div className="tasks-section__header">
                <h3 className="tasks-section__title">📋 Задачи</h3>
                <Button onClick={() => setShowCreateModal(true)}>
                    ➕ Создать задачу
                </Button>
            </div>

            {/* Панель сортировки */}
            <div className="tasks-sort-panel">
                <span className="tasks-sort-label">Сортировка:</span>
                {availableSortFields.map(({ value, label }) => {
                    const active = sortOptions.find(s => s.field === value)
                    const direction = active?.direction || null
                    return (
                        <button
                            key={value}
                            className={`tasks-sort-btn ${active ? 'tasks-sort-btn--active' : ''}`}
                            onClick={() => toggleSort(value)}
                        >
                            {label}
                            {active && (
                                <span className="tasks-sort-arrow">
                                    {direction === 'asc' ? ' ↑' : ' ↓'}
                                </span>
                            )}
                        </button>
                    )
                })}
                {sortOptions.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={resetSort}>
                        ✕ Сбросить
                    </Button>
                )}
            </div>

            {/* Вкладки */}
            <div className="tasks-section__tabs">
                <button
                    className={`tasks-section__tab ${activeTab === 'assigned' ? 'tasks-section__tab--active' : ''}`}
                    onClick={() => setActiveTab('assigned')}
                >
                    📥 Мои задачи ({assignedTasks.length})
                </button>
                <button
                    className={`tasks-section__tab ${activeTab === 'created' ? 'tasks-section__tab--active' : ''}`}
                    onClick={() => setActiveTab('created')}
                >
                    📤 Созданные мной ({createdTasks.length})
                </button>
                <button
                    className={`tasks-section__tab ${activeTab === 'archived' ? 'tasks-section__tab--active' : ''}`}
                    onClick={() => setActiveTab('archived')}
                >
                    📦 Архив ({archivedTasks.length})
                </button>
            </div>

            {/* Контент вкладок */}
            {loading ? (
                <div className="tasks-section__loading">⏳ Загрузка задач...</div>
            ) : (
                <>
                    {activeTab === 'assigned' && (
                        sortedAssigned.length === 0 ? (
                            <div className="tasks-section__empty">
                                <span className="tasks-section__empty-icon">📭</span>
                                <p>Вам пока не назначены задачи</p>
                            </div>
                        ) : (
                            <Accordion
                                items={buildAccordionItems(sortedAssigned, false)}
                                multiple
                                defaultOpen={[]}
                                variant="compact"
                            />
                        )
                    )}

                    {activeTab === 'created' && (
                        sortedCreated.length === 0 ? (
                            <div className="tasks-section__empty">
                                <span className="tasks-section__empty-icon">📝</span>
                                <p>Вы ещё не создали ни одной задачи</p>
                            </div>
                        ) : (
                            <Accordion
                                items={buildAccordionItems(sortedCreated, true)}
                                multiple
                                defaultOpen={[]}
                                variant="compact"
                            />
                        )
                    )}

                    {activeTab === 'archived' && (
                        sortedArchived.length === 0 ? (
                            <div className="tasks-section__empty">
                                <span className="tasks-section__empty-icon">📦</span>
                                <p>Нет архивированных задач</p>
                            </div>
                        ) : (
                            <Accordion
                                items={buildAccordionItems(sortedArchived, true)}
                                multiple
                                defaultOpen={[]}
                                variant="compact"
                            />
                        )
                    )}
                </>
            )}

            {/* Модальное окно создания задачи */}
            {showCreateModal && (
                <div className="tasks-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="tasks-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="tasks-modal__title">➕ Создание задачи</h2>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="tasks-modal__form-group">
                                <label>Название задачи *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="tasks-modal__input"
                                    placeholder="Введите название"
                                    required
                                />
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>Описание</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="tasks-modal__textarea"
                                    rows="3"
                                    placeholder="Введите описание"
                                />
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>🏢 Отдел</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="tasks-modal__input"
                                    placeholder="Например: Разработка, HR, Маркетинг..."
                                />
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>Исполнитель</label>
                                <select
                                    value={formData.assigned_to}
                                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                    className="tasks-modal__input"
                                >
                                    <option value="">Не назначен</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.first_name} {u.last_name} (@{u.username})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>Срок выполнения</label>
                                <input
                                    type="datetime-local"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="tasks-modal__input"
                                />
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>Приоритет</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="tasks-modal__input"
                                >
                                    <option value="critical">🔴 Критический</option>
                                    <option value="high">🟠 Высокий</option>
                                    <option value="medium">🔵 Средний</option>
                                    <option value="low">⚪ Низкий</option>
                                </select>
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>Протокол (СОП)</label>
                                <select
                                    value={formData.protocol}
                                    onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                                    className="tasks-modal__input"
                                >
                                    <option value="">Не выбран</option>
                                    {protocols.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="tasks-modal__buttons">
                                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                                    Отмена
                                </Button>
                                <Button variant="primary" onClick={handleCreateTask}>
                                    Создать
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования */}
            {showEditModal && editingTask && (
                <div className="tasks-modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="tasks-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="tasks-modal__title">✏️ Редактирование задачи</h2>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="tasks-modal__form-group">
                                <label>Название задачи *</label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="tasks-modal__input"
                                    placeholder="Введите название"
                                    required
                                />
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>Описание</label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="tasks-modal__textarea"
                                    rows="3"
                                    placeholder="Введите описание"
                                />
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>🏢 Отдел</label>
                                <input
                                    type="text"
                                    value={editFormData.department}
                                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                    className="tasks-modal__input"
                                    placeholder="Например: Разработка, HR, Маркетинг..."
                                />
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>Исполнитель</label>
                                <select
                                    value={editFormData.assigned_to_id}
                                    onChange={(e) => setEditFormData({ ...editFormData, assigned_to_id: e.target.value })}
                                    className="tasks-modal__input"
                                >
                                    <option value="">Не назначен</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.first_name} {u.last_name} (@{u.username})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>Срок выполнения</label>
                                <input
                                    type="datetime-local"
                                    value={editFormData.deadline}
                                    onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                                    className="tasks-modal__input"
                                />
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>Приоритет</label>
                                <select
                                    value={editFormData.priority}
                                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                                    className="tasks-modal__input"
                                >
                                    <option value="critical">🔴 Критический</option>
                                    <option value="high">🟠 Высокий</option>
                                    <option value="medium">🔵 Средний</option>
                                    <option value="low">⚪ Низкий</option>
                                </select>
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>Протокол (СОП)</label>
                                <select
                                    value={editFormData.protocol_id}
                                    onChange={(e) => setEditFormData({ ...editFormData, protocol_id: e.target.value })}
                                    className="tasks-modal__input"
                                >
                                    <option value="">Не выбран</option>
                                    {protocols.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="tasks-modal__form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={editFormData.is_completed}
                                        onChange={(e) => setEditFormData({ ...editFormData, is_completed: e.target.checked })}
                                    />
                                    ✅ Выполнена
                                </label>
                            </div>
                            <div className="tasks-modal__buttons">
                                <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                                    Отмена
                                </Button>
                                <Button variant="primary" onClick={handleSaveEdit}>
                                    💾 Сохранить
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно шагов */}
            {showStepsModal && (
                <div className="tasks-modal-overlay" onClick={() => setShowStepsModal(null)}>
                    <div className="tasks-modal tasks-modal--steps" onClick={(e) => e.stopPropagation()}>
                        <h2 className="tasks-modal__title">📋 Шаги</h2>
                        {(() => {
                            const task = [...assignedTasks, ...createdTasks].find(t => t.id === showStepsModal)
                            const stages = task?.stages || []
                            if (stages.length === 0) {
                                return <p className="tasks-modal__empty">Нет шагов</p>
                            }
                            return (
                                <ul className="tasks-steps-list">
                                    {stages.map((stage) => (
                                        <li key={stage.id} className="tasks-steps-list__item">
                                            <label className="tasks-steps-list__checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={stage.is_completed}
                                                    onChange={(e) => toggleStage(showStepsModal, stage.id, e.target.checked)}
                                                />
                                                <span className="tasks-steps-list__name">
                                                    Шаг {stage.order}:
                                                    <br />
                                                    {stage.name}
                                                    {stage.is_completed && ' ✅'}
                                                </span>
                                            </label>
                                            {stage.description && (
                                                <span className="tasks-steps-list__desc">{stage.description}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )
                        })()}
                        <div className="tasks-modal__buttons">
                            <Button variant="secondary" onClick={() => setShowStepsModal(null)}>
                                Закрыть
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно истории */}
            {showHistoryModal && (
                <div className="tasks-modal-overlay" onClick={() => setShowHistoryModal(null)}>
                    <div className="tasks-modal tasks-modal--history" onClick={(e) => e.stopPropagation()}>
                        <h2 className="tasks-modal__title">📜 История изменений</h2>
                        {(() => {
                            const task = [...assignedTasks, ...createdTasks].find(t => t.id === showHistoryModal)
                            const history = task?.history || []
                            if (history.length === 0) {
                                return <p className="tasks-modal__empty">История пуста</p>
                            }
                            return (
                                <div className="tasks-history-list">
                                    {history.map((entry) => (
                                        <div key={entry.id} className="tasks-history-list__item">
                                            <div className="tasks-history-list__header">
                                                <span className="tasks-history-list__user">
                                                    {entry.user?.first_name} {entry.user?.last_name} (@{entry.user?.username})
                                                </span>
                                                <span className="tasks-history-list__date">{formatDate(entry.created_at)}</span>
                                            </div>
                                            <div className="tasks-history-list__body">
                                                <Badge variant="secondary">{entry.get_action_type_display?.() || entry.action_type}</Badge>
                                                {entry.field_name && (
                                                    <span className="tasks-history-list__field">{entry.field_name}</span>
                                                )}
                                                {entry.old_value && (
                                                    <span className="tasks-history-list__old">было: {JSON.stringify(entry.old_value)}</span>
                                                )}
                                                {entry.new_value && (
                                                    <span className="tasks-history-list__new">стало: {JSON.stringify(entry.new_value)}</span>
                                                )}
                                                {entry.comment && (
                                                    <span className="tasks-history-list__comment">💬 {entry.comment}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        })()}
                        <div className="tasks-modal__buttons">
                            <Button variant="secondary" onClick={() => setShowHistoryModal(null)}>
                                Закрыть
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно протокола */}
            {showProtocolModal && (
                <div className="tasks-modal-overlay" onClick={() => setShowProtocolModal(null)}>
                    <div className="tasks-modal tasks-modal--protocol" onClick={(e) => e.stopPropagation()}>
                        <h2 className="tasks-modal__title">📄 Протокол</h2>
                        {(() => {
                            const task = [...assignedTasks, ...createdTasks].find(t => t.id === showProtocolModal)
                            const protocol = task?.protocol
                            if (!protocol) {
                                return <p className="tasks-modal__empty">Протокол не выбран</p>
                            }
                            return (
                                <div className="tasks-protocol-modal">
                                    <div className="tasks-protocol-modal__header">
                                        <div className="tasks-protocol-modal__code">
                                            <span className="tasks-protocol-modal__label">Код:</span>
                                            <strong>{protocol.code}</strong>
                                        </div>
                                        <div className="tasks-protocol-modal__name">
                                            <span className="tasks-protocol-modal__label">Название:</span>
                                            <strong>{protocol.name}</strong>
                                        </div>
                                        <div className="tasks-protocol-modal__version">
                                            <span className="tasks-protocol-modal__label">Версия:</span>
                                            <strong>{protocol.version || '1.0'}</strong>
                                        </div>
                                    </div>

                                    {protocol.description && (
                                        <div className="tasks-protocol-modal__description">
                                            <span className="tasks-protocol-modal__label">Описание:</span>
                                            <p>{protocol.description}</p>
                                        </div>
                                    )}

                                    <div className="tasks-protocol-modal__stages">
                                        <h4>📋 Этапы протокола ({protocol.stages?.length || 0})</h4>
                                        {protocol.stages && protocol.stages.length > 0 ? (
                                            <ul className="tasks-steps-list">
                                                {protocol.stages.map((stage) => (
                                                    <li key={stage.id} className="tasks-steps-list__item">
                                                        <span className="tasks-steps-list__order">
                                                            Шаг {stage.order}:
                                                        </span>
                                                        <span className="tasks-steps-list__name">
                                                            {stage.name}
                                                            {stage.is_completed && ' ✅'}
                                                        </span>
                                                        {stage.description && (
                                                            <span className="tasks-steps-list__desc">
                                                                {stage.description}
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="tasks-modal__empty">Нет этапов в протоколе</p>
                                        )}
                                    </div>

                                    {protocol.created_by && (
                                        <div className="tasks-protocol-modal__meta">
                                            <span className="tasks-protocol-modal__label">Создан:</span>
                                            <span>
                                                {protocol.created_by.first_name} {protocol.created_by.last_name}
                                                (@{protocol.created_by.username})
                                            </span>
                                            <span className="tasks-protocol-modal__label">Дата:</span>
                                            <span>{formatDate(protocol.created_at)}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                        <div className="tasks-modal__buttons">
                            <Button variant="secondary" onClick={() => setShowProtocolModal(null)}>
                                Закрыть
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}