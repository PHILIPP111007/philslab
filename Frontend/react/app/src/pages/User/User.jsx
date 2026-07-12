import './User.css'
import { useState } from 'react'
import Header from '../components/Header/Header'

export default function User() {
    const [user, setUser] = useState({
        id: 1,
        name: 'Анна Кузнецова',
        email: 'anna.kuznetsova@example.com',
        age: 25,
        city: 'Москва',
        status: 'Активен',
        department: 'Разработка',
        salary: 85000,
        experience: 3,
        phone: '+7 (999) 123-45-67',
        address: 'г. Москва, ул. Тверская, д. 15, кв. 78',
        createdAt: '2023-01-15T10:30:00',
        updatedAt: '2024-06-20T14:45:00',
        bio: 'Опытный разработчик с 3-летним стажем. Специализируется на React и TypeScript. Любит создавать красивые и функциональные интерфейсы.',
    })

    const [isEditing, setIsEditing] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [editData, setEditData] = useState({})

    // Статус с цветом
    const statusConfig = {
        'Активен': { class: 'status-active', emoji: '🟢', label: 'Активен' },
        'Неактивен': { class: 'status-inactive', emoji: '🔴', label: 'Неактивен' },
        'В ожидании': { class: 'status-pending', emoji: '🟡', label: 'В ожидании' },
        'Заблокирован': { class: 'status-blocked', emoji: '⚫', label: 'Заблокирован' },
    }

    const statusInfo = statusConfig[user.status] || statusConfig['Неактивен']

    // Форматирование зарплаты
    const formatSalary = (value) => {
        if (!value) return '—'
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0,
        }).format(value)
    }

    // Получение инициалов
    const getInitials = (name) => {
        if (!name) return '?'
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        }
        return name[0].toUpperCase()
    }

    // Форматирование даты
    const formatDate = (date) => {
        if (!date) return '—'
        return new Date(date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // Обработчики
    const handleEdit = () => {
        setIsEditing(true)
        setEditData({ ...user })
    }

    const handleSave = () => {
        setUser({ ...editData })
        setIsEditing(false)
        alert('✅ Пользователь обновлен!')
    }

    const handleCancel = () => {
        setIsEditing(false)
        setEditData({})
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setEditData(prev => ({ ...prev, [name]: value }))
    }

    const handleStatusChange = (newStatus) => {
        setUser(prev => ({ ...prev, status: newStatus }))
        alert(`✅ Статус изменен на "${newStatus}"`)
    }

    const handleDelete = () => {
        if (confirm(`Удалить пользователя "${user.name}"?`)) {
            alert('🗑️ Пользователь удален!')
        }
    }

    const toggleExpand = () => {
        setIsExpanded(!isExpanded)
    }

    // ============================================
    // РЕНДЕР
    // ============================================
    return (
        <>
            <Header />
            <div className="user-container">
                <br />
                {/* Основная карточка */}
                <div className="user-card">
                    {/* Аватар */}
                    <div className="user-card__avatar">
                        <div className="user-card__avatar-placeholder">
                            {getInitials(user.name)}
                        </div>
                    </div>

                    {/* Информация */}
                    <div className="user-card__body">
                        <div className="user-card__header">
                            <div className="user-card__header-left">
                                <h2 className="user-card__name">{user.name}</h2>
                                <span className={`badge ${statusInfo.class}`}>
                                    {statusInfo.emoji} {statusInfo.label}
                                </span>
                            </div>
                            <div className="user-card__header-right">
                                <button
                                    className="user-card__action user-card__action--edit"
                                    onClick={handleEdit}
                                    title="Редактировать"
                                >
                                    ✏️
                                </button>
                                <button
                                    className="user-card__action user-card__action--delete"
                                    onClick={handleDelete}
                                    title="Удалить"
                                >
                                    🗑️
                                </button>
                                <button
                                    className="user-card__action user-card__action--expand"
                                    onClick={toggleExpand}
                                    title={isExpanded ? 'Свернуть' : 'Развернуть'}
                                >
                                    {isExpanded ? '▲' : '▼'}
                                </button>
                            </div>
                        </div>

                        {/* Основные детали */}
                        <div className="user-card__details">
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">📧</span>
                                <span>{user.email}</span>
                            </div>
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">📍</span>
                                <span>{user.city}</span>
                            </div>
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">🏢</span>
                                <span>{user.department}</span>
                            </div>
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">🎂</span>
                                <span>{user.age} лет</span>
                            </div>
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">📅</span>
                                <span>Опыт: {user.experience} лет</span>
                            </div>
                            <div className="user-card__detail user-card__detail--highlight">
                                <span className="user-card__detail-icon">💰</span>
                                <span>{formatSalary(user.salary)}</span>
                            </div>
                        </div>

                        {/* Дополнительная информация (разворачивается) */}
                        {isExpanded && (
                            <div className="user-card__extra">
                                <div className="user-card__extra-section">
                                    <h4>📞 Контакты</h4>
                                    <div className="user-card__detail">
                                        <span className="user-card__detail-icon">📱</span>
                                        <span>{user.phone}</span>
                                    </div>
                                    <div className="user-card__detail">
                                        <span className="user-card__detail-icon">🏠</span>
                                        <span>{user.address}</span>
                                    </div>
                                </div>

                                <div className="user-card__extra-section">
                                    <h4>📝 О себе</h4>
                                    <p className="user-card__bio">{user.bio}</p>
                                </div>

                                <div className="user-card__extra-section">
                                    <h4>📊 Информация</h4>
                                    <div className="user-card__detail">
                                        <span className="user-card__detail-icon">📅</span>
                                        <span>Создан: {formatDate(user.createdAt)}</span>
                                    </div>
                                    <div className="user-card__detail">
                                        <span className="user-card__detail-icon">🔄</span>
                                        <span>Обновлен: {formatDate(user.updatedAt)}</span>
                                    </div>
                                </div>

                                <div className="user-card__extra-section">
                                    <h4>🔄 Изменить статус</h4>
                                    <div className="user-card__status-buttons">
                                        {Object.keys(statusConfig).map((statusKey) => (
                                            <button
                                                key={statusKey}
                                                className={`user-card__status-btn ${user.status === statusKey ? 'user-card__status-btn--active' : ''
                                                    }`}
                                                onClick={() => handleStatusChange(statusKey)}
                                            >
                                                {statusConfig[statusKey].emoji} {statusKey}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Модальное окно редактирования */}
                {isEditing && (
                    <div className="user-modal-overlay" onClick={handleCancel}>
                        <div className="user-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="user-modal__title">✏️ Редактирование пользователя</h2>
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="user-modal__form-group">
                                    <label>Имя</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editData.name || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={editData.email || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>Возраст</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={editData.age || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>Город</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={editData.city || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>Отдел</label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={editData.department || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>Зарплата</label>
                                    <input
                                        type="number"
                                        name="salary"
                                        value={editData.salary || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>Опыт (лет)</label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={editData.experience || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>Телефон</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={editData.phone || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>Адрес</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={editData.address || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>О себе</label>
                                    <textarea
                                        name="bio"
                                        value={editData.bio || ''}
                                        onChange={handleChange}
                                        className="user-modal__textarea"
                                        rows="3"
                                    />
                                </div>
                                <div className="user-modal__buttons">
                                    <button type="button" onClick={handleCancel} className="user-modal__btn user-modal__btn--cancel">
                                        Отмена
                                    </button>
                                    <button type="button" onClick={handleSave} className="user-modal__btn user-modal__btn--save">
                                        💾 Сохранить
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}