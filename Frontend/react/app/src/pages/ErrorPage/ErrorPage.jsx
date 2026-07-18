import "./ErrorPage.css"
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button/Button'

export default function ErrorPage() {
    const navigate = useNavigate();

    return (
        <div className="error-page">
            <div className="error-card">
                <div className="error-icon">⚠️</div>
                <h1 className="error-title">Что-то пошло не так</h1>
                <p className="error-message">
                    Страница, которую вы ищете, не существует или произошла ошибка.
                </p>
                <Button onClick={() => navigate('/')}>Вернуться на главную</Button>
            </div>
        </div>
    )
}