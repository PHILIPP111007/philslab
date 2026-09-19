import './MainPage.css'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import rememberPage from "../../modules/rememberPage"
import LinkButton from '../components/LinkButton/LinkButton'
import Header from '../components/Header/Header'

export default function MainPage() {
    var params = useParams()


    useEffect(() => {
        rememberPage(`users/${params.username}/main_page/`)
    }, [params.username])


    const navigationItems = [
        {
            id: 'search',
            title: '🔍 Поиск',
            description: 'Поиск по всем разделам системы',
            to: `/users/${params.username}/search/`,
            variant: 'secondary',
        },
        {
            id: 'department',
            title: '🏢 Отдел',
            description: 'Информация отдела (задачи, батчи)',
            to: `/users/${params.username}/department/`,
            variant: 'secondary',
        },
        {
            id: 'statistics',
            title: '📊 Статистика',
            description: 'Аналитика и отчеты по деятельности',
            to: `/users/${params.username}/statistics/`,
            variant: 'secondary',
        },
        {
            id: 'protocols',
            title: '📋 Протоколы / СОПы',
            description: 'Стандартные операционные процедуры',
            to: `/users/${params.username}/protocols/`,
            variant: 'secondary',
        },
        {
            id: 'warehouse',
            title: '📦 Склад отдела',
            description: 'Управление складскими запасами',
            to: `/users/${params.username}/warehouse/`,
            variant: 'secondary',
        },
        {
            id: 'admin_page',
            title: '👤 Администрирование',
            description: 'Панель администрирования',
            to: `/users/${params.username}/admin_page/`,
            variant: 'secondary',
        },
    ]

    return (
        <>
            <Header />

            <div className="main-page">
                <div className="main-page__container">
                    {/* Заголовок */}
                    <header className="main-page__header">
                        <h1 className="main-page__title">Главная</h1>
                    </header>

                    {/* Сетка карточек */}
                    <div className="main-page__grid">
                        {navigationItems.map((item) => (
                            <LinkButton
                                key={item.id}
                                to={item.to}
                                variant={item.variant}
                                className="main-page__card"
                            >
                                <div className="main-page__card-icon">{item.title.split(' ')[0]}</div>
                                <div className="main-page__card-content">
                                    <h3 className="main-page__card-title">{item.title}</h3>
                                    <p className="main-page__card-description">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="main-page__card-arrow">→</div>
                            </LinkButton>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
