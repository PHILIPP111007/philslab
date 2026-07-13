import { useState, useEffect, useCallback } from 'react'
import Fetch from '../../API/Fetch'
import { HttpMethod, APIVersion } from '../../data/enums'
import Table from "../components/Table/Table"
import Header from '../components/Header/Header'
import StatCard from '../components/StatCard/StatCard'

export default function Samples() {
    const [samples, setSamples] = useState([])
    const [loading, setLoading] = useState(true)

    // ---------- КОЛОНКИ ТАБЛИЦЫ (обновлены с учётом zlims_id) ----------
    const columns = [
        {
            accessorKey: 'id',
            header: 'ID',
            size: 70,
            enableEditing: false,
            enableSorting: true,
        },
        {
            accessorKey: 'zlims_id',
            header: 'ZLIMS ID',
            size: 120,
            editType: 'text',
        },
        {
            accessorKey: 'some_number',
            header: 'Число (плохо когда красное)',
            size: 120,
            editType: 'number',
            conditionalFormatting: (value, row, column) => {
                if (value > 100) {
                    return { backgroundColor: '#ffcccc', color: '#900' }
                }
                return {}
            }
        },
        {
            accessorKey: 'descr',
            header: 'Описание',
            size: 300,
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
    ]

    // ---------- ЗАГРУЗКА ДАННЫХ ----------
    const loadSamples = useCallback(async () => {
        setLoading(true)
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'samples/',
            method: HttpMethod.GET,
        })
        if (data?.ok) {
            setSamples(data.data || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        loadSamples()
    }, [loadSamples])

    // ---------- ОБРАБОТЧИК ДОБАВЛЕНИЯ ----------
    const handleAddSample = async (newItem) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: 'sample/',
            method: HttpMethod.POST,
            body: {
                zlims_id: newItem.zlims_id || '',
                some_number: newItem.some_number,
                descr: newItem.descr || '',
            },
        })
        if (data?.ok) {
            await loadSamples()
        } else {
            alert(data?.error || 'Ошибка добавления')
        }
    }

    // ---------- ОБРАБОТЧИК РЕДАКТИРОВАНИЯ (модальное окно) ----------
    const handleEditSample = async (updatedItem) => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `sample/${updatedItem.id}/`,
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
            alert(data?.error || 'Ошибка сохранения')
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
            alert(data?.error || 'Ошибка удаления')
        }
    }

    // ---------- ОБРАБОТЧИК ИЗМЕНЕНИЯ ДАННЫХ (инлайн-редактирование) ----------
    const handleDataChange = async (newData, meta) => {
        // обновляем локальный стейт сразу для отзывчивости UI
        setSamples(newData)

        // синхронизация с сервером при инлайн-редактировании
        if (meta?.operation === 'edit' && meta.data) {
            const updatedItem = meta.data
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `sample/${updatedItem.id}/`,
                method: HttpMethod.PUT,
                body: {
                    zlims_id: updatedItem.zlims_id,
                    some_number: updatedItem.some_number,
                    descr: updatedItem.descr,
                },
            })
            if (!data?.ok) {
                alert(data?.error || 'Ошибка сохранения')
                // откатываем изменения? можно перезагрузить
                await loadSamples()
            }
        }
    }

    // ---------- РЕНДЕР ----------
    return (
        <>
            <Header />
            <div className="app theme-transition">
                <header className="app__header">
                    <div className="app__header-left">
                        <h1 className="app__title">Образцы (Samples)</h1>
                        <p className="app__subtitle">Работа с образцами данных через таблицу</p>
                    </div>
                </header>

                {/* ======================================== */}
                {/* СТАТИСТИКА */}
                {/* ======================================== */}
                <div className="stats">
                    <StatCard label="Всего образцов" value={samples.length} color="var(--blue)" />
                </div>

                <section className="section">
                    <h2 className="section__title">Список образцов</h2>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>
                    ) : (
                        <Table
                            data={samples}
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
                            onDataChange={handleDataChange}
                            onAddSuccess={handleAddSample}
                            onEditSuccess={handleEditSample}
                            onDeleteSuccess={handleDeleteSample}
                        />
                    )}
                </section>
            </div>
        </>
    )
}