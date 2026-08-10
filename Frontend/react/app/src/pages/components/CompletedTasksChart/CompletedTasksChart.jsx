import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Fetch from '../../../API/Fetch';
import { HttpMethod, APIVersion } from '../../../data/enums';
import { notify_error } from '../../../modules/notify';
import Spinner from '../Spinner/Spinner';

export default function CompletedTasksChart({ department = "__ALL__" }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [themeColor, setThemeColor] = useState('#3794ff'); // fallback

    // Получаем цвет из CSS-переменной
    useEffect(() => {
        const computedStyle = getComputedStyle(document.documentElement);
        const blue = computedStyle.getPropertyValue('--blue').trim();
        if (blue) setThemeColor(blue);
    }, []);

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

    const dateLabels = dates.map(d => {
        const parts = d.split('-');
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    });

    return (
        <Plot
            data={[
                {
                    x: dates,
                    y: counts,
                    type: 'scatter',
                    mode: 'lines+markers',
                    fill: 'tozeroy',
                    fillcolor: `${themeColor}33`, // полупрозрачный (прозрачность 20%)
                    marker: {
                        color: themeColor,
                        size: 10,
                        line: { color: themeColor, width: 2 }
                    },
                    line: {
                        color: themeColor,
                        width: 2.5,
                        shape: 'linear'
                    },
                    name: 'Завершённые задачи',
                    hovertemplate: '%{text}: %{y} задач<extra></extra>',
                    text: dateLabels,
                },
            ]}
            layout={{
                xaxis: {
                    title: 'Дата',
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: dates,
                    tickangle: -45,
                    gridcolor: 'var(--border)',
                    zeroline: false,
                    tickfont: { color: 'var(--text)' },
                    titlefont: { color: 'var(--text)' },
                },
                yaxis: {
                    title: 'Количество задач',
                    min: 0,
                    dtick: 1,
                    gridcolor: 'var(--border)',
                    zeroline: true,
                    zerolinecolor: 'var(--border)',
                    tickfont: { color: 'var(--text)' },
                    titlefont: { color: 'var(--text)' },
                },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: 'var(--text)' },
                margin: { l: 60, r: 30, t: 60, b: 80 },
                hovermode: 'x',
                showlegend: true,
                legend: { orientation: 'h', y: 1.05, font: { color: 'var(--text)' } },
            }}
            config={{ responsive: true, displayModeBar: true }}
            style={{ width: '100%', height: '450px' }}
        />
    );
}