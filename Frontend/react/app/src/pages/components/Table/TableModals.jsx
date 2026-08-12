import { useEffect, useRef, useState } from 'react'

const getOptionValue = (option) => (
    typeof option === 'object' ? option.value : option
)

const getOptionLabel = (option) => (
    typeof option === 'object' ? option.label : option
)

const isEditableColumn = (column) => (
    Boolean(column.accessorKey) &&
    column.id !== 'select' &&
    column.id !== 'actions' &&
    column.enableEditing !== false &&
    column.editable !== false
)

const getEditableColumns = (columns) => columns.filter(isEditableColumn)

const getInitialFormData = (columns) => Object.fromEntries(
    getEditableColumns(columns).map((column) => [
        column.accessorKey,
        column.defaultValue ?? '',
    ])
)

function ModalFields({ columns, formData, onChange }) {
    return getEditableColumns(columns).map((column) => {
        const accessor = column.accessorKey
        const label = typeof column.header === 'string'
            ? column.header
            : accessor
        const value = formData[accessor] ?? ''

        return (
            <div key={accessor} className="modal-form-group">
                <label htmlFor={`table-field-${accessor}`}>{label}</label>
                {column.editType === 'select' ? (
                    <select
                        id={`table-field-${accessor}`}
                        name={accessor}
                        value={value}
                        onChange={onChange}
                        className="modal-input"
                        required={column.required !== false}
                    >
                        <option value="">Выберите...</option>
                        {column.options?.map((option) => (
                            <option key={getOptionValue(option)} value={getOptionValue(option)}>
                                {getOptionLabel(option)}
                            </option>
                        ))}
                    </select>
                ) : column.editType === 'checkbox' ? (
                    <input
                        id={`table-field-${accessor}`}
                        type="checkbox"
                        name={accessor}
                        checked={Boolean(value)}
                        onChange={onChange}
                        className="modal-checkbox"
                    />
                ) : (
                    <input
                        id={`table-field-${accessor}`}
                        type={column.editType || 'text'}
                        name={accessor}
                        value={value}
                        onChange={onChange}
                        className="modal-input"
                        required={column.required !== false}
                        step={column.editType === 'number' ? 'any' : undefined}
                    />
                )}
            </div>
        )
    })
}

export function EditModal({ user, isOpen, onClose, onSave, columns }) {
    const [formData, setFormData] = useState(() => ({ ...user }))
    const formRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                formRef.current?.querySelector('input')?.focus()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
        onClose()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} ref={formRef}>
                <h2 className="modal-title">Редактирование записи</h2>
                <form onSubmit={handleSubmit}>
                    <ModalFields columns={columns} formData={formData} onChange={handleChange} />
                    <div className="modal-button-group">
                        <button type="button" onClick={onClose} className="modal-button-cancel">Отмена</button>
                        <button type="submit" className="modal-button-save">💾 Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function DeleteModal({ item, isOpen, onClose, onConfirm }) {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Подтверждение удаления</h2>
                <p className="modal-text">
                    Вы уверены, что хотите удалить запись <strong>#{item?.id}</strong>?
                </p>
                <div className="modal-button-group modal-button-group-center">
                    <button type="button" onClick={onClose} className="modal-button-cancel">Отмена</button>
                    <button type="button" onClick={() => { onConfirm(item); onClose() }} className="modal-button-delete" autoFocus>🗑️ Удалить</button>
                </div>
            </div>
        </div>
    )
}

export function AddModal({ isOpen, onClose, onSave, columns }) {
    const [formData, setFormData] = useState(() => getInitialFormData(columns))
    const formRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                formRef.current?.querySelector('input')?.focus()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
        onClose()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} ref={formRef}>
                <h2 className="modal-title">Добавление новой записи</h2>
                <form onSubmit={handleSubmit}>
                    <ModalFields columns={columns} formData={formData} onChange={handleChange} />
                    <div className="modal-button-group">
                        <button type="button" onClick={onClose} className="modal-button-cancel">Отмена</button>
                        <button type="submit" className="modal-button-save">➕ Добавить</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
