import { useState, useEffect, useCallback, useMemo } from 'react'
import Fetch from '../../../API/Fetch'
import { notify_error } from '../../../modules/notify'
import { useDepartments } from '../../../hooks/useDepartments'
import { HttpMethod, APIVersion } from '../../../data/enums'
import Spinner from "../../components/Spinner/Spinner"
import Table from "../../components/Table/Table"
import StatCard from '../../components/StatCard/StatCard'
import LinkButton from '../../components/LinkButton/LinkButton'

// 🔽 Добавлен пропс department
export default function Batches({ department = null }) {
    const [batches, setBatches] = useState([])
    const [lazyParams, setLazyParams] = useState(null)
    const [totalRows, setTotalRows] = useState(0)
    const [loading, setLoading] = useState(true)
    const { departments, loading: deptLoading } = useDepartments()

    // 🔽 Колонки формируются внутри компонента, чтобы динамически менять их в зависимости от пропса department
    const columns = useMemo(() => {
        const base = [
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
                            <LinkButton to={`/batch/${id}/`}>{id}</LinkButton>
                        )
                    }
                    return id
                },
            },
            {
                accessorKey: 'name',
                header: 'Название',
                size: 180,
                editType: 'text',
                required: true,
            },
            {
                accessorKey: 'department',
                header: 'Отдел',
                size: 140,
                editType: 'select',
                // Если фильтр по отделу активен – запрещаем редактирование и скрываем колонку
                enableEditing: !department,          // 🆕
                visible: !department,                // 🆕 (можно также использовать enableHiding, но этот флаг скрывает колонку)
                editComponent: ({ value, onChange }) => (
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="table-edit-select"
                        style={{ width: '100%', padding: '4px 8px' }}
                    >
                        <option value="">Не выбран</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                ),
            },
            {
                accessorKey: 'descr',
                header: 'Описание',
                size: 220,
                editType: 'text',
            },
            {
                accessorKey: 'sample_count',
                header: 'Образцов',
                size: 130,
                enableEditing: false,
                enableSorting: true,
                cell: ({ getValue }) => {
                    const count = getValue()
                    return (
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: count > 0 ? '600' : '400',
                            color: count > 0 ? 'var(--text)' : 'var(--text-dark)',
                        }}>
                            {count > 0 ? '📋' : '📭'} {count || 0}
                        </span>
                    )
                },
            },
            {
                accessorKey: 'timestamp',
                header: 'Создан',
                size: 180,
                enableEditing: false,
                cell: ({ getValue }) => {
                    const date = getValue()
                    return date ? new Date(date).toLocaleString('ru-RU') : '—'
                },
            },
        ]

        // Если передан department, убираем колонку "Отдел" (она не нужна, т.к. все батчи одного отдела)
        return department ? base.filter(col => col.accessorKey !== 'department') : base
    }, [department, departments])

    // ---------- ЗАГРУЗКА ДАННЫХ (с фильтром по отделу) ----------
    const loadBatches = useCallback(async () => {
        setLoading(true)
        const query = new URLSearchParams()
        if (department) {
            query.set('filter[department]', department)   // 🔽 добавляем фильтр
        }
        const url = `batches/${query.toString() ? '?' + query.toString() : ''}`
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: url,
            method: HttpMethod.GET,
        })
        if (data?.ok) {
            setBatches(prev => {
                const newData = data.data || []
                if (prev.length === newData.length && prev.every((item, i) => item.id === newData[i].id)) {
                    return prev
                }
                return newData
            })
            setTotalRows(data.total || data.data?.length || 0)
        }
        setLoading(false)
    }, [department])

    const fetchBatches = useCallback(async (params) => {
        const query = new URLSearchParams()
        query.set('page', params.pageIndex + 1)
        query.set('page_size', params.pageSize)
        if (params.sorting.length > 0) {
            query.set('sort_by', params.sorting[0].id)
            query.set('sort_order', params.sorting[0].desc ? 'desc' : 'asc')
        }
        if (params.globalFilter) {
            query.set('search', params.globalFilter)
        }
        params.columnFilters.forEach(f => {
            query.set(`filter[${f.id}]`, f.value)
        })
        // 🔽 добавляем фильтр по отделу, если передан
        if (department) {
            query.set('filter[department]', department)
        }

        const res = await Fetch({
            api_version: APIVersion.V2,
            action: `batches/?${query.toString()}`,
            method: HttpMethod.GET,
        })
        if (res?.ok) {
            setBatches(res.data || [])
            setTotalRows(res.total || 0)
        }
    }, [department])

    // ---------- ОБРАБОТЧИКИ CRUD (с учётом department) ----------
    const handleAddBatch = async (newItem) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'batch/',
            method: HttpMethod.POST,
            body: {
                name: newItem.name || 'Новый батч',
                department: department || newItem.department || '',   // 🔽 используем пропс
                descr: newItem.descr || '',
            },
        })
        if (data?.ok) {
            if (lazyParams) {
                fetchBatches(lazyParams)
            } else {
                loadBatches()
            }
        } else {
            notify_error(data?.error || 'Ошибка добавления')
        }
    }

    const handleEditBatch = async (updatedItem) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${updatedItem.id}/`,
            method: HttpMethod.PUT,
            body: {
                name: updatedItem.name,
                department: department || updatedItem.department || '',   // 🔽 используем пропс
                descr: updatedItem.descr || '',
            },
        })
        if (data?.ok) {
            setBatches(prev =>
                prev.map(s => (s.id === updatedItem.id ? { ...s, ...updatedItem } : s))
            )
        } else {
            notify_error(data?.error || 'Ошибка сохранения')
        }
    }

    const handleDeleteBatch = async (item) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `batch/${item.id}/`,
            method: HttpMethod.DELETE,
        })
        if (data?.ok) {
            setBatches(prev => prev.filter(s => s.id !== item.id))
            setTotalRows(prev => prev - 1)
        } else {
            notify_error(data?.error || 'Ошибка удаления')
        }
    }

    const handleDataChange = async (newData, meta) => {
        if (meta?.operation === 'edit' && meta.data) {
            const updatedItem = meta.data
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `batch/${updatedItem.id}/`,
                method: HttpMethod.PUT,
                body: {
                    name: updatedItem.name,
                    department: department || updatedItem.department || '',   // 🔽 используем пропс
                    descr: updatedItem.descr || '',
                },
            })
            if (data?.ok) {
                setBatches(newData)
            } else {
                notify_error(data?.error || 'Ошибка сохранения')
                await loadBatches()
            }
        } else {
            setBatches(newData)
        }
    }

    // ---------- ЭФФЕКТЫ ----------
    useEffect(() => {
        if (lazyParams) {
            fetchBatches(lazyParams)
        }
    }, [lazyParams, fetchBatches])

    useEffect(() => {
        loadBatches()
    }, [loadBatches])

    const handleLazyLoad = useCallback((params) => {
        setLazyParams(params)
    }, [])

    // ---------- СТАТИСТИКА ----------
    const totalSamples = batches.reduce((sum, b) => sum + (b.sample_count || 0), 0)
    const batchesWithSamples = batches.filter(b => (b.sample_count || 0) > 0).length

    // ---------- РЕНДЕР ----------
    return (
        <>
            <div className="app theme-transition">
                <div className="stats">
                    <StatCard
                        icon="📦"
                        label="Всего батчей"
                        value={totalRows}
                        color="var(--blue)"
                    />
                    <StatCard
                        icon="📋"
                        label="Всего образцов"
                        value={totalSamples}
                        color="var(--green)"
                    />
                    <StatCard
                        icon="✅"
                        label="Батчей с образцами"
                        value={batchesWithSamples}
                        color="var(--orange)"
                    />
                </div>
                <section className="section">
                    {loading && deptLoading ? (
                        <Spinner />
                    ) : (
                        <Table
                            lazy
                            data={batches}
                            totalRows={totalRows}
                            onLazyLoad={handleLazyLoad}
                            columns={columns}
                            pageSize={10}
                            enableSelection
                            enableSorting
                            enableFiltering
                            enablePagination
                            enableColumnVisibility
                            enableAddButton
                            enableExport
                            enableInlineEdit={false}
                            enableEmptyRow={true}
                            onAddSuccess={handleAddBatch}
                            onEditSuccess={handleEditBatch}
                            onDeleteSuccess={handleDeleteBatch}
                            onDataChange={handleDataChange}
                        />
                    )}
                </section>
            </div>
        </>
    )
}