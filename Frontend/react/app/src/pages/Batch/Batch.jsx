import './Batch.css'
import { useState, useEffect, useContext, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Fetch from '../../API/Fetch'
import { UserContext } from "../../data/context"
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
    const [subsamples, setSubsamples] = useState([])
    const [loading, setLoading] = useState(true)

    // Состояния для редактирования батча
    const [showEditModal, setShowEditModal] = useState(false)
    const [editFormData, setEditFormData] = useState({
        name: '',
        department: '',
        descr: '',
    })

    // Состояния для добавления подобразца
    const [showAddSubsampleModal, setShowAddSubsampleModal] = useState(false)
    const [availableSubsamples, setAvailableSubsamples] = useState([])
    const [selectedSubsampleId, setSelectedSubsampleId] = useState('')

    // Состояния для редактирования подобразца
    const [showEditSubsampleModal, setShowEditSubsampleModal] = useState(false)
    const [editingSubsample, setEditingSubsample] = useState(null)
    const [subsampleEditForm, setSubsampleEditForm] = useState({
        sample_code: '',
        name: '',
        some_number: '',
        qc_1: '',
        qc_2: '',
        descr: '',
        material_type: '',
    })

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
            setSubsamples(data.data.subsamples || [])
        } else {
            notify_error(data?.error || 'Батч не найден')
            navigate('/batches')
        }
        setLoading(false)
    }, [batchId, navigate])

    const loadAvailableSubsamples = useCallback(async () => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'subsamples/',
            method: HttpMethod.GET,
            params: {
                page_size: 1000,
            }
        })
        if (data?.ok) {
            const existingIds = new Set(subsamples.map(s => s.id))
            const available = (data.data || []).filter(s => !existingIds.has(s.id))
            setAvailableSubsamples(available)
        }
    }, [subsamples])

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
    const handleEditSubsample = (subsample) => {
        setEditingSubsample(subsample)
        setSubsampleEditForm({
            sample_code: subsample.sample_code || '',
            name: subsample.name || '',
            some_number: subsample.some_number ?? '',
            qc_1: subsample.qc_1 ?? '',
            qc_2: subsample.qc_2 ?? '',
            descr: subsample.descr || '',
            material_type: subsample.material_type || '',
        })
        setShowEditSubsampleModal(true)
    }

    const handleSaveSubsampleEdit = async () => {
        if (!editingSubsample) return

        // Преобразуем пустые строки в null для числовых полей
        const body = {
            sample_code: subsampleEditForm.sample_code || null,
            name: subsampleEditForm.name || null,
            some_number: subsampleEditForm.some_number === '' ? null : Number(subsampleEditForm.some_number),
            qc_1: subsampleEditForm.qc_1 === '' ? null : Number(subsampleEditForm.qc_1),
            qc_2: subsampleEditForm.qc_2 === '' ? null : Number(subsampleEditForm.qc_2),
            descr: subsampleEditForm.descr || null,
            material_type: subsampleEditForm.material_type || null,
        }

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `subsample/${editingSubsample.id}/`,
            method: HttpMethod.PUT,
            body: body,
        })

        if (data?.ok) {
            setSubsamples(prev =>
                prev.map(s => s.id === editingSubsample.id ? { ...s, ...body } : s)
            )
            setShowEditSubsampleModal(false)
            setEditingSubsample(null)
            notify_success('Подобразец обновлен!')
        } else {
            notify_error(data?.error || 'Ошибка обновления подобразца')
        }
    }

    // ---------- ДОБАВЛЕНИЕ ПОДОБРАЗЦА В БАТЧ ----------
    const handleAddSubsample = async () => {
        if (!selectedSubsampleId) {
            notify_error('Выберите подобразец')
            return
        }

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${batchId}/subsample/${selectedSubsampleId}/`,
            method: HttpMethod.POST,
        })
        if (data?.ok) {
            if (data.data) {
                setBatch(data.data)
                setSubsamples(data.data.subsamples || [])
            } else {
                await loadBatch()
            }
            setShowAddSubsampleModal(false)
            setSelectedSubsampleId('')
            notify_success('Подобразец добавлен в батч!')
        } else {
            notify_error(data?.error || 'Ошибка добавления')
        }
    }

    // ---------- УДАЛЕНИЕ ПОДОБРАЗЦА ИЗ БАТЧА ----------
    const handleRemoveSubsample = async (subsampleId) => {
        if (!confirm('Удалить подобразец из батча?')) return

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${batchId}/subsample/${subsampleId}/`,
            method: HttpMethod.DELETE,
        })
        if (data?.ok) {
            if (data.data) {
                setBatch(data.data)
                setSubsamples(data.data.subsamples || [])
            } else {
                await loadBatch()
            }
            notify_success('Подобразец удален из батча!')
        } else {
            notify_error(data?.error || 'Ошибка удаления')
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
    const subsampleColumns = [
        {
            accessorKey: 'id',
            header: 'ID',
            size: 70,
            enableEditing: false,
            cell: ({ getValue, row }) => {
                const subsampleId = row.original.id
                return (
                    <LinkButton to={`/subsample/${subsampleId}`}>
                        {subsampleId}
                    </LinkButton>
                )
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
                        onClick={() => handleEditSubsample(row.original)}
                    >
                        ✏️
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveSubsample(row.original.id)}
                    >
                        🗑️
                    </Button>
                </div>
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
                                    📋 {batch.subsample_count || 0} подобразцов
                                </Badge>
                            </div>
                            <div className="batch-detail__actions">
                                <Button variant="primary" onClick={handleEdit}>
                                    ✏️ Редактировать
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={() => {
                                        loadAvailableSubsamples()
                                        setShowAddSubsampleModal(true)
                                    }}
                                >
                                    ➕ Добавить подобразец
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
                    <div className="batch-detail__subsamples">
                        <div className="batch-detail__subsamples-header">
                            <h2 className="batch-detail__subsamples-title">
                                📋 Подобразцы в батче ({batch.subsample_count || 0})
                            </h2>
                        </div>

                        {subsamples.length === 0 ? (
                            <div className="batch-detail__empty">
                                <span className="batch-detail__empty-icon">📭</span>
                                <p>В этом батче пока нет подобразцов</p>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        loadAvailableSubsamples()
                                        setShowAddSubsampleModal(true)
                                    }}
                                >
                                    ➕ Добавить подобразец
                                </Button>
                            </div>
                        ) : (
                            <Table
                                data={subsamples}
                                columns={subsampleColumns}
                                pageSize={10}
                                enableSelection={false}
                                enableSorting={true}
                                enableFiltering={true}
                                enablePagination={true}
                                enableColumnVisibility={false}
                                enableAddButton={false}
                                enableExport={true}
                                enableInlineEdit={false}
                                enableEmptyRow={false}
                                enableActionsColumn={false}
                            />
                        )}
                    </div>
                </div>
            </div>

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
                                <input
                                    type="text"
                                    value={editFormData.department}
                                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                    className="modal-input"
                                    placeholder="Введите отдел"
                                />
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

            {/* Модальное окно редактирования подобразца */}
            {showEditSubsampleModal && editingSubsample && (
                <div className="modal-overlay" onClick={() => setShowEditSubsampleModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">✏️ Редактирование подобразца #{editingSubsample.id}</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            handleSaveSubsampleEdit()
                        }}>
                            <div className="modal-form-group">
                                <label>Sample Code</label>
                                <input
                                    type="text"
                                    value={subsampleEditForm.sample_code}
                                    onChange={(e) => setSubsampleEditForm({ ...subsampleEditForm, sample_code: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Название</label>
                                <input
                                    type="text"
                                    value={subsampleEditForm.name}
                                    onChange={(e) => setSubsampleEditForm({ ...subsampleEditForm, name: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Номер</label>
                                <input
                                    type="number"
                                    value={subsampleEditForm.some_number}
                                    onChange={(e) => setSubsampleEditForm({ ...subsampleEditForm, some_number: e.target.value })}
                                    className="modal-input"
                                    step="any"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>QC 1</label>
                                <input
                                    type="number"
                                    value={subsampleEditForm.qc_1}
                                    onChange={(e) => setSubsampleEditForm({ ...subsampleEditForm, qc_1: e.target.value })}
                                    className="modal-input"
                                    step="any"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>QC 2</label>
                                <input
                                    type="number"
                                    value={subsampleEditForm.qc_2}
                                    onChange={(e) => setSubsampleEditForm({ ...subsampleEditForm, qc_2: e.target.value })}
                                    className="modal-input"
                                    step="any"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Описание</label>
                                <textarea
                                    value={subsampleEditForm.descr}
                                    onChange={(e) => setSubsampleEditForm({ ...subsampleEditForm, descr: e.target.value })}
                                    className="modal-textarea"
                                    rows="3"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Тип материала</label>
                                <input
                                    type="text"
                                    value={subsampleEditForm.material_type}
                                    onChange={(e) => setSubsampleEditForm({ ...subsampleEditForm, material_type: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-button-group">
                                <Button variant="secondary" onClick={() => setShowEditSubsampleModal(false)}>
                                    Отмена
                                </Button>
                                <Button variant="primary" onClick={handleSaveSubsampleEdit}>
                                    💾 Сохранить
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно добавления подобразца */}
            {showAddSubsampleModal && (
                <div className="modal-overlay" onClick={() => setShowAddSubsampleModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">➕ Добавление подобразца в батч</h2>
                        <div className="modal-form-group">
                            <label>Выберите подобразец</label>
                            {availableSubsamples.length === 0 ? (
                                <p className="modal-empty">Нет доступных подобразцов</p>
                            ) : (
                                <select
                                    value={selectedSubsampleId}
                                    onChange={(e) => setSelectedSubsampleId(e.target.value)}
                                    className="modal-input"
                                >
                                    <option value="">Выберите...</option>
                                    {availableSubsamples.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.sample_code || 'N/A'} — {s.name || 'Без названия'}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="modal-button-group">
                            <Button variant="secondary" onClick={() => setShowAddSubsampleModal(false)}>
                                Отмена
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddSubsample}
                                disabled={!selectedSubsampleId || availableSubsamples.length === 0}
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