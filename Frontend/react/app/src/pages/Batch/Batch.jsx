import './Batch.css'
import { useState, useEffect, useContext, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Fetch from '../../API/Fetch'
import { UserContext } from "../../data/context"
import { useDepartments } from '../../hooks/useDepartments';
import { notify_error, notify_success } from '../../modules/notify'
import rememberPage from "../../modules/rememberPage"
import { HttpMethod, APIVersion } from '../../data/enums'
import Spinner from "../components/Spinner/Spinner"
import Table from "../components/Table/Table"
import Header from '../components/Header/Header'
import Button from '../components/Button/Button'
import Badge from '../components/Badge/Badge'
import LinkButton from '../components/LinkButton/LinkButton'

export default function Batch() {
    const { user } = useContext(UserContext)
    const params = useParams()
    const navigate = useNavigate()
    const batchId = params.id

    const [batch, setBatch] = useState(null)
    const [samples, setSamples] = useState([])
    const [loading, setLoading] = useState(true)

    const [tasks, setTasks] = useState([]) // ✅ связанные задачи

    // Состояния для редактирования батча
    const [showEditModal, setShowEditModal] = useState(false)
    const [editFormData, setEditFormData] = useState({
        name: '',
        department: '',
        descr: '',
    })

    // Состояния для добавления подобразца
    const [showAddSampleModal, setShowAddSampleModal] = useState(false)
    const [availableSamples, setAvailableSamples] = useState([])
    const [selectedSampleId, setSelectedSampleId] = useState('')

    // Состояния для редактирования подобразца
    const [showEditSampleModal, setShowEditSampleModal] = useState(false)
    const [editingSample, setEditingSample] = useState(null)
    const [sampleEditForm, setSampleEditForm] = useState({
        sample_code: '',
        name: '',
        some_number: '',
        qc_1: '',
        qc_2: '',
        descr: '',
        material_type: '',
    })

    // ✅ Состояния для добавления задачи в батч
    const [showAddTaskModal, setShowAddTaskModal] = useState(false)
    const [availableTasks, setAvailableTasks] = useState([])
    const [selectedTaskId, setSelectedTaskId] = useState('')
    const { departments } = useDepartments();

    useEffect(() => {
        rememberPage(`batch/${batchId}`)
    }, [batchId])

    // ---------- ЗАГРУЗКА ДАННЫХ ----------
    const loadBatch = useCallback(async () => {
        setLoading(true)
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${batchId}/`,
            method: HttpMethod.GET,
        })
        if (data?.ok) {
            setBatch(data.data)
            setSamples(data.data.samples || [])
            setTasks(data.data.tasks || [])  // ✅
        } else {
            notify_error(data?.error || 'Батч не найден')
            navigate('/batches')
        }
        setLoading(false)
    }, [batchId, navigate])

    const loadAvailableSamples = useCallback(async () => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'samples/',
            method: HttpMethod.GET,
            params: {
                page_size: 1000,
            }
        })
        if (data?.ok) {
            const existingIds = new Set(samples.map(s => s.id))
            const available = (data.data || []).filter(s => !existingIds.has(s.id))
            setAvailableSamples(available)
        }
    }, [samples])

    // ✅ Загрузка доступных задач (ещё не привязанных)
    const loadAvailableTasks = useCallback(async () => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'tasks/',
            method: HttpMethod.GET,
            params: { page_size: 1000 }
        })
        if (data?.ok) {
            const existingIds = new Set(tasks.map(t => t.id))
            const available = (data.data || []).filter(t => !existingIds.has(t.id))
            setAvailableTasks(available)
        }
    }, [tasks])

    useEffect(() => {
        loadBatch()
    }, [loadBatch])

    // ---------- РЕДАКТИРОВАНИЕ БАТЧА ----------
    const handleEdit = () => {
        if (batch) {
            setEditFormData({
                name: batch.name || '',
                department: batch.department || '',
                descr: batch.descr || '',
            })
            setShowEditModal(true)
        }
    }

    const handleSaveEdit = async () => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${batchId}/`,
            method: HttpMethod.PUT,
            body: editFormData,
        })
        if (data?.ok) {
            setBatch(data.data)
            setShowEditModal(false)
            notify_success('Батч обновлен!')
        } else {
            notify_error(data?.error || 'Ошибка обновления')
        }
    }

    // ---------- РЕДАКТИРОВАНИЕ ПОДОБРАЗЦА ----------
    const handleEditSample = (sample) => {
        setEditingSample(sample)
        setSampleEditForm({
            sample_code: sample.sample_code || '',
            name: sample.name || '',
            some_number: sample.some_number ?? '',
            qc_1: sample.qc_1 ?? '',
            qc_2: sample.qc_2 ?? '',
            descr: sample.descr || '',
            material_type: sample.material_type || '',
        })
        setShowEditSampleModal(true)
    }

    const handleSaveSampleEdit = async () => {
        if (!editingSample) return

        // Преобразуем пустые строки в null для числовых полей
        const body = {
            sample_code: sampleEditForm.sample_code || null,
            name: sampleEditForm.name || null,
            some_number: sampleEditForm.some_number === '' ? null : Number(sampleEditForm.some_number),
            qc_1: sampleEditForm.qc_1 === '' ? null : Number(sampleEditForm.qc_1),
            qc_2: sampleEditForm.qc_2 === '' ? null : Number(sampleEditForm.qc_2),
            descr: sampleEditForm.descr || null,
            material_type: sampleEditForm.material_type || null,
        }

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `sample/${editingSample.id}/`,
            method: HttpMethod.PUT,
            body: body,
        })

        if (data?.ok) {
            setSamples(prev =>
                prev.map(s => s.id === editingSample.id ? { ...s, ...body } : s)
            )
            setShowEditSampleModal(false)
            setEditingSample(null)
            notify_success('Подобразец обновлен!')
        } else {
            notify_error(data?.error || 'Ошибка обновления подобразца')
        }
    }

    // ---------- ДОБАВЛЕНИЕ ПОДОБРАЗЦА В БАТЧ ----------
    const handleAddSample = async () => {
        if (!selectedSampleId) {
            notify_error('Выберите подобразец')
            return
        }

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${batchId}/sample/${selectedSampleId}/`,
            method: HttpMethod.POST,
        })
        if (data?.ok) {
            if (data.data) {
                setBatch(data.data)
                setSamples(data.data.samples || [])
            } else {
                await loadBatch()
            }
            setShowAddSampleModal(false)
            setSelectedSampleId('')
            notify_success('Подобразец добавлен в батч!')
        } else {
            notify_error(data?.error || 'Ошибка добавления')
        }
    }

    // ---------- УДАЛЕНИЕ ПОДОБРАЗЦА ИЗ БАТЧА ----------
    const handleRemoveSample = async (sampleId) => {
        if (!confirm('Удалить подобразец из батча?')) return

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${batchId}/sample/${sampleId}/`,
            method: HttpMethod.DELETE,
        })
        if (data?.ok) {
            if (data.data) {
                setBatch(data.data)
                setSamples(data.data.samples || [])
            } else {
                await loadBatch()
            }
            notify_success('Подобразец удален из батча!')
        } else {
            notify_error(data?.error || 'Ошибка удаления')
        }
    }

    // ✅ ДОБАВЛЕНИЕ ЗАДАЧИ В БАТЧ
    const handleAddTask = async () => {
        if (!selectedTaskId) {
            notify_error('Выберите задачу')
            return
        }
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${batchId}/task/${selectedTaskId}/`,
            method: HttpMethod.POST,
        })
        if (data?.ok) {
            setBatch(data.data)
            setTasks(data.data.tasks || [])
            setShowAddTaskModal(false)
            setSelectedTaskId('')
            notify_success('Задача добавлена в батч!')
        } else {
            notify_error(data?.error || 'Ошибка добавления задачи')
        }
    }

    // ✅ УДАЛЕНИЕ ЗАДАЧИ ИЗ БАТЧА
    const handleRemoveTask = async (taskId) => {
        if (!confirm('Удалить задачу из батча?')) return
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${batchId}/task/${taskId}/`,
            method: HttpMethod.DELETE,
        })
        if (data?.ok) {
            setBatch(data.data)
            setTasks(data.data.tasks || [])
            notify_success('Задача удалена из батча')
        } else {
            notify_error(data?.error || 'Ошибка удаления задачи')
        }
    }

    // ---------- УДАЛЕНИЕ БАТЧА ----------
    const handleDeleteBatch = async () => {
        if (!confirm('Удалить батч?')) return

        const res = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${batchId}/`,
            method: HttpMethod.DELETE,
        })
        if (res?.ok) {
            notify_success('Батч удален!')
            navigate('/batches')
        } else {
            notify_error(res?.error || 'Ошибка удаления')
        }
    }

    // ---------- ФОРМАТИРОВАНИЕ ДАТЫ ----------
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

    // ---------- КОЛОНКИ ДЛЯ ТАБЛИЦЫ ПОДОБРАЗЦОВ ----------
    const sampleColumns = [
        {
            accessorKey: 'id',
            header: 'ID',
            size: 70,
            enableEditing: false,
            enableSorting: true,
            cell: ({ getValue, row }) => {
                const id = getValue()
                if (id > 0) {
                    return (
                        <LinkButton to={`/sample/${id}/`}>
                            {id}
                        </LinkButton>
                    )
                }
                return id
            },
        },
        {
            accessorKey: 'sample_code',
            header: 'Sample Code',
            size: 150,
            enableEditing: false,
        },
        {
            accessorKey: 'name',
            header: 'Название',
            size: 150,
            enableEditing: false,
        },
        {
            accessorKey: 'some_number',
            header: 'Номер',
            size: 80,
            enableEditing: false,
        },
        {
            accessorKey: 'qc_1',
            header: 'QC 1',
            size: 70,
            enableEditing: false,
        },
        {
            accessorKey: 'qc_2',
            header: 'QC 2',
            size: 70,
            enableEditing: false,
        },
        {
            accessorKey: 'timestamp',
            header: 'Создан',
            size: 160,
            enableEditing: false,
            cell: ({ getValue }) => formatDate(getValue()),
        },
        {
            id: 'actions',
            header: 'Действия',
            size: 130,
            enableEditing: false,
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleEditSample(row.original)}
                    >
                        ✏️
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveSample(row.original.id)}
                    >
                        🗑️
                    </Button>
                </div>
            ),
        },
    ]

    // ---------- КОЛОНКИ ДЛЯ ТАБЛИЦЫ ЗАДАЧ ----------
    const taskColumns = [
        {
            accessorKey: 'id',
            header: 'ID',
            size: 70,
            cell: ({ getValue }) => (
                <LinkButton to={`/task/${getValue()}/`}>
                    {getValue()}
                </LinkButton>
            ),
        },
        { accessorKey: 'name', header: 'Название', size: 200 },
        { accessorKey: 'department', header: 'Отдел', size: 120 },
        { accessorKey: 'priority', header: 'Приоритет', size: 100 },
        {
            accessorKey: 'is_completed',
            header: 'Статус',
            size: 100,
            cell: ({ getValue }) => getValue() ? '✅ Завершена' : '🔄 В работе',
        },
        {
            id: 'actions',
            header: '',
            size: 80,
            enableSorting: false,
            cell: ({ row }) => (
                <Button variant="danger" size="sm" onClick={() => handleRemoveTask(row.original.id)}>
                    🗑️
                </Button>
            ),
        },
    ]

    // ---------- РЕНДЕР ----------
    if (loading) {
        return (
            <>
                <Header />
                <div className="batch-detail">
                    <Spinner />
                </div>
            </>
        )
    }

    if (!batch) {
        return (
            <>
                <Header />
                <div className="batch-detail">
                    <div className="batch-detail__not-found">
                        <h2>Батч не найден</h2>
                        <Button onClick={() => navigate('/batches')}>
                            ← Вернуться к списку
                        </Button>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header />
            <div className="batch-detail">
                <div className="batch-detail__container">
                    {/* Навигация */}
                    <div className="batch-detail__nav">
                        <LinkButton to={`/batches/${user.username}`} variant="secondary" size="sm">
                            ← Все батчи
                        </LinkButton>
                    </div>

                    {/* Карточка батча */}
                    <div className="batch-detail__card">
                        <div className="batch-detail__header">
                            <div className="batch-detail__title-section">
                                <h1 className="batch-detail__title">{batch.name || 'Батч без названия'}</h1>
                                <Badge variant="info">
                                    📦 ID: {batch.id}
                                </Badge>
                                <Badge variant="secondary">
                                    📋 {batch.sample_count || 0} образцов
                                </Badge>
                            </div>
                            <div className="batch-detail__actions">
                                <Button variant="primary" onClick={handleEdit}>
                                    ✏️ Редактировать
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={() => {
                                        loadAvailableSamples()
                                        setShowAddSampleModal(true)
                                    }}
                                >
                                    ➕ Добавить образец
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleDeleteBatch}
                                >
                                    🗑️ Удалить
                                </Button>
                            </div>
                        </div>

                        <div className="batch-detail__info">
                            <div className="batch-detail__info-grid">
                                <div className="batch-detail__info-item">
                                    <span className="batch-detail__info-label">Отдел</span>
                                    <span className="batch-detail__info-value">
                                        {batch.department || '—'}
                                    </span>
                                </div>
                                <div className="batch-detail__info-item">
                                    <span className="batch-detail__info-label">Создан</span>
                                    <span className="batch-detail__info-value">
                                        {formatDate(batch.timestamp)}
                                    </span>
                                </div>
                                <div className="batch-detail__info-item">
                                    <span className="batch-detail__info-label">Обновлен</span>
                                    <span className="batch-detail__info-value">
                                        {formatDate(batch.updated_at)}
                                    </span>
                                </div>
                                <div className="batch-detail__info-item">
                                    <span className="batch-detail__info-label">Создатель</span>
                                    <span className="batch-detail__info-value">
                                        {batch.user_id || '—'}
                                    </span>
                                </div>
                            </div>
                            {batch.descr && (
                                <div className="batch-detail__description">
                                    <span className="batch-detail__info-label">Описание</span>
                                    <p>{batch.descr}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Таблица подобразцов */}
                    <div className="batch-detail__samples">
                        <div className="batch-detail__samples-header">
                            <h2 className="batch-detail__samples-title">
                                📋 Образцы в батче ({batch.sample_count || 0})
                            </h2>
                        </div>

                        {samples.length === 0 ? (
                            <div className="batch-detail__empty">
                                <span className="batch-detail__empty-icon">📭</span>
                                <p>В этом батче пока нет образцов</p>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        loadAvailableSamples()
                                        setShowAddSampleModal(true)
                                    }}
                                >
                                    ➕ Добавить образец
                                </Button>
                            </div>
                        ) : (
                            <Table
                                data={samples}
                                columns={sampleColumns}
                                pageSize={10}
                                enableSelection={false}
                                enableSorting={true}
                                enableFiltering
                                enablePagination={true}
                                enableColumnVisibility={true}
                                enableAddButton={false}
                                enableExport={true}
                                enableInlineEdit={false}
                                enableEmptyRow={false}
                                enableActionsColumn={true}
                                enableCellSelection={true}
                            />
                        )}
                    </div>

                    {/* ✅ Блок связанных задач */}
                    <div className="batch-detail__tasks" style={{ marginTop: '2rem' }}>
                        <div className="batch-detail__samples-header">
                            <h2 className="batch-detail__samples-title">
                                📋 Связанные задачи ({tasks.length})
                            </h2>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="batch-detail__empty">
                                <span className="batch-detail__empty-icon">📭</span>
                                <p>Нет связанных задач</p>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        loadAvailableTasks()
                                        setShowAddTaskModal(true)
                                    }}
                                >
                                    ➕ Добавить задачу
                                </Button>
                            </div>
                        ) : (
                            <Table
                                data={tasks}
                                columns={taskColumns}
                                pageSize={10}
                                enableSelection={false}
                                enableSorting={true}
                                enableFiltering={true}
                                enablePagination={true}
                                enableColumnVisibility={false}
                                enableAddButton={false}
                                enableExport={false}
                                enableInlineEdit={false}
                                enableEmptyRow={false}
                                enableActionsColumn={false}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Модальное окно добавления задачи */}
            {showAddTaskModal && (
                <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">➕ Добавление задачи в батч</h2>
                        <div className="modal-form-group">
                            <label>Выберите задачу</label>
                            {availableTasks.length === 0 ? (
                                <p className="modal-empty">Нет доступных задач</p>
                            ) : (
                                <select
                                    value={selectedTaskId}
                                    onChange={(e) => setSelectedTaskId(e.target.value)}
                                    className="modal-input"
                                >
                                    <option value="">Выберите...</option>
                                    {availableTasks.map(t => (
                                        <option key={t.id} value={t.id}>
                                            #{t.id} {t.name} ({t.department || '—'})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="modal-button-group">
                            <Button variant="secondary" onClick={() => setShowAddTaskModal(false)}>
                                Отмена
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddTask}
                                disabled={!selectedTaskId || availableTasks.length === 0}
                            >
                                ➕ Добавить
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования батча */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">✏️ Редактирование батча</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            handleSaveEdit()
                        }}>
                            <div className="modal-form-group">
                                <label>Название</label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="modal-input"
                                    placeholder="Введите название"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Отдел</label>
                                <select
                                    value={editFormData.department || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                    className="modal-input"
                                >
                                    <option value="">Не выбран</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-form-group">
                                <label>Описание</label>
                                <textarea
                                    value={editFormData.descr}
                                    onChange={(e) => setEditFormData({ ...editFormData, descr: e.target.value })}
                                    className="modal-textarea"
                                    rows="3"
                                    placeholder="Введите описание"
                                />
                            </div>
                            <div className="modal-button-group">
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

            {/* Модальное окно редактирования образца */}
            {showEditSampleModal && editingSample && (
                <div className="modal-overlay" onClick={() => setShowEditSampleModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">✏️ Редактирование образца #{editingSample.id}</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            handleSaveSampleEdit()
                        }}>
                            <div className="modal-form-group">
                                <label>Sample Code</label>
                                <input
                                    type="text"
                                    value={sampleEditForm.sample_code}
                                    onChange={(e) => setSampleEditForm({ ...sampleEditForm, sample_code: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Название</label>
                                <input
                                    type="text"
                                    value={sampleEditForm.name}
                                    onChange={(e) => setSampleEditForm({ ...sampleEditForm, name: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Номер</label>
                                <input
                                    type="number"
                                    value={sampleEditForm.some_number}
                                    onChange={(e) => setSampleEditForm({ ...sampleEditForm, some_number: e.target.value })}
                                    className="modal-input"
                                    step="any"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>QC 1</label>
                                <input
                                    type="number"
                                    value={sampleEditForm.qc_1}
                                    onChange={(e) => setSampleEditForm({ ...sampleEditForm, qc_1: e.target.value })}
                                    className="modal-input"
                                    step="any"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>QC 2</label>
                                <input
                                    type="number"
                                    value={sampleEditForm.qc_2}
                                    onChange={(e) => setSampleEditForm({ ...sampleEditForm, qc_2: e.target.value })}
                                    className="modal-input"
                                    step="any"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Описание</label>
                                <textarea
                                    value={sampleEditForm.descr}
                                    onChange={(e) => setSampleEditForm({ ...sampleEditForm, descr: e.target.value })}
                                    className="modal-textarea"
                                    rows="3"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Тип материала</label>
                                <input
                                    type="text"
                                    value={sampleEditForm.material_type}
                                    onChange={(e) => setSampleEditForm({ ...sampleEditForm, material_type: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-button-group">
                                <Button variant="secondary" onClick={() => setShowEditSampleModal(false)}>
                                    Отмена
                                </Button>
                                <Button variant="primary" onClick={handleSaveSampleEdit}>
                                    💾 Сохранить
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно добавления подобразца */}
            {showAddSampleModal && (
                <div className="modal-overlay" onClick={() => setShowAddSampleModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">➕ Добавление образца в батч</h2>
                        <div className="modal-form-group">
                            <label>Выберите образец</label>
                            {availableSamples.length === 0 ? (
                                <p className="modal-empty">Нет доступных образцов</p>
                            ) : (
                                <select
                                    value={selectedSampleId}
                                    onChange={(e) => setSelectedSampleId(e.target.value)}
                                    className="modal-input"
                                >
                                    <option value="">Выберите...</option>
                                    {availableSamples.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.sample_code || 'N/A'} — {s.name || 'Без названия'}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="modal-button-group">
                            <Button variant="secondary" onClick={() => setShowAddSampleModal(false)}>
                                Отмена
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddSample}
                                disabled={!selectedSampleId || availableSamples.length === 0}
                            >
                                ➕ Добавить
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}