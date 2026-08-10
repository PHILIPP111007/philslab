import { useContext } from 'react'
import { useParams } from 'react-router-dom'
import { UserContext } from '../../data/context'
import Header from '../components/Header/Header'
import CompletedTasksChart from '../components/CompletedTasksChart/CompletedTasksChart'


export default function Statistics() {
    const { user } = useContext(UserContext)
    const params = useParams()

    return (
        <>
            <Header />
            <section className="section section-filled">
                <br />
                <h3 className="section__title">📊 Статистика завершённых задач</h3>
                <br />
                <CompletedTasksChart />
            </section>

        </>
    )
}