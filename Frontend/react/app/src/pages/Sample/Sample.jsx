import './Sample.css'
import { useState, useEffect, useCallback, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Fetch from '../../API/Fetch'
import { buildSamplePayload } from '../../API/payloads'
import { UserContext } from '../../data/context'
import { HttpMethod, APIVersion } from '../../data/enums'
import { notify_error, notify_success } from '../../modules/notify'
import { formatDate } from '../../modules/dateTime'
import rememberPage from '../../modules/rememberPage'
import Header from '../components/Header/Header'
import Spinner from '../components/Spinner/Spinner'
import Button from '../components/Button/Button'
import Badge from '../components/Badge/Badge'
import LinkButton from '../components/LinkButton/LinkButton'
import Table from '../components/Table/Table'
import History from '../components/History/History'

export default function Sample() {
    const { user } = useContext(UserContext)
    const params = useParams()
    const navigate = useNavigate()
    const sampleId = params.id
    const username = params.username || user?.username

    const [sample, setSample] = useState(null)
    const [loading, setLoading] = useState(true)
    const [batches, setBatches] = useState([])  // связанные батчи

    // Состояния для модалки редактирования
    const [showEditModal, setShowEditModal] = useState(false)
    const [editForm, setEditForm] = useState({
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
    const [saving, setSaving] = useState(false)

    // Запоминаем страницу
    useEffect(() => {
        rememberPage(`sample/${sampleId}/${username}`)
    }, [sampleId, username])

    // Загрузка данных
    const loadSample = useCallback(async () => {
        setLoading(true)
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `sample/${sampleId}/`,
            method: HttpMethod.GET,
        })
        if (data?.ok) {
            const sampleData = data.data
            setSample(sampleData)
            setBatches(sampleData.batches || [])
        } else {
            notify_error(data?.error || 'Образец не найден')
        }
        setLoading(false)
    }, [sampleId])

    useEffect(() => {
        loadSample()
    }, [loadSample])

    // Редактирование
    const handleEdit = () => {
        if (!sample) return
        setEditForm({
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
        setShowEditModal(true)
    }

    const handleSaveEdit = async () => {
        setSaving(true)
        const body = buildSamplePayload(editForm)
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `sample/${sampleId}/`,
            method: HttpMethod.PUT,
            body: body,
        })
        if (data?.ok) {
            notify_success('Образец обновлён')
            setShowEditModal(false)
            loadSample()
        } else {
            notify_error(data?.error || 'Ошибка обновления')
        }
        setSaving(false)
    }

    // Удаление
    const handleDelete = async () => {
        if (!confirm('Удалить образец безвозвратно?')) return
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `sample/${sampleId}/`,
            method: HttpMethod.DELETE,
        })
        if (data?.ok) {
            notify_success('Образец удалён')
            navigate(`/samples/${username}/`)
        } else {
            notify_error(data?.error || 'Ошибка удаления')
        }
    }

    // Колонки для таблицы батчей
    const batchColumns = [
        {
            accessorKey: 'id',
            header: 'ID',
            size: 70,
            cell: ({ getValue }) => {
                const id = getValue()
                return id ? <LinkButton to={`/batch/${id}/${username}/`}>{id}</LinkButton> : '—'
            },
        },
        { accessorKey: 'name', header: 'Название', size: 200 },
        { accessorKey: 'department', header: 'Отдел', size: 120 },
        {
            accessorKey: 'sample_count',
            header: 'Образцов',
            size: 100,
            cell: ({ getValue }) => getValue() || 0,
        },
        {
            accessorKey: 'timestamp',
            header: 'Создан',
            size: 180,
            cell: ({ getValue }) => formatDate(getValue()),
        },
    ]

    if (loading) {
        return (
            <>
                <Header />
                <div className="sample-detail" style={{ padding: '2rem', textAlign: 'center' }}>
                    <Spinner />
                </div>
            </>
        )
    }

    if (!sample) {
        return (
            <>
                <Header />
                <div className="sample-detail" style={{ padding: '2rem' }}>
                    <h2>Образец не найден</h2>
                    <Button onClick={() => navigate(`/samples/${username}/`)}>← К списку</Button>
                </div>
            </>
        )
    }

    return (
        <>
            <Header />
            <div className="sample-detail">
                <div className="sample-detail__container">
                    {/* Навигация */}
                    <div className="sample-detail__nav">
                        <LinkButton to={`/samples/${user.username}/`} variant="secondary" size="sm">
                            ← Все образцы
                        </LinkButton>
                    </div>

                    {/* Карточка образца */}
                    <div className="sample-detail__card">
                        <div className="sample-detail__header">
                            <div className="sample-detail__title-section">
                                <h1 className="sample-detail__title">
                                    {sample.sample_code || 'Образец без кода'}
                                </h1>
                                <Badge variant="info">ID: {sample.id}</Badge>
                                {sample.zlims_code && (
                                    <Badge variant="secondary">ZLIMS: {sample.zlims_code}</Badge>
                                )}
                            </div>
                            <div className="sample-detail__actions">
                                <Button variant="primary" onClick={handleEdit}>
                                    ✏️ Редактировать
                                </Button>
                                <Button variant="danger" onClick={handleDelete}>
                                    🗑️ Удалить
                                </Button>
                            </div>
                        </div>

                        <div className="sample-detail__info">
                            <div className="sample-detail__info-grid">
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">Код группы</span>
                                    <span className="sample-detail__info-value">
                                        {sample.sample_group_code || '—'}
                                    </span>
                                </div>
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">UIN 1</span>
                                    <span className="sample-detail__info-value">
                                        {sample.uin1 || '—'}
                                    </span>
                                </div>
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">UIN 2</span>
                                    <span className="sample-detail__info-value">
                                        {sample.uin2 || '—'}
                                    </span>
                                </div>
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">Код проекта</span>
                                    <span className="sample-detail__info-value">
                                        {sample.project_code || '—'}
                                    </span>
                                </div>
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">Индекс</span>
                                    <span className="sample-detail__info-value">
                                        {sample.sample_index || '—'}
                                    </span>
                                </div>
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">QC 1</span>
                                    <span className="sample-detail__info-value">
                                        {sample.qc_1 !== null && sample.qc_1 !== undefined ? sample.qc_1 : '—'}
                                    </span>
                                </div>
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">QC 2</span>
                                    <span className="sample-detail__info-value">
                                        {sample.qc_2 !== null && sample.qc_2 !== undefined ? sample.qc_2 : '—'}
                                    </span>
                                </div>
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">Тип материала</span>
                                    <span className="sample-detail__info-value">
                                        {sample.material_type || '—'}
                                    </span>
                                </div>
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">Создан</span>
                                    <span className="sample-detail__info-value">
                                        {formatDate(sample.timestamp)}
                                    </span>
                                </div>
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">Обновлён</span>
                                    <span className="sample-detail__info-value">
                                        {formatDate(sample.updated_at)}
                                    </span>
                                </div>
                                <div className="sample-detail__info-item">
                                    <span className="sample-detail__info-label">Создатель</span>
                                    <span className="sample-detail__info-value">
                                        {sample.user?.first_name && sample.user?.last_name
                                            ? `${sample.user.first_name} ${sample.user.last_name} (@${sample.user.username})`
                                            : sample.user_id || '—'}
                                    </span>
                                </div>
                            </div>
                            {sample.descr && (
                                <div className="sample-detail__description">
                                    <span className="sample-detail__info-label">📝 Описание</span>
                                    <p>{sample.descr}</p>
                                </div>
                            )}
                        </div>

                        {/* Связанные батчи */}
                        <div className="sample-detail__batches">
                            <h3>📦 Связанные батчи ({batches.length})</h3>
                            {batches.length === 0 ? (
                                <p className="sample-detail__empty">Нет связанных батчей</p>
                            ) : (
                                <Table
                                    data={batches}
                                    columns={batchColumns}
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
                                    enableCellSelection={false}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <History
                    entityType="sample"
                    entityId={sample.id}
                    refreshKey={sample.updated_at}
                />
            </div>

            {/* Модалка редактирования */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">✏️ Редактирование образца #{sample.id}</h2>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="modal-form-group">
                                <label>Код образца</label>
                                <input
                                    type="text"
                                    value={editForm.sample_code}
                                    onChange={(e) => setEditForm({ ...editForm, sample_code: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Код группы</label>
                                <input
                                    type="text"
                                    value={editForm.sample_group_code}
                                    onChange={(e) => setEditForm({ ...editForm, sample_group_code: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>ZLIMS код</label>
                                <input
                                    type="text"
                                    value={editForm.zlims_code}
                                    onChange={(e) => setEditForm({ ...editForm, zlims_code: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>UIN 1</label>
                                <input
                                    type="text"
                                    value={editForm.uin1}
                                    onChange={(e) => setEditForm({ ...editForm, uin1: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>UIN 2</label>
                                <input
                                    type="text"
                                    value={editForm.uin2}
                                    onChange={(e) => setEditForm({ ...editForm, uin2: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Код проекта</label>
                                <input
                                    type="text"
                                    value={editForm.project_code}
                                    onChange={(e) => setEditForm({ ...editForm, project_code: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Индекс</label>
                                <input
                                    type="text"
                                    value={editForm.sample_index}
                                    onChange={(e) => setEditForm({ ...editForm, sample_index: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>QC 1</label>
                                <input
                                    type="number"
                                    value={editForm.qc_1}
                                    onChange={(e) => setEditForm({ ...editForm, qc_1: e.target.value })}
                                    className="modal-input"
                                    step="any"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>QC 2</label>
                                <input
                                    type="number"
                                    value={editForm.qc_2}
                                    onChange={(e) => setEditForm({ ...editForm, qc_2: e.target.value })}
                                    className="modal-input"
                                    step="any"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Тип материала</label>
                                <input
                                    type="text"
                                    value={editForm.material_type}
                                    onChange={(e) => setEditForm({ ...editForm, material_type: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Описание</label>
                                <textarea
                                    value={editForm.descr}
                                    onChange={(e) => setEditForm({ ...editForm, descr: e.target.value })}
                                    className="modal-textarea"
                                    rows="3"
                                />
                            </div>
                            <div className="modal-button-group">
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
            )}
        </>
    )
}
