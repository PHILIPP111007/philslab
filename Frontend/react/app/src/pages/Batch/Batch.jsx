import './Batch.css'
import { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Fetch from '../../API/Fetch'
import { buildSamplePayload } from '../../API/payloads'
import { UserContext } from "../../data/context"
import { useDepartments } from '../../hooks/useDepartments';
import { notify_error, notify_success } from '../../modules/notify'
import { formatDate } from '../../modules/dateTime'
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
    const [tasks, setTasks] = useState([])

    // Редактирование батча
    const [showEditModal, setShowEditModal] = useState(false)
    const [editFormData, setEditFormData] = useState({
        name: '',
        department: '',
        descr: '',
    })

    // Добавление образцов – новый подход с поиском
    const [showAddSampleModal, setShowAddSampleModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedSampleIds, setSelectedSampleIds] = useState(new Set())
    const [searchTotal, setSearchTotal] = useState(0)
    const [searchPageSize] = useState(20)
    const [addLoading, setAddLoading] = useState(false)
    const searchAbortController = useRef(null)

    // Редактирование образца
    const [showEditSampleModal, setShowEditSampleModal] = useState(false)
    const [editingSample, setEditingSample] = useState(null)
    const [sampleEditForm, setSampleEditForm] = useState({
        sample_code: '',
        sample_group_code: '',
        zlims_code: '',
        uin1: '',
        uin2: '',
        project_code: '',
        sample_index: '',
        qc_1: '',
        qc_2: '',
        descr: '',
        material_type: '',
    })

    // Добавление задачи
    const [showAddTaskModal, setShowAddTaskModal] = useState(false)
    const [availableTasks, setAvailableTasks] = useState([])
    const [selectedTaskId, setSelectedTaskId] = useState('')

    const { departments } = useDepartments();

    useEffect(() => {
        rememberPage(`batch/${batchId}`)
    }, [batchId])

    // ---------- ЗАГРУЗКА БАТЧА ----------
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
            setTasks(data.data.tasks || [])
        } else {
            notify_error(data?.error || 'Батч не найден')
            navigate('/batches')
        }
        setLoading(false)
    }, [batchId, navigate])

    useEffect(() => {
        loadBatch()
    }, [loadBatch])

    // ---------- ПОИСК ОБРАЗЦОВ ----------
    const searchSamples = useCallback(async (query, page = 1) => {
        if (!query.trim() || query.trim().length < 2) {
            setSearchResults([])
            setSearchTotal(0)
            return
        }

        // Отменяем предыдущий запрос
        if (searchAbortController.current) {
            searchAbortController.current.abort()
        }
        const controller = new AbortController()
        searchAbortController.current = controller

        setSearchLoading(true)
        try {
            const existingIds = new Set(samples.map(s => s.id))
            const params = new URLSearchParams({
                search: query,
                page: page,
                page_size: searchPageSize,
            })
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `samples/?${params.toString()}`,
                method: HttpMethod.GET,
                signal: controller.signal,
            })
            if (data?.ok) {
                const filtered = data.data.filter(s => !existingIds.has(s.id))
                setSearchResults(filtered)
                setSearchTotal(data.total)
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Search error:', error)
            }
        } finally {
            setSearchLoading(false)
            searchAbortController.current = null
        }
    }, [samples, searchPageSize])

    // Дебаунс для поиска
    useEffect(() => {
        const timer = setTimeout(() => {
            searchSamples(searchQuery, 1)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, searchSamples])

    // Выбор/снятие выбора образца
    const toggleSampleSelection = (sampleId) => {
        setSelectedSampleIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(sampleId)) newSet.delete(sampleId)
            else newSet.add(sampleId)
            return newSet
        })
    }

    const toggleAllSelection = (checked) => {
        if (checked) {
            const allIds = searchResults.map(s => s.id)
            setSelectedSampleIds(new Set(allIds))
        } else {
            setSelectedSampleIds(new Set())
        }
    }

    // Массовое добавление выбранных образцов
    const handleAddSelectedSamples = async () => {
        if (selectedSampleIds.size === 0) {
            notify_error('Выберите хотя бы один образец')
            return
        }
        setAddLoading(true)
        const ids = Array.from(selectedSampleIds)
        const promises = ids.map(id =>
            Fetch({
                api_version: APIVersion.V2,
                action: `batch/${batchId}/sample/${id}/`,
                method: HttpMethod.POST,
            })
        )
        const results = await Promise.all(promises)
        const allOk = results.every(r => r?.ok)
        if (allOk) {
            notify_success(`Добавлено ${ids.length} образцов`)
            await loadBatch()
            setShowAddSampleModal(false)
            setSelectedSampleIds(new Set())
            setSearchQuery('')
            setSearchResults([])
        } else {
            const errors = results.filter(r => !r?.ok).map(r => r?.error).join('; ')
            notify_error(`Ошибка добавления: ${errors}`)
        }
        setAddLoading(false)
    }

    // ---------- ЗАГРУЗКА ДОСТУПНЫХ ЗАДАЧ ----------
    const loadAvailableTasks = useCallback(async () => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'tasks/',
            method: HttpMethod.GET,
            params: { page_size: 100 }
        })
        if (data?.ok) {
            const existingIds = new Set(tasks.map(t => t.id))
            const available = (data.data || []).filter(t => !existingIds.has(t.id))
            setAvailableTasks(available)
        }
    }, [tasks])

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

    // ---------- РЕДАКТИРОВАНИЕ ОБРАЗЦА ----------
    const handleEditSample = (sample) => {
        setEditingSample(sample)
        setSampleEditForm({
            sample_code: sample.sample_code || '',
            sample_group_code: sample.sample_group_code || '',
            zlims_code: sample.zlims_code || '',
            uin1: sample.uin1 || '',
            uin2: sample.uin2 || '',
            project_code: sample.project_code || '',
            sample_index: sample.sample_index || '',
            qc_1: sample.qc_1 ?? '',
            qc_2: sample.qc_2 ?? '',
            descr: sample.descr || '',
            material_type: sample.material_type || '',
        })
        setShowEditSampleModal(true)
    }

    const handleSaveSampleEdit = async () => {
        if (!editingSample) return

        const body = buildSamplePayload(sampleEditForm)

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
            notify_success('Образец обновлен!')
        } else {
            notify_error(data?.error || 'Ошибка обновления образца')
        }
    }

    // ---------- УДАЛЕНИЕ ОБРАЗЦА ИЗ БАТЧА ----------
    const handleRemoveSample = async (sampleId) => {
        if (!confirm('Удалить образец из батча?')) return

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
            notify_success('Образец удален из батча!')
        } else {
            notify_error(data?.error || 'Ошибка удаления')
        }
    }

    // ---------- ЗАДАЧИ ----------
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

    // ---------- КОЛОНКИ ----------
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
                        <LinkButton to={`/sample/${id}/`}>{id}</LinkButton>
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
            accessorKey: 'sample_group_code',
            header: 'Код группы',
            size: 150,
            enableEditing: false,
        },
        {
            accessorKey: 'zlims_code',
            header: 'ZLIMS код',
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
            accessorKey: 'material_type',
            header: 'Тип материала',
            size: 130,
            enableEditing: false,
        },
        {
            accessorKey: 'timestamp',
            header: 'Создан',
            size: 160,
            enableEditing: false,
            editable: false,
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

    const taskColumns = [
        {
            accessorKey: 'id',
            header: 'ID',
            size: 70,
            cell: ({ getValue }) => {
                const id = getValue()
                return id ? <LinkButton to={`/task/${id}/`}>{id}</LinkButton> : '—'
            },
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
            header: 'Действия',
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
                                <Badge variant="info">📦 ID: {batch.id}</Badge>
                                <Badge variant="secondary">📋 {batch.sample_count || 0} образцов</Badge>
                            </div>
                            <div className="batch-detail__actions">
                                <Button variant="primary" onClick={handleEdit}>✏️ Редактировать</Button>
                                <Button variant="success" onClick={() => setShowAddSampleModal(true)}>
                                    ➕ Добавить образец
                                </Button>
                                <Button variant="danger" onClick={handleDeleteBatch}>🗑️ Удалить</Button>
                            </div>
                        </div>

                        <div className="batch-detail__info">
                            <div className="batch-detail__info-grid">
                                <div className="batch-detail__info-item">
                                    <span className="batch-detail__info-label">Отдел</span>
                                    <span className="batch-detail__info-value">{batch.department || '—'}</span>
                                </div>
                                <div className="batch-detail__info-item">
                                    <span className="batch-detail__info-label">Создан</span>
                                    <span className="batch-detail__info-value">{formatDate(batch.timestamp)}</span>
                                </div>
                                <div className="batch-detail__info-item">
                                    <span className="batch-detail__info-label">Обновлен</span>
                                    <span className="batch-detail__info-value">{formatDate(batch.updated_at)}</span>
                                </div>
                                <div className="batch-detail__info-item">
                                    <span className="batch-detail__info-label">Создатель</span>
                                    <span className="batch-detail__info-value">{batch.user_id || '—'}</span>
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

                    {/* Таблица образцов */}
                    <div className="batch-detail__samples">
                        <div className="batch-detail__samples-header">
                            <h2 className="batch-detail__samples-title">📋 Образцы в батче ({batch.sample_count || 0})</h2>
                        </div>

                        {samples.length === 0 ? (
                            <div className="batch-detail__empty">
                                <span className="batch-detail__empty-icon">📭</span>
                                <p>В этом батче пока нет образцов</p>
                                <Button variant="primary" onClick={() => setShowAddSampleModal(true)}>
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
                                enableFiltering={true}
                                enablePagination={true}
                                enableColumnVisibility={true}
                                enableAddButton={false}
                                enableExport={true}
                                enableInlineEdit={false}
                                enableEmptyRow={false}
                                enableActionsColumn={false}
                                enableCellSelection={true}
                            />
                        )}
                    </div>

                    {/* Блок связанных задач */}
                    <div className="batch-detail__tasks" style={{ marginTop: '2rem' }}>
                        <div className="batch-detail__samples-header">
                            <h2 className="batch-detail__samples-title">📋 Связанные задачи ({tasks.length})</h2>
                            <Button variant="primary" onClick={() => { loadAvailableTasks(); setShowAddTaskModal(true); }}>
                                ➕ Добавить задачу
                            </Button>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="batch-detail__empty">
                                <span className="batch-detail__empty-icon">📭</span>
                                <p>Нет связанных задач</p>
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

            {/* Модалка добавления задачи */}
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

            {/* Модалка редактирования батча */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">✏️ Редактирование батча</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
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

            {/* Модалка редактирования образца */}
            {showEditSampleModal && editingSample && (
                <div className="modal-overlay" onClick={() => setShowEditSampleModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">✏️ Редактирование образца #{editingSample.id}</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveSampleEdit(); }}>
                            <div className="modal-form-group">
                                <label>Sample Code</label>
                                <input
                                    type="text"
                                    value={sampleEditForm.sample_code}
                                    onChange={(e) => setSampleEditForm({ ...sampleEditForm, sample_code: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            {[
                                ['sample_group_code', 'Код группы'],
                                ['zlims_code', 'ZLIMS код'],
                                ['uin1', 'UIN 1'],
                                ['uin2', 'UIN 2'],
                                ['project_code', 'Код проекта'],
                                ['sample_index', 'Индекс'],
                            ].map(([field, label]) => (
                                <div className="modal-form-group" key={field}>
                                    <label>{label}</label>
                                    <input
                                        type="text"
                                        value={sampleEditForm[field]}
                                        onChange={(e) => setSampleEditForm({ ...sampleEditForm, [field]: e.target.value })}
                                        className="modal-input"
                                    />
                                </div>
                            ))}
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

            {/* Новая модалка добавления образцов с поиском */}
            {showAddSampleModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowAddSampleModal(false)
                    setSelectedSampleIds(new Set())
                    setSearchQuery('')
                    setSearchResults([])
                }}>
                    <div className="modal modal--add-samples" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">➕ Добавление образцов в батч</h2>
                        <div className="modal-form-group">
                            <label>Поиск образцов (минимум 2 символа)</label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="modal-input"
                                placeholder="Введите код или название..."
                                autoFocus
                            />
                        </div>

                        {searchLoading && <Spinner />}

                        {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                            <p className="modal-empty">Образцы не найдены</p>
                        )}

                        {searchResults.length > 0 && (
                            <div className="modal-samples-list">
                                <div className="modal-samples-list__header">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={searchResults.every(s => selectedSampleIds.has(s.id))}
                                            onChange={(e) => toggleAllSelection(e.target.checked)}
                                        />
                                        Выбрать все
                                    </label>
                                    <span>Найдено: {searchTotal}</span>
                                </div>
                                <ul className="modal-samples-list__items">
                                    {searchResults.map(sample => (
                                        <li key={sample.id} className="modal-samples-list__item">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSampleIds.has(sample.id)}
                                                    onChange={() => toggleSampleSelection(sample.id)}
                                                />
                                                <span>
                                                    <strong>{sample.sample_code || 'Без кода'}</strong>
                                                    {sample.zlims_code && ` (ZLIMS: ${sample.zlims_code})`}
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="modal-button-group">
                            <Button variant="secondary" onClick={() => {
                                setShowAddSampleModal(false)
                                setSelectedSampleIds(new Set())
                                setSearchQuery('')
                                setSearchResults([])
                            }} disabled={addLoading}>
                                Отмена
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddSelectedSamples}
                                disabled={selectedSampleIds.size === 0 || addLoading}
                            >
                                {addLoading ? '⏳ Добавление...' : `➕ Добавить выбранные (${selectedSampleIds.size})`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
