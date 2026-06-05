import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { 
    ClipboardList, Send, Copy, Eye, Plus, X, 
    ExternalLink, CheckCircle, Clock, Award, HelpCircle,
    MessageCircle, Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';

interface PacienteTest {
    id: number;
    pacienteId: number;
    nombreTest: string;
    token: string;
    fechaEnvio: string;
    estado: 'enviado' | 'completado';
    fechaCompletado: string | null;
    respuestas: Record<string, number> | null;
    puntaje: number | null;
    resultado: string | null;
    doctorId?: number | null;
    doctor?: {
        id: number;
        nombre: string;
        paterno: string;
        materno?: string;
    } | null;
}

interface Doctor {
    id: number;
    nombre: string;
    paterno: string;
    materno?: string;
    estado: string;
}

const questions = [
    { id: 1, text: "Me siento una persona tan valiosa como las otras.", type: 'positive' },
    { id: 2, text: "Generalmente me inclino a pensar que soy un fracaso.", type: 'negative' },
    { id: 3, text: "Creo que tengo algunas cualidades buenas.", type: 'positive' },
    { id: 4, text: "Soy capaz de hacer las cosas tan bien como los demás.", type: 'positive' },
    { id: 5, text: "Creo que no tengo mucho de lo que estar orgulloso.", type: 'negative' },
    { id: 6, text: "Tengo una actitud positiva hacia mí mismo.", type: 'positive' },
    { id: 7, text: "En general me siento satisfecho conmigo mismo.", type: 'positive' },
    { id: 8, text: "Me gustaría tener más respeto por mí mismo.", type: 'negative' },
    { id: 9, text: "Realmente me siento inútil en algunas ocasiones.", type: 'negative' },
    { id: 10, text: "A veces pienso que no sirvo para nada.", type: 'negative' }
];

const optionLabels: Record<number, string> = {
    1: "Muy en desacuerdo",
    2: "En desacuerdo",
    3: "De acuerdo",
    4: "Muy de acuerdo"
};

const PacienteTabTest: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [tests, setTests] = useState<PacienteTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [generatedToken, setGeneratedToken] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState<PacienteTest | null>(null);
    const [copied, setCopied] = useState(false);
    const [showManual, setShowManual] = useState(false);

    // Doctor selection state for WhatsApp sending
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
    const [testIdToWhatsApp, setTestIdToWhatsApp] = useState<number | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Historial de Tests',
            content: 'En esta pestaña puede ver todos los tests enviados y completados por el paciente, con sus puntajes e interpretaciones.'
        },
        {
            title: 'Generar Enlace de Test',
            content: 'Use el botón "Generar Enlace de Test" para crear un link único y seguro. Copie este enlace para compartirlo con el paciente por WhatsApp, correo u otro medio.'
        },
        {
            title: 'Ver Resultados',
            content: 'Haga clic en el botón "Ver Resultados" en los tests completados para ver el puntaje final, la interpretación clínica y el desglose detallado de las respuestas a cada pregunta.'
        }
    ];

    const fetchTests = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await api.get(`/paciente-test/paciente/${id}`);
            setTests(res.data);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error fetching patient tests:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar el historial de tests.',
                confirmButtonColor: '#3b82f6'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/doctors?limit=1000');
            const data = res.data.data || res.data;
            const activeDoctors = (data || []).filter((d: any) => d.estado === 'activo');
            setDoctors(activeDoctors);
        } catch (error) {
            console.error("Error fetching doctors:", error);
        }
    };

    useEffect(() => {
        fetchTests();
        fetchDoctors();
    }, [id]);

    const handleGenerateTest = async () => {
        if (!id) return;
        try {
            Swal.fire({
                title: 'Generando test...',
                text: 'Espere por favor',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const res = await api.post('/paciente-test/enviar', { pacienteId: Number(id) });
            Swal.close();

            setGeneratedToken(res.data.token);
            setShowLinkModal(true);
            setCopied(false);
            fetchTests();
        } catch (error) {
            Swal.close();
            console.error("Error generating test:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el enlace del test.',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    const getTestLink = (token: string) => {
        return `${window.location.origin}/test-publico/${token}`;
    };

    const handleCopyLink = (token: string) => {
        const url = getTestLink(token);
        navigator.clipboard.writeText(url)
            .then(() => {
                setCopied(true);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '¡Enlace copiado al portapapeles!',
                    showConfirmButton: false,
                    timer: 2000
                });
            })
            .catch(err => {
                console.error("Failed to copy link:", err);
            });
    };

    const handleDeleteTest = async (testId: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar test?',
            text: 'Se eliminará este enlace de test. Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) return;
        try {
            await api.delete(`/paciente-test/${testId}`);
            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El test ha sido eliminado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
            fetchTests();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'No se pudo eliminar el test.',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    const handleSendWhatsAppClick = (testId: number) => {
        setTestIdToWhatsApp(testId);
        setShowDoctorModal(true);
        setSelectedDoctorId('');
    };

    const handleSendWhatsAppSubmit = async () => {
        if (!testIdToWhatsApp || !selectedDoctorId) return;

        try {
            Swal.fire({
                title: 'Enviando WhatsApp...',
                text: 'Espere por favor',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            await api.post(`/paciente-test/${testIdToWhatsApp}/send-whatsapp`, {
                doctorId: Number(selectedDoctorId),
                frontendUrl: window.location.origin
            });

            Swal.fire({
                icon: 'success',
                title: '¡Enviado!',
                text: 'El enlace del test se ha enviado al WhatsApp del paciente.',
                timer: 3000,
                showConfirmButton: false
            });

            setShowDoctorModal(false);
            setTestIdToWhatsApp(null);
            setSelectedDoctorId('');
            fetchTests();
        } catch (error: any) {
            console.error("Error sending test WhatsApp:", error);
            const msg = error.response?.data?.message || 'No se pudo enviar el enlace del test por WhatsApp.';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: msg,
                confirmButtonColor: '#ef4444'
            });
        }
    };

    const handleViewDetails = (test: PacienteTest) => {
        setSelectedTest(test);
        setShowDetailModal(true);
    };

    const calculateQuestionPoints = (qId: number, selection: number, type: string) => {
        if (type === 'positive') {
            return selection - 1;
        } else {
            return 4 - selection;
        }
    };

    const sortedTests = [...tests].sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime());
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedTests = sortedTests.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="content-card bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 transition-colors">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <HelpCircle size={22} className="text-blue-500" />
                        Historial de Tests Psicológicos
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestión y envío de la Escala de Autoestima de Rosenberg.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={handleGenerateTest}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                    >
                        <Plus size={18} /> Generar Enlace de Test
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : tests.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <ClipboardList size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No se han enviado tests a este paciente todavía</p>
                    <button
                        onClick={handleGenerateTest}
                        className="mt-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors text-xs"
                    >
                        Generar el primer enlace ahora
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Record Count */}
                    {sortedTests.length > 0 && (
                        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedTests.length)} de {sortedTests.length} registros
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                                <tr>
                                    {['Nombre del Test', 'Fecha de Envío', 'Estado', 'Fecha Completado', 'Puntaje', 'Acciones'].map(h => (
                                        <th key={h} className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                {paginatedTests.map(test => {
                                    const isCompletado = test.estado === 'completado';
                                    return (
                                        <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-semibold">
                                                <div>{test.nombreTest}</div>
                                                {test.doctor && (
                                                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                                                        Solicitado por: Dr. {test.doctor.nombre} {test.doctor.paterno}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {new Date(test.fechaEnvio).toLocaleString('es-ES', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    isCompletado
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        : test.doctorId
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                }`}>
                                                    {isCompletado ? 'Completado' : test.doctorId ? 'Enviado' : 'Generado'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {test.fechaCompletado 
                                                    ? new Date(test.fechaCompletado).toLocaleString('es-ES', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                      })
                                                    : <span className="text-gray-400 dark:text-gray-500">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {isCompletado ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-black text-gray-900 dark:text-white">{test.puntaje}</span>
                                                        <span className="text-gray-400 text-xs">/ 30 pts</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    {isCompletado ? (
                                                        <button
                                                            onClick={() => handleViewDetails(test)}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white hover:text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 text-xs active:scale-95 border border-transparent"
                                                            title="Ver Respuestas Detalladas"
                                                        >
                                                            <Eye size={14} /> Ver Resultados
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleCopyLink(test.token)}
                                                                className="bg-gray-500 hover:bg-gray-600 text-white hover:text-white font-bold py-1.5 px-2 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center text-xs active:scale-95 border border-transparent"
                                                                title="Copiar Enlace"
                                                            >
                                                                <Copy size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleSendWhatsAppClick(test.id)}
                                                                className="bg-green-500 hover:bg-green-600 text-white hover:text-white font-bold py-1.5 px-2 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center text-xs active:scale-95 border border-transparent"
                                                                title="Enviar por WhatsApp"
                                                            >
                                                                <MessageCircle size={14} />
                                                            </button>
                                                             <a
                                                                href={getTestLink(test.token)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white font-bold py-1.5 px-2 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center text-xs active:scale-95 hover:no-underline border border-transparent"
                                                                title="Abrir en pestaña nueva"
                                                            >
                                                                <ExternalLink size={14} />
                                                            </a>
                                                            <button
                                                                onClick={() => handleDeleteTest(test.id)}
                                                                className="bg-red-500 hover:bg-red-600 text-white hover:text-white font-bold py-1.5 px-2 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center text-xs active:scale-95 border border-transparent"
                                                                title="Eliminar Test"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Link Generator Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 transform scale-100 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Send size={20} className="text-blue-500" />
                                Enlace de Test Generado
                            </h3>
                        </div>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Copia el siguiente enlace y envíalo al paciente (por WhatsApp, correo, etc.) para que pueda realizar el test de forma remota sin necesidad de iniciar sesión:
                        </p>

                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6">
                            <input 
                                type="text" 
                                readOnly 
                                value={getTestLink(generatedToken)}
                                className="bg-transparent border-none outline-none flex-1 text-xs font-mono text-gray-600 dark:text-gray-300"
                            />
                            <button
                                onClick={() => handleCopyLink(generatedToken)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-95 flex items-center justify-center"
                                title="Copiar enlace"
                            >
                                <Copy size={16} />
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-5">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white hover:text-white font-semibold py-2 px-4 text-xs rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 active:scale-95 border border-transparent"
                            >
                                <X size={14} />
                                Cerrar
                            </button>
                            <a
                                href={getTestLink(generatedToken)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white font-bold px-4 py-2 text-xs rounded-xl shadow-md flex items-center gap-1.5 transform hover:-translate-y-0.5 transition-all active:scale-95 hover:no-underline border border-transparent"
                            >
                                <ExternalLink size={14} /> Probar Test
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Doctor Selection Modal for WhatsApp */}
            {showDoctorModal && (
                <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 transform scale-100 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Send size={20} className="text-blue-500" />
                                Enviar Test por WhatsApp
                            </h3>
                        </div>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Seleccione el doctor que solicita realizar este test. Esto permitirá que el doctor reciba una notificación automática en su WhatsApp cuando el paciente termine de responder.
                        </p>

                        <div className="mb-6">
                            <label className="block mb-2 font-bold text-sm text-gray-700 dark:text-gray-300">Doctor Solicitante:</label>
                            <div className="relative">
                                <select
                                    value={selectedDoctorId}
                                    onChange={(e) => setSelectedDoctorId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                >
                                    <option value="">-- Seleccione un Doctor --</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>Dr. {d.nombre} {d.paterno} {d.materno || ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-5">
                            <button
                                onClick={() => {
                                    setShowDoctorModal(false);
                                    setTestIdToWhatsApp(null);
                                    setSelectedDoctorId('');
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white hover:text-white font-semibold py-2 px-4 text-xs rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5 border border-transparent"
                            >
                                <X size={14} />
                                Cancelar
                            </button>
                            <button
                                                                onClick={handleSendWhatsAppSubmit}
                                                                disabled={!selectedDoctorId}
                                                                className={`font-bold px-5 py-2 text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:scale-95 border border-transparent ${
                                                                    selectedDoctorId 
                                                                        ? 'bg-green-500 hover:bg-green-600 text-white hover:text-white cursor-pointer' 
                                                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-505 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                <MessageCircle size={14} />
                                                                Enviar WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Answers Detail Modal */}
            {showDetailModal && selectedTest && (
                <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5 pb-4 border-b border-gray-150 dark:border-gray-700 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Award size={20} className="text-blue-500" />
                                    Detalle del Test Completado
                                </h3>
                                <p className="text-xs text-gray-450 dark:text-gray-400 mt-1">
                                    {selectedTest.nombreTest}
                                </p>
                            </div>
                        </div>

                        {/* Summary Score Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 flex-shrink-0">
                            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                                <Award size={22} className="text-blue-500 mb-1" />
                                <span className="text-[10px] text-gray-450 dark:text-gray-400 font-bold uppercase tracking-wider">Puntuación</span>
                                <div className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">
                                    {selectedTest.puntaje} <span className="text-sm font-semibold text-gray-400">/ 30 pts</span>
                                </div>
                            </div>

                            <div className="col-span-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl flex flex-col justify-center">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block mb-1">Interpretación</span>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">
                                    {selectedTest.resultado}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-3 border border-gray-150 dark:border-gray-700 text-center mb-6 grid grid-cols-2 gap-4 text-xs flex-shrink-0">
                            <div>
                                <span className="text-gray-450 block">Fecha Envío</span>
                                <strong className="text-gray-700 dark:text-gray-300 font-semibold mt-0.5 block">
                                    {new Date(selectedTest.fechaEnvio).toLocaleString('es-ES')}
                                </strong>
                            </div>
                            <div>
                                <span className="text-gray-450 block">Fecha Completado</span>
                                <strong className="text-gray-700 dark:text-gray-300 font-semibold mt-0.5 block">
                                    {selectedTest.fechaCompletado ? new Date(selectedTest.fechaCompletado).toLocaleString('es-ES') : '—'}
                                </strong>
                            </div>
                        </div>

                        {/* Questions & Responses */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 scrollbar-thin">
                            <h4 className="text-xs font-black uppercase text-gray-450 dark:text-gray-400 tracking-wider">Desglose de Respuestas</h4>
                            
                            <div className="divide-y divide-gray-100 dark:divide-gray-700 border-t border-b border-gray-100 dark:border-gray-700">
                                {questions.map((q, idx) => {
                                    const selection = selectedTest.respuestas ? selectedTest.respuestas[q.id] : null;
                                    const points = selection !== null ? calculateQuestionPoints(q.id, selection, q.type) : 0;
                                    return (
                                        <div key={q.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <div className="flex gap-2.5 max-w-[80%]">
                                                <span className="flex-shrink-0 w-5.5 h-5.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold text-[10px] flex items-center justify-center mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-relaxed">
                                                        {q.text}
                                                    </p>
                                                    {selection !== null ? (
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            Respuesta: <strong className="text-blue-500 dark:text-blue-400 font-medium">{optionLabels[selection]}</strong> ({q.type === 'positive' ? 'Pregunta Directa' : 'Pregunta Inversa'})
                                                        </p>
                                                    ) : (
                                                        <p className="text-[10px] text-red-500 mt-0.5 font-semibold">Sin respuesta</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {selection !== null && (
                                                <div className="bg-gray-100 dark:bg-gray-700/50 py-1 px-3 rounded-lg flex items-center justify-between gap-3 text-xs self-start md:self-auto flex-shrink-0">
                                                    <span className="text-[10px] text-gray-450">Valor: {selection}</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">+{points} pts</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-5">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="bg-[#3498db] hover:bg-blue-600 text-white hover:text-white font-bold px-6 py-2 rounded-xl text-xs shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 border border-transparent"
                            >
                                <CheckCircle size={14} />
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {sortedTests.length > itemsPerPage && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(sortedTests.length / itemsPerPage)}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            )}

            <ManualModal 
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Historial de Tests Psicológicos"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteTabTest;
