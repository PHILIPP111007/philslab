import './User.css'
import { useState, useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Fetch from '../../API/Fetch'
import Header from '../components/Header/Header'
import rememberPage from "../../modules/rememberPage"
import { HttpMethod, APIVersion } from '../../data/enums'
import { UserContext } from "../../data/context.js"
import { useSetUser } from "../../hooks/useAuth.js"
import Button from "../components/Button/Button"
import TasksSection from '../components/TasksSection/TasksSection'

export default function User() {
    const { user, setUser } = useContext(UserContext)
    var params = useParams()
    var [userLocal, setUserLocal] = useState(user)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState({})
    const [loading, setLoading] = useState(false)

    useSetUser({ username: params.username, setUser: setUser, setUserLocal: setUserLocal })

    const getInitials = (firstName, lastName) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?'
    }

    const handleEdit = () => {
        setEditData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            descr: user.descr || '',
            department: user.department || '', // ✅ добавлено
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: `user/${params.username}/`,
                method: HttpMethod.PUT,
                body: {
                    first_name: editData.first_name || '',
                    last_name: editData.last_name || '',
                    email: editData.email || '',
                    descr: editData.descr || '',
                    department: editData.department || '', // ✅ добавлено
                },
            })
            if (data?.ok) {
                setUser(prev => ({ ...prev, ...editData }))
                setIsEditing(false)
            }
        } catch (error) {
            console.error('Ошибка обновления:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        setEditData({})
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setEditData(prev => ({ ...prev, [name]: value }))
    }

    useEffect(() => {
        rememberPage(`users/${params.username}`)
    }, [params.username])

    return (
        <>
            <Header />
            <div className="user-container">
                <br />
                <div className="user-card-main-page">
                    <div className="user-card-main-page__avatar">
                        <div className="user-card-main-page__avatar-placeholder">
                            {getInitials(user.first_name, user.last_name)}
                        </div>
                    </div>

                    <div className="user-card-main-page__body">
                        <div className="user-card-main-page__header">
                            <div className="user-card-main-page__header-left">
                                <h2 className="user-card-main-page__name">
                                    {user.first_name} {user.last_name}
                                </h2>
                                <span className="user-card-main-page__username">@{user.username}</span>
                            </div>
                            <div className="user-card-main-page__header-right">
                                <Button
                                    className="btn btn-secondary"
                                    onClick={handleEdit}
                                    title="Редактировать"
                                    disabled={loading}
                                >
                                    {loading ? '⏳ Сохранение...' : '✏️ Редактировать'}
                                </Button>
                            </div>
                        </div>

                        <div className="user-card-main-page__details">
                            <div className="user-card-main-page__detail">
                                <span className="user-card-main-page__detail-icon">📧</span>
                                <span>{user.email || '—'}</span>
                            </div>
                            <div className="user-card-main-page__detail">
                                <span className="user-card-main-page__detail-icon">🏢</span> {/* ✅ добавлено */}
                                <span>{user.department || '—'}</span>
                            </div>
                            <div className="user-card-main-page__detail">
                                <span className="user-card-main-page__detail-icon">📝</span>
                                <span>{user.descr || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="user-modal-overlay" onClick={handleCancel}>
                        <div className="user-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="user-modal__title">✏️ Редактирование профиля</h2>
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="user-modal__form-group">
                                    <label>Имя</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={editData.first_name || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>Фамилия</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={editData.last_name || ''}
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
                                    <label>Отдел</label> {/* ✅ добавлено */}
                                    <input
                                        type="text"
                                        name="department"
                                        value={editData.department || ''}
                                        onChange={handleChange}
                                        className="user-modal__input"
                                        placeholder="Например: Разработка, HR, Маркетинг..."
                                    />
                                </div>
                                <div className="user-modal__form-group">
                                    <label>О себе</label>
                                    <textarea
                                        name="descr"
                                        value={editData.descr || ''}
                                        onChange={handleChange}
                                        className="user-modal__textarea"
                                        rows="3"
                                        placeholder="Расскажите о себе..."
                                    />
                                </div>
                                <div className="user-modal__buttons">
                                    <Button className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
                                        Отмена
                                    </Button>
                                    <Button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                                        {loading ? '⏳ Сохранение...' : '💾 Сохранить'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <TasksSection />
            </div>
        </>
    )
}