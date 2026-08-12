import './Table.css'
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getGroupedRowModel,
    getExpandedRowModel,
    flexRender,
} from '@tanstack/react-table'
import ExcelJS from 'exceljs'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { notify_error } from '../../../modules/notify'
import { AddModal, DeleteModal, EditModal } from './TableModals'
import { EditableCell, TableRow } from './TableCells'

// ============================================
// АГРЕГАЦИИ
// ============================================
function renderAggregation(column, table) {
    const aggFn = column.columnDef.aggregation
    if (!aggFn) return null
    const rows = table.getFilteredRowModel().rows.map(r => r.original)
    if (aggFn === 'sum') {
        const sum = rows.reduce((acc, row) => acc + (Number(row[column.id]) || 0), 0)
        return <span>{sum}</span>
    }
    if (aggFn === 'average') {
        const sum = rows.reduce((acc, row) => acc + (Number(row[column.id]) || 0), 0)
        const avg = rows.length ? sum / rows.length : 0
        return <span>{avg.toFixed(2)}</span>
    }
    if (aggFn === 'count') {
        return <span>{rows.length}</span>
    }
    if (typeof aggFn === 'function') {
        return <span>{aggFn(rows)}</span>
    }
    return null
}

// ============================================
// ФИЛЬТРЫ
// ============================================
const textFilter = (row, columnId, filterValue) => {
    if (!filterValue) return true
    const value = row.getValue(columnId)
    return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
}

const numberContainsFilter = (row, columnId, filterValue) => {
    if (!filterValue) return true
    const value = row.getValue(columnId)
    return String(value).includes(filterValue)
}

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ ТАБЛИЦЫ
// ============================================
export default function Table({
    data: initialData = [],
    columns: userColumns = [],
    pageSize: initialPageSize = 10,
    enableSelection = true,
    enableSorting = true,
    enableFiltering = true,
    enableGrouping = true,
    enablePagination = true,
    enableColumnVisibility = true,
    enableAddButton = true,
    enableExport = true,
    enableActionsColumn = true,
    enableInlineEdit = true,
    enableEmptyRow = true,
    enableCellSelection = false,
    onDataChange,
    onEditSuccess,
    onDeleteSuccess,
    onAddSuccess,
    onCellEdit,
    validateCell,
    lazy = false,
    onLazyLoad,
    totalRows = 0,
    onExportAll,
    infiniteScroll = false,
}) {
    // ---------- утилиты для пустой строки ----------
    const createEmptyRowData = useCallback((id) => {
        const emptyRow = { id }
        userColumns.forEach((col) => {
            if (col.accessorKey && col.accessorKey !== 'id') {
                emptyRow[col.accessorKey] = col.defaultValue ?? ''
            }
        })
        return emptyRow
    }, [userColumns])

    const getNextEmptyRowId = useCallback((dataArray) => {
        const minId = dataArray.reduce((min, item) => Math.min(min, item.id || 0), 0)
        return minId > 0 ? -1 : minId - 1
    }, [])

    const ensureEmptyRow = useCallback((dataArray) => {
        if (!enableEmptyRow) return dataArray
        const hasEmptyRow = dataArray.some(item => item.id < 0)
        if (!hasEmptyRow) {
            const newId = getNextEmptyRowId(dataArray)
            return [...dataArray, createEmptyRowData(newId)]
        }
        return dataArray
    }, [enableEmptyRow, createEmptyRowData, getNextEmptyRowId])

    // ---------- состояние ----------
    const [data, setData] = useState(() => {
        if (enableEmptyRow && !infiniteScroll) {
            if (initialData.length === 0) return [createEmptyRowData(-1)]
            return ensureEmptyRow(initialData)
        }
        return initialData
    })

    const [sorting, setSorting] = useState([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [columnFilters, setColumnFilters] = useState([])
    const [grouping, setGrouping] = useState([])
    const [expanded, setExpanded] = useState({})
    const [columnVisibility, setColumnVisibility] = useState({})
    const [columnOrder, setColumnOrder] = useState([])
    const [pageIndex, setPageIndex] = useState(0)
    const [pageSize, setPageSize] = useState(initialPageSize)
    const [columnSizing, setColumnSizing] = useState({})

    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [selectedCells, setSelectedCells] = useState(new Set())
    const [lastSelectedCell, setLastSelectedCell] = useState(null)

    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMoreData, setHasMoreData] = useState(true)
    const [lastRowElement, setLastRowElement] = useState(null)
    const setLastRowRef = useCallback((node) => setLastRowElement(node), [])

    const effectiveEnableEmptyRow = infiniteScroll ? false : enableEmptyRow

    // ---------- эффекты ----------
    useEffect(() => {
        setColumnSizing({})
    }, [columnVisibility])

    // Сброс выделения при смене страницы/фильтров
    useEffect(() => {
        setSelectedCells(new Set())
        setLastSelectedCell(null)
    }, [pageIndex, pageSize, globalFilter, columnFilters])

    // При изменении фильтров или сортировки сбрасываем данные и загружаем первую страницу
    useEffect(() => {
        if (infiniteScroll) {
            setData([]);
            setPageIndex(0);
            setHasMoreData(true);
            setIsLoadingMore(false);
            onLazyLoad?.({ pageIndex: 0, pageSize, sorting, globalFilter, columnFilters });
        }
    }, [sorting, globalFilter, columnFilters, infiniteScroll, onLazyLoad, pageSize]);

    // Синхронизация внешних данных с локальным состоянием таблицы.
    useEffect(() => {
        if (lazy && infiniteScroll) {
            setData(prev => {
                const existingIds = new Set(prev.map(item => item.id));
                const newItems = initialData.filter(item => !existingIds.has(item.id));
                const newData = [...prev, ...newItems];
                if (totalRows > 0 && newData.length >= totalRows) {
                    setHasMoreData(false);
                } else if (totalRows > 0) {
                    setHasMoreData(true);
                } else {
                    if (initialData.length < pageSize) {
                        setHasMoreData(false);
                    } else {
                        setHasMoreData(true);
                    }
                }
                return newData;
            });
            setIsLoadingMore(false);
        } else {
            setData(effectiveEnableEmptyRow ? ensureEmptyRow(initialData) : initialData);
        }
    }, [initialData, lazy, infiniteScroll, pageSize, totalRows, effectiveEnableEmptyRow, ensureEmptyRow]);

    // Обработчик загрузки следующей страницы
    const loadMore = useCallback(() => {
        if (isLoadingMore || !hasMoreData || !lazy) return;
        const nextPage = pageIndex + 1;
        setIsLoadingMore(true);
        // Обновляем pageIndex, чтобы отображать текущую страницу (опционально)
        setPageIndex(nextPage);
        // И сразу вызываем загрузку
        onLazyLoad?.({ pageIndex: nextPage, pageSize, sorting, globalFilter, columnFilters });
    }, [isLoadingMore, hasMoreData, lazy, pageIndex, pageSize, sorting, globalFilter, columnFilters, onLazyLoad]);

    // Наблюдаем за последней строкой через callback ref: изменение ref.current
    // само по себе не вызывает ререндер и не может быть dependency effect.
    useEffect(() => {
        if (!infiniteScroll || !lastRowElement) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore()
                }
            },
            { root: null, rootMargin: '0px 0px 200px 0px', threshold: 0.1 }
        )

        observer.observe(lastRowElement)

        return () => {
            observer.disconnect()
        }
    }, [infiniteScroll, lastRowElement, loadMore])

    // Lazy-загрузка при изменении pageIndex (или других параметров)
    // Lazy-загрузка при изменении параметров (только для обычной пагинации)
    useEffect(() => {
        if (!lazy || infiniteScroll) return; // при infiniteScroll мы вызываем вручную
        onLazyLoad?.({ pageIndex, pageSize, sorting, globalFilter, columnFilters });
    }, [lazy, pageIndex, pageSize, sorting, globalFilter, columnFilters, onLazyLoad, infiniteScroll]);

    const handleEdit = useCallback((updatedItem) => {
        setData((old) => {
            const newData = old.map((item) => item.id === updatedItem.id ? updatedItem : item)
            if (onDataChange) {
                onDataChange(newData.filter(i => i.id > 0), { id: updatedItem.id, operation: 'edit', data: updatedItem })
            } else {
                onEditSuccess?.(updatedItem)
            }
            return newData
        })
    }, [onDataChange, onEditSuccess])

    const handleDelete = useCallback((item) => {
        if (item.id < 0) return
        setData((old) => {
            const newData = old.filter((i) => i.id !== item.id)
            const totalItems = newData.filter(i => i.id > 0).length
            const maxPage = Math.max(0, Math.ceil(totalItems / pageSize) - 1)
            if (pageIndex > maxPage) setPageIndex(maxPage)
            const finalData = effectiveEnableEmptyRow ? ensureEmptyRow(newData) : newData
            if (onDataChange) {
                onDataChange(finalData.filter(i => i.id > 0), { id: item.id, operation: 'delete', data: item })
            } else {
                onDeleteSuccess?.(item)
            }
            return finalData
        })
    }, [pageSize, pageIndex, effectiveEnableEmptyRow, ensureEmptyRow, onDataChange, onDeleteSuccess])

    const handleAdd = useCallback((newItem) => {
        setData((old) => {
            const dataWithoutEmpty = old.filter(item => item.id > 0)
            const maxId = dataWithoutEmpty.reduce((max, item) => Math.max(max, item.id || 0), 0)
            const itemWithId = { ...newItem, id: maxId + 1 }
            const finalData = effectiveEnableEmptyRow ? ensureEmptyRow([...dataWithoutEmpty, itemWithId]) : [...dataWithoutEmpty, itemWithId]
            if (onDataChange) {
                onDataChange(finalData.filter(i => i.id > 0), { id: itemWithId.id, operation: 'add', data: itemWithId })
            } else {
                onAddSuccess?.(itemWithId)
            }
            const totalItems = finalData.filter(i => i.id > 0).length
            const lastPage = Math.max(0, Math.ceil(totalItems / pageSize) - 1)
            setPageIndex(lastPage)
            return finalData
        })
    }, [pageSize, effectiveEnableEmptyRow, ensureEmptyRow, onDataChange, onAddSuccess])

    const handleCellEdit = useCallback((row, columnId, value) => {
        if (row.id < 0) {
            setData((old) => {
                const dataWithoutEmpty = old.filter(item => item.id > 0)
                const maxId = dataWithoutEmpty.reduce((max, item) => Math.max(max, item.id || 0), 0)
                const newRow = { ...row, [columnId]: value, id: maxId + 1 }
                const filtered = old.filter(item => item.id !== row.id)
                const finalData = effectiveEnableEmptyRow ? ensureEmptyRow([...filtered, newRow]) : [...filtered, newRow]
                onCellEdit?.(newRow, columnId, value)
                if (onDataChange) {
                    onDataChange(finalData.filter(i => i.id > 0), { id: newRow.id, operation: 'add', data: newRow })
                } else {
                    onAddSuccess?.(newRow)
                }
                return finalData
            })
        } else {
            if (data.some(item => item.id === row.id)) {
                setData((old) => {
                    const currentRow = old.find(item => item.id === row.id)
                    if (!currentRow) return old

                    const updatedItem = { ...currentRow, [columnId]: value }
                    const newData = old.map(item => item.id === row.id ? updatedItem : item)
                    onCellEdit?.(updatedItem, columnId, value)
                    if (onDataChange) {
                        onDataChange(newData.filter(i => i.id > 0), {
                            id: row.id,
                            operation: 'edit',
                            data: updatedItem,
                            column: columnId,
                            value,
                        })
                    } else {
                        onEditSuccess?.(updatedItem)
                    }
                    return newData
                })
            }
        }
    }, [data, effectiveEnableEmptyRow, ensureEmptyRow, onCellEdit, onAddSuccess, onDataChange, onEditSuccess])

    // ---------- ФУНКЦИИ ВЫДЕЛЕНИЯ ----------
    const isCellSelected = useCallback((rowIndex, colIndex) => {
        return selectedCells.has(`${rowIndex}-${colIndex}`)
    }, [selectedCells])

    const toggleCellSelection = useCallback((rowIndex, colIndex, event) => {
        if (!enableCellSelection) return
        const key = `${rowIndex}-${colIndex}`
        if (event.ctrlKey || event.metaKey) {
            setSelectedCells(prev => {
                const newSet = new Set(prev)
                if (newSet.has(key)) newSet.delete(key)
                else newSet.add(key)
                return newSet
            })
            setLastSelectedCell({ rowIndex, colIndex })
            return
        }
        if (event.shiftKey && lastSelectedCell) {
            const { rowIndex: lastRow, colIndex: lastCol } = lastSelectedCell
            const minRow = Math.min(rowIndex, lastRow)
            const maxRow = Math.max(rowIndex, lastRow)
            const minCol = Math.min(colIndex, lastCol)
            const maxCol = Math.max(colIndex, lastCol)
            const newSet = new Set()
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    newSet.add(`${r}-${c}`)
                }
            }
            setSelectedCells(newSet)
            setLastSelectedCell({ rowIndex, colIndex })
            return
        }
        setSelectedCells(new Set([key]))
        setLastSelectedCell({ rowIndex, colIndex })
    }, [enableCellSelection, lastSelectedCell])

    // ---------- КОНТЕКСТНОЕ МЕНЮ ----------
    const handleRowContextMenu = useCallback((e, rowData) => {
        e.preventDefault()
        if (rowData.id < 0) return
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            row: rowData,
        })
    }, [])

    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        row: null,
    })
    const contextMenuRef = useRef(null)

    useEffect(() => {
        if (!contextMenu.visible) return
        const handleClickOutside = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setContextMenu(prev => ({ ...prev, visible: false }))
            }
        }
        const handleEscape = (e) => {
            if (e.key === 'Escape') setContextMenu(prev => ({ ...prev, visible: false }))
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [contextMenu.visible])

    const handleContextEdit = useCallback(() => {
        setSelectedItem(contextMenu.row)
        setEditModalOpen(true)
        setContextMenu(prev => ({ ...prev, visible: false }))
    }, [contextMenu.row])

    const handleContextDelete = useCallback(() => {
        setSelectedItem(contextMenu.row)
        setDeleteModalOpen(true)
        setContextMenu(prev => ({ ...prev, visible: false }))
    }, [contextMenu.row])

    const handleContextCopy = useCallback(() => {
        const row = contextMenu.row
        const text = Object.entries(row)
            .filter(([key]) => key !== 'id')
            .map(([key, val]) => `${key}: ${val}`)
            .join('\n')
        navigator.clipboard.writeText(text)
        setContextMenu(prev => ({ ...prev, visible: false }))
    }, [contextMenu.row])

    const handleContextDuplicate = useCallback(() => {
        const row = { ...contextMenu.row }
        delete row.id
        handleAdd(row)
        setContextMenu(prev => ({ ...prev, visible: false }))
    }, [contextMenu.row, handleAdd])

    // ---------- КОЛОНКИ ----------
    const selectionColumn = useMemo(() => enableSelection ? [{
        id: 'select',
        header: ({ table }) => <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
        cell: ({ row }) => row.original.id < 0 ? null : <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
        size: 40,
        enableSorting: false,
        enableColumnFilter: false,
    }] : [], [enableSelection])

    const actionsColumn = useMemo(() => {
        if (!enableActionsColumn) return []
        return [{
            id: 'actions',
            header: 'Действия',
            cell: ({ row }) => {
                if (row.original.id < 0) return <span style={{ fontSize: '11px', color: 'var(--text-dark)', opacity: 0.6 }}>Новая запись</span>
                return (
                    <div className="table-action-buttons">
                        <button onClick={() => { setSelectedItem(row.original); setEditModalOpen(true) }} className="table-action-edit" title="Редактировать">✏️</button>
                        <button onClick={() => { setSelectedItem(row.original); setDeleteModalOpen(true) }} className="table-action-delete" title="Удалить">🗑️</button>
                    </div>
                )
            },
            size: 90,
            enableSorting: false,
            enableColumnFilter: false,
        }]
    }, [enableActionsColumn])

    const columns = useMemo(() => {
        const processedColumns = userColumns.map(col => {
            const processedCol = { ...col }
            const isEditable = col.editable !== undefined ? col.editable : (col.enableEditing !== false)
            if (enableInlineEdit && isEditable) {
                processedCol.cell = (props) => (
                    <EditableCell {...props} onCellEdit={handleCellEdit} validate={validateCell}
                    />
                )
            }
            if (!processedCol.filterFn) {
                processedCol.filterFn = processedCol.editType === 'number' ? numberContainsFilter : textFilter
            }
            return processedCol
        })
        return [...selectionColumn, ...processedColumns, ...actionsColumn]
    }, [userColumns, enableInlineEdit, selectionColumn, actionsColumn, handleCellEdit, validateCell])

    // ---------- ТАБЛИЦА ----------
    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
            columnFilters,
            grouping,
            expanded,
            columnVisibility,
            columnOrder,
            pagination: { pageIndex, pageSize },
            columnSizing,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onGroupingChange: setGrouping,
        onExpandedChange: setExpanded,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnOrderChange: setColumnOrder,
        onPaginationChange: (updater) => {
            const newState = typeof updater === 'function'
                ? updater({ pageIndex, pageSize })
                : updater
            setPageIndex(newState.pageIndex)
            if (newState.pageSize !== pageSize) setPageSize(newState.pageSize)
        },
        onColumnSizingChange: setColumnSizing,
        manualPagination: lazy,
        manualSorting: lazy,
        manualFiltering: lazy,
        pageCount: lazy ? Math.ceil(totalRows / pageSize) : undefined,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        getCoreRowModel: getCoreRowModel(),
        ...(lazy
            ? {}
            : {
                getSortedRowModel: getSortedRowModel(),
                getFilteredRowModel: getFilteredRowModel(),
                getPaginationRowModel: getPaginationRowModel(),
            }
        ),
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        filterFns: { text: textFilter, numberContains: numberContainsFilter },
        meta: {},
        enableSorting,
        enableColumnFilters: enableFiltering,
        enableGrouping,
        enableExpanding: enableGrouping,
        autoResetPageIndex: false,
        getRowId: useCallback(row => String(row.id), []),
    })

    // ---------- МАССОВОЕ ПРИМЕНЕНИЕ ----------
    const applyValueToSelectedCells = useCallback((value) => {
        if (selectedCells.size === 0) return
        const rows = table.getRowModel().rows
        const allColumns = table.getAllColumns().filter(col => col.getIsVisible())
        const updates = []
        const newData = [...data]
        selectedCells.forEach(key => {
            const [rowIndexStr, colIndexStr] = key.split('-')
            const rowIndex = parseInt(rowIndexStr, 10)
            const colIndex = parseInt(colIndexStr, 10)
            const row = rows[rowIndex]
            if (!row) return
            const originalRow = row.original
            if (originalRow.id < 0) return
            const column = allColumns[colIndex]
            if (!column) return
            const columnId = column.id
            const dataIndex = newData.findIndex(item => item.id === originalRow.id)
            if (dataIndex === -1) return
            newData[dataIndex] = { ...newData[dataIndex], [columnId]: value }
            updates.push({ id: originalRow.id, columnId, value })
        })
        setData(newData)
        if (onDataChange) {
            onDataChange(newData.filter(i => i.id > 0), {
                operation: 'batchEdit',
                updates,
            })
        }
    }, [selectedCells, data, table, onDataChange])

    useEffect(() => {
        if (table && table.options.meta) {
            table.options.meta.applyValueToSelectedCells = applyValueToSelectedCells
        }
    }, [table, applyValueToSelectedCells])

    // ---------- ЭКСПОРТ ----------
    const getExportData = useCallback(async (selectedOnly = false) => {
        if (selectedOnly) {
            return table.getSelectedRowModel().rows
                .map(r => r.original)
                .filter(item => item.id > 0)
        }
        if (onExportAll) {
            try {
                const allData = await onExportAll({ sorting, globalFilter, columnFilters })
                return allData.filter(item => item.id > 0)
            } catch (error) {
                console.error('Export all error:', error)
                notify_error('Ошибка загрузки данных для экспорта')
                return []
            }
        }
        return table.getPrePaginationRowModel().rows
            .map(r => r.original)
            .filter(item => item.id > 0)
    }, [table, onExportAll, sorting, globalFilter, columnFilters])

    const exportToExcel = useCallback(async (selectedOnly = false) => {
        const exportData = await getExportData(selectedOnly)
        if (exportData.length === 0) {
            notify_error(selectedOnly ? 'Выберите строки для экспорта' : 'Нет данных для экспорта')
            return
        }
        try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Данные', {
                properties: { tabColor: { argb: selectedOnly ? 'FF4CAF50' : 'FF2196F3' } }
            })
            const exportColumns = userColumns.filter(col => col.accessorKey)
            const headerRow = worksheet.addRow(exportColumns.map(col => col.header || col.accessorKey))
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: selectedOnly ? 'FF4CAF50' : 'FF2196F3' } }
                cell.alignment = { vertical: 'middle', horizontal: 'center' }
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
            })
            headerRow.height = 25
            exportData.forEach((item, index) => {
                const rowData = exportColumns.map(col => item[col.accessorKey] ?? '')
                const dataRow = worksheet.addRow(rowData)
                if (index % 2 === 0) {
                    dataRow.eachCell(cell => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } })
                }
                dataRow.eachCell((cell, colNumber) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                    cell.alignment = { horizontal: typeof rowData[colNumber - 1] === 'number' ? 'right' : 'left' }
                })
            })
            worksheet.columns = exportColumns.map(col => ({
                width: Math.min(Math.max(
                    (col.header || col.accessorKey).length,
                    ...exportData.map(item => String(item[col.accessorKey] ?? '').length)
                ) + 4, 50)
            }))
            worksheet.autoFilter = {
                from: { row: 1, column: 1 },
                to: { row: exportData.length + 1, column: exportColumns.length }
            }
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `export${selectedOnly ? '_selected' : ''}_${new Date().toISOString().slice(0, 10)}.xlsx`
            link.click()
            URL.revokeObjectURL(link.href)
        } catch (error) {
            console.error('Export error:', error)
            notify_error('Ошибка экспорта в Excel')
        }
    }, [getExportData, userColumns])

    const exportToCSV = useCallback(async (selectedOnly = false) => {
        const exportData = await getExportData(selectedOnly)
        if (exportData.length === 0) {
            notify_error(selectedOnly ? 'Выберите строки для экспорта' : 'Нет данных для экспорта')
            return
        }
        const exportColumns = userColumns.filter(col => col.accessorKey)
        const headers = exportColumns.map(col => col.header || col.accessorKey).join(';')
        const rows = exportData.map(item =>
            exportColumns.map(col => {
                let value = item[col.accessorKey] ?? ''
                if (typeof value === 'string' && (value.includes(';') || value.includes('"'))) {
                    value = `"${value.replace(/"/g, '""')}"`
                }
                return value
            }).join(';')
        )
        const csvContent = '\uFEFF' + [headers, ...rows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `export${selectedOnly ? '_selected' : ''}_${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
    }, [getExportData, userColumns])

    // ---------- РЕНДЕР ----------
    return (
        <div className="table-container">
            <EditModal
                key={editModalOpen ? `edit-${selectedItem?.id ?? 'new'}` : 'edit-closed'}
                user={selectedItem}
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSave={handleEdit}
                columns={userColumns}
            />
            <DeleteModal item={selectedItem} isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} />
            <AddModal
                key={addModalOpen ? 'add-open' : 'add-closed'}
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSave={handleAdd}
                columns={userColumns}
            />

            <div className="table-toolbar">
                <div className="table-toolbar-left">
                    {enableFiltering && <input type="text" value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} placeholder="🔍 Поиск..." className="table-search-input" />}
                    {enablePagination && (
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="table-select">
                            {[5, 10, 20, 50, 100].map(size => <option key={size} value={size}>{size} записей</option>)}
                        </select>
                    )}
                    {enableFiltering && <span className="table-filter-info">Показано: <strong>{table.getRowModel().rows.length}</strong> из {data.filter(item => item.id > 0).length}</span>}
                    {enableCellSelection && (
                        <div className="table-batch-edit">
                            <input
                                type="text"
                                placeholder="Значение для выделенных"
                                className="table-batch-input"
                                id="batch-value-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyValueToSelectedCells(e.currentTarget.value)
                                        e.currentTarget.value = ''
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    const input = document.getElementById('batch-value-input')
                                    if (input) {
                                        applyValueToSelectedCells(input.value)
                                        input.value = ''
                                    }
                                }}
                                className="table-button"
                                disabled={selectedCells.size === 0}
                            >
                                Применить к выделенным
                            </button>
                        </div>
                    )}
                </div>
                <div className="table-toolbar-right">
                    {enableAddButton && <button onClick={() => setAddModalOpen(true)} className="table-button-add">➕ Добавить</button>}
                    {enableExport && (
                        <div className="table-export-dropdown">
                            <button className="table-button">📊 Экспорт ▼</button>
                            <div className="table-export-dropdown__menu">
                                <button onClick={() => exportToCSV(false)} className="table-export-dropdown__item">📄 CSV (все)</button>
                                <button onClick={() => exportToCSV(true)} className="table-export-dropdown__item">✅ CSV (выбранные)</button>
                                <div className="table-export-dropdown__divider" />
                                <button onClick={() => exportToExcel(false)} className="table-export-dropdown__item">📊 Excel (все)</button>
                                <button onClick={() => exportToExcel(true)} className="table-export-dropdown__item">✅ Excel (выбранные)</button>
                            </div>
                        </div>
                    )}
                    {enableFiltering && <button onClick={() => { setColumnFilters([]); setGlobalFilter('') }} className="table-button">✕ Сбросить</button>}
                </div>
            </div>

            {enableColumnVisibility && (
                <div className="table-column-visibility">
                    <span className="table-visibility-label">Колонки:</span>
                    {table.getAllLeafColumns().map(column => (
                        <label key={column.id} className="table-visibility-checkbox">
                            <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
                            {column.columnDef.header || column.id}
                        </label>
                    ))}
                </div>
            )}

            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    const sticky = header.column.columnDef.sticky
                                    const stickyStyle = sticky === 'left' ? { position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg-light)' } : {}
                                    return (
                                        <th key={header.id}
                                            className={`table-header ${sticky === 'left' ? 'sticky-left' : ''}`}
                                            style={{ width: header.getSize(), ...stickyStyle }}>
                                            <div className="table-header-content"
                                                onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() && (
                                                    <span className="table-header-sort-icon">
                                                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted()] ?? ' ↕'}
                                                    </span>
                                                )}
                                            </div>
                                            {enableFiltering && header.column.getCanFilter() && (
                                                <input type="text" value={header.column.getFilterValue() ?? ''}
                                                    onChange={e => header.column.setFilterValue(e.target.value)}
                                                    placeholder="Фильтр..." className="table-header-filter"
                                                    onClick={e => e.stopPropagation()} />
                                            )}
                                            {header.column.getCanResize() && (
                                                <div
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className={`resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`}
                                                />
                                            )}
                                        </th>
                                    )
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="table-empty">😕 Нет данных</td>
                            </tr>
                        ) : (
                            <>
                                {table.getRowModel().rows.map((row, rowIndex) => {
                                    const isLastRow = rowIndex === table.getRowModel().rows.length - 1
                                    return (
                                        <TableRow
                                            key={row.id}
                                            ref={infiniteScroll && isLastRow ? setLastRowRef : null}
                                            row={row}
                                            rowIndex={rowIndex}
                                            handleRowContextMenu={handleRowContextMenu}
                                            onCellClick={toggleCellSelection}
                                            isCellSelected={isCellSelected}
                                            enableCellSelection={enableCellSelection}
                                        />
                                    )
                                })}
                                {infiniteScroll && (
                                    <tr>
                                        <td colSpan={columns.length} className="table-infinite-loader">
                                            {isLoadingMore && <span className="table-loading-more">⏳ Загрузка...</span>}
                                            {!isLoadingMore && !hasMoreData && totalRows > 0 && (
                                                <span className="table-all-loaded">✅ Все данные загружены</span>
                                            )}
                                            {!isLoadingMore && hasMoreData && totalRows > 0 && (
                                                <span className="table-scroll-hint">⬇️ Прокрутите для загрузки</span>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                    <tfoot>
                        {table.getFooterGroups().map(footerGroup => (
                            <tr key={footerGroup.id}>
                                {footerGroup.headers.map(header => {
                                    const sticky = header.column.columnDef.sticky
                                    const stickyStyle = sticky === 'left' ? { position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg-light)' } : {}
                                    return (
                                        <th key={header.id} className="table-footer-cell"
                                            style={{ width: header.getSize(), ...stickyStyle }}>
                                            {header.column.columnDef.footer
                                                ? flexRender(header.column.columnDef.footer, header.getContext())
                                                : header.column.columnDef.aggregation
                                                    ? renderAggregation(header.column, table)
                                                    : null}
                                        </th>
                                    )
                                })}
                            </tr>
                        ))}
                    </tfoot>
                </table>
                {contextMenu.visible && (
                    <div
                        ref={contextMenuRef}
                        className="context-menu"
                        style={{
                            position: 'fixed',
                            left: contextMenu.x,
                            top: contextMenu.y,
                            zIndex: 1000,
                        }}
                    >
                        <button onClick={handleContextEdit} className="context-menu__item">✏️ Редактировать</button>
                        <button onClick={handleContextDuplicate} className="context-menu__item">📄 Дублировать (уйдет в конец таблицы)</button>
                        <button onClick={handleContextCopy} className="context-menu__item">📋 Копировать</button>
                        <div className="context-menu__divider" />
                        <button onClick={handleContextDelete} className="context-menu__item context-menu__item--danger">🗑️ Удалить</button>
                    </div>
                )}
            </div>

            <div className="table-footer">
                <div className="table-footer-info">
                    Всего: <strong>{totalRows}</strong> записей
                    {enableSelection && table.getSelectedRowModel().rows.length > 0 && (
                        <span className="table-footer-selected">, выбрано: <strong>{table.getSelectedRowModel().rows.length}</strong></span>
                    )}
                </div>
                {!infiniteScroll && enablePagination && (
                    <div className="table-pagination">
                        <button onClick={() => setPageIndex(0)} disabled={pageIndex === 0} className="table-page-button">⟪</button>
                        <button onClick={() => setPageIndex(p => Math.max(0, p - 1))} disabled={pageIndex === 0} className="table-page-button">⟨</button>
                        <span className="table-page-info">Страница {pageIndex + 1} из {table.getPageCount()}</span>
                        <button onClick={() => setPageIndex(p => Math.min(table.getPageCount() - 1, p + 1))} disabled={pageIndex >= table.getPageCount() - 1} className="table-page-button">⟩</button>
                        <button onClick={() => setPageIndex(table.getPageCount() - 1)} disabled={pageIndex >= table.getPageCount() - 1} className="table-page-button">⟫</button>
                    </div>
                )}
                {infiniteScroll && (
                    <div className="table-infinite-status">
                        {isLoadingMore && <span className="table-loading-more">⏳ Загрузка...</span>}
                        {!hasMoreData && totalRows > 0 && <span className="table-all-loaded">✅ Все данные загружены</span>}
                    </div>
                )}
            </div>
        </div>
    )
}
