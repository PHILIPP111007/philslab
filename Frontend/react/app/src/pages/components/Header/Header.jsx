import './Header.css'
import { useState, useRef, useEffect, use } from 'react'
import { useNavigate } from "react-router-dom"
import Fetch from "../../../API/Fetch.js"
import { UserContext, AuthContext } from "../../../data/context.js"
import { HttpMethod, CacheKeys, APIVersion } from "../../../data/enums.js"
import { ThemeToggle } from '../Theme/ThemeToggle'
import LinkButton from '../LinkButton/LinkButton'

export default function Header() {
    var { setIsAuth } = use(AuthContext)
    const { user, setUser } = use(UserContext)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const settingsRef = useRef(null)
    var navigate = useNavigate()

    async function logout() {
        await Fetch({ api_version: APIVersion.V1, action: "token/logout/", method: HttpMethod.POST })
        setIsAuth(false)
        localStorage.removeItem(CacheKeys.TOKEN)
        setUser({
            id: 0,
            username: "",
            email: "",
            first_name: "",
            last_name: "",
            descr: "",
        })
        navigate(`/login/`)
    }

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
        <div className="sticky-header">
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
                                        <LinkButton to={`/main_page/${user.username}/`} variant="secondary">Главная страница</LinkButton>
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
                                    <button className="sticky-header__logout-btn" onClick={logout}>Выйти</button>
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