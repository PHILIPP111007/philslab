import './Task.css'
import { useState, useEffect, useCallback, useContext, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserContext } from '../../data/context.js'
import Fetch from '../../API/Fetch'
import { HttpMethod, APIVersion } from '../../data/enums'
import { notify_error, notify_success } from '../../modules/notify'
import rememberPage from '../../modules/rememberPage'
import { useDepartments } from '../../hooks/useDepartments'
import Header from '../components/Header/Header'
import Button from '../components/Button/Button'
import Badge from '../components/Badge/Badge'
import ProgressBar from '../components/ProgressBar/ProgressBar'
import LinkButton from '../components/LinkButton/LinkButton'
import Spinner from '../components/Spinner/Spinner'

export default function Task() {
    const { user } = useContext(UserContext)
    const params = useParams()
    const navigate = useNavigate()
    const taskId = params.id

    // Основные состояния
    const [task, setTask] = useState(null)
    const [loading, setLoading] = useState(true)
    const [stages, setStages] = useState([])
    const [history, setHistory] = useState([])
    const [protocol, setProtocol] = useState(null)

    // Состояния модалок
    const [showEditModal, setShowEditModal] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        assigned_to_id: '',
        deadline: '',
        priority: 'medium',
        department: '',
        protocol_id: '',
        is_completed: false,
    })
    const [showStepsModal, setShowStepsModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [showProtocolModal, setShowProtocolModal] = useState(false)
    const [saving, setSaving] = useState(false)

    // Справочники
    const [users, setUsers] = useState([])
    const [protocols, setProtocols] = useState([])
    const { departments } = useDepartments()

    // Запоминаем страницу
    useEffect(() => {
        rememberPage(`task/${taskId}`)
    }, [taskId])

    // ---------- Загрузка данных ----------
    const loadTask = useCallback(async () => {
        setLoading(true)
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/`,
            method: HttpMethod.GET,
        })
        if (data?.ok) {
            const taskData = data.data
            setTask(taskData)
            setStages(taskData?.stages || [])
            setHistory(taskData?.history || [])
            setProtocol(taskData?.protocol || null)
        } else {
            notify_error(data?.error || 'Задача не найдена')
            navigate('/')
        }
        setLoading(false)
    }, [taskId, navigate])


    const loadUsers = useCallback(async () => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'users/',
            method: HttpMethod.GET,
        })
        if (data?.ok) setUsers(data.data || [])
    }, [])

    const loadProtocols = useCallback(async () => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'protocols/',
            method: HttpMethod.GET,
        })
        if (data?.ok) setProtocols(data.data || [])
    }, [])

    useEffect(() => {
        loadTask()
        loadUsers()
        loadProtocols()
    }, [loadTask, loadUsers, loadProtocols])

    // ---------- Обработчики действий ----------
    const handleEdit = () => {
        if (!task) return
        setEditForm({
            name: task.name || '',
            description: task.description || '',
            assigned_to_id: task.assigned_to?.id || '',
            deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
            priority: task.priority || 'medium',
            department: task.department || '',
            protocol_id: task.protocol?.id || '',
            is_completed: task.is_completed || false,
        })
        setShowEditModal(true)
    }

    const handleSaveEdit = async () => {
        setSaving(true)
        const updateData = {
            name: editForm.name,
            description: editForm.description,
            assigned_to_id: editForm.assigned_to_id ? parseInt(editForm.assigned_to_id) : null,
            deadline: editForm.deadline || null,
            priority: editForm.priority,
            department: editForm.department || '',
            protocol_id: editForm.protocol_id ? parseInt(editForm.protocol_id) : null,
            is_completed: editForm.is_completed,
        }
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/`,
            method: HttpMethod.PUT,
            body: updateData,
        })
        if (data?.ok) {
            notify_success('Задача обновлена!')
            setShowEditModal(false)
            loadTask()
        } else {
            notify_error(data?.error || 'Ошибка обновления')
        }
        setSaving(false)
    }

    const handleToggleComplete = async () => {
        if (!task) return
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/`,
            method: HttpMethod.PUT,
            body: { is_completed: !task.is_completed },
        })
        if (data?.ok) {
            notify_success('Статус обновлён')
            loadTask()
        } else {
            notify_error(data?.error || 'Ошибка обновления статуса')
        }
    }

    const handleArchive = async () => {
        if (!task) return
        if (!confirm('📦 Архивировать задачу?')) return
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/archive/`,
            method: HttpMethod.POST,
        })
        if (data?.ok) {
            notify_success('Задача архивирована')
            loadTask()
        } else {
            notify_error(data?.error || 'Ошибка архивации')
        }
    }

    const handleUnarchive = async () => {
        if (!task) return
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/unarchive/`,
            method: HttpMethod.POST,
        })
        if (data?.ok) {
            notify_success('Задача разархивирована')
            loadTask()
        } else {
            notify_error(data?.error || 'Ошибка разархивации')
        }
    }

    const handleDelete = async () => {
        if (!task) return
        if (!confirm('🗑️ Удалить задачу безвозвратно?')) return
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/`,
            method: HttpMethod.DELETE,
        })
        if (data?.ok) {
            notify_success('Задача удалена')
            navigate('/')
        } else {
            notify_error(data?.error || 'Ошибка удаления')
        }
    }

    const toggleStage = async (stageId, completed) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `task/${taskId}/stage/${stageId}/`,
            method: HttpMethod.PUT,
            body: { is_completed: completed },
        })
        if (data?.ok) {
            loadTask()
        } else {
            notify_error(data?.error || 'Ошибка обновления этапа')
        }
    }

    // ---------- Утилиты ----------
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

    const getPriorityColor = (priority) => {
        const colors = {
            critical: 'danger',
            high: 'warning',
            medium: 'info',
            low: 'secondary',
        }
        return colors[priority] || 'secondary'
    }

    const progress = useMemo(() => {
        if (!stages || stages.length === 0) return 0
        const completed = stages.filter(s => s.is_completed).length
        return Math.round((completed / stages.length) * 100)
    }, [stages])

    // ---------- Рендер ----------
    if (loading) {
        return (
            <>
                <Header />
                <div className="task-detail" style={{ padding: '2rem', textAlign: 'center' }}>
                    <Spinner />
                </div>
            </>
        )
    }

    if (!task) {
        return (
            <>
                <Header />
                <div className="task-detail" style={{ padding: '2rem' }}>
                    <h2>Задача не найдена</h2>
                    <Button onClick={() => navigate('/')}>← На главную</Button>
                </div>
            </>
        )
    }

    // Теперь task гарантированно существует
    return (
        <>
            <Header />
            <div className="task-detail">
                <div className="task-detail__container">
                    {/* Карточка задачи */}
                    <div className="task-detail__card">
                        <div className="task-detail__header">
                            <div className="task-detail__title-section">
                                <h1 className="task-detail__title">{task.name}</h1>
                                <div className="task-detail__badges">
                                    <Badge variant={task.is_archived ? 'secondary' : (task.is_completed ? 'success' : 'warning')}>
                                        {task.is_archived ? '📦 Архивирована' : (task.is_completed ? '✅ Завершена' : '🔄 В работе')}
                                    </Badge>
                                    <Badge variant={getPriorityColor(task.priority)}>
                                        {task.priority || 'medium'}
                                    </Badge>
                                    {task.protocol && (
                                        <Badge variant="info">{task.protocol.code}</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="task-detail__actions">
                                {!task.is_archived && (
                                    <Button variant="primary" onClick={handleEdit}>
                                        ✏️ Редактировать
                                    </Button>
                                )}
                                <Button
                                    variant={task.is_completed ? 'success' : 'secondary'}
                                    onClick={handleToggleComplete}
                                    disabled={task.is_archived}
                                >
                                    {task.is_completed ? '✅ Выполнена' : '⬜ Отметить выполненной'}
                                </Button>
                                {task.is_archived ? (
                                    <Button variant="secondary" onClick={handleUnarchive}>
                                        📂 Разархивировать
                                    </Button>
                                ) : (
                                    <Button variant="danger" onClick={handleArchive}>
                                        📦 Архивировать
                                    </Button>
                                )}
                                <Button variant="danger" onClick={handleDelete}>
                                    🗑️ Удалить
                                </Button>
                            </div>
                        </div>

                        {/* Информация */}
                        <div className="task-detail__info">
                            <div className="task-detail__info-grid">
                                <div className="task-detail__info-item">
                                    <span className="task-detail__info-label">🏢 Отдел</span>
                                    <span className="task-detail__info-value">{task.department || '—'}</span>
                                </div>
                                <div className="task-detail__info-item">
                                    <span className="task-detail__info-label">👤 Исполнитель</span>
                                    <span className="task-detail__info-value">
                                        {task.assigned_to ? (
                                            `${task.assigned_to.first_name} ${task.assigned_to.last_name} (@${task.assigned_to.username})`
                                        ) : 'Не назначен'}
                                    </span>
                                </div>
                                <div className="task-detail__info-item">
                                    <span className="task-detail__info-label">👤 Создатель</span>
                                    <span className="task-detail__info-value">
                                        {task.created_by ? (
                                            `${task.created_by.first_name} ${task.created_by.last_name} (@${task.created_by.username})`
                                        ) : '—'}
                                    </span>
                                </div>
                                <div className="task-detail__info-item">
                                    <span className="task-detail__info-label">📅 Срок</span>
                                    <span className="task-detail__info-value">{formatDate(task.deadline)}</span>
                                </div>
                                <div className="task-detail__info-item">
                                    <span className="task-detail__info-label">📅 Создана</span>
                                    <span className="task-detail__info-value">{formatDate(task.created_at)}</span>
                                </div>
                                <div className="task-detail__info-item">
                                    <span className="task-detail__info-label">📅 Обновлена</span>
                                    <span className="task-detail__info-value">{formatDate(task.updated_at)}</span>
                                </div>
                            </div>
                            {task.description && (
                                <div className="task-detail__description">
                                    <span className="task-detail__info-label">📝 Описание</span>
                                    <p>{task.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Прогресс */}
                        <div className="task-detail__progress">
                            <div className="task-detail__progress-header">
                                <span>📊 Прогресс выполнения этапов</span>
                                <span>{progress}%</span>
                            </div>
                            <ProgressBar progress={progress} variant={progress === 100 ? 'success' : 'primary'} showLabel={false} />
                        </div>

                        {/* Этапы */}
                        <div className="task-detail__stages">
                            <div className="task-detail__section-header">
                                <h3>📋 Этапы ({stages.length})</h3>
                                <Button variant="secondary" size="sm" onClick={() => setShowStepsModal(true)}>
                                    Управлять этапами
                                </Button>
                            </div>
                            {stages.length === 0 ? (
                                <p className="task-detail__empty">Нет этапов</p>
                            ) : (
                                <ul className="task-detail__stages-list">
                                    {stages.map((stage) => (
                                        <li key={stage.id} className="task-detail__stage-item">
                                            <label className="task-detail__stage-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={stage.is_completed}
                                                    onChange={(e) => toggleStage(stage.id, e.target.checked)}
                                                    disabled={task.is_archived}
                                                />
                                                <span>
                                                    Шаг {stage.order}: {stage.name}
                                                    {stage.is_completed && ' ✅'}
                                                </span>
                                            </label>
                                            {stage.description && (
                                                <span className="task-detail__stage-desc">{stage.description}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Связанные батчи */}
                        {task.batches && task.batches.length > 0 && (
                            <div className="task-detail__batches">
                                <h3>📦 Связанные батчи</h3>
                                <div className="task-detail__batches-list">
                                    {task.batches.map(batch => (
                                        <LinkButton key={batch.id} to={`/batch/${batch.id}`}>
                                            {batch.name || `Батч #${batch.id}`}
                                        </LinkButton>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Связанные образцы */}
                        {task.samples && task.samples.length > 0 && (
                            <div className="task-detail__samples">
                                <h3>🧪 Образцы</h3>
                                <div className="task-detail__samples-list">
                                    {task.samples.map(sample => (
                                        <LinkButton key={sample.id} to={`/sample/${sample.id}`}>
                                            {sample.sample_code || `Образец #${sample.id}`}
                                        </LinkButton>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Протокол */}
                        {task.protocol && (
                            <div className="task-detail__protocol">
                                <h3>📄 Протокол</h3>
                                <div className="task-detail__protocol-info">
                                    <span><strong>Код:</strong> {task.protocol.code}</span>
                                    <span><strong>Название:</strong> {task.protocol.name}</span>
                                    <span><strong>Версия:</strong> {task.protocol.version || '1.0'}</span>
                                    <Button variant="secondary" size="sm" onClick={() => setShowProtocolModal(true)}>
                                        Просмотреть протокол
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* История */}
                        {history.length > 0 && (
                            <div className="task-detail__history">
                                <h3>📜 История изменений</h3>
                                <Button variant="secondary" size="sm" onClick={() => setShowHistoryModal(true)}>
                                    Показать историю
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Модалки – см. ниже */}
            {/* ... (модальные окна такие же, как в предыдущей версии, только проверки не нужны, так как они используют отдельные состояния) */}

            {/* Модалка редактирования */}
            {
                showEditModal && (
                    <div className="task-modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="task-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="task-modal__title">✏️ Редактирование задачи</h2>
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="task-modal__form-group">
                                    <label>Название задачи *</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="task-modal__input"
                                        required
                                    />
                                </div>
                                <div className="task-modal__form-group">
                                    <label>Описание</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        className="task-modal__textarea"
                                        rows="3"
                                    />
                                </div>
                                <div className="task-modal__form-group">
                                    <label>🏢 Отдел</label>
                                    <select
                                        value={editForm.department || ''}
                                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                        className="task-modal__input"
                                    >
                                        <option value="">Не выбран</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="task-modal__form-group">
                                    <label>Исполнитель</label>
                                    <select
                                        value={editForm.assigned_to_id}
                                        onChange={(e) => setEditForm({ ...editForm, assigned_to_id: e.target.value })}
                                        className="task-modal__input"
                                    >
                                        <option value="">Не назначен</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.first_name} {u.last_name} (@{u.username})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="task-modal__form-group">
                                    <label>Срок выполнения</label>
                                    <input
                                        type="datetime-local"
                                        value={editForm.deadline}
                                        onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                                        className="task-modal__input"
                                    />
                                </div>
                                <div className="task-modal__form-group">
                                    <label>Приоритет</label>
                                    <select
                                        value={editForm.priority}
                                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                                        className="task-modal__input"
                                    >
                                        <option value="critical">🔴 Критический</option>
                                        <option value="high">🟠 Высокий</option>
                                        <option value="medium">🔵 Средний</option>
                                        <option value="low">⚪ Низкий</option>
                                    </select>
                                </div>
                                <div className="task-modal__form-group">
                                    <label>Протокол (СОП)</label>
                                    <select
                                        value={editForm.protocol_id}
                                        onChange={(e) => setEditForm({ ...editForm, protocol_id: e.target.value })}
                                        className="task-modal__input"
                                    >
                                        <option value="">Не выбран</option>
                                        {protocols.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="task-modal__form-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={editForm.is_completed}
                                            onChange={(e) => setEditForm({ ...editForm, is_completed: e.target.checked })}
                                        />
                                        ✅ Выполнена
                                    </label>
                                </div>
                                <div className="task-modal__buttons">
                                    <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={saving}>
                                        Отмена
                                    </Button>
                                    <Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
                                        {saving ? '⏳ Сохранение...' : '💾 Сохранить'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Модалка этапов (аналог из TasksSection) */}
            {
                showStepsModal && (
                    <div className="task-modal-overlay" onClick={() => setShowStepsModal(false)}>
                        <div className="task-modal task-modal--steps" onClick={(e) => e.stopPropagation()}>
                            <h2 className="task-modal__title">📋 Этапы</h2>
                            {stages.length === 0 ? (
                                <p className="task-modal__empty">Нет шагов</p>
                            ) : (
                                <ul className="task-steps-list">
                                    {stages.map((stage) => (
                                        <li key={stage.id} className="task-steps-list__item">
                                            <label className="task-steps-list__checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={stage.is_completed}
                                                    onChange={(e) => toggleStage(stage.id, e.target.checked)}
                                                    disabled={task.is_archived}
                                                />
                                                <span className="task-steps-list__name">
                                                    Шаг {stage.order}:<br />
                                                    {stage.name}
                                                    {stage.is_completed && ' ✅'}
                                                </span>
                                            </label>
                                            {stage.description && (
                                                <span className="task-steps-list__desc">{stage.description}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="task-modal__buttons">
                                <Button variant="secondary" onClick={() => setShowStepsModal(false)}>
                                    Закрыть
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Модалка истории */}
            {
                showHistoryModal && (
                    <div className="task-modal-overlay" onClick={() => setShowHistoryModal(false)}>
                        <div className="task-modal task-modal--history" onClick={(e) => e.stopPropagation()}>
                            <h2 className="task-modal__title">📜 История изменений</h2>
                            {history.length === 0 ? (
                                <p className="task-modal__empty">История пуста</p>
                            ) : (
                                <div className="task-history-list">
                                    {history.map((entry) => (
                                        <div key={entry.id} className="task-history-list__item">
                                            <div className="task-history-list__header">
                                                <span className="task-history-list__user">
                                                    {entry.user?.first_name} {entry.user?.last_name} (@{entry.user?.username})
                                                </span>
                                                <span className="task-history-list__date">{formatDate(entry.created_at)}</span>
                                            </div>
                                            <div className="task-history-list__body">
                                                <Badge variant="secondary">{entry.get_action_type_display?.() || entry.action_type}</Badge>
                                                {entry.field_name && (
                                                    <span className="task-history-list__field">{entry.field_name}</span>
                                                )}
                                                {entry.old_value && (
                                                    <span className="task-history-list__old">было: {JSON.stringify(entry.old_value)}</span>
                                                )}
                                                {entry.new_value && (
                                                    <span className="task-history-list__new">стало: {JSON.stringify(entry.new_value)}</span>
                                                )}
                                                {entry.comment && (
                                                    <span className="task-history-list__comment">💬 {entry.comment}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="task-modal__buttons">
                                <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
                                    Закрыть
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Модалка протокола */}
            {
                showProtocolModal && protocol && (
                    <div className="task-modal-overlay" onClick={() => setShowProtocolModal(false)}>
                        <div className="task-modal task-modal--protocol" onClick={(e) => e.stopPropagation()}>
                            <h2 className="task-modal__title">📄 Протокол: {protocol.code}</h2>
                            <div className="task-protocol-modal">
                                <div className="task-protocol-modal__header">
                                    <div><strong>Название:</strong> {protocol.name}</div>
                                    <div><strong>Версия:</strong> {protocol.version || '1.0'}</div>
                                </div>
                                {protocol.description && (
                                    <div className="task-protocol-modal__description">
                                        <strong>Описание:</strong> {protocol.description}
                                    </div>
                                )}
                                <div className="task-protocol-modal__stages">
                                    <h4>Этапы протокола ({protocol.stages?.length || 0})</h4>
                                    {protocol.stages && protocol.stages.length > 0 ? (
                                        <ul className="task-steps-list">
                                            {protocol.stages.map((stage) => (
                                                <li key={stage.id} className="task-steps-list__item">
                                                    <span className="task-steps-list__order">Шаг {stage.order}:</span>
                                                    <span className="task-steps-list__name">{stage.name}</span>
                                                    {stage.description && (
                                                        <span className="task-steps-list__desc">{stage.description}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="task-modal__empty">Нет этапов</p>
                                    )}
                                </div>
                                {protocol.created_by && (
                                    <div className="task-protocol-modal__meta">
                                        <span>Создан: {protocol.created_by.first_name} {protocol.created_by.last_name} (@{protocol.created_by.username})</span>
                                        <span>Дата: {formatDate(protocol.created_at)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="task-modal__buttons">
                                <Button variant="secondary" onClick={() => setShowProtocolModal(false)}>
                                    Закрыть
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    )
}
