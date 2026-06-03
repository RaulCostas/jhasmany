import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Paciente, HistoriaClinica, HistoriaClinicaDiagnostico } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import { getLocalDateString } from '../utils/dateUtils';
import { CIE10_DISORDERS } from '../constants/cie10';
import { Calendar, Info, Stethoscope, Plus, Trash2, AlertCircle } from 'lucide-react';

interface HistoriaClinicaFormProps {
    pacienteId: number;
    paciente?: Paciente | null;
    onSuccess: () => void;
    historiaToEdit: HistoriaClinica | null;
    onCancelEdit: () => void;
}

const HistoriaClinicaForm: React.FC<HistoriaClinicaFormProps> = ({
    pacienteId,
    paciente,
    onSuccess,
    historiaToEdit,
    onCancelEdit,
}) => {
    const [formData, setFormData] = useState({
        fecha: getLocalDateString(),
        modalidad: 'Presencial',
        servicio: 'Psiquiatria',
        motivo_visita: '',
        examen_fisico: '',
        examen_mental: '',
        examenes_auxiliares: '',
        plan_trabajo: '',
        derivar_consulta: 'NO',
        derivar_consulta_detalle: ''
    });

    const [diagnosticosList, setDiagnosticosList] = useState<HistoriaClinicaDiagnostico[]>([]);
    const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Nuevo Registro Clínico',
            content: 'Guarde las notas de evolución del paciente. Seleccione modalidad y servicio, detalle anamnesis, cargue exámenes físicos, agregue múltiples diagnósticos CIE-10 y defina el plan de trabajo.'
        },
        {
            title: 'Sección Diagnósticos',
            content: 'Use "Agregar Diagnóstico" para cargar uno o más diagnósticos CIE-10. Escriba en la caja para buscar y autocompletar códigos de trastornos mentales (F00-F99).'
        },
        {
            title: 'Derivación',
            content: 'Si marca "Derivar consulta" como SÍ, se activará una caja de texto adicional para detallar el centro, especialista o motivo de la derivación.'
        }
    ];

    useEffect(() => {
        if (historiaToEdit) {
            setFormData({
                fecha: historiaToEdit.fecha.split('T')[0],
                modalidad: historiaToEdit.modalidad || 'Presencial',
                servicio: historiaToEdit.servicio || 'Psiquiatria',
                motivo_visita: historiaToEdit.motivo_visita || '',
                examen_fisico: historiaToEdit.examen_fisico || '',
                examen_mental: historiaToEdit.examen_mental || '',
                examenes_auxiliares: historiaToEdit.examenes_auxiliares || '',
                plan_trabajo: historiaToEdit.plan_trabajo || '',
                derivar_consulta: historiaToEdit.derivar_consulta || 'NO',
                derivar_consulta_detalle: historiaToEdit.derivar_consulta_detalle || ''
            });
            setDiagnosticosList(historiaToEdit.diagnosticos || []);
        } else {
            resetForm();
        }
    }, [historiaToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            fecha: getLocalDateString(),
            modalidad: 'Presencial',
            servicio: 'Psiquiatria',
            motivo_visita: '',
            examen_fisico: '',
            examen_mental: '',
            examenes_auxiliares: '',
            plan_trabajo: '',
            derivar_consulta: 'NO',
            derivar_consulta_detalle: ''
        });
        setDiagnosticosList([]);
        setSearchTerms({});
    };

    // Diagnoses methods
    const handleAddDiagnostico = () => {
        setDiagnosticosList(prev => [...prev, { diagnostico: '', tipo: 'Presuntivo' }]);
    };

    const handleRemoveDiagnostico = (index: number) => {
        setDiagnosticosList(prev => prev.filter((_, i) => i !== index));
        setSearchTerms(prev => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
        });
    };

    const handleUpdateDiagnosticoType = (index: number, tipo: 'Definitivo' | 'Repetitivo' | 'Presuntivo') => {
        setDiagnosticosList(prev => prev.map((item, i) => i === index ? { ...item, tipo } : item));
    };

    const handleSelectDiagnostico = (index: number, val: string) => {
        setDiagnosticosList(prev => prev.map((item, i) => i === index ? { ...item, diagnostico: val } : item));
        setSearchTerms(prev => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
        });
    };

    const handleSave = async () => {
        // Validate diagnoses
        const hasEmptyDiag = diagnosticosList.some(d => !d.diagnostico.trim());
        if (hasEmptyDiag) {
            Swal.fire({
                icon: 'warning',
                title: 'Diagnósticos incompletos',
                text: 'Por favor complete o elimine las filas de diagnóstico vacías.',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        try {
            const payload: any = {
                ...formData,
                pacienteId: Number(pacienteId),
                diagnosticos: diagnosticosList
            };

            // Add user ID for auditing
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    payload.usuarioId = JSON.parse(userStr).id;
                } catch (e) {
                    console.error("Error parsing user for auditing", e);
                }
            }

            if (historiaToEdit) {
                await api.patch(`/historia-clinica/${historiaToEdit.id}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Seguimiento Actualizado',
                    text: 'Historia Clínica actualizada exitosamente',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            } else {
                await api.post('/historia-clinica', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Seguimiento Guardado',
                    text: 'Historia Clínica guardada exitosamente',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
            onSuccess();
            onCancelEdit();
            resetForm();
        } catch (error) {
            console.error('Error saving historia clinica:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar el registro',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSave();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className={`p-2 rounded-lg ${historiaToEdit ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300' : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'}`}>
                        <Stethoscope size={24} />
                    </span>
                    {historiaToEdit ? 'Editar Seguimiento Clínico' : 'Nuevo Seguimiento Clínico'}
                </h3>
                <button
                    type="button"
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* --- DATOS GENERALES --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b dark:border-gray-600 pb-2">Datos Generales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Fecha */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Modalidad */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Modalidad</label>
                            <select
                                name="modalidad"
                                value={formData.modalidad}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Presencial">Presencial</option>
                                <option value="Virtual">Virtual</option>
                            </select>
                        </div>

                        {/* Servicio */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Servicio</label>
                            <select
                                name="servicio"
                                value={formData.servicio}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Psiquiatria">Psiquiatría</option>
                                <option value="Neuropsiquiatria">Neuropsiquiatría</option>
                                <option value="Psicologia">Psicología</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- ANAMNESIS --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b dark:border-gray-600 pb-2">Anamnesis</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tipo de Enfermedad (jalar de Ficha) */}
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <span className="block text-xs font-bold text-gray-400 uppercase">Tiempo / Tipo de Enfermedad (Ficha Médica)</span>
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                                {paciente?.fichaClinica?.enf_actual_te || <span className="text-gray-400 italic">No registrado en Ficha</span>}
                            </span>
                        </div>

                        {/* Relato Cronológico (jalar de Ficha) */}
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <span className="block text-xs font-bold text-gray-400 uppercase">Relato Cronológico (Ficha Médica)</span>
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium line-clamp-3" title={paciente?.fichaClinica?.enf_actual_relato}>
                                {paciente?.fichaClinica?.enf_actual_relato || <span className="text-gray-400 italic">No registrado en Ficha</span>}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Motivo de Visita</label>
                        <textarea
                            name="motivo_visita"
                            value={formData.motivo_visita}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Describa el motivo de la consulta actual..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                        />
                    </div>
                </div>

                {/* --- EXAMEN FISICO Y MENTAL --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b dark:border-gray-600 pb-2">Examen Físico y Mental</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Examen Físico</label>
                            <textarea
                                name="examen_fisico"
                                value={formData.examen_fisico}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Escriba los resultados del examen físico..."
                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Examen Mental</label>
                            <textarea
                                name="examen_mental"
                                value={formData.examen_mental}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Escriba los resultados del examen mental..."
                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Exámenes Auxiliares</label>
                        <textarea
                            name="examenes_auxiliares"
                            value={formData.examenes_auxiliares}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Ingrese resultados de exámenes auxiliares, de laboratorio o de imagen..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                        />
                    </div>
                </div>

                {/* --- DIAGNOSTICOS --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Diagnósticos</h4>
                        <button
                            type="button"
                            onClick={handleAddDiagnostico}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-sm transition-all"
                        >
                            <Plus size={14} />
                            Agregar Diagnóstico
                        </button>
                    </div>

                    {diagnosticosList.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 italic bg-white dark:bg-gray-800 p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                            <AlertCircle size={16} />
                            <span>No se han agregado diagnósticos para esta consulta. Haga clic en "Agregar Diagnóstico".</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {diagnosticosList.map((item, idx) => {
                                const activeSearch = searchTerms[idx] !== undefined;
                                const currentSearchVal = searchTerms[idx] || '';
                                
                                const filteredDisorders = CIE10_DISORDERS.filter(d => 
                                    d.code.toLowerCase().includes(currentSearchVal.toLowerCase()) ||
                                    d.description.toLowerCase().includes(currentSearchVal.toLowerCase())
                                );

                                return (
                                    <div key={idx} className="flex flex-col md:flex-row gap-4 items-start bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                        
                                        {/* Diagnosis Select Auto-complete */}
                                        <div className="flex-1 w-full relative">
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Diagnóstico</label>
                                            <input
                                                type="text"
                                                placeholder="Escriba código o nombre para buscar (ej: F00)..."
                                                value={searchTerms[idx] !== undefined ? searchTerms[idx] : item.diagnostico}
                                                onFocus={() => setSearchTerms(prev => ({ ...prev, [idx]: item.diagnostico || '' }))}
                                                onBlur={() => setTimeout(() => {
                                                    setSearchTerms(prev => {
                                                        const copy = { ...prev };
                                                        delete copy[idx];
                                                        return copy;
                                                    });
                                                }, 200)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSearchTerms(prev => ({ ...prev, [idx]: val }));
                                                }}
                                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                            
                                            {/* Dropdown list */}
                                            {activeSearch && (
                                                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 divide-y divide-gray-100 dark:divide-gray-700">
                                                    {filteredDisorders.length === 0 ? (
                                                        <div className="p-3 text-xs text-gray-400 italic">No se encontraron resultados</div>
                                                    ) : (
                                                        filteredDisorders.map(d => (
                                                            <button
                                                                key={d.code}
                                                                type="button"
                                                                onMouseDown={() => handleSelectDiagnostico(idx, `${d.code} ${d.description}`)}
                                                                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2 border-0 shadow-none focus:outline-none"
                                                            >
                                                                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded text-[10px]">{d.code}</span>
                                                                <span className="font-medium truncate">{d.description}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Diagnostic Type Select */}
                                        <div className="w-full md:w-56">
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Tipo</label>
                                            <select
                                                value={item.tipo}
                                                onChange={(e) => handleUpdateDiagnosticoType(idx, e.target.value as any)}
                                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            >
                                                <option value="Definitivo">Definitivo</option>
                                                <option value="Repetitivo">Repetitivo</option>
                                                <option value="Presuntivo">Presuntivo</option>
                                            </select>
                                        </div>

                                        {/* Delete Diagnosis */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDiagnostico(idx)}
                                            className="p-2 text-red-500 bg-transparent border-0 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg md:self-end mt-1 shadow-none focus:outline-none"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* --- PLAN DE TRABAJO --- */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-6">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b dark:border-gray-600 pb-2">Plan de Trabajo</h4>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Plan de Trabajo</label>
                        <textarea
                            name="plan_trabajo"
                            value={formData.plan_trabajo}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Describa el plan de trabajo terapéutico o medicación..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                        />
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">¿Derivar Consulta?</span>
                            <div className="flex gap-6">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="derivar_consulta"
                                        value="SI"
                                        checked={formData.derivar_consulta === 'SI'}
                                        onChange={handleChange}
                                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-bold">SÍ</span>
                                </label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="derivar_consulta"
                                        value="NO"
                                        checked={formData.derivar_consulta === 'NO'}
                                        onChange={handleChange}
                                        className="form-radio text-gray-500 focus:ring-gray-400 h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-bold">NO</span>
                                </label>
                            </div>
                        </div>

                        {formData.derivar_consulta === 'SI' && (
                            <div className="animate-in fade-in slide-in-from-top-1">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Detalle de Derivación</label>
                                <textarea
                                    name="derivar_consulta_detalle"
                                    value={formData.derivar_consulta_detalle}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Indique a qué especialidad, doctor o centro deriva al paciente y el motivo..."
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-start gap-3 rounded-b-xl -mx-6 -mb-6">
                    <button
                        type="submit"
                        className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {historiaToEdit ? 'Actualizar Seguimiento' : 'Guardar Seguimiento'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onCancelEdit();
                            resetForm();
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        Cancelar
                    </button>
                </div>
            </form>

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Evolución y Seguimiento Clínico"
                sections={manualSections}
            />
        </div>
    );
};

export default HistoriaClinicaForm;
