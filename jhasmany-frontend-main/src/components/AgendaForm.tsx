import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatFullName } from '../utils/formatters';
import type { Agenda, Paciente, Doctor } from '../types';

interface AgendaFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData: Agenda | null;
    defaultDate: string;
    defaultTime?: string;
    defaultConsultorio?: number;
    existingAppointments?: Agenda[];
    defaultPacienteId?: number;
}

import QuickPacienteForm from './QuickPacienteForm';
import Swal from 'sweetalert2';



const AgendaForm: React.FC<AgendaFormProps> = ({
    isOpen, onClose, onSave, initialData, defaultDate, defaultTime, defaultConsultorio, existingAppointments = [],
    defaultPacienteId
}) => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [patients, setPatients] = useState<Paciente[]>([]);
    const [isQuickPatientOpen, setIsQuickPatientOpen] = useState(false);
    const [isNonPatientEvent, setIsNonPatientEvent] = useState(false);

    const [formData, setFormData] = useState({
        fecha: defaultDate,
        hora: defaultTime || '08:00',
        duracion: 30,
        pacienteId: defaultPacienteId || 0,
        doctorId: 0,
        estado: 'agendado',
        usuarioId: 0,
        observaciones: '',
        motivoCancelacion: ''
    });

    const [maxDuration, setMaxDuration] = useState(120); // Default max
    const [durationWarning, setDurationWarning] = useState<string | null>(null);

    // Calculate Max Duration on changes
    useEffect(() => {
        if (!formData.fecha || !formData.hora) return;

        // Only validate if date matches defaultDate (since existingAppointments provides data for defaultDate)
        if (formData.fecha !== defaultDate) {
            setMaxDuration(120);
            setDurationWarning(null);
            return;
        }

        const timeToMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const currentStart = timeToMinutes(formData.hora);

        const dayAppointments = existingAppointments.filter(app =>
            app.id !== initialData?.id &&
            app.estado !== 'cancelado' &&
            app.estado !== 'no asistio' &&
            app.estado !== 'eliminado'
        );

        dayAppointments.sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora));

        const nextApp = dayAppointments.find(app => timeToMinutes(app.hora) > currentStart);

        if (nextApp) {
            const nextStart = timeToMinutes(nextApp.hora);
            const diff = nextStart - currentStart;

            if (diff > 0) {
                setMaxDuration(diff);
                if (formData.duracion > diff) {
                    setFormData(prev => ({ ...prev, duracion: diff }));
                    setDurationWarning(`La duración se ajustó a ${diff} min por choque con cita de las ${nextApp.hora}`);
                } else {
                    setDurationWarning(null);
                }
            }
        } else {
            setMaxDuration(240);
            setDurationWarning(null);
        }

    }, [formData.hora, formData.fecha, formData.duracion, existingAppointments, defaultDate, initialData]);

    // Get current user
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setFormData(prev => ({ ...prev, usuarioId: user.id }));
            } catch (e) {
                console.error("Error parsing user", e);
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen && !initialData) {
            setFormData(prev => ({
                ...prev,
                fecha: defaultDate,
                hora: defaultTime || '08:00',
                pacienteId: defaultPacienteId || 0,
                doctorId: 0,
                observaciones: '',
                motivoCancelacion: ''
            }));
            setIsNonPatientEvent(false);
        }
    }, [isOpen, initialData, defaultDate, defaultTime]);

    useEffect(() => {
        fetchCatalogs();
        if (initialData) {
            setFormData({
                fecha: initialData.fecha,
                hora: initialData.hora,
                duracion: initialData.duracion,
                pacienteId: initialData.pacienteId || 0,
                doctorId: initialData.doctorId,
                estado: initialData.estado,
                usuarioId: initialData.usuarioId,
                observaciones: initialData.observaciones || '',
                motivoCancelacion: initialData.motivoCancelacion || ''
            });

            if (!initialData.pacienteId || initialData.pacienteId === 0) {
                setIsNonPatientEvent(true);
            } else {
                setIsNonPatientEvent(false);
            }
        }
    }, [initialData]);

    const fetchCatalogs = async () => {
        try {
            const [doctorsRes, patientsRes] = await Promise.all([
                api.get('/doctors?limit=1000'),
                api.get('/pacientes?limit=5000')
            ]);
            const activeDoctors = (doctorsRes.data.data || []).filter((doctor: any) => doctor.estado === 'activo');
            setDoctors(activeDoctors);

            const activePatients = (patientsRes.data.data || []).filter((patient: any) => patient.estado === 'activo');
            activePatients.sort((a: Paciente, b: Paciente) => {
                const nameA = formatFullName(a).toLowerCase();
                const nameB = formatFullName(b).toLowerCase();
                return nameA.localeCompare(nameB);
            });
            setPatients(activePatients);
        } catch (error) {
            console.error('Error fetching catalogs:', error);
        }
    };

    const handlePatientCreated = async (newPaciente: Paciente) => {
        await fetchCatalogs();
        setFormData(prev => ({
            ...prev,
            pacienteId: newPaciente.id,
            observaciones: ''
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: (name.includes('Id') || name === 'duracion') ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields before submitting
        if (!formData.doctorId || formData.doctorId <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor seleccione un doctor',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        // Validate patient if not a non-patient event
        if (!isNonPatientEvent && (!formData.pacienteId || formData.pacienteId <= 0)) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor seleccione un paciente o marque como evento sin paciente',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        // Validate observaciones for non-patient events
        if (isNonPatientEvent && !formData.observaciones.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor ingrese una descripción para el evento',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        // Prepare payload
        const payload = {
            ...formData,
            pacienteId: formData.pacienteId > 0 ? formData.pacienteId : null,
            observaciones: formData.observaciones || (isNonPatientEvent ? 'Bloqueo / Evento' : '')
        };

        // Validate user
        if (!payload.usuarioId || payload.usuarioId <= 0) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const u = JSON.parse(userStr);
                payload.usuarioId = u.id;
            }
        }

        if (!payload.usuarioId || payload.usuarioId <= 0) {
            Swal.fire('Error', 'No se pudo identificar al usuario. Inicie sesión nuevamente.', 'error');
            return;
        }

        try {
            let response;
            if (initialData) {
                response = await api.patch(`/agenda/${initialData.id}`, payload);
            } else {
                response = await api.post('/agenda', payload);
            }

            if (response.data && response.data.error) {
                throw new Error(response.data.message + ' | ' + response.data.details);
            }

            await Swal.fire({
                icon: 'success',
                title: initialData ? 'Cita Actualizada' : 'Cita Agendada',
                text: initialData ? 'La cita se ha actualizado correctamente' : 'La cita se ha agendado correctamente',
                timer: 1500,
                showConfirmButton: false
            });
            onSave();
        } catch (error: any) {
            console.error('Error saving appointment:', error);
            const msg = error.response?.data?.message || error.message || 'Error al guardar la cita';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(msg) ? msg.join(', ') : msg
            });
        }
    };

    const handleDelete = async () => {
        try {
            // ALWAYS get current user from localStorage for the action of deleting
            // formData.usuarioId contains whom created the appointment, not who is deleting it
            let currentUserId = 0;
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    currentUserId = JSON.parse(userStr).id;
                } catch (e) {
                    console.error("Error parsing user", e);
                }
            }

            // Fallback to 0 if not found, but it should be found if logged in
            await api.delete(`/agenda/${initialData?.id}?userId=${currentUserId}`);
            await Swal.fire({
                icon: 'success',
                title: 'Cita Eliminada',
                text: 'La cita ha sido eliminada correctamente',
                timer: 1500,
                showConfirmButton: false
            });
            onSave();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al eliminar la cita'
            });
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-[500px] max-w-[90%] max-h-[90vh] overflow-y-auto shadow-xl text-gray-800 dark:text-gray-100">
                <h2 className="mt-0 text-xl font-bold mb-4 flex items-center gap-3">
                    <span className="p-2 bg-purple-100 dark:bg-purple-900 rounded-xl text-purple-600 dark:text-purple-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </span>
                    {initialData ? 'Editar Cita' : 'Nueva Cita'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">




                        {/* Fecha y Hora */}
                        <div>
                            <label className="block mb-1 font-bold text-sm">Fecha:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-bold text-sm">Hora:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <input
                                    type="time"
                                    name="hora"
                                    value={formData.hora}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm">Duración (min):</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <input
                                    type="number"
                                    name="duracion"
                                    value={formData.duracion}
                                    onChange={handleChange}
                                    step="30"
                                    min="30"
                                    max={maxDuration}
                                    placeholder="Ej. 30"
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            {durationWarning && (
                                <div className="text-red-500 text-xs mt-1">
                                    {durationWarning}
                                </div>
                            )}
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="inline-flex items-center cursor-pointer mb-4">
                                <input
                                    type="checkbox"
                                    checked={isNonPatientEvent}
                                    onChange={(e) => {
                                        setIsNonPatientEvent(e.target.checked);
                                        if (e.target.checked) {
                                            setFormData(prev => ({
                                                ...prev,
                                                pacienteId: 0,
                                                observaciones: '' // Clear observations to avoid confusion
                                            }));
                                        }
                                    }}
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded-xl border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
                                />
                                <span className="ml-2 text-gray-700 dark:text-gray-300 font-bold">Bloqueo / Evento (Sin Paciente)</span>
                            </label>
                        </div>

                        {!isNonPatientEvent && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block mb-1 font-bold text-sm">Paciente:</label>
                                <div className="flex gap-2.5">
                                    <div className="relative flex-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                        </svg>
                                        <select
                                            name="pacienteId"
                                            value={formData.pacienteId}
                                            onChange={handleChange}
                                            required={!isNonPatientEvent}
                                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                        >
                                            <option value={0}>-- Seleccione Paciente --</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{formatFullName(p)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsQuickPatientOpen(true)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2 rounded-xl flex items-center justify-center transform hover:-translate-y-0.5 transition-all active:scale-95 shadow-md"
                                        title="Nuevo Paciente Rápido"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Doctor */}
                        <div className="col-span-1 md:col-span-2">
                            <label className="block mb-1 font-bold text-sm">Doctor:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <select
                                    name="doctorId"
                                    value={formData.doctorId}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                ><option value={0}>-- Seleccione Doctor --</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{formatFullName(d)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block mb-1 font-bold text-sm">
                                {isNonPatientEvent ? 'Motivo / Descripción del Evento:' : 'Observaciones:'}
                            </label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-3 text-gray-400 pointer-events-none">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                <textarea
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder={isNonPatientEvent ? "Ej: Reunión, Viaje..." : "Detalle u observaciones de la cita..."}
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    required={isNonPatientEvent}
                                />
                            </div>
                        </div>



                        {/* Estado */}
                        <div>
                            <label className="block mb-1 font-bold text-sm">Estado:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                                    <line x1="12" y1="2" x2="12" y2="12"></line>
                                </svg>
                                <select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                >
                                    <option value="" disabled>-- Seleccione --</option>
                                    <option value="agendado">Agendado</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="atendido">Atendido</option>
                                    <option value="no asistio">No Asistió</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>
                        </div>



                        {/* Motivo de Cancelación - Only show when estado is cancelado */}
                        {formData.estado === 'cancelado' && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block mb-1 font-bold text-sm">Motivo de Cancelación:</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-3 text-gray-400 pointer-events-none">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    <textarea
                                        name="motivoCancelacion"
                                        value={formData.motivoCancelacion}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Ingrese el motivo de la cancelación..."
                                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-start gap-3 rounded-b-xl mt-6">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            {initialData ? 'Actualizar' : 'Guardar'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Cancelar
                        </button>

                        {initialData && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="ml-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Eliminar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Quick Patient Modal - Moved outside the form */}
            <QuickPacienteForm
                isOpen={isQuickPatientOpen}
                onClose={() => setIsQuickPatientOpen(false)}
                onSuccess={handlePatientCreated}
            />
        </div>
    );
};

export default AgendaForm;
