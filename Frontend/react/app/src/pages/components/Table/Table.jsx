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
import { useState, useMemo, useEffect, useRef, useLayoutEffect, useCallback, memo } from 'react'


// Вспомогательная функция для отображения агрегаций в футере
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
// ФИЛЬТРЫ (без изменений)
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
// INLINE EDITABLE CELL (без изменений)
// ============================================

const EditableCell = memo(function EditableCell({ getValue, row, column, table, onCellEdit, validate, onStartEdit, onEndEdit }) {
    const initialValue = getValue()
    const [value, setValue] = useState(initialValue)
    const [isEditing, setIsEditing] = useState(false)
    const [error, setError] = useState(null)
    const inputRef = useRef(null)
    const cellRef = useRef(null)
    const isSavingRef = useRef(false)

    const columnDef = column.columnDef
    const isEditable = columnDef.editable !== false

    const conditionalStyle = useMemo(() => {
        if (typeof columnDef.conditionalFormatting === 'function') {
            const result = columnDef.conditionalFormatting(initialValue, row.original, column)
            if (result && typeof result === 'object') return result
        }
        return {}
    }, [columnDef, initialValue, row.original, column])

    useEffect(() => { if (!isEditing) setValue(initialValue) }, [initialValue, isEditing])

    useLayoutEffect(() => {
        if (isEditing && inputRef.current) {
            const timer = setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
            return () => clearTimeout(timer)
        }
    }, [isEditing])

    const handleDoubleClick = (e) => {
        if (isEditable && !isEditing) {
            e.preventDefault(); e.stopPropagation()
            onStartEdit?.(row.id, column.id); setIsEditing(true)
        }
    }

    const handleSave = useCallback(() => {
        if (isSavingRef.current) return; isSavingRef.current = true; setError(null)
        if (validate && value !== initialValue) {
            const result = validate(value, row.original)
            if (typeof result === 'string') { setError(result); inputRef.current?.focus(); isSavingRef.current = false; return }
        }
        if (value !== initialValue) onCellEdit?.(row.original, column.id, value)
        setIsEditing(false); onEndEdit?.()
        setTimeout(() => { isSavingRef.current = false }, 100)
    }, [value, initialValue, validate, row, column, onCellEdit, onEndEdit])

    const { updateData, requestCellFocusAfterPageChange } = table.options.meta

    const moveToCellBelow = useCallback(() => {
        const currentTd = cellRef.current?.closest('td')
        const currentTr = currentTd?.closest('tr')
        const tbody = currentTr?.closest('tbody')
        if (!tbody) return

        setTimeout(() => {
            const rows = Array.from(tbody.querySelectorAll('tr'))
            const currentRowIdx = rows.indexOf(currentTr)
            let nextRow = rows[currentRowIdx + 1]

            if (!nextRow) {
                // Если следующей строки нет, пытаемся перейти на следующую страницу
                if (table.getCanNextPage?.()) {
                    const currentCellIdx = Array.from(currentTr.querySelectorAll('td')).indexOf(currentTd)
                    requestCellFocusAfterPageChange?.(currentCellIdx)
                    table.nextPage()
                }
                return
            }

            const cells = Array.from(nextRow.querySelectorAll('td'))
            const currentCellIdx = Array.from(currentTr.querySelectorAll('td')).indexOf(currentTd)
            const nextCell = cells[currentCellIdx]
            if (!nextCell) return

            const editableDiv = nextCell.querySelector('.editable-cell--editable')
            if (editableDiv) {
                editableDiv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
            }
        }, 150)
    }, [table, requestCellFocusAfterPageChange])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); moveToCellBelow(); return }
        if (e.key === 'Escape') { e.preventDefault(); setValue(initialValue); setIsEditing(false); setError(null); onEndEdit?.(); return }
        if (e.key === 'Tab') {
            e.preventDefault(); handleSave()
            const currentCell = cellRef.current?.closest('td'); if (!currentCell) return
            const currentRow = currentCell.closest('tr'); const allCells = Array.from(currentRow.querySelectorAll('td') || [])
            const currentIndex = allCells.indexOf(currentCell); const nextCell = allCells[currentIndex + (e.shiftKey ? -1 : 1)]
            if (nextCell) {
                const editableDiv = nextCell.querySelector('.editable-cell--editable')
                if (editableDiv) setTimeout(() => editableDiv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })), 50)
            }
        }
    }

    const handleBlur = () => { setTimeout(() => { if (isEditing && !isSavingRef.current) handleSave() }, 100) }

    if (isEditing) {
        return (
            <div ref={cellRef} className="editable-cell editable-cell--editing">
                <input ref={inputRef} type={columnDef.editType || 'text'} value={value}
                    onChange={(e) => setValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown}
                    className={`editable-cell__input ${error ? 'editable-cell__input--error' : ''}`}
                    placeholder={columnDef.placeholder || ''} step={columnDef.editType === 'number' ? 'any' : undefined} />
                {error && <span className="editable-cell__error">{error}</span>}
            </div>
        )
    }

    return (
        <div ref={cellRef} className={`editable-cell ${isEditable ? 'editable-cell--editable' : ''}`}
            onDoubleClick={handleDoubleClick} title={isEditable ? 'Двойной клик для редактирования' : ''} style={conditionalStyle}>
            <span className="editable-cell__value">{value ?? ''}</span>
            {isEditable && <span className="editable-cell__indicator">✎</span>}
        </div>
    )
}, (prevProps, nextProps) => {
    return (
        prevProps.row.original === nextProps.row.original &&
        prevProps.column.id === nextProps.column.id &&
        prevProps.getValue() === nextProps.getValue()
    )
})


// ============================================
// МОДАЛЬНЫЕ ОКНА
// ============================================
function EditModal({ user, isOpen, onClose, onSave, columns }) {
    const [formData, setFormData] = useState({})
    const formRef = useRef(null)

    useEffect(() => {
        if (isOpen && user) {
            setFormData({ ...user })
        }
    }, [isOpen, user])

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                formRef.current?.querySelector('input')?.focus()
            }, 100)
        }
    }, [isOpen])

    if (!isOpen) return null

    const editableColumns = columns.filter(
        (col) => col.id !== 'select' && col.id !== 'actions' && col.enableEditing !== false
    )

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
        onClose()
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
    }

    return (
        <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
            <div className="modal" onClick={(e) => e.stopPropagation()} ref={formRef}>
                <h2 className="modal-title">Редактирование записи</h2>
                <form onSubmit={handleSubmit}>
                    {editableColumns.map((col) => {
                        const accessor = col.accessorKey || col.id
                        const label = col.header || accessor
                        const value = formData[accessor] ?? ''

                        return (
                            <div key={accessor} className="modal-form-group">
                                <label>{label}</label>
                                {col.editType === 'select' ? (
                                    <select
                                        name={accessor}
                                        value={value}
                                        onChange={handleChange}
                                        className="modal-input"
                                        required={col.required !== false}
                                    >
                                        <option value="">Выберите...</option>
                                        {col.options?.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                ) : col.editType === 'checkbox' ? (
                                    <input
                                        type="checkbox"
                                        name={accessor}
                                        checked={!!value}
                                        onChange={handleChange}
                                        className="modal-checkbox"
                                    />
                                ) : (
                                    <input
                                        type={col.editType || 'text'}
                                        name={accessor}
                                        value={value}
                                        onChange={handleChange}
                                        className="modal-input"
                                        required={col.required !== false}
                                        step={col.editType === 'number' ? 'any' : undefined}
                                    />
                                )}
                            </div>
                        )
                    })}
                    <div className="modal-button-group">
                        <button type="button" onClick={onClose} className="modal-button-cancel">
                            Отмена
                        </button>
                        <button type="submit" className="modal-button-save">
                            💾 Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function DeleteModal({ item, isOpen, onClose, onConfirm }) {
    if (!isOpen) return null

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'Enter') {
            onConfirm(item)
            onClose()
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
            <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Подтверждение удаления</h2>
                <p className="modal-text">
                    Вы уверены, что хотите удалить запись <strong>#{item?.id}</strong>?
                </p>
                <div className="modal-button-group modal-button-group-center">
                    <button type="button" onClick={onClose} className="modal-button-cancel">
                        Отмена
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm(item)
                            onClose()
                        }}
                        className="modal-button-delete"
                        autoFocus
                    >
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        </div>
    )
}

function AddModal({ isOpen, onClose, onSave, columns }) {
    const [formData, setFormData] = useState({})
    const formRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            const initialData = {}
            columns.forEach((col) => {
                if (col.accessorKey && col.enableEditing !== false) {
                    initialData[col.accessorKey] = col.defaultValue ?? ''
                }
            })
            setFormData(initialData)

            setTimeout(() => {
                formRef.current?.querySelector('input')?.focus()
            }, 100)
        }
    }, [columns, isOpen])

    if (!isOpen) return null

    const editableColumns = columns.filter(
        (col) => col.id !== 'select' && col.id !== 'actions' && col.enableEditing !== false
    )

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
        onClose()
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
    }

    return (
        <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
            <div className="modal" onClick={(e) => e.stopPropagation()} ref={formRef}>
                <h2 className="modal-title">Добавление новой записи</h2>
                <form onSubmit={handleSubmit}>
                    {editableColumns.map((col) => {
                        const accessor = col.accessorKey || col.id
                        const label = col.header || accessor
                        const value = formData[accessor] ?? ''

                        return (
                            <div key={accessor} className="modal-form-group">
                                <label>{label}</label>
                                {col.editType === 'select' ? (
                                    <select
                                        name={accessor}
                                        value={value}
                                        onChange={handleChange}
                                        className="modal-input"
                                        required={col.required !== false}
                                    >
                                        <option value="">Выберите...</option>
                                        {col.options?.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                ) : col.editType === 'checkbox' ? (
                                    <input
                                        type="checkbox"
                                        name={accessor}
                                        checked={!!value}
                                        onChange={handleChange}
                                        className="modal-checkbox"
                                    />
                                ) : (
                                    <input
                                        type={col.editType || 'text'}
                                        name={accessor}
                                        value={value}
                                        onChange={handleChange}
                                        className="modal-input"
                                        required={col.required !== false}
                                        step={col.editType === 'number' ? 'any' : undefined}
                                    />
                                )}
                            </div>
                        )
                    })}
                    <div className="modal-button-group">
                        <button type="button" onClick={onClose} className="modal-button-cancel">
                            Отмена
                        </button>
                        <button type="submit" className="modal-button-save">
                            ➕ Добавить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}


const TableRow = memo(function TableRow({ row, handleRowContextMenu }) {
    const isTempRow = row.original.id < 0
    return (
        <tr
            className={`${row.getIsSelected() ? 'table-row-selected' : 'table-row'} ${isTempRow ? 'table-row--empty' : ''}`}
            onContextMenu={(e) => handleRowContextMenu(e, row.original)}
        >
            {row.getVisibleCells().map(cell => {
                const sticky = cell.column.columnDef.sticky
                const stickyStyle = sticky === 'left'
                    ? { position: 'sticky', left: 0, zIndex: 1, background: row.getIsSelected() ? 'var(--bg-selected)' : 'var(--bg)' }
                    : {}
                return (
                    <td key={cell.id} className={`table-cell ${sticky === 'left' ? 'sticky-left' : ''}`}
                        style={{ width: cell.column.getSize(), ...stickyStyle }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                )
            })}
        </tr>
    )
}, (prev, next) => {
    return (
        prev.row.id === next.row.id &&
        prev.row.original === next.row.original &&
        prev.row.getIsSelected() === next.row.getIsSelected() &&
        prev.handleRowContextMenu === next.handleRowContextMenu
    )
})



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
    enableImport = true,
    enableInlineEdit = true,
    enableEmptyRow = true,
    onDataChange,
    onEditSuccess,
    onDeleteSuccess,
    onAddSuccess,
    onCellEdit,
    validateCell,
    lazy = false,
    onLazyLoad,
    totalRows = 0,
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
        if (enableEmptyRow) {
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

    // Добавлено: состояние для изменения ширины колонок
    const [columnSizing, setColumnSizing] = useState({})

    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [editingCellId, setEditingCellId] = useState(null)
    const [focusRequest, setFocusRequest] = useState(null)

    const requestCellFocusAfterPageChange = useCallback((columnIndex) => {
        setFocusRequest({ columnIndex })
    }, [])

    useEffect(() => {
        if (lazy) {
            setData(enableEmptyRow ? ensureEmptyRow(initialData) : initialData);
        }
    }, [initialData, lazy, enableEmptyRow, ensureEmptyRow]);



    // Состояние контекстного меню
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        row: null,
    })
    const contextMenuRef = useRef(null)

    // Эффект, который срабатывает при изменении pageIndex и пытается сфокусировать нужную ячейку
    useEffect(() => {
        if (!focusRequest) return
        const timer = setTimeout(() => {
            const tbody = document.querySelector('.table-wrapper tbody')
            if (!tbody) return
            const rows = Array.from(tbody.querySelectorAll('tr'))
            // Берём первую строку (можно уточнить: не пустую)
            const firstRow = rows[0]
            if (!firstRow) return
            const cells = Array.from(firstRow.querySelectorAll('td'))
            const targetCell = cells[focusRequest.columnIndex]
            if (targetCell) {
                const editableDiv = targetCell.querySelector('.editable-cell--editable')
                if (editableDiv) {
                    editableDiv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
                }
            }
            setFocusRequest(null)
        }, 100) // задержка для завершения перерисовки
        return () => clearTimeout(timer)
    }, [focusRequest, pageIndex])


    // Закрытие меню при клике вне или по Escape
    useEffect(() => {
        if (!contextMenu.visible) return

        const handleClickOutside = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setContextMenu(prev => ({ ...prev, visible: false }))
            }
        }
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setContextMenu(prev => ({ ...prev, visible: false }))
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [contextMenu.visible])

    // Эффект для уведомления родителя в lazy-режиме
    useEffect(() => {
        if (!lazy) return;
        onLazyLoad?.({
            pageIndex,
            pageSize,
            sorting,
            globalFilter,
            columnFilters,
        });
    }, [lazy, pageIndex, pageSize, sorting, globalFilter, columnFilters, onLazyLoad])

    // ---------- обработчики данных (без изменений) ----------
    const updateData = useCallback((rowIndex, columnId, value) => {
        setData((old) => old.map((row, index) => index === rowIndex ? { ...row, [columnId]: value } : row))
    }, [])

    const handleEdit = useCallback((updatedItem) => {
        setData((old) => {
            const newData = old.map((item) => item.id === updatedItem.id ? updatedItem : item)
            onDataChange?.(newData.filter(i => i.id > 0), { id: updatedItem.id, operation: 'edit', data: updatedItem })
            onEditSuccess?.(updatedItem)
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
            const finalData = ensureEmptyRow(newData)
            onDataChange?.(finalData.filter(i => i.id > 0), { id: item.id, operation: 'delete', data: item })
            onDeleteSuccess?.(item)
            return finalData
        })
    }, [pageSize, pageIndex, ensureEmptyRow, onDataChange, onDeleteSuccess])

    const handleAdd = useCallback((newItem) => {
        setData((old) => {
            const dataWithoutEmpty = old.filter(item => item.id > 0)
            const maxId = dataWithoutEmpty.reduce((max, item) => Math.max(max, item.id || 0), 0)
            const itemWithId = { ...newItem, id: maxId + 1 }
            const finalData = ensureEmptyRow([...dataWithoutEmpty, itemWithId])
            onDataChange?.(finalData.filter(i => i.id > 0), { id: itemWithId.id, operation: 'add', data: itemWithId })
            onAddSuccess?.(itemWithId)
            const totalItems = finalData.filter(i => i.id > 0).length
            const lastPage = Math.max(0, Math.ceil(totalItems / pageSize) - 1)
            setPageIndex(lastPage)
            return finalData
        })
    }, [pageSize, ensureEmptyRow, onDataChange, onAddSuccess])

    const handleCellEdit = useCallback((row, columnId, value) => {
        if (row.id < 0) {
            setData((old) => {
                const dataWithoutEmpty = old.filter(item => item.id > 0)
                const maxId = dataWithoutEmpty.reduce((max, item) => Math.max(max, item.id || 0), 0)
                const newRow = { ...row, [columnId]: value, id: maxId + 1 }
                const filtered = old.filter(item => item.id !== row.id)
                const finalData = enableEmptyRow ? ensureEmptyRow([...filtered, newRow]) : [...filtered, newRow]
                onCellEdit?.(newRow, columnId, value)
                onAddSuccess?.(newRow)
                onDataChange?.(finalData.filter(i => i.id > 0), { id: newRow.id, operation: 'add', data: newRow })
                return finalData
            })
        } else {
            const rowIndex = data.findIndex(item => item.id === row.id)
            if (rowIndex !== -1) {
                setData((old) => {
                    const newData = old.map((item, index) => index === rowIndex ? { ...item, [columnId]: value } : item)
                    onCellEdit?.(row, columnId, value)
                    onDataChange?.(newData.filter(i => i.id > 0), { id: row.id, operation: 'edit', data: { ...row, [columnId]: value }, column: columnId, value })
                    return newData
                })
            }
        }
    }, [data, enableEmptyRow, ensureEmptyRow, onCellEdit, onAddSuccess, onDataChange])

    // --- Контекстное меню ---
    const handleRowContextMenu = useCallback((e, rowData) => {
        e.preventDefault()
        // Для пустой строки не показываем меню
        if (rowData.id < 0) return

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            row: rowData,
        })
    }, [])

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
        // Собираем текст из всех полей строки, кроме id (если нужно)
        const text = Object.entries(row)
            .filter(([key]) => key !== 'id')
            .map(([key, val]) => `${key}: ${val}`)
            .join('\n')
        navigator.clipboard.writeText(text).then(() => {
            alert('Данные строки скопированы в буфер обмена')
        })
        setContextMenu(prev => ({ ...prev, visible: false }))
    }, [contextMenu.row])

    const handleContextDuplicate = useCallback(() => {
        const row = { ...contextMenu.row }
        delete row.id // будет присвоен новый ID в handleAdd
        handleAdd(row) // используем существующую функцию добавления
        setContextMenu(prev => ({ ...prev, visible: false }))
    }, [contextMenu.row, handleAdd])

    // ---------- колонки ----------
    const selectionColumn = useMemo(() => enableSelection ? [{
        id: 'select',
        header: ({ table }) => <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
        cell: ({ row }) => row.original.id < 0 ? null : <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
        size: 40,
        enableSorting: false,
        enableColumnFilter: false,
    }] : [], [enableSelection])

    const actionsColumn = useMemo(() => [{
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
    }], [])

    const columns = useMemo(() => {
        const processedColumns = userColumns.map(col => {
            const processedCol = { ...col }

            if (enableInlineEdit && col.editable !== false) {
                processedCol.cell = (props) => (
                    <EditableCell {...props} onCellEdit={handleCellEdit} validate={validateCell}
                        onStartEdit={(rowId, colId) => setEditingCellId(`${rowId}-${colId}`)}
                        onEndEdit={() => setEditingCellId(null)} />
                )
            }

            // Фильтр по умолчанию textFilter, если не указан другой
            if (!processedCol.filterFn) {
                // Можно оставить определение числового фильтра через мета-информацию колонки,
                // но без привязки к данным. Например:
                processedCol.filterFn = processedCol.editType === 'number' ? numberContainsFilter : textFilter
            }

            return processedCol
        })

        return [...selectionColumn, ...processedColumns, ...actionsColumn]
    }, [userColumns, enableInlineEdit, selectionColumn, actionsColumn, handleCellEdit, validateCell]) // data удалена


    // ---------- таблица ----------
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
            columnSizing,   // <-- для resize
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
                : updater;
            setPageIndex(newState.pageIndex);
            if (newState.pageSize !== pageSize) setPageSize(newState.pageSize);
        },
        onColumnSizingChange: setColumnSizing,   // <-- для resize
        manualPagination: lazy,
        manualSorting: lazy,
        manualFiltering: lazy,
        pageCount: lazy ? Math.ceil(totalRows / pageSize) : undefined,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        getCoreRowModel: getCoreRowModel(),
        // Клиентские модели только когда не lazy
        ...(lazy
            ? {}
            : {
                getSortedRowModel: getSortedRowModel(),
                getFilteredRowModel: getFilteredRowModel(),
                getPaginationRowModel: getPaginationRowModel(),
            }
        ),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        filterFns: { text: textFilter, numberContains: numberContainsFilter },
        meta: { updateData, requestCellFocusAfterPageChange },
        enableSorting,
        enableColumnFilters: enableFiltering,
        enableGrouping,
        enableExpanding: enableGrouping,
        autoResetPageIndex: false,
    })

    // ---------- экспорт ----------
    const getExportData = useCallback((selectedOnly = false) => {
        const sourceData = selectedOnly ? table.getSelectedRowModel().rows.map(r => r.original) : data
        return sourceData.filter(item => item.id > 0)
    }, [data, table])

    const exportToExcel = useCallback(async (selectedOnly = false) => {
        const exportData = getExportData(selectedOnly)
        if (exportData.length === 0) {
            alert(selectedOnly ? 'Выберите строки для экспорта' : 'Нет данных для экспорта')
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
            alert('Ошибка экспорта в Excel')
        }
    }, [getExportData, userColumns])

    const exportToCSV = useCallback((selectedOnly = false) => {
        const exportData = getExportData(selectedOnly)
        if (exportData.length === 0) {
            alert(selectedOnly ? 'Выберите строки для экспорта' : 'Нет данных для экспорта')
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


    // ---------- рендер ----------
    return (
        <div className="table-container">
            <EditModal user={selectedItem} isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleEdit} columns={userColumns} />
            <DeleteModal item={selectedItem} isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} />
            <AddModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSave={handleAdd} columns={userColumns} />

            <div className="table-toolbar">
                <div className="table-toolbar-left">
                    {enableFiltering && <input type="text" value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} placeholder="🔍 Поиск..." className="table-search-input" />}
                    {enablePagination && (
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="table-select">
                            {[5, 10, 20, 50, 100].map(size => <option key={size} value={size}>{size} записей</option>)}
                        </select>
                    )}
                    {enableFiltering && <span className="table-filter-info">Показано: <strong>{table.getRowModel().rows.length}</strong> из {data.filter(item => item.id > 0).length}</span>}
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
                            <tr><td colSpan={columns.length} className="table-empty">😕 Нет данных</td></tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} row={row} handleRowContextMenu={handleRowContextMenu} />
                            ))
                        )}
                    </tbody>
                    {/* Футер с агрегациями */}
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
                {/* Контекстное меню */}
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
                        <button onClick={handleContextEdit} className="context-menu__item">
                            ✏️ Редактировать
                        </button>
                        <button onClick={handleContextDuplicate} className="context-menu__item">
                            📄 Дублировать (уйдет в конец таблицы)
                        </button>
                        <button onClick={handleContextCopy} className="context-menu__item">
                            📋 Копировать
                        </button>
                        <div className="context-menu__divider" />
                        <button onClick={handleContextDelete} className="context-menu__item context-menu__item--danger">
                            🗑️ Удалить
                        </button>
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
                {enablePagination && (
                    <div className="table-pagination">
                        <button onClick={() => setPageIndex(0)} disabled={pageIndex === 0} className="table-page-button">⟪</button>
                        <button onClick={() => setPageIndex(p => Math.max(0, p - 1))} disabled={pageIndex === 0} className="table-page-button">⟨</button>
                        <span className="table-page-info">Страница {pageIndex + 1} из {table.getPageCount()}</span>
                        <button onClick={() => setPageIndex(p => Math.min(table.getPageCount() - 1, p + 1))} disabled={pageIndex >= table.getPageCount() - 1} className="table-page-button">⟩</button>
                        <button onClick={() => setPageIndex(table.getPageCount() - 1)} disabled={pageIndex >= table.getPageCount() - 1} className="table-page-button">⟫</button>
                    </div>
                )}
            </div>
        </div>
    )
}