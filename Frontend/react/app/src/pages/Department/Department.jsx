// Department.js
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../../data/context.js';
import Fetch from '../../API/Fetch';
import rememberPage from '../../modules/rememberPage';
import { HttpMethod, APIVersion } from '../../data/enums';
import Header from '../components/Header/Header';
import TasksSection from '../components/TasksSection/TasksSection';
import Spinner from '../components/Spinner/Spinner.jsx';
import Batches from '../components/Batch/Batches';

export default function Department() {
    const { user } = useContext(UserContext);
    const params = useParams();
    const [departmentName, setDepartmentName] = useState(null);
    const [loading, setLoading] = useState(true);

    const targetUsername = params.username || user?.username;

    useEffect(() => {
        rememberPage(`department/${params.username || ''}`);
    }, [params.username]);

    useEffect(() => {
        if (!targetUsername) {
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
            try {
                const data = await Fetch({
                    method: HttpMethod.GET,
                    api_version: APIVersion.V2,
                    action: `user/${targetUsername}/`,
                });
                if (data?.ok) {
                    const dept = data.local_user?.department || data.global_user?.department || null;
                    setDepartmentName(dept);
                } else {
                    setDepartmentName(null);
                }
            } catch {
                setDepartmentName(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [targetUsername]);

    if (loading) {
        return (
            <>
                <Header />
                <Spinner />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="app theme-transition">
                <section className="section">
                    <h3>Отдел {departmentName}</h3>
                </section>
                <section className="section">
                    <TasksSection departmentName={departmentName} />
                </section>
                <section className="section">
                    <h3 className="section__title">📦 Батчи</h3>
                    <Batches department={departmentName} />
                </section>
            </div>
        </>
    );
}