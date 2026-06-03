import React, { useState, useEffect } from 'react';
import { ClipboardList, Save, Loader2, RotateCcw } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';

interface ExamenDentalLiterarioProps {
    pacienteId: number;
    readOnly?: boolean;
    onSaveTrigger?: boolean;
    onSaveComplete?: () => void;
    onDataLoaded?: (hasData: boolean) => void;
    onModified?: (isModified: boolean) => void;
}

const toothNumbersLiterary = [
    [18, 17, 16, 15, 14, 13, 12, 11],
    [21, 22, 23, 24, 25, 26, 27, 28],
    [38, 37, 36, 35, 34, 33, 32, 31],
    [41, 42, 43, 44, 45, 46, 47, 48]
];

const ExamenDentalLiterario: React.FC<ExamenDentalLiterarioProps> = ({ 
    pacienteId, 
    readOnly = true, 
    onSaveTrigger, 
    onSaveComplete,
    onDataLoaded,
    onModified
}) => {
    const [detalle, setDetalle] = useState<Record<number, string>>({});
    const [originalDetalle, setOriginalDetalle] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExamen();
    }, [pacienteId]);

    useEffect(() => {
        if (onSaveTrigger) {
            handleSave();
        }
    }, [onSaveTrigger]);

    const fetchExamen = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/pacientes-seguro/${pacienteId}/examen-dental`);
            const data = response.data.detalle || {};
            setDetalle(data);
            const dataStr = JSON.stringify(data);
            setOriginalDetalle(dataStr);
            
            if (onDataLoaded) {
                // Check if there is actual content in the object
                const hasData = Object.values(data).some(v => v && String(v).trim() !== '');
                onDataLoaded(hasData);
            }
        } catch (error) {
            console.error('Error fetching examen dental:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (tooth: number, value: string) => {
        const newDetalle = { ...detalle, [tooth]: value };
        setDetalle(newDetalle);
        
        if (onModified) {
            onModified(JSON.stringify(newDetalle) !== originalDetalle);
        }
    };

    const handleSave = async () => {
        try {
            await api.post(`/pacientes-seguro/${pacienteId}/examen-dental`, { detalle });
            setOriginalDetalle(JSON.stringify(detalle));
            if (onModified) onModified(false);
            if (onSaveComplete) onSaveComplete();
        } catch (error) {
            console.error('Error saving examen dental:', error);
            Swal.fire('Error', 'No se pudo guardar el examen dental', 'error');
        }
    };

    if (loading) return (
        <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                    <ClipboardList size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Examen Dental (Orden Literario)</h3>
                    <p className="text-xs text-gray-500">Registro de hallazgos por pieza dental</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {toothNumbersLiterary.map((column, colIdx) => (
                    <div key={colIdx} className="space-y-3">
                        {column.map(num => (
                            <div key={num} className="flex items-center gap-3 group">
                                <span className="w-8 text-[11px] font-black text-gray-400 group-hover:text-purple-500 transition-colors">
                                    {num}
                                </span>
                                <input 
                                    type="text" 
                                    value={detalle[num] || ''}
                                    onChange={(e) => handleInputChange(num, e.target.value.toUpperCase())}
                                    placeholder="..."
                                    disabled={readOnly}
                                    className={`flex-1 px-3 py-1.5 text-xs font-bold border rounded-lg outline-none transition-all ${readOnly ? 'bg-gray-50 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800 text-gray-500' : 'bg-white dark:bg-gray-900/30 border-purple-200 dark:border-purple-900/50 focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-white'}`}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExamenDentalLiterario;
