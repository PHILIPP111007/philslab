import { useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import rememberPage from "../../modules/rememberPage"
import { UserContext } from '../../data/context'
import Header from '../components/Header/Header'
import CompletedTasksChart from '../components/CompletedTasksChart/CompletedTasksChart'

export default function Statistics() {
    const { user } = useContext(UserContext)
    const params = useParams()

    useEffect(() => {
        rememberPage(`statistics/${params.username}`)
    }, [params.username])

    return (
        <>
            <Header />
            <br />
            <section className="section section-filled">
                <br />
                <h3 className="section__title">📊 Статистика завершённых задач</h3>
                <br />
                <CompletedTasksChart />
            </section>

        </>
    )
}