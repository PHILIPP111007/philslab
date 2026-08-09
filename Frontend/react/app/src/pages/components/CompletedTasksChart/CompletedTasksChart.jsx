import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Fetch from '../../../API/Fetch';
import { HttpMethod, APIVersion } from '../../../data/enums';
import { notify_error } from '../../../modules/notify';
import Spinner from '../Spinner/Spinner';

export default function CompletedTasksChart({ department }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!department) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const res = await Fetch({
                    api_version: APIVersion.V2,
                    action: `tasks/completed_stats/?department=${encodeURIComponent(department)}&days=30`,
                    method: HttpMethod.GET,
                });
                if (res?.ok) {
                    setData(res.data || []);
                } else {
                    notify_error(res?.error || 'Ошибка загрузки статистики');
                }
            } catch (err) {
                notify_error('Ошибка запроса статистики');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [department]);

    if (loading) return <Spinner />;
    if (!data.length) return <p>Нет данных о завершённых задачах за последние 30 дней</p>;

    const dates = data.map(item => item.date);
    const counts = data.map(item => item.count);

    return (
        <Plot
            data={[
                {
                    x: dates,
                    y: counts,
                    type: 'scatter',
                    mode: 'lines+markers',
                    fill: 'tozeroy',                    // 👈 заливка от линии до оси X
                    fillcolor: 'rgba(66, 133, 244, 0.2)', // полупрозрачный синий
                    marker: {
                        color: 'var(--blue)',
                        size: 10,
                        line: { color: 'var(--blue)', width: 2 }
                    },
                    line: {
                        color: 'var(--blue)',
                        width: 2.5,
                        shape: 'linear' // можно 'spline' для плавной линии
                    },
                    name: 'Завершённые задачи',
                    hovertemplate: '%{x}: %{y} задач<extra></extra>',
                },
            ]}
            layout={{
                xaxis: {
                    title: 'Дата',
                    type: 'date',
                    tickformat: '%d.%m.%Y',
                    tickangle: -45,
                    gridcolor: 'var(--border)',
                    zeroline: false,
                },
                yaxis: {
                    title: 'Количество задач',
                    min: 0,
                    dtick: 1,
                    gridcolor: 'var(--border)',
                    zeroline: true,
                    zerolinecolor: 'var(--border)',
                },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: 'var(--text)' },
                margin: { l: 60, r: 30, t: 60, b: 80 },
                hovermode: 'x',
                showlegend: true,
                legend: { orientation: 'h', y: 1.05 },
            }}
            config={{ responsive: true, displayModeBar: true }}
            style={{ width: '100%', height: '450px' }}
        />
    );
}