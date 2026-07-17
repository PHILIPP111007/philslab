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

export default function Subsamples() {
    var { user, setUser } = use(UserContext)
    var params = useParams()
    const [samples, setSamples] = useState([])
    const [lazyParams, setLazyParams] = useState(null)
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        rememberPage(`subsamples/${params.username}`)
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
            accessorKey: 'sample_code',
            header: 'sample_code',
            size: 80,
            editType: 'text',
        },
        {
            accessorKey: 'zlims_code',
            header: 'zlims_code',
            size: 80,
            editType: 'text',
        },
        {
            accessorKey: 'user',
            header: 'user',
            size: 80,
            editType: 'text',
        },
        {
            accessorKey: 'qc_1',
            header: 'qc_1',
            size: 80,
            editType: 'text',
        },
        {
            accessorKey: 'qc_2',
            header: 'qc_2',
            size: 80,
            editType: 'text',
        },
        {
            accessorKey: 'descr',
            header: 'descr',
            size: 80,
            editType: 'text',
        },
        {
            accessorKey: 'material_type',
            header: 'material_type',
            size: 80,
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
    ]


    // ---------- ЗАГРУЗКА ДАННЫХ ----------
    const loadSamples = useCallback(async () => {
        setLoading(true)
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'subsamples/',
            method: HttpMethod.GET,
        })
        if (data?.ok) {
            setSamples(prev => {
                // Если данные не изменились, возвращаем старый массив
                const newData = data.data || []
                if (prev.length === newData.length && prev.every((item, i) => item.id === newData[i].id)) {
                    return prev // не вызывает ререндер
                }
                return newData
            })
        }
        setLoading(false)
    }, [])


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
            action: `subsamples/?${query.toString()}`,
            method: HttpMethod.GET,
        });
        if (res?.ok) {
            setSamples(res.data);
            setTotalRows(res.total);
        }
    }, [])


    // ---------- ОБРАБОТЧИК ДОБАВЛЕНИЯ ----------
    const handleAddSample = async (newItem) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'subsample/',
            method: HttpMethod.POST,
            body: {
                zlims_id: newItem.zlims_id || '',
                some_number: newItem.some_number,
                descr: newItem.descr || '',
            },
        })
        if (data?.ok && lazyParams) {
            fetchSamples(lazyParams); // обновить список
        } else {
            notify_error(data?.error || "Ошибка добавления")
        }
    }

    // ---------- ОБРАБОТЧИК РЕДАКТИРОВАНИЯ (модальное окно) ----------
    const handleEditSample = async (updatedItem) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `subsample/${updatedItem.id}/`,
            method: HttpMethod.PUT,
            body: {
                zlims_id: updatedItem.zlims_id,
                some_number: updatedItem.some_number,
                descr: updatedItem.descr,
            },
        })
        if (data?.ok) {
            // обновляем локальный стейт или перезагружаем
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
            action: `subsample/${item.id}/`,
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
        // синхронизация с сервером при инлайн-редактировании
        if (meta?.operation === 'edit' && meta.data) {
            const updatedItem = meta.data
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `subsample/${updatedItem.id}/`,
                method: HttpMethod.PUT,
                body: {
                    zlims_id: updatedItem.zlims_id,
                    some_number: updatedItem.some_number,
                    descr: updatedItem.descr,
                },
            })
            setSamples(newData)
            if (!data?.ok) {
                notify_error(data?.error || 'Ошибка сохранения')
                // откатываем изменения? можно перезагрузить
                await loadSamples()
            }
        }
    }

    useEffect(() => {
        if (lazyParams) {
            fetchSamples(lazyParams);
        }
    }, [lazyParams, fetchSamples]);

    useEffect(() => {
        loadSamples()
    }, [loadSamples])

    const handleLazyLoad = useCallback((params) => {
        setLazyParams(params); // обновляем параметры -> useEffect загрузит данные
    }, []);


    // ---------- РЕНДЕР ----------
    return (
        <>
            <Header />
            <div className="app theme-transition">
                <div className="stats">
                    <StatCard label="Всего образцов" value={totalRows} color="var(--blue)" />
                </div>
                <section className="section">
                    <h2 className="section__title">Список суб образцов</h2>
                    {loading
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
                            onDataChange={handleDataChange}   // ← было пропущено
                        />
                    }
                </section>
            </div>
        </>
    );
}