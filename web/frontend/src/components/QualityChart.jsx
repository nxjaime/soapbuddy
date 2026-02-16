import { Activity } from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

const QUALITY_FIELDS = [
    { key: 'hardness',     label: 'Hardness',     subject: 'Hardness' },
    { key: 'cleansing',    label: 'Cleansing',    subject: 'Cleansing' },
    { key: 'conditioning', label: 'Conditioning', subject: 'Cond.' },
    { key: 'bubbly',       label: 'Bubbly',       subject: 'Bubbly' },
    { key: 'creamy',       label: 'Creamy',       subject: 'Creamy' },
];

export default function QualityChart({ qualities }) {
    if (!qualities) return null;

    const data = QUALITY_FIELDS.map(f => ({
        subject: f.subject,
        A: qualities[f.key] ?? 0,
        fullMark: 100
    }));

    return (
        <div style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                <Activity size={16} style={{ marginRight: '8px' }} />
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Soap Qualities</h4>
            </div>
            <div style={{
                height: '250px',
                width: '100%',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-md)',
                display: 'flex'
            }}>
                <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                            <PolarGrid stroke="#e5e7eb" strokeOpacity={0.2} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Qualities"
                                dataKey="A"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="#8b5cf6"
                                fillOpacity={0.3}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                itemStyle={{ color: '#d1d5db' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div style={{
                    width: '140px',
                    padding: '16px',
                    fontSize: '0.8rem',
                    borderLeft: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    {QUALITY_FIELDS.map(f => (
                        <div key={f.key} style={{ marginBottom: '8px' }}>
                            <div style={{ color: 'var(--text-muted)' }}>{f.label}</div>
                            <div style={{ fontWeight: 600 }}>{qualities[f.key] ?? '—'}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
