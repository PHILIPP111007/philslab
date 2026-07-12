import './Header.css'
import { useState, useRef, useEffect } from 'react'
import { ThemeToggle } from '../Theme/ThemeToggle'
import LinkButton from '../LinkButton/LinkButton'


export default function Header({
    user,
    title = 'Информация о пользователе',
    onSettingsChange,
    onLogout,
    className = '',
}) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [settings, setSettings] = useState({
        showAvatar: true,
        showEmail: true,
        showStatus: true,
        showDepartment: true,
        compact: false,
    })
    const settingsRef = useRef(null)

    // Закрытие настроек при клике вне
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setIsSettingsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSettingChange = (key, value) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)
        if (onSettingsChange) {
            onSettingsChange(newSettings)
        }
    }

    const toggleSettings = () => {
        setIsSettingsOpen(!isSettingsOpen)
    }

    // Статус с цветом
    const statusConfig = {
        'Активен': { class: 'status-active', emoji: '🟢', label: 'Активен' },
        'Неактивен': { class: 'status-inactive', emoji: '🔴', label: 'Неактивен' },
        'В ожидании': { class: 'status-pending', emoji: '🟡', label: 'В ожидании' },
        'Заблокирован': { class: 'status-blocked', emoji: '⚫', label: 'Заблокирован' },
    }

    const statusInfo = statusConfig[user?.status] || statusConfig['Неактивен']

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

    return (
        <div className={`sticky-header ${settings.compact ? 'sticky-header--compact' : ''} ${className}`}>
            <div className="sticky-header__content">
                {/* Левая часть - аватар и основная информация */}
                <div className="sticky-header__left"></div>

                {/* Правая часть - кнопки действий */}
                <div className="sticky-header__right">
                    {/* Кнопка настроек (обновленная) */}
                    <div className="sticky-header__settings-wrapper" ref={settingsRef}>
                        <button
                            className={`sticky-header__settings-btn ${isSettingsOpen ? 'sticky-header__settings-btn--active' : ''}`}
                            onClick={toggleSettings}
                            title="Настройки"
                        >
                            <span className="sticky-header__settings-icon">⚙️</span>
                            <span className="sticky-header__settings-label">Настройки</span>
                            <span className={`sticky-header__settings-arrow ${isSettingsOpen ? 'sticky-header__settings-arrow--open' : ''}`}>
                                ▼
                            </span>
                        </button>

                        {/* Всплывающее окно настроек */}
                        {isSettingsOpen && (
                            <div className="sticky-header__settings-popup">
                                <div className="sticky-header__settings-header">
                                    <h3>⚙️ Настройки</h3>
                                    <button
                                        className="sticky-header__settings-close"
                                        onClick={() => setIsSettingsOpen(false)}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="sticky-header__settings-body">
                                    {/* Отображение информации */}
                                    <div className="sticky-header__setting-group">
                                        <LinkButton to="/users/admin/" variant="secondary">
                                            Личный кабинет
                                        </LinkButton>
                                        <br />
                                        <br />
                                        <LinkButton to="/hello/" variant="secondary">
                                            Страница со стилями
                                        </LinkButton>
                                        <br />
                                        <br />
                                        <label className="sticky-header__setting">
                                            <input
                                                type="checkbox"
                                                checked={settings.showAvatar}
                                                onChange={(e) => handleSettingChange('showAvatar', e.target.checked)}
                                            />
                                            Показывать аватар
                                        </label>
                                        <label className="sticky-header__setting">
                                            <input
                                                type="checkbox"
                                                checked={settings.showEmail}
                                                onChange={(e) => handleSettingChange('showEmail', e.target.checked)}
                                            />
                                            Показывать email
                                        </label>
                                        <label className="sticky-header__setting">
                                            <input
                                                type="checkbox"
                                                checked={settings.showStatus}
                                                onChange={(e) => handleSettingChange('showStatus', e.target.checked)}
                                            />
                                            Показывать статус
                                        </label>
                                        <label className="sticky-header__setting">
                                            <input
                                                type="checkbox"
                                                checked={settings.showDepartment}
                                                onChange={(e) => handleSettingChange('showDepartment', e.target.checked)}
                                            />
                                            Показывать отдел
                                        </label>
                                    </div>

                                    {/* Компактный режим */}
                                    <div className="sticky-header__setting-group">
                                        <div className="sticky-header__setting-group-title">
                                            Внешний вид
                                        </div>
                                        <label className="sticky-header__setting">
                                            <input
                                                type="checkbox"
                                                checked={settings.compact}
                                                onChange={(e) => handleSettingChange('compact', e.target.checked)}
                                            />
                                            Компактный режим
                                        </label>
                                    </div>

                                    {/* ThemeToggle */}
                                    <div className="sticky-header__setting-group sticky-header__setting-group--theme">
                                        <div className="sticky-header__setting-group-title">
                                            Тема оформления
                                        </div>
                                        <div className="sticky-header__theme-toggle-wrapper">
                                            <ThemeToggle />
                                        </div>
                                    </div>
                                </div>

                                <div className="sticky-header__settings-footer">
                                    {onLogout && (
                                        <button
                                            className="sticky-header__logout-btn"
                                            onClick={onLogout}
                                        >
                                            🚪 Выйти
                                        </button>
                                    )}
                                    <button
                                        className="sticky-header__close-btn"
                                        onClick={() => setIsSettingsOpen(false)}
                                    >
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    )
}