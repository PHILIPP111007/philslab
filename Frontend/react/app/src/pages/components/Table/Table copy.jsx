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
import { useState, useMemo, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import './Table.css'

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
// INLINE EDITABLE CELL
// ============================================
// EditableCell с навигацией Enter вниз (как в Excel)
function EditableCell({
    getValue,
    row,
    column,
    table,
    onCellEdit,
    validate,
    onStartEdit,
    onEndEdit,
}) {
    const initialValue = getValue()
    const [value, setValue] = useState(initialValue)
    const [isEditing, setIsEditing] = useState(false)
    const [error, setError] = useState(null)
    const inputRef = useRef(null)
    const cellRef = useRef(null)
    const isSavingRef = useRef(false)

    const columnDef = column.columnDef
    const isEditable = columnDef.editable !== false

    // Условное форматирование (если задано)
    const conditionalStyle = useMemo(() => {
        if (typeof columnDef.conditionalFormatting === 'function') {
            const result = columnDef.conditionalFormatting(
                initialValue,
                row.original,
                column
            )
            if (result && typeof result === 'object') return result
        }
        return {}
    }, [columnDef, initialValue, row.original, column])

    useEffect(() => {
        if (!isEditing) setValue(initialValue)
    }, [initialValue, isEditing])

    useLayoutEffect(() => {
        if (isEditing && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current?.focus()
                inputRef.current?.select()
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [isEditing])

    const handleDoubleClick = (e) => {
        if (isEditable && !isEditing) {
            e.preventDefault()
            e.stopPropagation()
            onStartEdit?.(row.id, column.id)
            setIsEditing(true)
        }
    }

    const handleSave = useCallback(() => {
        if (isSavingRef.current) return
        isSavingRef.current = true

        setError(null)

        if (validate && value !== initialValue) {
            const result = validate(value, row.original)
            if (typeof result === 'string') {
                setError(result)
                inputRef.current?.focus()
                isSavingRef.current = false
                return
            }
        }

        if (value !== initialValue) {
            onCellEdit?.(row.original, column.id, value)
        }

        setIsEditing(false)
        onEndEdit?.()

        setTimeout(() => { isSavingRef.current = false }, 100)
    }, [value, initialValue, validate, row, column, onCellEdit, onEndEdit])

    // Переход к ячейке ниже в том же столбце
    const moveToCellBelow = useCallback(() => {
        const currentTd = cellRef.current?.closest('td')
        const currentTr = currentTd?.closest('tr')
        const tbody = currentTr?.closest('tbody')
        if (!tbody) return

        // Даём время на обновление DOM после изменения данных
        setTimeout(() => {
            const rows = Array.from(tbody.querySelectorAll('tr'))
            const currentRowIdx = rows.indexOf(currentTr)
            const nextRow = rows[currentRowIdx + 1]
            if (!nextRow) return

            const cells = Array.from(nextRow.querySelectorAll('td'))
            const currentCellIdx = Array.from(currentTr.querySelectorAll('td')).indexOf(currentTd)
            const nextCell = cells[currentCellIdx]
            if (!nextCell) return

            const editableDiv = nextCell.querySelector('.editable-cell--editable')
            if (editableDiv) {
                editableDiv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
            }
        }, 150) // задержка, чтобы React перерисовал таблицу
    }, [])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSave()
            moveToCellBelow()   // ← навигация вниз после сохранения
            return
        }
        if (e.key === 'Escape') {
            e.preventDefault()
            setValue(initialValue)
            setIsEditing(false)
            setError(null)
            onEndEdit?.()
            return
        }
        if (e.key === 'Tab') {
            e.preventDefault()
            handleSave()

            const currentCell = cellRef.current?.closest('td')
            const currentRow = currentCell?.closest('tr')
            const allCells = Array.from(currentRow?.querySelectorAll('td') || [])
            const currentIndex = allCells.indexOf(currentCell)
            const nextCell = allCells[currentIndex + (e.shiftKey ? -1 : 1)]

            if (nextCell) {
                const editableDiv = nextCell.querySelector('.editable-cell--editable')
                if (editableDiv) {
                    setTimeout(() => {
                        editableDiv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
                    }, 50)
                }
            }
        }
    }

    const handleBlur = () => {
        setTimeout(() => {
            if (isEditing && !isSavingRef.current) handleSave()
        }, 100)
    }

    if (isEditing) {
        return (
            <div ref={cellRef} className="editable-cell editable-cell--editing">
                <input
                    ref={inputRef}
                    type={columnDef.editType || 'text'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`editable-cell__input ${error ? 'editable-cell__input--error' : ''}`}
                    placeholder={columnDef.placeholder || ''}
                    step={columnDef.editType === 'number' ? 'any' : undefined}
                />
                {error && <span className="editable-cell__error">{error}</span>}
            </div>
        )
    }

    return (
        <div
            ref={cellRef}
            className={`editable-cell ${isEditable ? 'editable-cell--editable' : ''}`}
            onDoubleClick={handleDoubleClick}
            title={isEditable ? 'Двойной клик для редактирования' : ''}
            style={conditionalStyle}
        >
            <span className="editable-cell__value">{value ?? ''}</span>
            {isEditable && <span className="editable-cell__indicator">✎</span>}
        </div>
    )
}

// ============================================
// МОДАЛЬНЫЕ ОКНА (без изменений)
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
}) {
    // ============================================
    // УТИЛИТЫ ДЛЯ ПУСТОЙ СТРОКИ
    // ============================================
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

    // ============================================
    // СОСТОЯНИЕ (с гарантией пустой строки)
    // ============================================
    const [data, setData] = useState(() => {
        if (enableEmptyRow) {
            if (initialData.length === 0) {
                return [createEmptyRowData(-1)]
            }
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

    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [editingCellId, setEditingCellId] = useState(null)
    const [pageSize, setPageSize] = useState(initialPageSize);

    // ============================================
    // ОБРАБОТЧИКИ ДАННЫХ
    // ============================================

    // Простое обновление существующей строки (без колбэков)
    const updateData = useCallback((rowIndex, columnId, value) => {
        setData((old) =>
            old.map((row, index) => {
                if (index === rowIndex) {
                    return { ...row, [columnId]: value }
                }
                return row
            })
        )
    }, [])

    const handleEdit = useCallback((updatedItem) => {
        setData((old) => {
            const newData = old.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
            );
            const realData = newData.filter(item => item.id > 0);
            // Вызов onDataChange с мета-информацией
            onDataChange?.(realData, {
                id: updatedItem.id,
                operation: 'edit',
                data: updatedItem,
            });
            onEditSuccess?.(updatedItem);
            return newData;
        });
    }, [onDataChange, onEditSuccess]);


    const handleDelete = useCallback((item) => {
        if (item.id < 0) return; // пустую строку не удаляем
        setData((old) => {
            const newData = old.filter((i) => i.id !== item.id);
            const totalItems = newData.filter(i => i.id > 0).length;
            const maxPage = Math.max(0, Math.ceil(totalItems / pageSize) - 1);
            if (pageIndex > maxPage) setPageIndex(maxPage);
            const finalData = ensureEmptyRow(newData);
            const realData = finalData.filter(i => i.id > 0);
            onDataChange?.(realData, {
                id: item.id,
                operation: 'delete',
                data: item,
            });
            onDeleteSuccess?.(item);
            return finalData;
        });
    }, [pageSize, pageIndex, ensureEmptyRow, onDataChange, onDeleteSuccess]);


    const handleAdd = useCallback((newItem) => {
        setData((old) => {
            const dataWithoutEmpty = old.filter(item => item.id > 0);
            const maxId = dataWithoutEmpty.reduce((max, item) => Math.max(max, item.id || 0), 0);
            const itemWithId = { ...newItem, id: maxId + 1 };
            const newData = [...dataWithoutEmpty, itemWithId];
            const finalData = ensureEmptyRow(newData);
            const realData = finalData.filter(item => item.id > 0);
            const totalItems = realData.length;
            const lastPage = Math.max(0, Math.ceil(totalItems / pageSize) - 1);
            setPageIndex(lastPage);
            onDataChange?.(realData, {
                id: itemWithId.id,
                operation: 'add',
                data: itemWithId,
            });
            onAddSuccess?.(itemWithId);
            return finalData;
        });
    }, [pageSize, ensureEmptyRow, onDataChange, onAddSuccess]);


    // Главный обработчик клика/Enter в ячейке
    const handleCellEdit = useCallback((row, columnId, value) => {
        if (row.id < 0) {
            // создание новой записи из пустой строки
            setData((old) => {
                const dataWithoutEmpty = old.filter(item => item.id > 0);
                const maxId = dataWithoutEmpty.reduce((max, item) => Math.max(max, item.id || 0), 0);
                const newId = maxId + 1;
                const newRow = { ...row, [columnId]: value, id: newId };

                const filtered = old.filter((item) => item.id !== row.id);
                const updated = [...filtered, newRow];
                const finalData = enableEmptyRow ? ensureEmptyRow(updated) : updated;
                const realData = finalData.filter(item => item.id > 0);

                onCellEdit?.(newRow, columnId, value);
                onAddSuccess?.(newRow);
                onDataChange?.(realData, {
                    id: newId,
                    operation: 'add',
                    data: newRow,
                });

                return finalData;
            });
        } else {
            // обновление существующей записи
            const rowIndex = data.findIndex((item) => item.id === row.id);
            if (rowIndex !== -1) {
                // Обновляем состояние и передаём мета-данные
                setData((old) => {
                    const newData = old.map((item, index) =>
                        index === rowIndex ? { ...item, [columnId]: value } : item
                    );
                    const realData = newData.filter(item => item.id > 0);
                    onCellEdit?.(row, columnId, value);
                    onDataChange?.(realData, {
                        id: row.id,
                        operation: 'edit',
                        data: { ...row, [columnId]: value },
                        column: columnId,
                        value: value,
                    });
                    return newData;
                });
            }
        }
    }, [data, enableEmptyRow, ensureEmptyRow, onCellEdit, onAddSuccess, onDataChange]);


    // ============================================
    // КОЛОНКИ
    // ============================================
    const selectionColumn = useMemo(() => enableSelection ? [{
        id: 'select',
        header: ({ table }) => (
            <input
                type="checkbox"
                checked={table.getIsAllRowsSelected()}
                onChange={table.getToggleAllRowsSelectedHandler()}
            />
        ),
        cell: ({ row }) => {
            if (row.original.id < 0) return null // скрываем чекбокс у пустой строки
            return (
                <input
                    type="checkbox"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            )
        },
        size: 40,
        enableSorting: false,
        enableColumnFilter: false,
    }] : [], [enableSelection])

    const actionsColumn = useMemo(() => [{
        id: 'actions',
        header: 'Действия',
        cell: ({ row }) => {
            const isTempRow = row.original.id < 0
            if (isTempRow) {
                return (
                    <span style={{ fontSize: '11px', color: 'var(--text-dark)', opacity: 0.6 }}>
                        Новая запись
                    </span>
                )
            }
            return (
                <div className="table-action-buttons">
                    <button
                        onClick={() => {
                            setSelectedItem(row.original)
                            setEditModalOpen(true)
                        }}
                        className="table-action-edit"
                        title="Редактировать"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => {
                            setSelectedItem(row.original)
                            setDeleteModalOpen(true)
                        }}
                        className="table-action-delete"
                        title="Удалить"
                    >
                        🗑️
                    </button>
                </div>
            )
        },
        size: 90,
        enableSorting: false,
        enableColumnFilter: false,
    }], [])

    const columns = useMemo(() => {
        const processedColumns = userColumns.map((col) => {
            const processedCol = { ...col }

            if (enableInlineEdit && col.editable !== false) {
                processedCol.cell = (props) => (
                    <EditableCell
                        {...props}
                        onCellEdit={handleCellEdit}
                        validate={validateCell}
                        onStartEdit={(rowId, colId) => setEditingCellId(`${rowId}-${colId}`)}
                        onEndEdit={() => setEditingCellId(null)}
                    />
                )
            }

            if (!col.filterFn) {
                const sampleValue = data.find(item => item.id > 0)?.[col.accessorKey]
                processedCol.filterFn = typeof sampleValue === 'number' ? numberContainsFilter : textFilter
            }

            return processedCol
        })

        return [...selectionColumn, ...processedColumns, ...actionsColumn]
    }, [userColumns, data, enableInlineEdit, selectionColumn, actionsColumn, handleCellEdit, validateCell])

    // ============================================
    // TANSTACK TABLE
    // ============================================
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
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        filterFns: { text: textFilter, numberContains: numberContainsFilter },
        meta: { updateData },
        enableSorting,
        enableColumnFilters: enableFiltering,
        enableGrouping,
        enableExpanding: enableGrouping,
        autoResetPageIndex: false,
    })

    // ============================================
    // ЭКСПОРТ ДАННЫХ (игнорируем пустые строки)
    // ============================================
    const getExportData = useCallback((selectedOnly = false) => {
        const sourceData = selectedOnly
            ? table.getSelectedRowModel().rows.map(r => r.original)
            : data
        return sourceData.filter(item => item.id > 0)
    }, [data, table])

    const exportToExcel = useCallback(async (selectedOnly = false) => {
        const exportData = getExportData(selectedOnly)
        if (exportData.length === 0) {
            alert(selectedOnly ? 'Выберите строки для экспорта' : 'Нет данных для экспорта')
            return
        }
        // ... (без изменений) ...
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

    // ============================================
    // РЕНДЕР
    // ============================================
    return (
        <div className="table-container">
            <EditModal user={selectedItem} isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleEdit} columns={userColumns} />
            <DeleteModal item={selectedItem} isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} />
            <AddModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSave={handleAdd} columns={userColumns} />

            <div className="table-toolbar">
                <div className="table-toolbar-left">
                    {enableFiltering && (
                        <input
                            type="text"
                            value={globalFilter}
                            onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="🔍 Поиск..."
                            className="table-search-input"
                        />
                    )}
                    {enablePagination && (
                        <select
                            value={pageSize}
                            onChange={e => setPageSize(Number(e.target.value))}
                            className="table-select"
                        >
                            {[5, 10, 20, 50, 100].map(size => (
                                <option key={size} value={size}>{size} записей</option>
                            ))}
                        </select>
                    )}
                    {enableFiltering && (
                        <span className="table-filter-info">
                            Показано: <strong>{table.getRowModel().rows.length}</strong> из {data.filter(item => item.id > 0).length}
                        </span>
                    )}
                </div>

                <div className="table-toolbar-right">
                    {enableAddButton && (
                        <button onClick={() => setAddModalOpen(true)} className="table-button-add">
                            ➕ Добавить
                        </button>
                    )}
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
                    {enableFiltering && (
                        <button onClick={() => { setColumnFilters([]); setGlobalFilter(''); }} className="table-button">
                            ✕ Сбросить
                        </button>
                    )}
                </div>
            </div>

            {enableColumnVisibility && (
                <div className="table-column-visibility">
                    <span className="table-visibility-label">Колонки:</span>
                    {table.getAllLeafColumns().map(column => (
                        <label key={column.id} className="table-visibility-checkbox">
                            <input
                                type="checkbox"
                                checked={column.getIsVisible()}
                                onChange={column.getToggleVisibilityHandler()}
                            />
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
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="table-header" style={{ width: header.getSize() }}>
                                        <div
                                            className="table-header-content"
                                            onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getCanSort() && (
                                                <span className="table-header-sort-icon">
                                                    {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted()] ?? ' ↕'}
                                                </span>
                                            )}
                                        </div>
                                        {enableFiltering && header.column.getCanFilter() && (
                                            <input
                                                type="text"
                                                value={header.column.getFilterValue() ?? ''}
                                                onChange={e => header.column.setFilterValue(e.target.value)}
                                                placeholder="Фильтр..."
                                                className="table-header-filter"
                                                onClick={e => e.stopPropagation()}
                                            />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="table-empty">
                                    😕 Нет данных
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className={`${row.getIsSelected() ? 'table-row-selected' : 'table-row'} ${row.original.id < 0 ? 'table-row--empty' : ''}`}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="table-cell" style={{ width: cell.column.getSize() }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                <div className="table-footer-info">
                    Всего: <strong>{data.filter(item => item.id > 0).length}</strong> записей
                    {enableSelection && table.getSelectedRowModel().rows.length > 0 && (
                        <span className="table-footer-selected">
                            , выбрано: <strong>{table.getSelectedRowModel().rows.length}</strong>
                        </span>
                    )}
                </div>
                {enablePagination && (
                    <div className="table-pagination">
                        <button onClick={() => setPageIndex(0)} disabled={pageIndex === 0} className="table-page-button">⟪</button>
                        <button onClick={() => setPageIndex(p => Math.max(0, p - 1))} disabled={pageIndex === 0} className="table-page-button">⟨</button>
                        <span className="table-page-info">
                            Страница {pageIndex + 1} из {table.getPageCount()}
                        </span>
                        <button onClick={() => setPageIndex(p => Math.min(table.getPageCount() - 1, p + 1))} disabled={pageIndex >= table.getPageCount() - 1} className="table-page-button">⟩</button>
                        <button onClick={() => setPageIndex(table.getPageCount() - 1)} disabled={pageIndex >= table.getPageCount() - 1} className="table-page-button">⟫</button>
                    </div>
                )}
            </div>
        </div>
    )
}