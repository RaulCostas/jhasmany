import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatFullName } from '../utils/formatters';
import type { GastoFijo, Recordatorio, RecordatorioTratamiento } from '../types';

import { getLocalDateString, formatDate } from '../utils/dateUtils';

import Swal from 'sweetalert2';
import PagosGastosFijosForm from './PagosGastosFijosForm';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<{ totalPacientes: number, birthdayPacientes: any[] }>({ totalPacientes: 0, birthdayPacientes: [] });
    const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
    const [dueGastos, setDueGastos] = useState<GastoFijo[]>([]);

    const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
    const [tratamientosPendientes, setTratamientosPendientes] = useState<RecordatorioTratamiento[]>([]);
    const [sendingGreeting, setSendingGreeting] = useState<number[]>([]);
    const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
    const [selectedGasto, setSelectedGasto] = useState<GastoFijo | null>(null);


    const [loading, setLoading] = useState(true);

    // Permission Logic
    const userString = localStorage.getItem('user');
    let user = null;
    try {
        user = userString ? JSON.parse(userString) : null;
    } catch {
        user = null;
    }
    const permisos = (user && Array.isArray(user.permisos)) ? user.permisos : [];
    const hasAccess = (moduleId: string) => !permisos.includes(moduleId);

    useEffect(() => {
        fetchDashboardSummary();
    }, []);

    const fetchDashboardSummary = async () => {
        setLoading(true);
        try {
            const response = await api.get('/dashboard/summary');
            const data = response.data;
            
            setStats(data.pacienteStats);
            setTodayAppointmentsCount(data.todayAppointmentsCount);
            setDueGastos(data.dueGastos);
            setRecordatorios(data.reminders);
            setTratamientosPendientes(data.pendingTreatments);
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCompletarTratamiento = async (id: number) => {
        try {
            await api.patch(`/recordatorio-tratamiento/${id}`, { estado: 'completado' });
            fetchDashboardSummary(); // Refresh all to keep it simple and consistent
        } catch (error) {
            console.error('Error al completar tratamiento:', error);
        }
    };



    const handleCompletarRecordatorioGeneral = async (id: number) => {
        try {
            await api.patch(`/recordatorio/${id}`, { estado: 'inactivo' });
            fetchDashboardSummary();
        } catch (error) {
            console.error('Error al completar recordatorio:', error);
        }
    };

    const calculateAge = (dateString: string) => {
        const birthDate = new Date(dateString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleSendGreeting = async (paciente: any) => {

        setSendingGreeting((prev) => [...prev, paciente.id]);
        try {
            await api.post(`/chatbot/send-birthday/${paciente.id}`, { clinicName: 'JHASMANY' });
            Swal.fire({
                icon: 'success',
                title: '¡Enviado!',
                text: 'Felicitación enviada correctamente',
                timer: 1500,
                showConfirmButton: false
            });

            // Actualizar estado local para deshabilitar botón instantáneamente
            const currentYear = new Date().getFullYear();
            setStats(prev => ({
                ...prev,
                birthdayPacientes: prev.birthdayPacientes.map((p: any) => 
                    p.id === paciente.id ? { ...p, ultimo_cumpleanos_felicitado: currentYear } : p
                )
            }));
        } catch (error: any) {
            console.error('Error enviando felicitación:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'El chatbot no está conectado a WhatsApp',
                timer: 1500,
                showConfirmButton: false
            });
        } finally {
            setSendingGreeting((prev) => prev.filter((id) => id !== paciente.id));
        }
    };

    // Removed explicit loading spinner to satisfy user preference for immediate transition

    return (
        <div className="content-card dark:bg-gray-800 p-8 rounded-xl shadow-sm transition-colors duration-200">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">
                Bienvenido a Dr. Ojeda
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 text-center mb-8">
                Sistema de Gestión
            </p>



            {/* Recordatorios Section */}
            {hasAccess('dashboard_recordatorios') && recordatorios.length > 0 && (
                <div className="mb-8 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
                        <span>🔔</span> Recordatorios Activos
                    </h2>
                    <div className="space-y-3">
                        {recordatorios.map(recordatorio => (
                            <div
                                key={recordatorio.id}
                                className="flex justify-between items-start bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${recordatorio.tipo === 'personal'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                            }`}>
                                            {recordatorio.tipo === 'personal' ? '👤 Personal' : '🏥 Consultorio'}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(recordatorio.fecha)} - {recordatorio.hora.substring(0, 5)}
                                        </span>
                                    </div>
                                    <p className="text-gray-800 dark:text-white font-medium mb-1">
                                        {recordatorio.mensaje}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Repetir: {recordatorio.repetir}
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl text-purple-500 dark:text-purple-400">
                                        🔔
                                    </div>
                                    <button
                                        onClick={() => handleCompletarRecordatorioGeneral(recordatorio.id)}
                                        title="Marcar como visto / inactivar"
                                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tratamientos Pendientes Section */}
            {hasAccess('dashboard_seguimiento') && tratamientosPendientes.length > 0 && (
                <div className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2">
                        <span>📋</span> Seguimiento Clínico
                    </h2>
                    <div className="space-y-3">
                        {tratamientosPendientes.map(recordatorio => (
                            <div
                                key={recordatorio.id}
                                className="flex justify-between items-start bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                            Tratamiento
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(recordatorio.fechaRecordatorio)}
                                        </span>
                                    </div>
                                    <div className="text-gray-800 dark:text-white mb-1">
                                        <span className="font-bold block text-lg mb-1">{formatFullName(recordatorio.historiaClinica?.paciente)}</span>
                                        <div className="text-sm mt-1">
                                            <span className="font-semibold text-indigo-700 dark:text-indigo-300">Servicio:</span> {recordatorio.historiaClinica?.servicio}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Fecha Cita: {formatDate(recordatorio.historiaClinica?.fecha)} • Recordatorio a los {recordatorio.dias} días
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/pacientes/${recordatorio.historiaClinica?.pacienteId}/historia-clinica`)}
                                        className="mt-3 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                                    >
                                        Ver Seguimiento Clínico
                                    </button>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl text-indigo-500 dark:text-indigo-400">
                                        📋
                                    </div>
                                    <button
                                        onClick={() => handleCompletarTratamiento(recordatorio.id)}
                                        title="Marcar como visto / completado"
                                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}





            {/* Expenses Due Today Section */}
            {hasAccess('dashboard_gastos_vencidos') && dueGastos.length > 0 && (
                <div className="mb-8 bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-pink-700 dark:text-pink-400 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Gastos Fijos por Pagar Hoy
                    </h2>
                    <div className="space-y-3">
                        {dueGastos.map(gasto => (
                            <div
                                key={gasto.id}
                                className="flex justify-between items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                                        {gasto.gasto_fijo}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        Monto: {gasto.monto} {gasto.moneda}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => { setSelectedGasto(gasto); setIsGastoModalOpen(true); }}
                                        className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1 shadow-md transition-all transform hover:-translate-y-0.5"
                                    >
                                        <span>💳</span> Pagar
                                    </button>
                                    <div className="text-2xl text-pink-500 dark:text-pink-400">
                                        💸
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}



            {/* Patient Birthday Section */}
            {hasAccess('dashboard_cumpleanos') && stats.birthdayPacientes.length > 0 && (
                <div className="mb-8 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                        <span>🎉</span> Cumpleaños de Pacientes Hoy
                    </h2>
                    <div className="space-y-3">
                        {stats.birthdayPacientes.map((paciente: any) => (
                            <div
                                key={paciente.id}
                                className="flex justify-between items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                                        {formatFullName(paciente)}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        Cumple {calculateAge(paciente.fecha_nacimiento)} años hoy
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleSendGreeting(paciente)}
                                        disabled={sendingGreeting.includes(paciente.id) || paciente.ultimo_cumpleanos_felicitado === new Date().getFullYear()}
                                        className={`px-3 py-1.5 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 ${(sendingGreeting.includes(paciente.id) || paciente.ultimo_cumpleanos_felicitado === new Date().getFullYear()) ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
                                    >
                                        {sendingGreeting.includes(paciente.id) ? (
                                            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                                        ) : (
                                            <span>{paciente.ultimo_cumpleanos_felicitado === new Date().getFullYear() ? '✅' : '📲'}</span>
                                        )}
                                        {paciente.ultimo_cumpleanos_felicitado === new Date().getFullYear() ? 'Felicitado' : 'Enviar Felicitaciones'}
                                    </button>
                                    <div className="text-3xl animate-bounce">
                                        🎈
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}




            <div className="mt-12 flex justify-center gap-6 flex-wrap">
                <div className="p-6 bg-blue-500 text-white rounded-xl w-52 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 duration-200">
                    <h3 className="mb-2 text-lg font-medium opacity-90">Pacientes</h3>
                    <p className="text-3xl font-bold">{stats.totalPacientes}</p>
                </div>
                {hasAccess('dashboard_citas_hoy') && (
                    <div className="p-6 bg-green-500 text-white rounded-xl w-52 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 duration-200">
                        <h3 className="mb-2 text-lg font-medium opacity-90">Citas Hoy</h3>
                        <p className="text-3xl font-bold">{todayAppointmentsCount}</p>
                    </div>
                )}
            </div>

            {isGastoModalOpen && selectedGasto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <PagosGastosFijosForm
                        gastoFijo={selectedGasto}
                        existingPayment={null}
                        onClose={() => { setIsGastoModalOpen(false); setSelectedGasto(null); }}
                        onSave={() => {
                            setIsGastoModalOpen(false);
                            setSelectedGasto(null);
                            fetchDashboardSummary(); // Refresh list
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default Home;
