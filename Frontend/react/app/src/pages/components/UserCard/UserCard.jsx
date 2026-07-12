import './UserCard.css'

// ============================================
// USER CARD - INLINE КОМПОНЕНТ
// ============================================
export default function UserCard({
    user,
    variant = 'default',
    onEdit,
    onDelete,
    onView,
    compact = false,
    className = '',
    ...props
}) {
    const {
        name,
        email,
        age,
        city,
        status,
        department,
        salary,
        experience,
        avatar,
        id,
    } = user || {}

    // Статус с цветом
    const statusConfig = {
        'Активен': { class: 'status-active', emoji: '🟢', label: 'Активен' },
        'Неактивен': { class: 'status-inactive', emoji: '🔴', label: 'Неактивен' },
        'В ожидании': { class: 'status-pending', emoji: '🟡', label: 'В ожидании' },
        'Заблокирован': { class: 'status-blocked', emoji: '⚫', label: 'Заблокирован' },
    }

    const statusInfo = statusConfig[status] || statusConfig['Неактивен']

    // Форматирование зарплаты
    const formatSalary = (value) => {
        if (!value) return '—'
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0,
        }).format(value)
    }

    // Базовые классы
    const cardClasses = [
        'user-card',
        `user-card--${variant}`,
        compact ? 'user-card--compact' : '',
        className,
    ].filter(Boolean).join(' ')

    // ============================================
    // РЕНДЕР - ОБЫЧНАЯ КАРТОЧКА
    // ============================================
    if (!compact) {
        return (
            <div className={cardClasses} {...props}>
                {/* Аватар */}
                <div className="user-card__avatar">
                    {avatar ? (
                        <img src={avatar} alt={name} className="user-card__avatar-img" />
                    ) : (
                        <div className="user-card__avatar-placeholder">
                            {name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                    )}
                </div>

                {/* Информация */}
                <div className="user-card__body">
                    <div className="user-card__header">
                        <h3 className="user-card__name">{name || 'Без имени'}</h3>
                        <span className={`badge ${statusInfo.class}`}>
                            {statusInfo.emoji} {statusInfo.label}
                        </span>
                    </div>

                    <div className="user-card__details">
                        {email && (
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">📧</span>
                                <span>{email}</span>
                            </div>
                        )}
                        {city && (
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">📍</span>
                                <span>{city}</span>
                            </div>
                        )}
                        {age && (
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">🎂</span>
                                <span>{age} лет</span>
                            </div>
                        )}
                        {department && (
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">🏢</span>
                                <span>{department}</span>
                            </div>
                        )}
                        {experience && (
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">📅</span>
                                <span>Опыт: {experience} лет</span>
                            </div>
                        )}
                        {salary && (
                            <div className="user-card__detail user-card__detail--highlight">
                                <span className="user-card__detail-icon">💰</span>
                                <span>{formatSalary(salary)}</span>
                            </div>
                        )}
                    </div>

                    {/* Действия */}
                    <div className="user-card__actions">
                        {onView && (
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => onView(user)}
                            >
                                👁️ Просмотр
                            </button>
                        )}
                        {onEdit && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => onEdit(user)}
                            >
                                ✏️ Редактировать
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => onDelete(user)}
                            >
                                🗑️ Удалить
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ============================================
    // РЕНДЕР - КОМПАКТНАЯ КАРТОЧКА
    // ============================================
    return (
        <div className={cardClasses} {...props}>
            <div className="user-card__avatar user-card__avatar--small">
                {avatar ? (
                    <img src={avatar} alt={name} className="user-card__avatar-img" />
                ) : (
                    <div className="user-card__avatar-placeholder user-card__avatar-placeholder--small">
                        {name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                )}
            </div>

            <div className="user-card__body user-card__body--compact">
                <div className="user-card__header user-card__header--compact">
                    <h4 className="user-card__name user-card__name--compact">{name || 'Без имени'}</h4>
                    <span className={`badge ${statusInfo.class} badge-sm`}>
                        {statusInfo.emoji} {statusInfo.label}
                    </span>
                </div>

                <div className="user-card__details user-card__details--compact">
                    {city && (
                        <span className="user-card__detail--inline">{city}</span>
                    )}
                    {age && (
                        <span className="user-card__detail--inline">{age} лет</span>
                    )}
                    {salary && (
                        <span className="user-card__detail--inline user-card__detail--highlight">
                            {formatSalary(salary)}
                        </span>
                    )}
                </div>

                <div className="user-card__actions user-card__actions--compact">
                    {onView && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onView(user)}
                        >
                            👁️
                        </button>
                    )}
                    {onEdit && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onEdit(user)}
                        >
                            ✏️
                        </button>
                    )}
                    {onDelete && (
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => onDelete(user)}
                        >
                            🗑️
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}