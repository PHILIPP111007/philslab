import { useCallback, useLayoutEffect, useMemo, useRef, useState, forwardRef, memo } from 'react'
import { flexRender } from '@tanstack/react-table'

const getOptionValue = (option) => (
    typeof option === 'object' ? option.value : option
)

const getOptionLabel = (option) => (
    typeof option === 'object' ? option.label : option
)

export const EditableCell = memo(function EditableCell({ getValue, row, column, table, onCellEdit, validate }) {
    const initialValue = getValue()
    const [value, setValue] = useState(initialValue)
    const [isEditing, setIsEditing] = useState(false)
    const [error, setError] = useState(null)
    const inputRef = useRef(null)
    const cellRef = useRef(null)
    const isSavingRef = useRef(false)

    const columnDef = column.columnDef
    const isEditable = columnDef.editable !== false
    const { applyValueToSelectedCells } = table.options.meta || {}

    const conditionalStyle = useMemo(() => {
        if (typeof columnDef.conditionalFormatting === 'function') {
            const result = columnDef.conditionalFormatting(initialValue, row.original, column)
            if (result && typeof result === 'object') return result
        }
        return {}
    }, [columnDef, initialValue, row.original, column])

    useLayoutEffect(() => {
        if (isEditing && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current?.focus()
                inputRef.current?.select()
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [isEditing])

    const handleDoubleClick = (event) => {
        if (isEditable && !isEditing) {
            event.preventDefault()
            event.stopPropagation()
            setValue(initialValue)
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

        if (value !== initialValue) onCellEdit?.(row.original, column.id, value)
        setIsEditing(false)
        setTimeout(() => { isSavingRef.current = false }, 100)
    }, [value, initialValue, validate, row, column, onCellEdit])

    const moveToCellBelow = useCallback(() => {
        const currentTd = cellRef.current?.closest('td')
        const currentTr = currentTd?.closest('tr')
        const tbody = currentTr?.closest('tbody')
        if (!tbody) return

        setTimeout(() => {
            const rows = Array.from(tbody.querySelectorAll('tr'))
            const currentRowIdx = rows.indexOf(currentTr)
            const nextRow = rows[currentRowIdx + 1]

            if (!nextRow) {
                if (table.getCanNextPage?.()) table.nextPage()
                return
            }

            const cells = Array.from(nextRow.querySelectorAll('td'))
            const currentCellIdx = Array.from(currentTr.querySelectorAll('td')).indexOf(currentTd)
            const nextCell = cells[currentCellIdx]
            const editableDiv = nextCell?.querySelector('.editable-cell--editable')
            if (editableDiv) editableDiv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
        }, 150)
    }, [table])

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            if (applyValueToSelectedCells) {
                applyValueToSelectedCells(value)
                setIsEditing(false)
            }
            return
        }

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            handleSave()
            moveToCellBelow()
            return
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            setValue(initialValue)
            setIsEditing(false)
            setError(null)
            return
        }

        if (event.key === 'Tab') {
            event.preventDefault()
            handleSave()
            const currentCell = cellRef.current?.closest('td')
            if (!currentCell) return
            const currentRow = currentCell.closest('tr')
            const allCells = Array.from(currentRow.querySelectorAll('td'))
            const currentIndex = allCells.indexOf(currentCell)
            const nextCell = allCells[currentIndex + (event.shiftKey ? -1 : 1)]
            const editableDiv = nextCell?.querySelector('.editable-cell--editable')
            if (editableDiv) {
                setTimeout(() => editableDiv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })), 50)
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
                {columnDef.editType === 'select' ? (
                    <select
                        ref={inputRef}
                        value={value ?? ''}
                        onChange={(event) => setValue(event.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className={`editable-cell__input ${error ? 'editable-cell__input--error' : ''}`}
                    >
                        <option value="">Выберите...</option>
                        {columnDef.options?.map((option) => {
                            const optionValue = getOptionValue(option)
                            return (
                                <option key={optionValue} value={optionValue}>
                                    {getOptionLabel(option)}
                                </option>
                            )
                        })}
                    </select>
                ) : (
                    <input
                        ref={inputRef}
                        type={columnDef.editType || 'text'}
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className={`editable-cell__input ${error ? 'editable-cell__input--error' : ''}`}
                        placeholder={columnDef.placeholder || ''}
                        step={columnDef.editType === 'number' ? 'any' : undefined}
                    />
                )}
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
            <span className="editable-cell__value">{initialValue ?? ''}</span>
            {isEditable && <span className="editable-cell__indicator">✎</span>}
        </div>
    )
}, (prevProps, nextProps) => (
    prevProps.row.original === nextProps.row.original &&
    prevProps.column.id === nextProps.column.id &&
    prevProps.getValue() === nextProps.getValue()
))

export const TableRow = forwardRef(function TableRow(
    { row, rowIndex, handleRowContextMenu, onCellClick, isCellSelected, enableCellSelection },
    ref,
) {
    const isTempRow = row.original.id < 0

    return (
        <tr
            ref={ref}
            className={`${row.getIsSelected() ? 'table-row-selected' : 'table-row'} ${isTempRow ? 'table-row--empty' : ''}`}
            onContextMenu={(event) => handleRowContextMenu(event, row.original)}
        >
            {row.getVisibleCells().map((cell, colIndex) => {
                const sticky = cell.column.columnDef.sticky
                const stickyStyle = sticky === 'left'
                    ? {
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        background: row.getIsSelected() ? 'var(--bg-selected)' : 'var(--bg)',
                    }
                    : {}
                const isSelected = enableCellSelection && isCellSelected(rowIndex, colIndex)

                return (
                    <td
                        key={cell.id}
                        className={`table-cell ${sticky === 'left' ? 'sticky-left' : ''} ${isSelected ? 'cell-selected' : ''}`}
                        style={{ width: cell.column.getSize(), ...stickyStyle }}
                        data-row-index={rowIndex}
                        data-col-index={colIndex}
                        onClick={(event) => {
                            if (!enableCellSelection) return
                            if (event.target.closest('input, select, textarea')) return
                            onCellClick(rowIndex, colIndex, event)
                        }}
                    >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                )
            })}
        </tr>
    )
})
