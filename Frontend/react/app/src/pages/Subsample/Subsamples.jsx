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
            accessorKey: 'sample_id',
            header: 'Sample ID',
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
            accessorKey: 'some_number',
            header: 'Номер',
            size: 80,
            editType: 'number',
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
            size: 150,
            editType: 'text',
        },
        {
            accessorKey: 'material_type',
            header: 'Тип материала',
            size: 120,
            editType: 'text',
        },
        {
            accessorKey: 'user_id',
            header: 'Пользователь',
            size: 80,
            enableEditing: false,
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
            action: `subsamples/?${query.toString()}`,
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
        if (!newItem.sample_id) {
            notify_error("Необходимо указать sample_id")
            return
        }
        if (!newItem.name) {
            notify_error("Необходимо указать название")
            return
        }

        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'subsample/',
            method: HttpMethod.POST,
            body: {
                sample_id: newItem.sample_id,
                sample_code: newItem.sample_code || '',
                name: newItem.name,
                some_number: newItem.some_number || null,
                qc_1: newItem.qc_1 || null,
                qc_2: newItem.qc_2 || null,
                descr: newItem.descr || '',
                material_type: newItem.material_type || '',
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
                sample_code: updatedItem.sample_code,
                name: updatedItem.name,
                some_number: updatedItem.some_number,
                qc_1: updatedItem.qc_1,
                qc_2: updatedItem.qc_2,
                descr: updatedItem.descr,
                material_type: updatedItem.material_type,
            },
        })
        if (data?.ok) {
            // обновляем локальный стейт
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
        if (meta?.operation === 'edit' && meta.data) {
            const updatedItem = meta.data
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `subsample/${updatedItem.id}/`,
                method: HttpMethod.PUT,
                body: {
                    sample_code: updatedItem.sample_code,
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
                // Откатываем изменения - перезагружаем текущую страницу
                if (lazyParams) {
                    await fetchSamples(lazyParams)
                }
            }
        } else if (meta?.operation === 'add' && meta.data) {
            // Обработка добавления через инлайн-редактирование пустой строки
            const newItem = meta.data
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: 'subsample/',
                method: HttpMethod.POST,
                body: {
                    sample_id: newItem.sample_id,
                    sample_code: newItem.sample_code || '',
                    name: newItem.name,
                    some_number: newItem.some_number || null,
                    qc_1: newItem.qc_1 || null,
                    qc_2: newItem.qc_2 || null,
                    descr: newItem.descr || '',
                    material_type: newItem.material_type || '',
                },
            })
            if (data?.ok) {
                setSamples(newData.filter(item => item.id > 0))
                if (lazyParams) {
                    await fetchSamples(lazyParams)
                }
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
                    <StatCard label="Всего суб-образцов" value={totalRows} color="var(--blue)" />
                </div>
                <section className="section">
                    <h2 className="section__title">Список суб-образцов</h2>
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