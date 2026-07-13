import './Header.css'
import { useState, useRef, useEffect, useContext } from 'react'
import { UserContext } from "../../../data/context.js"
import { ThemeToggle } from '../Theme/ThemeToggle'
import LinkButton from '../LinkButton/LinkButton'

export default function Header({ onLogout, className = '' }) {
    const { user, setUser } = useContext(UserContext)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const settingsRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setIsSettingsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className={`sticky-header ${className}`}>
            <div className="sticky-header__content">
                <div className="sticky-header__left"></div>

                <div className="sticky-header__right">
                    <div className="sticky-header__settings-wrapper" ref={settingsRef}>
                        <button
                            className={`sticky-header__settings-btn ${isSettingsOpen ? 'sticky-header__settings-btn--active' : ''}`}
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            title="Настройки"
                        >
                            <span className="sticky-header__settings-icon">⚙️</span>
                            <span className="sticky-header__settings-label">Настройки</span>
                            <span className={`sticky-header__settings-arrow ${isSettingsOpen ? 'sticky-header__settings-arrow--open' : ''}`}>▼</span>
                        </button>

                        {isSettingsOpen && (
                            <div className="sticky-header__settings-popup">
                                <div className="sticky-header__settings-header">
                                    <h3>⚙️ Настройки</h3>
                                    <button className="sticky-header__settings-close" onClick={() => setIsSettingsOpen(false)}>✕</button>
                                </div>

                                <div className="sticky-header__settings-body">
                                    <div className="sticky-header__setting-group">
                                        <LinkButton to={`/users/${user.username}/`} variant="secondary">Личный кабинет</LinkButton>
                                        <br />
                                        <br />
                                        <LinkButton to={`/samples/${user.username}/`} variant="secondary">Образцы</LinkButton>
                                        <br />
                                        <br />
                                        <LinkButton to="/hello/" variant="secondary">Страница со стилями</LinkButton>
                                    </div>

                                    <div className="sticky-header__setting-group sticky-header__setting-group--theme">
                                        <div className="sticky-header__setting-group-title">Тема оформления</div>
                                        <div className="sticky-header__theme-toggle-wrapper">
                                            <ThemeToggle />
                                        </div>
                                    </div>
                                </div>

                                <div className="sticky-header__settings-footer">
                                    {onLogout && (
                                        <button className="sticky-header__logout-btn" onClick={onLogout}>🚪 Выйти</button>
                                    )}
                                    <button className="sticky-header__close-btn" onClick={() => setIsSettingsOpen(false)}>Закрыть</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}