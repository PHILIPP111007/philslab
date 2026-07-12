import './User.css'
import { useState, useContext } from 'react'
import Header from '../components/Header/Header'
import { useParams } from 'react-router-dom'
import Fetch from '../../API/Fetch'
import { HttpMethod, APIVersion } from '../../data/enums'
import { UserContext } from "../../data/context.js"
import { useSetUser } from "../../hooks/useAuth.js"

export default function User() {
    var params = useParams()
    const { user, setUser } = useContext(UserContext)
    var [userLocal, setUserLocal] = useState(user)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState({})

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
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        const data = await Fetch({
            api_version: APIVersion.V2,
            action: `user/${params.username}/`,
            method: HttpMethod.PUT,
            body: editData,
        })
        if (data?.ok) {
            setUser(prev => ({ ...prev, ...editData }))
            setIsEditing(false)
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

    if (!user) {
        return (
            <>
                <Header />
                <div className="user-container">Загрузка...</div>
            </>
        )
    }

    return (
        <>
            <Header />
            <div className="user-container">
                <br />
                <div className="user-card">
                    <div className="user-card__avatar">
                        <div className="user-card__avatar-placeholder">
                            {getInitials(user.first_name, user.last_name)}
                        </div>
                    </div>

                    <div className="user-card__body">
                        <div className="user-card__header">
                            <div className="user-card__header-left">
                                <h2 className="user-card__name">
                                    {user.first_name} {user.last_name}
                                </h2>
                                <span className="user-card__username">@{user.username}</span>
                            </div>
                            <div className="user-card__header-right">
                                <button
                                    className="user-card__action user-card__action--edit"
                                    onClick={handleEdit}
                                    title="Редактировать"
                                >
                                    ✏️
                                </button>
                            </div>
                        </div>

                        <div className="user-card__details">
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">📧</span>
                                <span>{user.email}</span>
                            </div>
                            <div className="user-card__detail">
                                <span className="user-card__detail-icon">📝</span>
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
                                    <label>О себе</label>
                                    <textarea
                                        name="descr"
                                        value={editData.descr || ''}
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