import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../../data/context.js';
import Header from '../components/Header/Header';
import TasksSection from '../components/TasksSection/TasksSection';
import rememberPage from '../../modules/rememberPage';
import Fetch from '../../API/Fetch';
import { HttpMethod, APIVersion } from '../../data/enums';

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
                    // ✅ Берём отдел из local_user или global_user
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
                <div style={{ padding: '2rem', textAlign: 'center' }}>⏳ Загрузка...</div>
            </>
        );
    }

    return (
        <>
            <Header />
            <TasksSection departmentName={departmentName} />
        </>
    );
}