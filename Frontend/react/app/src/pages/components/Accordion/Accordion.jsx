import { useState } from 'react'
import './Accordion.css'

export default function Accordion({
    items = [],
    defaultOpen = [],
    multiple = false,
    variant = 'default',
    className = '',
    onToggle,
    iconOpen = '▼',
    iconClosed = '▶',
    iconPosition = 'left',
}) {
    const [openItems, setOpenItems] = useState(defaultOpen)

    const toggle = (id) => {
        let newOpenItems

        if (multiple) {
            newOpenItems = openItems.includes(id)
                ? openItems.filter(i => i !== id)
                : [...openItems, id]
        } else {
            newOpenItems = openItems.includes(id) ? [] : [id]
        }

        setOpenItems(newOpenItems)
        onToggle?.(newOpenItems)
    }

    const isOpen = (id) => openItems.includes(id)

    return (
        <div className={`accordion accordion--${variant} ${className}`}>
            {items.map((item) => (
                <div
                    key={item.id}
                    className={`accordion__item ${isOpen(item.id) ? 'accordion__item--open' : ''}`}
                >
                    {/* Заголовок */}
                    <div
                        className="accordion__header"
                        onClick={() => toggle(item.id)}
                    >
                        <div className="accordion__header-content">
                            {iconPosition === 'left' && (
                                <span className="accordion__icon">
                                    {isOpen(item.id) ? iconOpen : iconClosed}
                                </span>
                            )}

                            {item.icon && (
                                <span className="accordion__item-icon">{item.icon}</span>
                            )}

                            <span className="accordion__title">{item.title}</span>

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

                            {iconPosition === 'right' && (
                                <span className="accordion__icon accordion__icon--right">
                                    {isOpen(item.id) ? iconOpen : iconClosed}
                                </span>
                            )}
                        </div>

                        {/* Дополнительные действия в заголовке */}
                        {item.actions && (
                            <div className="accordion__header-actions" onClick={(e) => e.stopPropagation()}>
                                {item.actions}
                            </div>
                        )}
                    </div>

                    {/* Содержимое */}
                    <div className={`accordion__body ${isOpen(item.id) ? 'accordion__body--open' : ''}`}>
                        <div className="accordion__content">
                            {item.content}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}