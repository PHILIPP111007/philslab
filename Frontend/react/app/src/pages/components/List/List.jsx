import { useState } from 'react'
import './List.css'

export default function List({
    items = [],
    variant = 'default',
    onItemClick,
    onItemDelete,
    onItemEdit,
    className = '',
    emptyMessage = 'Нет элементов',
    selectable = false,
    draggable = false,
    onReorder,
}) {
    const [selectedId, setSelectedId] = useState(null)
    const [dragOverId, setDragOverId] = useState(null)

    const handleClick = (item) => {
        if (selectable) {
            setSelectedId(item.id)
        }
        onItemClick?.(item)
    }

    const handleDelete = (e, item) => {
        e.stopPropagation()
        if (confirm(`Удалить "${item.label || item.title || item.name}"?`)) {
            onItemDelete?.(item)
        }
    }

    const handleEdit = (e, item) => {
        e.stopPropagation()
        onItemEdit?.(item)
    }

    const handleDragStart = (e, item) => {
        if (!draggable) return
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', JSON.stringify(item))
    }

    const handleDragOver = (e, item) => {
        e.preventDefault()
        setDragOverId(item.id)
    }

    const handleDragLeave = () => {
        setDragOverId(null)
    }

    const handleDrop = (e, targetItem) => {
        e.preventDefault()
        setDragOverId(null)
        if (!onReorder) return

        const sourceData = e.dataTransfer.getData('text/plain')
        if (!sourceData) return

        const sourceItem = JSON.parse(sourceData)
        if (sourceItem.id === targetItem.id) return

        onReorder(sourceItem, targetItem)
    }

    if (items.length === 0) {
        return (
            <div className="list-empty">
                <span className="list-empty__icon">📭</span>
                <span className="list-empty__text">{emptyMessage}</span>
            </div>
        )
    }

    return (
        <ul className={`list list--${variant} ${className}`}>
            {items.map((item) => {
                const isSelected = selectable && selectedId === item.id
                const isDragOver = draggable && dragOverId === item.id

                return (
                    <li
                        key={item.id}
                        className={`
              list__item 
              ${isSelected ? 'list__item--selected' : ''}
              ${isDragOver ? 'list__item--drag-over' : ''}
              ${onItemClick ? 'list__item--clickable' : ''}
              ${draggable ? 'list__item--draggable' : ''}
            `}
                        onClick={() => handleClick(item)}
                        draggable={draggable}
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleDragOver(e, item)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, item)}
                    >
                        {/* Иконка перетаскивания */}
                        {draggable && (
                            <span className="list__drag-handle">⠿</span>
                        )}

                        {/* Иконка элемента */}
                        {item.icon && (
                            <span className="list__icon">{item.icon}</span>
                        )}

                        {/* Аватар */}
                        {item.avatar && (
                            <div className="list__avatar">
                                {item.avatar}
                            </div>
                        )}

                        {/* Основной контент */}
                        <div className="list__content">
                            <div className="list__primary">
                                {item.label || item.title || item.name}
                                {item.badge && (
                                    <span className={`badge badge-${item.badgeVariant || 'secondary'}`}>
                                        {item.badge}
                                    </span>
                                )}
                                {item.status && (
                                    <span className={`badge ${item.statusClass || 'status-active'}`}>
                                        {item.status}
                                    </span>
                                )}
                            </div>
                            {item.subtext && (
                                <div className="list__subtext">{item.subtext}</div>
                            )}
                            {item.meta && (
                                <div className="list__meta">
                                    {Object.entries(item.meta).map(([key, value]) => (
                                        <span key={key} className="list__meta-item">
                                            <span className="list__meta-label">{key}:</span>
                                            <span className="list__meta-value">{value}</span>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Действия */}
                        <div className="list__actions">
                            {onItemEdit && (
                                <button
                                    className="list__action list__action--edit"
                                    onClick={(e) => handleEdit(e, item)}
                                    title="Редактировать"
                                >
                                    ✏️
                                </button>
                            )}
                            {onItemDelete && (
                                <button
                                    className="list__action list__action--delete"
                                    onClick={(e) => handleDelete(e, item)}
                                    title="Удалить"
                                >
                                    🗑️
                                </button>
                            )}
                            {item.action && (
                                <button
                                    className="list__action"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        item.action(item)
                                    }}
                                    title={item.actionLabel || 'Действие'}
                                >
                                    {item.actionIcon || '▶'}
                                </button>
                            )}
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}