import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Fetch from '../../API/Fetch'
import { buildSamplePayload } from '../../API/payloads'
import { notify_error, notify_success } from '../../modules/notify'
import rememberPage from "../../modules/rememberPage"
import { HttpMethod, APIVersion } from '../../data/enums'
import { formatDate } from '../../modules/dateTime'
import { useDepartments } from '../../hooks/useDepartments'
import Spinner from "../components/Spinner/Spinner"
import Table from "../components/Table/Table"
import Header from '../components/Header/Header'
import StatCard from '../components/StatCard/StatCard'
import Button from '../components/Button/Button'
import LinkButton from '../components/LinkButton/LinkButton'

export default function Samples() {
    const params = useParams()
    const [samples, setSamples] = useState([])
    const [lazyParams, setLazyParams] = useState(null)
    const [totalRows, setTotalRows] = useState(0)
    const [loading, setLoading] = useState(true)

    // Для модального окна создания батча
    const [showBatchModal, setShowBatchModal] = useState(false)
    const [batchName, setBatchName] = useState('')
    const [batchDepartment, setBatchDepartment] = useState('')
    const [batchDescr, setBatchDescr] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const { departments, loading: deptLoading } = useDepartments()

    useEffect(() => {
        rememberPage(`samples/${params.username}/`)
    }, [params.username])

    // ---------- КОЛОНКИ ----------
    const columns = [
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
            header: 'Код образца',
            size: 120,
            editType: 'text',
            required: false,
        },
        {
            accessorKey: 'sample_group_code',
            header: 'Код группы',
            size: 120,
            editType: 'text',
            required: false,
        },
        {
            accessorKey: 'zlims_code',
            header: 'ZLIMS код',
            size: 100,
            editType: 'text',
            required: false,
        },
        {
            accessorKey: 'uin1',
            header: 'UIN 1',
            size: 100,
            editType: 'text',
            required: false,
        },
        {
            accessorKey: 'uin2',
            header: 'UIN 2',
            size: 100,
            editType: 'text',
            required: false,
        },
        {
            accessorKey: 'project_code',
            header: 'Код проекта',
            size: 100,
            editType: 'text',
            required: false,
        },
        {
            accessorKey: 'sample_index',
            header: 'Индекс',
            size: 80,
            editType: 'text',
            required: false,
        },
        {
            accessorKey: 'qc_1',
            header: 'QC 1',
            size: 80,
            editType: 'number',
            required: false,
        },
        {
            accessorKey: 'qc_2',
            header: 'QC 2',
            size: 80,
            editType: 'number',
            required: false,
        },
        {
            accessorKey: 'descr',
            header: 'Описание',
            size: 200,
            editType: 'text',
            required: false,
        },
        {
            accessorKey: 'material_type',
            header: 'Тип материала',
            size: 120,
            editType: 'text',
            required: false,
        },
        {
            accessorKey: 'timestamp',
            header: 'Дата создания',
            size: 180,
            enableEditing: false,
            cell: ({ getValue }) => formatDate(getValue()),
        },
    ]

    // ---------- ЗАГРУЗКА ДАННЫХ (с пагинацией) ----------
    const fetchSamples = useCallback(async (params) => {
        const query = new URLSearchParams();
        query.set('page', params.pageIndex + 1);
        query.set('page_size', params.pageSize);
        if (params.sorting.length > 0) {
            query.set('sort_by', params.sorting[0].id);
            query.set('sort_order', params.sorting[0].desc ? 'desc' : 'asc');
        }
        if (params.globalFilter) {
            query.set('search', params.globalFilter);
        }
        params.columnFilters.forEach(f => {
            query.set(`filter[${f.id}]`, f.value);
        });

        const res = await Fetch({
            api_version: APIVersion.V2,
            action: `samples/?${query.toString()}`,
            method: HttpMethod.GET,
        });
        if (res?.ok) {
            setSamples(res.data);
            setTotalRows(res.total);
            setLoading(false);
        }
    }, [])

    // ---------- ПОЛУЧЕНИЕ ID ВСЕХ ОТФИЛЬТРОВАННЫХ ОБРАЗЦОВ (через export) ----------
    const fetchAllFilteredSampleIds = useCallback(async () => {
        if (!lazyParams) return []

        const query = new URLSearchParams();
        // Используем экспортный эндпоинт, который возвращает все записи без пагинации
        if (lazyParams.sorting.length > 0) {
            query.set('sort_by', lazyParams.sorting[0].id);
            query.set('sort_order', lazyParams.sorting[0].desc ? 'desc' : 'asc');
        }
        if (lazyParams.globalFilter) {
            query.set('search', lazyParams.globalFilter);
        }
        lazyParams.columnFilters.forEach(f => {
            query.set(`filter[${f.id}]`, f.value);
        });

        const res = await Fetch({
            api_version: APIVersion.V2,
            action: `samples/export/?${query.toString()}`,
            method: HttpMethod.GET,
        });

        if (res?.ok && res.data) {
            return res.data.map(sample => sample.id)
        }
        return []
    }, [lazyParams])

    // ---------- ОБРАБОТЧИКИ CRUD ----------
    const handleDataChange = async (newData, meta) => {
        if (meta?.operation === 'edit' && meta.data) {
            const updatedItem = meta.data
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `sample/${updatedItem.id}/`,
                method: HttpMethod.PUT,
                body: buildSamplePayload(updatedItem),
            })
            if (data?.ok) {
                const saved = data.data || updatedItem
                setSamples(prev => prev.map(item => item.id === saved.id ? { ...item, ...saved } : item))
            } else {
                notify_error(data?.error || 'Ошибка сохранения')
                if (lazyParams) {
                    await fetchSamples(lazyParams)
                }
            }
        } else if (meta?.operation === 'add' && meta.data) {
            const newItem = meta.data
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: 'sample/',
                method: HttpMethod.POST,
                body: buildSamplePayload(newItem),
            })
            if (data?.ok) {
                if (lazyParams) await fetchSamples(lazyParams)
            } else {
                notify_error(data?.error || 'Ошибка добавления')
            }
        } else if (meta?.operation === 'delete' && meta.data) {
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `sample/${meta.data.id}/`,
                method: HttpMethod.DELETE,
            })
            if (data?.ok) {
                setSamples(prev => prev.filter(item => item.id !== meta.data.id))
                setTotalRows(prev => Math.max(0, prev - 1))
            } else {
                notify_error(data?.error || 'Ошибка удаления')
                if (lazyParams) await fetchSamples(lazyParams)
            }
        } else if (meta?.operation === 'batchEdit' && meta.updates) {
            const updatedIds = new Set(meta.updates.map(u => u.id));
            const promises = [];
            for (const id of updatedIds) {
                const record = newData.find(item => item.id === id);
                if (!record) continue;
                promises.push(
                    Fetch({
                        api_version: APIVersion.V2,
                        action: `sample/${id}/`,
                        method: HttpMethod.PUT,
                        body: buildSamplePayload(record),
                    })
                );
            }
            try {
                const results = await Promise.all(promises);
                const allOk = results.every(res => res?.ok);
                if (allOk) {
                    setSamples(newData);
                } else {
                    const errorRes = results.find(res => !res?.ok);
                    throw new Error(errorRes?.error || 'Ошибка массового обновления');
                }
            } catch (error) {
                notify_error(error.message || 'Ошибка массового обновления');
                if (lazyParams) {
                    await fetchSamples(lazyParams);
                }
            }
        }
    };

    const handleExportAll = async ({ sorting, globalFilter, columnFilters }) => {
        const query = new URLSearchParams();
        if (sorting.length > 0) {
            query.set('sort_by', sorting[0].id);
            query.set('sort_order', sorting[0].desc ? 'desc' : 'asc');
        }
        if (globalFilter) query.set('search', globalFilter);
        columnFilters.forEach(f => {
            query.set(`filter[${f.id}]`, f.value);
        });

        const res = await Fetch({
            api_version: APIVersion.V2,
            action: `samples/export/?${query.toString()}`,
            method: HttpMethod.GET,
        });
        return res?.data || [];
    };

    // ---------- СОЗДАНИЕ БАТЧА ИЗ ОТФИЛЬТРОВАННЫХ ОБРАЗЦОВ ----------
    const handleCreateBatchFromFilter = async () => {
        if (!batchName.trim()) {
            notify_error('Введите название батча')
            return
        }

        setIsCreating(true)
        try {
            // 1. Получаем ID всех образцов, соответствующих текущим фильтрам (через export)
            const sampleIds = await fetchAllFilteredSampleIds()
            if (sampleIds.length === 0) {
                notify_error('Нет образцов, соответствующих фильтрам')
                return
            }

            // 2. Создаём батч
            const createRes = await Fetch({
                api_version: APIVersion.V2,
                action: 'batch/',
                method: HttpMethod.POST,
                body: {
                    name: batchName.trim(),
                    department: batchDepartment || '',
                    descr: batchDescr || '',
                },
            })
            if (!createRes?.ok) {
                throw new Error(createRes?.error || 'Ошибка создания батча')
            }
            const batchId = createRes.data.id

            // 3. Добавляем все образцы в батч (по одному)
            const addPromises = sampleIds.map(sampleId =>
                Fetch({
                    api_version: APIVersion.V2,
                    action: `batch/${batchId}/sample/${sampleId}/`,
                    method: HttpMethod.POST,
                })
            )
            const addResults = await Promise.all(addPromises)
            const failed = addResults.filter(res => !res?.ok)
            if (failed.length > 0) {
                notify_error(`Не удалось добавить ${failed.length} образцов в батч`)
            } else {
                notify_success(`Батч "${batchName.trim()}" создан с ${sampleIds.length} образцами`)
            }

            // 4. Обновляем таблицу и закрываем модалку
            if (lazyParams) {
                await fetchSamples(lazyParams)
            }
            setShowBatchModal(false)
            setBatchName('')
            setBatchDepartment('')
            setBatchDescr('')
        } catch (error) {
            notify_error(error.message || 'Ошибка при создании батча')
        } finally {
            setIsCreating(false)
        }
    }

    // ---------- ЭФФЕКТЫ ----------
    const handleLazyLoad = useCallback((params) => {
        setLazyParams(params);
    }, []);

    useEffect(() => {
        setLoading(true)
        const initialParams = {
            pageIndex: 0,
            pageSize: 10,
            sorting: [],
            globalFilter: '',
            columnFilters: [],
        }
        setLazyParams(initialParams)
    }, [])

    useEffect(() => {
        if (lazyParams) {
            fetchSamples(lazyParams)
        }
    }, [lazyParams, fetchSamples])

    // ---------- РЕНДЕР ----------
    return (
        <>
            <Header />
            <div className="app theme-transition">
                <div className="stats">
                    <StatCard label="Всего образцов" value={totalRows} color="var(--blue)" />
                </div>

                <section className="section">
                    <div className="samples-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 className="section__title" style={{ margin: 0 }}>Список образцов</h2>
                        <Button
                            variant="primary"
                            onClick={() => setShowBatchModal(true)}
                            disabled={isCreating || totalRows === 0}
                        >
                            📦 Создать батч из отфильтрованных ({totalRows})
                        </Button>
                    </div>

                    {loading && !lazyParams ? (
                        <Spinner />
                    ) : (
                        <Table
                            lazy
                            data={samples}
                            totalRows={totalRows}
                            onLazyLoad={handleLazyLoad}
                            columns={columns}
                            pageSize={10}
                            enableSelection={false}
                            enableSorting
                            enableFiltering
                            enablePagination
                            enableColumnVisibility
                            enableAddButton
                            enableExport
                            enableInlineEdit
                            enableCellSelection={true}
                            enableEmptyRow={true}
                            onDataChange={handleDataChange}
                            onExportAll={handleExportAll}
                        // infiniteScroll
                        />
                    )}
                </section>
            </div>

            {/* Модальное окно создания батча */}
            {showBatchModal && (
                <div className="modal-overlay" onClick={() => !isCreating && setShowBatchModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>📦 Создание батча из отфильтрованных образцов</h2>
                        <p>Будет создан батч из <strong>{totalRows}</strong> образцов, соответствующих текущим фильтрам.</p>
                        <div className="modal__field">
                            <label>Название батча *</label>
                            <input
                                type="text"
                                value={batchName}
                                onChange={(e) => setBatchName(e.target.value)}
                                placeholder="Введите название"
                                disabled={isCreating}
                            />
                        </div>
                        <div className="modal__field">
                            <label>Отдел</label>
                            <select
                                value={batchDepartment}
                                onChange={(e) => setBatchDepartment(e.target.value)}
                                disabled={isCreating}
                            >
                                <option value="">Не выбран</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div className="modal__field">
                            <label>Описание</label>
                            <textarea
                                value={batchDescr}
                                onChange={(e) => setBatchDescr(e.target.value)}
                                placeholder="Описание батча"
                                rows="3"
                                disabled={isCreating}
                            />
                        </div>
                        <div className="modal__actions">
                            <Button
                                variant="secondary"
                                onClick={() => setShowBatchModal(false)}
                                disabled={isCreating}
                            >
                                Отмена
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleCreateBatchFromFilter}
                                disabled={isCreating || !batchName.trim() || totalRows === 0}
                            >
                                {isCreating ? 'Создание...' : 'Создать батч'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
