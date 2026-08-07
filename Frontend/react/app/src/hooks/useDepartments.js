// hooks/useDepartments.js
import { useState, useEffect } from 'react';
import Fetch from '../API/Fetch';
import { HttpMethod, APIVersion } from '../data/enums';

export function useDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: 'departments/',    // предполагаемый эндпоинт
                method: HttpMethod.GET,
            });
            if (data?.ok && data?.data) {
                setDepartments(data.data); // ожидаем массив строк, например ['REGISTRATION', 'QC']
            } else {
                // если эндпоинта нет – можно захардкодить или оставить пустым
                setDepartments([]);
            }
            setLoading(false);
        };
        load();
    }, []);

    return { departments, loading };
}