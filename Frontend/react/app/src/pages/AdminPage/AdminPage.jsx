import { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../../data/context.js';
import Header from '../components/Header/Header';
import rememberPage from '../../modules/rememberPage';
import Fetch from '../../API/Fetch';
import { HttpMethod, APIVersion } from '../../data/enums';
import { notify_error, notify_success } from '../../modules/notify';
import Button from '../components/Button/Button';
import Table from '../components/Table/Table';
import Spinner from '../components/Spinner/Spinner';
import Badge from '../components/Badge/Badge';

export default function AdminPage() {
    const { user } = useContext(UserContext);
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [protocols, setProtocols] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [lazyParams, setLazyParams] = useState(null);

    // Состояния для модалок протоколов
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProtocol, setEditingProtocol] = useState(null);
    const [protocolForm, setProtocolForm] = useState({
        code: '',
        name: '',
        version: '',
        description: '',
    });
    const [saving, setSaving] = useState(false);

    // Состояния для модалки этапов
    const [showStagesModal, setShowStagesModal] = useState(false);
    const [currentProtocolId, setCurrentProtocolId] = useState(null);
    const [stages, setStages] = useState([]);
    const [stageForm, setStageForm] = useState({ name: '', description: '', order: 0 });
    const [editingStage, setEditingStage] = useState(null);
    const [showStageForm, setShowStageForm] = useState(false);
    const [savingStage, setSavingStage] = useState(false);

    // Запоминаем страницу
    useEffect(() => {
        rememberPage(`admin_page/${params.username}`);
    }, [params.username]);

    // ---------- Загрузка протоколов ----------
    const loadProtocols = useCallback(async () => {
        setLoading(true);
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'protocols/',
            method: HttpMethod.GET,
        });
        if (data?.ok) {
            setProtocols(data.data || []);
            setTotalRows(data.total || 0);
        } else {
            notify_error(data?.error || 'Ошибка загрузки');
        }
        setLoading(false);
    }, []); // ← пустой массив зависимостей

    const fetchProtocols = useCallback(async (params) => {
        const query = new URLSearchParams();
        query.set('page', params.pageIndex + 1);
        query.set('page_size', params.pageSize);
        // ... сортировка, фильтры
        const res = await Fetch({
            api_version: APIVersion.V2,
            action: `protocols/?${query.toString()}`,
            method: HttpMethod.GET,
        });
        if (res?.ok) {
            setProtocols(res.data || []);
            setTotalRows(res.total || 0);
        }
    }, []); // ← пустой массив

    useEffect(() => {
        if (lazyParams) {
            fetchProtocols(lazyParams);
        }
    }, [lazyParams, fetchProtocols]);

    useEffect(() => {
        loadProtocols();
    }, [loadProtocols]);

    // ---------- CRUD протоколов ----------
    const handleCreateProtocol = async () => {
        setSaving(true);
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'protocol/',
            method: HttpMethod.POST,
            body: {
                code: protocolForm.code,
                name: protocolForm.name,
                version: protocolForm.version || '1.0',
                description: protocolForm.description || '',
            },
        });
        if (data?.ok) {
            notify_success('Протокол создан!');
            setShowCreateModal(false);
            setProtocolForm({ code: '', name: '', version: '', description: '' });
            loadProtocols();
        } else {
            notify_error(data?.error || 'Ошибка создания');
        }
        setSaving(false);
    };

    const handleEditProtocol = (protocol) => {
        setEditingProtocol(protocol);
        setProtocolForm({
            code: protocol.code || '',
            name: protocol.name || '',
            version: protocol.version || '',
            description: protocol.description || '',
        });
        setShowEditModal(true);
    };

    const handleUpdateProtocol = async () => {
        if (!editingProtocol) return;
        setSaving(true);
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `protocol/${editingProtocol.id}/`,
            method: HttpMethod.PUT,
            body: {
                code: protocolForm.code,
                name: protocolForm.name,
                version: protocolForm.version || '1.0',
                description: protocolForm.description || '',
            },
        });
        if (data?.ok) {
            notify_success('Протокол обновлён!');
            setShowEditModal(false);
            setEditingProtocol(null);
            setProtocolForm({ code: '', name: '', version: '', description: '' });
            loadProtocols();
        } else {
            notify_error(data?.error || 'Ошибка обновления');
        }
        setSaving(false);
    };

    const handleDeleteProtocol = async (protocol) => {
        if (!confirm(`Удалить протокол "${protocol.name}"?`)) return;
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `protocol/${protocol.id}/`,
            method: HttpMethod.DELETE,
        });
        if (data?.ok) {
            notify_success('Протокол удалён');
            loadProtocols();
        } else {
            notify_error(data?.error || 'Ошибка удаления');
        }
    };

    // ---------- Управление этапами ----------
    const loadStages = useCallback(async (protocolId) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `protocol/${protocolId}/stages/`,
            method: HttpMethod.GET,
        });
        if (data?.ok) {
            setStages(data.data || []);
        } else {
            notify_error(data?.error || 'Ошибка загрузки этапов');
        }
    }, []);

    const openStagesModal = (protocolId) => {
        setCurrentProtocolId(protocolId);
        setShowStagesModal(true);
        loadStages(protocolId);
    };

    const handleAddStage = () => {
        setEditingStage(null);
        setStageForm({ name: '', description: '', order: stages.length + 1 });
        setShowStageForm(true);
    };

    const handleEditStage = (stage) => {
        setEditingStage(stage);
        setStageForm({
            name: stage.name || '',
            description: stage.description || '',
            order: stage.order || 0,
        });
        setShowStageForm(true);
    };

    const handleSaveStage = async () => {
        if (!currentProtocolId) return;
        setSavingStage(true);
        const url = editingStage
            ? `stage/${editingStage.id}/`
            : `protocol/${currentProtocolId}/stage/`;
        const method = editingStage ? HttpMethod.PUT : HttpMethod.POST;
        const body = {
            name: stageForm.name,
            description: stageForm.description || '',
            order: stageForm.order || 0,
        };
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: url,
            method: method,
            body: body,
        });
        if (data?.ok) {
            notify_success(editingStage ? 'Этап обновлён' : 'Этап добавлен');
            setShowStageForm(false);
            setStageForm({ name: '', description: '', order: 0 });
            setEditingStage(null);
            loadStages(currentProtocolId);
        } else {
            notify_error(data?.error || 'Ошибка сохранения этапа');
        }
        setSavingStage(false);
    };

    const handleDeleteStage = async (stageId) => {
        if (!confirm('Удалить этап?')) return;
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `stage/${stageId}/`,
            method: HttpMethod.DELETE,
        });
        if (data?.ok) {
            notify_success('Этап удалён');
            loadStages(currentProtocolId);
        } else {
            notify_error(data?.error || 'Ошибка удаления этапа');
        }
    };

    const handleMoveStage = async (stageId, direction) => {
        // Простая реализация: меняем order местами и отправляем обновления
        // Предполагаем, что бэкенд позволяет менять порядок
        const currentIndex = stages.findIndex(s => s.id === stageId);
        if (currentIndex === -1) return;
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= stages.length) return;

        const stage = stages[currentIndex];
        const otherStage = stages[newIndex];
        // Меняем order
        const tempOrder = stage.order;
        stage.order = otherStage.order;
        otherStage.order = tempOrder;

        // Отправляем оба обновления
        const updateStage = async (s) => {
            await Fetch({
                api_version: APIVersion.V2,
                action: `stage/${s.id}/`,
                method: HttpMethod.PUT,
                body: { order: s.order },
            });
        };
        await Promise.all([updateStage(stage), updateStage(otherStage)]);
        // Перезагружаем список
        loadStages(currentProtocolId);
    };

    // ---------- Колонки для таблицы протоколов ----------
    const columns = useMemo(() => [
        {
            accessorKey: 'id',
            header: 'ID',
            size: 60,
            enableEditing: false,
        },
        {
            accessorKey: 'code',
            header: 'Код',
            size: 120,
            enableEditing: false,
        },
        {
            accessorKey: 'name',
            header: 'Название',
            size: 200,
            enableEditing: false,
        },
        {
            accessorKey: 'version',
            header: 'Версия',
            size: 80,
            enableEditing: false,
            cell: ({ getValue }) => <Badge variant="secondary">{getValue() || '1.0'}</Badge>,
        },
        {
            accessorKey: 'description',
            header: 'Описание',
            size: 250,
            enableEditing: false,
        },
        {
            accessorKey: 'created_at',
            header: 'Создан',
            size: 180,
            enableEditing: false,
            cell: ({ getValue }) => {
                const date = getValue();
                return date ? new Date(date).toLocaleString('ru-RU') : '—';
            },
        },
        {
            id: 'actions',
            header: 'Действия',
            size: 200,
            enableEditing: false,
            enableSorting: false,
            cell: ({ row }) => (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <Button variant="primary" size="sm" onClick={() => handleEditProtocol(row.original)}>
                        ✏️
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteProtocol(row.original)}>
                        🗑️
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openStagesModal(row.original.id)}>
                        📋 Этапы
                    </Button>
                </div>
            ),
        },
    ], []);

    // ---------- Рендер ----------
    if (loading) {
        return (
            <>
                <Header />
                <div className="app theme-transition" style={{ padding: '2rem', textAlign: 'center' }}>
                    <Spinner />
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="app theme-transition">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h1 className="app__title">📋 Управление протоколами (СОП)</h1>
                    <Button variant="primary" onClick={() => { setShowCreateModal(true); setProtocolForm({ code: '', name: '', version: '', description: '' }); }}>
                        ➕ Создать протокол
                    </Button>
                </div>

                <section className="section">
                    <Table
                        lazy
                        data={protocols}
                        totalRows={totalRows}
                        onLazyLoad={fetchProtocols}
                        columns={columns}
                        pageSize={10}
                        enableSelection={false}
                        enableSorting={true}
                        enableFiltering={true}
                        enablePagination={true}
                        enableColumnVisibility={false}
                        enableAddButton={false}
                        enableExport={false}
                        enableInlineEdit={false}
                        enableEmptyRow={true}
                        enableActionsColumn={false}
                    />
                </section>
            </div>

            {/* Модалка создания протокола */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">➕ Создание протокола</h2>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="modal-form-group">
                                <label>Код (уникальный)</label>
                                <input
                                    type="text"
                                    value={protocolForm.code}
                                    onChange={(e) => setProtocolForm({ ...protocolForm, code: e.target.value })}
                                    className="modal-input"
                                    placeholder="Например: SOP-001"
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Название</label>
                                <input
                                    type="text"
                                    value={protocolForm.name}
                                    onChange={(e) => setProtocolForm({ ...protocolForm, name: e.target.value })}
                                    className="modal-input"
                                    placeholder="Название протокола"
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Версия</label>
                                <input
                                    type="text"
                                    value={protocolForm.version}
                                    onChange={(e) => setProtocolForm({ ...protocolForm, version: e.target.value })}
                                    className="modal-input"
                                    placeholder="1.0"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Описание</label>
                                <textarea
                                    value={protocolForm.description}
                                    onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })}
                                    className="modal-textarea"
                                    rows="3"
                                    placeholder="Описание протокола"
                                />
                            </div>
                            <div className="modal-button-group">
                                <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={saving}>
                                    Отмена
                                </Button>
                                <Button variant="primary" onClick={handleCreateProtocol} disabled={saving}>
                                    {saving ? '⏳ Создание...' : 'Создать'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модалка редактирования протокола */}
            {showEditModal && editingProtocol && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">✏️ Редактирование протокола #{editingProtocol.id}</h2>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="modal-form-group">
                                <label>Код</label>
                                <input
                                    type="text"
                                    value={protocolForm.code}
                                    onChange={(e) => setProtocolForm({ ...protocolForm, code: e.target.value })}
                                    className="modal-input"
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Название</label>
                                <input
                                    type="text"
                                    value={protocolForm.name}
                                    onChange={(e) => setProtocolForm({ ...protocolForm, name: e.target.value })}
                                    className="modal-input"
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Версия</label>
                                <input
                                    type="text"
                                    value={protocolForm.version}
                                    onChange={(e) => setProtocolForm({ ...protocolForm, version: e.target.value })}
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Описание</label>
                                <textarea
                                    value={protocolForm.description}
                                    onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })}
                                    className="modal-textarea"
                                    rows="3"
                                />
                            </div>
                            <div className="modal-button-group">
                                <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={saving}>
                                    Отмена
                                </Button>
                                <Button variant="primary" onClick={handleUpdateProtocol} disabled={saving}>
                                    {saving ? '⏳ Сохранение...' : '💾 Сохранить'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модалка управления этапами */}
            {showStagesModal && currentProtocolId !== null && (
                <div className="modal-overlay" onClick={() => setShowStagesModal(false)}>
                    <div className="modal modal--stages" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <h2 className="modal-title">📋 Этапы протокола #{currentProtocolId}</h2>
                        <div style={{ marginBottom: '1rem' }}>
                            <Button variant="primary" onClick={handleAddStage}>
                                ➕ Добавить этап
                            </Button>
                        </div>

                        {stages.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-dark)', padding: '1rem' }}>
                                Нет этапов. Добавьте первый!
                            </p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {stages.map((stage) => (
                                    <li key={stage.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        borderBottom: '1px solid var(--border)',
                                    }}>
                                        <div>
                                            <strong>Шаг {stage.order}:</strong> {stage.name}
                                            {stage.description && <span style={{ marginLeft: '8px', color: 'var(--text-dark)' }}>({stage.description})</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <Button variant="secondary" size="sm" onClick={() => handleMoveStage(stage.id, 'up')} disabled={stage.order <= 1}>
                                                ⬆
                                            </Button>
                                            <Button variant="secondary" size="sm" onClick={() => handleMoveStage(stage.id, 'down')} disabled={stage.order >= stages.length}>
                                                ⬇
                                            </Button>
                                            <Button variant="primary" size="sm" onClick={() => handleEditStage(stage)}>
                                                ✏️
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDeleteStage(stage.id)}>
                                                🗑️
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="modal-button-group" style={{ marginTop: '1rem' }}>
                            <Button variant="secondary" onClick={() => setShowStagesModal(false)}>
                                Закрыть
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка создания/редактирования этапа */}
            {showStageForm && (
                <div className="modal-overlay" onClick={() => setShowStageForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">{editingStage ? '✏️ Редактирование этапа' : '➕ Добавление этапа'}</h2>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="modal-form-group">
                                <label>Название этапа *</label>
                                <input
                                    type="text"
                                    value={stageForm.name}
                                    onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                                    className="modal-input"
                                    placeholder="Название этапа"
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Описание</label>
                                <textarea
                                    value={stageForm.description}
                                    onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                                    className="modal-textarea"
                                    rows="2"
                                    placeholder="Описание этапа"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Порядок (номер шага)</label>
                                <input
                                    type="number"
                                    value={stageForm.order}
                                    onChange={(e) => setStageForm({ ...stageForm, order: parseInt(e.target.value) || 0 })}
                                    className="modal-input"
                                    min="1"
                                    step="1"
                                />
                            </div>
                            <div className="modal-button-group">
                                <Button variant="secondary" onClick={() => setShowStageForm(false)} disabled={savingStage}>
                                    Отмена
                                </Button>
                                <Button variant="primary" onClick={handleSaveStage} disabled={savingStage}>
                                    {savingStage ? '⏳ Сохранение...' : editingStage ? '💾 Сохранить' : '➕ Добавить'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}