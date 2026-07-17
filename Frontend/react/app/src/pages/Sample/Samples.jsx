import { useState, useEffect, useCallback, use } from 'react'
import { useParams } from 'react-router-dom'
import Fetch from '../../API/Fetch'
import { UserContext } from "../../data/context"
import { notify_error } from '../../modules/notify'
import rememberPage from "../../modules/rememberPage"
import { HttpMethod, APIVersion } from '../../data/enums'
import Spinner from "../components/Spinner/Spinner"
import Table from "../components/Table/Table"
import Header from '../components/Header/Header'
import StatCard from '../components/StatCard/StatCard'

export default function Samples() {
    var { user, setUser } = use(UserContext)
    var params = useParams()
    const [samples, setSamples] = useState([])
    const [lazyParams, setLazyParams] = useState(null)
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        rememberPage(`samples/${params.username}`)
    }, [params.username])

    const columns = [
        {
            accessorKey: 'id',
            header: 'ID',
            size: 70,
            enableEditing: false,
            enableSorting: true,
        },
        {
            accessorKey: 'name',
            header: 'Название',
            size: 120,
            editType: 'text',
            required: true,
        },
        {
            accessorKey: 'sample_code',
            header: 'Код образца',
            size: 120,
            editType: 'text',
        },
        {
            accessorKey: 'sample_group_code',
            header: 'Код группы',
            size: 120,
            editType: 'text',
        },
        {
            accessorKey: 'zlims_code',
            header: 'ZLIMS код',
            size: 100,
            editType: 'text',
        },
        {
            accessorKey: 'uin1',
            header: 'UIN 1',
            size: 100,
            editType: 'text',
        },
        {
            accessorKey: 'uin2',
            header: 'UIN 2',
            size: 100,
            editType: 'text',
        },
        {
            accessorKey: 'project_code',
            header: 'Код проекта',
            size: 100,
            editType: 'text',
        },
        {
            accessorKey: 'sample_index',
            header: 'Индекс',
            size: 80,
            editType: 'text',
        },
        {
            accessorKey: 'some_number',
            header: 'Число',
            size: 80,
            editType: 'number',
            conditionalFormatting: (value, row, column) => {
                if (value > 100) {
                    return { backgroundColor: '#ffcccc', color: '#900' }
                }
                return {}
            },
            aggregation: 'sum',
        },
        {
            accessorKey: 'qc_1',
            header: 'QC 1',
            size: 80,
            editType: 'number',
        },
        {
            accessorKey: 'qc_2',
            header: 'QC 2',
            size: 80,
            editType: 'number',
        },
        {
            accessorKey: 'descr',
            header: 'Описание',
            size: 200,
            editType: 'text',
        },
        {
            accessorKey: 'material_type',
            header: 'Тип материала',
            size: 120,
            editType: 'text',
        },
        {
            accessorKey: 'timestamp',
            header: 'Дата создания',
            size: 180,
            enableEditing: false,
            cell: ({ getValue }) => {
                const val = getValue()
                if (!val) return '—'
                return new Date(val).toLocaleString('ru-RU')
            },
        },
        {
            id: 'days_ago',
            header: 'Дней назад',
            size: 100,
            enableEditing: false,
            accessorFn: (row) => {
                if (!row.timestamp) return '—'
                const created = new Date(row.timestamp)
                const now = new Date()
                const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24))
                return diff
            },
            cell: ({ getValue }) => {
                const days = getValue()
                if (days === '—') return '—'
                return `${days} дн.`
            },
        },
        {
            id: 'full_info',
            header: 'ZLIMS + Число',
            size: 200,
            enableEditing: false,
            accessorFn: (row) => {
                return `${row.zlims_code || ''}_${row.some_number || 0}`
            },
        }
    ]


    // ---------- ЗАГРУЗКА ДАННЫХ ----------
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


    // ---------- ОБРАБОТЧИК ДОБАВЛЕНИЯ ----------
    const handleAddSample = async (newItem) => {
        // Проверяем обязательные поля
        if (!newItem.name) {
            notify_error("Необходимо указать название")
            return
        }

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'sample/',
            method: HttpMethod.POST,
            body: {
                sample_code: newItem.sample_code || '',
                sample_group_code: newItem.sample_group_code || '',
                zlims_code: newItem.zlims_code || '',
                uin1: newItem.uin1 || '',
                uin2: newItem.uin2 || '',
                project_code: newItem.project_code || '',
                sample_index: newItem.sample_index || '',
                name: newItem.name,
                some_number: newItem.some_number || null,
                qc_1: newItem.qc_1 || null,
                qc_2: newItem.qc_2 || null,
                descr: newItem.descr || '',
                material_type: newItem.material_type || '',
            },
        })
        if (data?.ok && lazyParams) {
            fetchSamples(lazyParams);
        } else {
            notify_error(data?.error || "Ошибка добавления")
        }
    }

    // ---------- ОБРАБОТЧИК РЕДАКТИРОВАНИЯ (модальное окно) ----------
    const handleEditSample = async (updatedItem) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `sample/${updatedItem.id}/`,
            method: HttpMethod.PUT,
            body: {
                sample_code: updatedItem.sample_code,
                sample_group_code: updatedItem.sample_group_code,
                zlims_code: updatedItem.zlims_code,
                uin1: updatedItem.uin1,
                uin2: updatedItem.uin2,
                project_code: updatedItem.project_code,
                sample_index: updatedItem.sample_index,
                name: updatedItem.name,
                some_number: updatedItem.some_number,
                qc_1: updatedItem.qc_1,
                qc_2: updatedItem.qc_2,
                descr: updatedItem.descr,
                material_type: updatedItem.material_type,
            },
        })
        if (data?.ok) {
            setSamples(prev =>
                prev.map(s => (s.id === updatedItem.id ? { ...s, ...updatedItem } : s))
            )
        } else {
            notify_error(data?.error || 'Ошибка сохранения')
        }
    }

    // ---------- ОБРАБОТЧИК УДАЛЕНИЯ ----------
    const handleDeleteSample = async (item) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `sample/${item.id}/`,
            method: HttpMethod.DELETE,
        })
        if (data?.ok) {
            setSamples(prev => prev.filter(s => s.id !== item.id))
        } else {
            notify_error(data?.error || 'Ошибка удаления')
        }
    }

    // ---------- ОБРАБОТЧИК ИЗМЕНЕНИЯ ДАННЫХ (инлайн-редактирование) ----------
    const handleDataChange = async (newData, meta) => {
        if (meta?.operation === 'edit' && meta.data) {
            const updatedItem = meta.data
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `sample/${updatedItem.id}/`,
                method: HttpMethod.PUT,
                body: {
                    sample_code: updatedItem.sample_code,
                    sample_group_code: updatedItem.sample_group_code,
                    zlims_code: updatedItem.zlims_code,
                    uin1: updatedItem.uin1,
                    uin2: updatedItem.uin2,
                    project_code: updatedItem.project_code,
                    sample_index: updatedItem.sample_index,
                    name: updatedItem.name,
                    some_number: updatedItem.some_number,
                    qc_1: updatedItem.qc_1,
                    qc_2: updatedItem.qc_2,
                    descr: updatedItem.descr,
                    material_type: updatedItem.material_type,
                },
            })
            if (data?.ok) {
                setSamples(newData)
            } else {
                notify_error(data?.error || 'Ошибка сохранения')
                if (lazyParams) {
                    await fetchSamples(lazyParams)
                }
            }
        } else if (meta?.operation === 'add' && meta.data) {
            // Обработка добавления через инлайн-редактирование
            const newItem = meta.data
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: 'sample/',
                method: HttpMethod.POST,
                body: {
                    sample_code: newItem.sample_code || '',
                    sample_group_code: newItem.sample_group_code || '',
                    zlims_code: newItem.zlims_code || '',
                    uin1: newItem.uin1 || '',
                    uin2: newItem.uin2 || '',
                    project_code: newItem.project_code || '',
                    sample_index: newItem.sample_index || '',
                    name: newItem.name,
                    some_number: newItem.some_number || null,
                    qc_1: newItem.qc_1 || null,
                    qc_2: newItem.qc_2 || null,
                    descr: newItem.descr || '',
                    material_type: newItem.material_type || '',
                },
            })
            if (data?.ok && lazyParams) {
                await fetchSamples(lazyParams)
            } else {
                notify_error(data?.error || 'Ошибка добавления')
            }
        }
    }

    // Инициализация lazy-загрузки
    const handleLazyLoad = useCallback((params) => {
        setLazyParams(params);
    }, []);

    // Первая загрузка при монтировании
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
                    <h2 className="section__title">Список образцов</h2>
                    {loading && !lazyParams
                        ?
                        <Spinner />
                        :
                        <Table
                            lazy
                            data={samples}
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
                            enableInlineEdit
                            enableEmptyRow={true}
                            onAddSuccess={handleAddSample}
                            onEditSuccess={handleEditSample}
                            onDeleteSuccess={handleDeleteSample}
                            onDataChange={handleDataChange}
                        />
                    }
                </section>
            </div>
        </>
    );
}