import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import type { Paciente, RecetaDetalle, Medicamento } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import { getLocalDateString } from '../utils/dateUtils';
import { formatFullName } from '../utils/formatters';
import SearchablePatientSelect from './SearchablePatientSelect';
import SearchableMedicamentoSelect from './SearchableMedicamentoSelect';
import SignatureModal from './SignatureModal';



interface FormData {
    pacienteId: number;
    userId: number;
    fecha: string;
    detalles: RecetaDetalle[];
}

interface RecetarioFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | string | null;
    pacienteId?: number | string | null;
    onSaveSuccess?: () => void;
}

const viasAdministracion = [
    'Oral', 'Sublingual', 'Rectal', 'Intravenosa', 'Intramoscular', 
    'Subcutanea', 'Dermica', 'Nasal', 'Oftalmologica', 'Inhalatoria', 
    'Epidural', 'Intratecal', 'Vaginal', 'Intraarticular', 'Parenteral', 'Otros'
];

const RecetarioForm: React.FC<RecetarioFormProps> = ({ isOpen, onClose, id, pacienteId, onSaveSuccess }) => {
    const [presetPacienteName, setPresetPacienteName] = useState('');
    const [medicamentosCatalog, setMedicamentosCatalog] = useState<Medicamento[]>([]);
    const [hasRegisteredSignature, setHasRegisteredSignature] = useState(false);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [estaFirmado, setEstaFirmado] = useState(false);

    const checkRegisteredSignature = async (userIdToCheck: number) => {
        if (!userIdToCheck) return;
        try {
            const response = await api.get(`/firmas/documento/usuario/${userIdToCheck}`);
            const signatures = response.data;
            if (signatures && signatures.length > 0) {
                const latestSignature = signatures[signatures.length - 1];
                setHasRegisteredSignature(true);
                setSignaturePreview(latestSignature.firmaData);
                setEstaFirmado(true);
            } else {
                setHasRegisteredSignature(false);
                setSignaturePreview(null);
                setEstaFirmado(false);
            }
        } catch (error) {
            console.error('Error checking user signature:', error);
        }
    };
    
    const isEditing = Boolean(id);
    const localDate = getLocalDateString();

    const [formData, setFormData] = useState<FormData>({
        pacienteId: 0,
        userId: 0,
        fecha: localDate,
        detalles: [{
            id: 0,
            recetaId: 0,
            medicamentoId: 0,
            tiempo: '',
            via: 'Oral',
            posologia: '',
            cantidad: ''
        }]
    });

    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Crear/Editar Receta',
            content: 'Complete los datos del formulario para registrar la receta. Seleccione al paciente y configure las líneas de medicamentos.'
        },
        {
            title: 'Detalle de Medicamentos',
            content: 'En cada fila, busque y seleccione el medicamento del catálogo, y configure la Posología (ej: 1 comprimido), Vía (ej: Oral), Frecuencia/Tiempo (ej: cada 8 horas por 5 días) y Cantidad.'
        },
        {
            title: 'Catálogo de Medicamentos',
            content: 'Los medicamentos disponibles se cargan automáticamente desde la base de datos. Si un medicamento no aparece, regístrelo en la pestaña Medicamentos dentro de Configuración.'
        }
    ];

    // Load Medicines Catalog
    useEffect(() => {
        if (!isOpen) return;

        api.get('/medicamento?limit=9999')
            .then(res => {
                setMedicamentosCatalog(res.data.data || []);
            })
            .catch(err => {
                console.error('Error loading medicines catalog:', err);
            });
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const userStr = localStorage.getItem('user');
        let currentUserId = 0;
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.id) {
                    currentUserId = user.id;
                    setFormData(prev => ({ ...prev, userId: user.id }));
                }
            } catch (e) {
                console.error("Error parsing user", e);
            }
        }

        if (pacienteId) {
            setFormData(prev => ({ ...prev, pacienteId: Number(pacienteId) }));
            api.get(`/pacientes/${pacienteId}`)
                .then(res => {
                    setPresetPacienteName(formatFullName(res.data));
                })
                .catch(err => {
                    console.error('Error fetching preset patient info:', err);
                });
        } else {
            setPresetPacienteName('');
        }

        if (isEditing) {
            fetchReceta();
        } else {
            if (currentUserId) {
                checkRegisteredSignature(currentUserId);
            }
            setFormData(prev => ({
                ...prev,
                pacienteId: pacienteId ? Number(pacienteId) : 0,
                userId: currentUserId,
                fecha: localDate,
                detalles: [{
                    id: 0,
                    recetaId: 0,
                    medicamentoId: 0,
                    tiempo: '',
                    via: 'Oral',
                    posologia: '',
                    cantidad: ''
                }]
            }));
        }
    }, [isOpen, id, pacienteId]);

    const fetchReceta = async () => {
        try {
            const response = await api.get(`/receta/${id}`);
            const data = response.data;
            setFormData({
                pacienteId: data.pacienteId,
                userId: data.userId,
                fecha: data.fecha.split('T')[0],
                detalles: data.detalles || []
            });
            setEstaFirmado(Boolean(data.esta_firmado));
            if (data.userId) {
                checkRegisteredSignature(data.userId);
            }
            if (!data.detalles || data.detalles.length === 0) {
                addDetalle();
            }
        } catch (error) {
            console.error('Error fetching receta:', error);
            Swal.fire('Error', 'No se pudo cargar la receta', 'error');
            onClose();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'pacienteId') ? Number(value) : value
        }));
    };

    const addDetalle = () => {
        setFormData(prev => ({
            ...prev,
            detalles: [...prev.detalles, {
                id: 0,
                recetaId: 0,
                medicamentoId: 0,
                tiempo: '',
                via: 'Oral',
                posologia: '',
                cantidad: ''
            }]
        }));
    };

    const removeDetalle = (index: number) => {
        setFormData(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
        }));
    };

    const handleDetalleChange = (index: number, field: keyof RecetaDetalle, value: any) => {
        setFormData(prev => {
            const newDetalles = [...prev.detalles];
            newDetalles[index] = { ...newDetalles[index], [field]: value };
            return { ...prev, detalles: newDetalles };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.pacienteId) {
            Swal.fire('Atención', 'Seleccione un paciente', 'warning');
            return;
        }
        if (!formData.userId) {
            Swal.fire('Atención', 'No se pudo identificar al usuario. Recargue la página.', 'warning');
            return;
        }

        // Filter out details where no medicine is selected
        const validDetalles = formData.detalles.filter(d => d.medicamentoId > 0);

        if (validDetalles.length === 0) {
            Swal.fire('Atención', 'Seleccione al menos un medicamento válido del catálogo', 'warning');
            return;
        }

        const payload = {
            ...formData,
            detalles: validDetalles,
            esta_firmado: estaFirmado
        };

        try {
            if (isEditing) {
                await api.patch(`/receta/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Receta Actualizada',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/receta', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Receta Creada',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving receta:', error);
            Swal.fire('Error', 'No se pudo guardar la receta', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50 transition-opacity">
            <div className="w-full max-w-[1000px] h-full bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto transform transition-transform animate-slide-in-right">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6 border-b dark:border-gray-700 pb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
                            <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl text-blue-600 dark:text-blue-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </span>
                            {isEditing ? 'Editar Receta' : 'Nueva Receta'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => setShowManual(true)}
                            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                            title="Ayuda / Manual"
                        >
                            ?
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Fecha <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="date"
                                        name="fecha"
                                        value={formData.fecha}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Paciente <span className="text-red-500">*</span></label>
                            {pacienteId ? (
                                <div className="p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    {presetPacienteName || 'Cargando paciente...'}
                                </div>
                            ) : (
                                <SearchablePatientSelect
                                    onSelect={(type, id) => {
                                        setFormData(prev => ({ ...prev, pacienteId: id }));
                                    }}
                                    selectedId={formData.pacienteId}
                                    selectedType="particular"
                                    allowType="particular"
                                    required
                                />
                            )}
                        </div>

                        {/* Details List */}
                        <div className="mt-6 border p-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">Detalle de Medicamentos</h3>
                                <button type="button" onClick={addDetalle} className="p-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-lg flex items-center gap-1.5 shadow transition-all text-xs font-semibold transform hover:-translate-y-0.5" title="Agregar Medicamento">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Agregar Medicamento
                                </button>
                            </div>
                            <div className="space-y-4">
                                {formData.detalles.map((detalle, index) => (
                                    <div key={index} className="p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow transition-shadow relative">
                                        {/* Header Row */}
                                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100 dark:border-gray-600">
                                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                                Medicamento #{index + 1}
                                            </span>
                                            {!(formData.detalles.length === 1 && index === 0) && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeDetalle(index)}
                                                    className="p-1.5 bg-red-100 hover:bg-red-200 active:scale-95 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold transform hover:-translate-y-0.5"
                                                    title="Eliminar fila"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>

                                        {/* Row 1: Medicamento (Full Width) */}
                                        <div className="mb-3">
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Medicamento <span className="text-red-500">*</span></label>
                                            <SearchableMedicamentoSelect
                                                medicamentosCatalog={medicamentosCatalog}
                                                selectedId={detalle.medicamentoId}
                                                onSelect={(val) => handleDetalleChange(index, 'medicamentoId', val)}
                                                required
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Row 2: Grid of Secondary Fields */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                            {/* Tiempo */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tiempo (días) <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={detalle.tiempo}
                                                    onChange={(e) => handleDetalleChange(index, 'tiempo', e.target.value)}
                                                    placeholder="Ej: 5 días, 10 días..."
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    required
                                                />
                                            </div>

                                            {/* Via */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Vía (adm.) <span className="text-red-500">*</span></label>
                                                <select
                                                    value={detalle.via}
                                                    onChange={(e) => handleDetalleChange(index, 'via', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    required
                                                >
                                                    {viasAdministracion.map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Posología */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Posología <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={detalle.posologia}
                                                    onChange={(e) => handleDetalleChange(index, 'posologia', e.target.value)}
                                                    placeholder="Ej: 1 tableta, 5ml..."
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    required
                                                />
                                            </div>

                                            {/* Cantidad */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Cantidad <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={detalle.cantidad}
                                                    onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                                                    placeholder="Ej: 15..."
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Firma Digital de la Receta */}
                        <div className="mt-6 border p-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <span>✍️</span> Firma Digital de la Receta
                            </h3>
                            {hasRegisteredSignature ? (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-800 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800 w-[140px] h-[70px] flex items-center justify-center overflow-hidden">
                                            <img src={signaturePreview || undefined} alt="Firma registrada" className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                                <span>✓</span> Firma digital registrada
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                Se aplicará automáticamente a esta receta.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={estaFirmado}
                                                onChange={(e) => setEstaFirmado(e.target.checked)}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                                            />
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Firmar receta al guardar
                                            </span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowSignatureModal(true)}
                                            className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            Actualizar Firma
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-700 border border-yellow-200 dark:border-yellow-800/50 rounded-xl shadow-sm">
                                    <div>
                                        <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                                            <span>⚠️</span> No tienes una firma digital registrada
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Registra tu firma para poder emitir recetas firmadas automáticamente.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowSignatureModal(true)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm shadow transition-all transform hover:-translate-y-0.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Registrar Firma Digital
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-start gap-3 mt-8 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl -mx-6 -mb-6">
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                {isEditing ? 'Actualizar Receta' : 'Guardar Receta'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Cancelar
                            </button>
                        </div>
                    </form>

                    {/* Manual Modal */}
                    <ManualModal
                        isOpen={showManual}
                        onClose={() => setShowManual(false)}
                        title="Manual de Usuario - Formulario de Receta"
                        sections={manualSections}
                    />

                    {showSignatureModal && formData.userId > 0 && (
                        <SignatureModal
                            isOpen={showSignatureModal}
                            onClose={() => setShowSignatureModal(false)}
                            tipoDocumento="usuario"
                            documentoId={formData.userId}
                            rolFirmante="doctor"
                            onSuccess={() => checkRegisteredSignature(formData.userId)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecetarioForm;
