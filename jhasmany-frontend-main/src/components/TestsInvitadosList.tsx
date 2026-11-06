import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    Sparkles, Copy, MessageCircle, Eye, UserPlus, Trash2, 
    CheckCircle2, Clock, Search, ExternalLink, Link2, 
    Share2, Filter, ShieldCheck, UserCheck, AlertCircle, 
    ChevronRight, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import ValoresResultadosModal from './ValoresResultadosModal';
import { formatDateTime } from '../utils/dateUtils';
import Pagination from './Pagination';

interface PacienteTestInvitado {
    id: number;
    pacienteId: number | null;
    doctorId: number | null;
    nombreTest: string;
    token: string;
    fechaEnvio: string;
    estado: 'enviado' | 'completado';
    fechaCompletado: string | null;
    respuestas: any;
    puntaje: number | null;
    resultado: string | null;
    esInvitado: boolean;
    invitadoNombre: string | null;
    invitadoPaterno: string | null;
    invitadoMaterno: string | null;
    invitadoCelular: string | null;
    doctor?: {
        id: number;
        nombre: string;
        paterno: string;
    } | null;
    paciente?: {
        id: number;
        nombre: string;
        paterno: string;
        materno?: string;
    } | null;
}

interface PacienteSimple {
    id: number;
    nombre: string;
    paterno: string;
    materno?: string;
    dni?: string;
    telefono_celular?: string;
}

const TestsInvitadosList: React.FC = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<PacienteTestInvitado[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completado' | 'enviado'>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals
    const [selectedTest, setSelectedTest] = useState<PacienteTestInvitado | null>(null);
    const [isResultadosModalOpen, setIsResultadosModalOpen] = useState(false);

    // Link modal
    const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);
    const [testToLink, setTestToLink] = useState<PacienteTestInvitado | null>(null);
    const [vincularMode, setVincularMode] = useState<'nuevo' | 'existente'>('nuevo');
    const [existingPacientes, setExistingPacientes] = useState<PacienteSimple[]>([]);
    const [selectedPacienteId, setSelectedPacienteId] = useState<number | ''>('');
    const [patientSearchTerm, setPatientSearchTerm] = useState('');

    // Form for new patient registration
    const [newPatientForm, setNewPatientForm] = useState({
        nombre: '',
        paterno: '',
        materno: '',
        telefono_celular: '',
        dni: '',
    });
    const [linking, setLinking] = useState(false);

    // Share link
    const publicUrl = `${window.location.origin}/juego-valores/invitado`;
    const [copied, setCopied] = useState(false);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/paciente-test/invitados');
            setTests(res.data);
        } catch (error) {
            console.error('Error fetching guest tests:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los tests de participantes invitados.',
                confirmButtonColor: '#7c3aed'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPacientesList = async () => {
        try {
            const res = await api.get('/pacientes?limit=1000');
            const data = res.data.data || res.data;
            setExistingPacientes(data || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    useEffect(() => {
        fetchTests();
        fetchPacientesList();
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        Swal.fire({
            icon: 'success',
            title: '¡Enlace Copiado!',
            text: 'El enlace público para participantes invitados se ha copiado al portapapeles.',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    };

    const handleShareWhatsApp = async () => {
        const { value: phone } = await Swal.fire({
            title: 'Compartir por WhatsApp',
            input: 'text',
            inputLabel: 'Número de WhatsApp del invitado',
            inputPlaceholder: 'Ej. 912345678 o 51912345678',
            showCancelButton: true,
            confirmButtonText: 'Abrir WhatsApp',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#22c55e',
            inputValidator: (value) => {
                if (!value || value.trim().length < 8) {
                    return 'Ingrese un número válido';
                }
            }
        });

        if (phone) {
            let cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length === 9) {
                cleanPhone = '51' + cleanPhone;
            }
            const message = encodeURIComponent(
                `Hola, te invito a realizar la dinámica terapéutica interactiva *Explorando Valores*.\n\nPuedes ingresar desde tu celular o computadora en este enlace:\n🔗 ${publicUrl}\n\n¡Esperamos que disfrutes la experiencia!`
            );
            window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
        }
    };

    const handleOpenVincularModal = (test: PacienteTestInvitado) => {
        setTestToLink(test);
        setVincularMode('nuevo');
        setNewPatientForm({
            nombre: test.invitadoNombre || '',
            paterno: test.invitadoPaterno || '',
            materno: test.invitadoMaterno || '',
            telefono_celular: test.invitadoCelular || '',
            dni: '',
        });
        setSelectedPacienteId('');
        setPatientSearchTerm('');
        setIsVincularModalOpen(true);
    };

    const handleConfirmVincular = async () => {
        if (!testToLink) return;

        if (vincularMode === 'nuevo') {
            if (!newPatientForm.nombre.trim() || !newPatientForm.paterno.trim()) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos Obligatorios',
                    text: 'El nombre y apellido paterno son requeridos para registrar al nuevo paciente.',
                    confirmButtonColor: '#7c3aed'
                });
                return;
            }
        } else {
            if (!selectedPacienteId) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Seleccione un Paciente',
                    text: 'Debe seleccionar un paciente de la lista para vincular la dinámica.',
                    confirmButtonColor: '#7c3aed'
                });
                return;
            }
        }

        try {
            setLinking(true);
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;

            const payload = vincularMode === 'nuevo'
                ? {
                    crearNuevo: true,
                    nombre: newPatientForm.nombre.trim(),
                    paterno: newPatientForm.paterno.trim(),
                    materno: newPatientForm.materno.trim(),
                    telefono_celular: newPatientForm.telefono_celular.trim(),
                    dni: newPatientForm.dni.trim(),
                    usuarioId: currentUser?.id,
                }
                : {
                    pacienteId: Number(selectedPacienteId),
                };

            const res = await api.post(`/paciente-test/${testToLink.id}/vincular`, payload);
            setIsVincularModalOpen(false);
            await fetchTests();
            await fetchPacientesList();

            const pacId = res.data.paciente?.id;
            Swal.fire({
                icon: 'success',
                title: '¡Vinculación Exitosa!',
                text: res.data.message || 'La dinámica ha sido vinculada al historial clínico del paciente.',
                showCancelButton: true,
                confirmButtonText: 'Ver Ficha del Paciente',
                cancelButtonText: 'Permanecer aquí',
                confirmButtonColor: '#3b82f6',
                cancelButtonColor: '#6b7280'
            }).then((result) => {
                if (result.isConfirmed && pacId) {
                    navigate(`/pacientes/${pacId}/test`);
                }
            });
        } catch (error: any) {
            console.error('Error linking patient:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al vincular',
                text: error.response?.data?.message || 'No se pudo vincular al paciente. Verifique los datos.',
                confirmButtonColor: '#7c3aed'
            });
        } finally {
            setLinking(false);
        }
    };

    const handleDeleteTest = async (test: PacienteTestInvitado) => {
        const participantName = `${test.invitadoNombre || ''} ${test.invitadoPaterno || ''}`.trim() || 'este participante';
        const result = await Swal.fire({
            title: '¿Eliminar registro?',
            text: `¿Está seguro de eliminar el registro de dinámica de ${participantName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/paciente-test/${test.id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'El registro ha sido eliminado.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchTests();
            } catch (error: any) {
                console.error('Error deleting test:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'No se pudo eliminar el registro.',
                    confirmButtonColor: '#7c3aed'
                });
            }
        }
    };

    // Filtered tests
    const filteredTests = tests.filter(t => {
        const fullName = `${t.invitadoNombre || ''} ${t.invitadoPaterno || ''} ${t.invitadoMaterno || ''} ${t.invitadoCelular || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.estado === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
    const paginatedTests = filteredTests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const statsTotal = tests.length;
    const statsCompletados = tests.filter(t => t.estado === 'completado').length;
    const statsEnviados = tests.filter(t => t.estado === 'enviado').length;

    // Filtered patient list for linking
    const filteredExistingPatients = existingPacientes.filter(p => {
        const search = patientSearchTerm.toLowerCase();
        const name = `${p.nombre || ''} ${p.paterno || ''} ${p.materno || ''}`.toLowerCase();
        const dni = (p.dni || '').toLowerCase();
        const phone = (p.telefono_celular || '').toLowerCase();
        return name.includes(search) || dni.includes(search) || phone.includes(search);
    });

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5 tracking-tight">
                        <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                            <Sparkles size={24} />
                        </span>
                        Tests y Dinámicas de Invitados
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona y comparte enlaces públicos para participantes que aún no están registrados en el sistema.
                    </p>
                </div>
            </div>

            {/* Quick Share Banner Card */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-purple-800/40">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                            <Sparkles size={13} /> Enlace Público Universal
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            Dinámica Interactiva: Explorando Valores
                        </h2>
                        <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                            Envía este link por WhatsApp o correo a cualquier persona. Al abrirlo, ingresará sus datos básicos (nombre, apellidos y celular) y podrá realizar la dinámica de inmediato.
                        </p>

                        <div className="flex items-center gap-2 pt-2">
                            <div className="flex-1 bg-slate-950/70 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-purple-100 font-mono select-all truncate">
                                {publicUrl}
                            </div>
                            <button
                                onClick={handleCopyLink}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 transform hover:-translate-y-0.5 active:scale-95 shrink-0 cursor-pointer"
                            >
                                <Copy size={15} />
                                {copied ? '¡Copiado!' : 'Copiar Enlace'}
                            </button>
                            <button
                                onClick={handleShareWhatsApp}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 transform hover:-translate-y-0.5 active:scale-95 shrink-0 cursor-pointer"
                            >
                                <MessageCircle size={15} />
                                Enviar por WhatsApp
                            </button>
                        </div>
                    </div>

                    {/* Stats counters */}
                    <div className="grid grid-cols-3 gap-3 shrink-0">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                            <span className="block text-2xl font-black text-white">{statsTotal}</span>
                            <span className="text-[11px] text-purple-200/70 uppercase tracking-wider font-semibold">Total Invitados</span>
                        </div>
                        <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-4 text-center border border-emerald-400/20">
                            <span className="block text-2xl font-black text-emerald-400">{statsCompletados}</span>
                            <span className="text-[11px] text-emerald-200/80 uppercase tracking-wider font-semibold">Completados</span>
                        </div>
                        <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-4 text-center border border-amber-400/20">
                            <span className="block text-2xl font-black text-amber-400">{statsEnviados}</span>
                            <span className="text-[11px] text-amber-200/80 uppercase tracking-wider font-semibold">En Proceso</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por participante o celular..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={15} className="text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Estado:</span>
                    <button
                        onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            statusFilter === 'all'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                        Todos ({tests.length})
                    </button>
                    <button
                        onClick={() => { setStatusFilter('completado'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            statusFilter === 'completado'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                        Completados ({statsCompletados})
                    </button>
                    <button
                        onClick={() => { setStatusFilter('enviado'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            statusFilter === 'enviado'
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                        En Proceso ({statsEnviados})
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/60 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando tests de participantes...</p>
                    </div>
                ) : filteredTests.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                            <Sparkles size={26} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">No hay tests de invitados registrados</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Comparte el enlace público para que los participantes no registrados comiencen la dinámica y sus resultados aparecerán aquí.
                        </p>
                        <button
                            onClick={handleCopyLink}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
                        >
                            <Copy size={14} /> Copiar Enlace Público
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50/75 dark:bg-slate-900/50 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-4 py-3.5">Participante Invitado</th>
                                    <th className="px-4 py-3.5">Dinámica</th>
                                    <th className="px-4 py-3.5">Fecha Inicio</th>
                                    <th className="px-4 py-3.5">Estado</th>
                                    <th className="px-4 py-3.5">Fecha Completado</th>
                                    <th className="px-4 py-3.5">Resultado</th>
                                    <th className="px-4 py-3.5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                {paginatedTests.map((test) => {
                                    const isCompletado = test.estado === 'completado';
                                    const participantFullName = `${test.invitadoNombre || ''} ${test.invitadoPaterno || ''} ${test.invitadoMaterno || ''}`.trim() || 'Invitado sin nombre';

                                    return (
                                        <tr 
                                            key={test.id}
                                            className="hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-colors"
                                        >
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {participantFullName}
                                                </div>
                                                {test.invitadoCelular && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        <a 
                                                            href={`https://wa.me/${test.invitadoCelular.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                                                            title="Contactar por WhatsApp"
                                                        >
                                                            <MessageCircle size={13} />
                                                            {test.invitadoCelular}
                                                        </a>
                                                    </div>
                                                )}
                                                {test.paciente && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                        <UserCheck size={11} /> Vinculado a: {test.paciente.nombre} {test.paciente.paterno}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                                    <Sparkles size={12} /> {test.nombreTest}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-300">
                                                {formatDateTime(test.fechaEnvio)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    isCompletado
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                }`}>
                                                    {isCompletado ? 'Completado' : 'En Proceso'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-300">
                                                {test.fechaCompletado 
                                                    ? formatDateTime(test.fechaCompletado)
                                                    : <span className="text-gray-400 dark:text-gray-500">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                {isCompletado ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                        <CheckCircle2 size={12} className="text-emerald-500" /> Top 3 Definido
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {isCompletado && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTest(test);
                                                                setIsResultadosModalOpen(true);
                                                            }}
                                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-xs flex items-center gap-1 transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-sm cursor-pointer"
                                                            title="Ver Resultados"
                                                        >
                                                            <Eye size={13} /> Ver Resultados
                                                        </button>
                                                    )}

                                                    {!test.pacienteId ? (
                                                        <button
                                                            onClick={() => handleOpenVincularModal(test)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-xs flex items-center gap-1 transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-sm cursor-pointer"
                                                            title="Vincular / Registrar como Paciente"
                                                        >
                                                            <UserPlus size={13} /> Vincular a Paciente
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => navigate(`/pacientes/${test.pacienteId}/test`)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-xs flex items-center gap-1 transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-sm cursor-pointer"
                                                            title="Ver Ficha del Paciente"
                                                        >
                                                            <ExternalLink size={13} /> Ver Ficha
                                                        </button>
                                                    )}

                                                    {!isCompletado && (
                                                        <button
                                                            onClick={() => handleDeleteTest(test)}
                                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 p-1.5 rounded-lg text-xs transition-all cursor-pointer"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Results Modal */}
            {isResultadosModalOpen && selectedTest && (
                <ValoresResultadosModal
                    isOpen={isResultadosModalOpen}
                    onClose={() => {
                        setIsResultadosModalOpen(false);
                        setSelectedTest(null);
                    }}
                    test={selectedTest}
                    pacienteName={`${selectedTest.invitadoNombre || ''} ${selectedTest.invitadoPaterno || ''} ${selectedTest.invitadoMaterno || ''}`.trim() || 'Participante Invitado'}
                />
            )}

            {/* Vincular / Registrar Paciente Modal */}
            {isVincularModalOpen && testToLink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-gray-150 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Vincular Test a Paciente
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Participante: <strong className="text-purple-600 dark:text-purple-400">{testToLink.invitadoNombre} {testToLink.invitadoPaterno}</strong>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsVincularModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mode Switcher */}
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setVincularMode('nuevo')}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    vincularMode === 'nuevo'
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
                                }`}
                            >
                                <UserPlus size={14} /> Registrar como Nuevo Paciente
                            </button>
                            <button
                                type="button"
                                onClick={() => setVincularMode('existente')}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    vincularMode === 'existente'
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
                                }`}
                            >
                                <Link2 size={14} /> Asociar a Paciente Existente
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            {vincularMode === 'nuevo' ? (
                                <div className="space-y-3.5">
                                    <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-200 dark:border-purple-800/40 text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                                        💡 Se registrará formalmente como nuevo paciente en el sistema y este test se trasladará de inmediato a su ficha clínica e historial de tests.
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                            Nombres <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newPatientForm.nombre}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, nombre: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                Apellido Paterno <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newPatientForm.paterno}
                                                onChange={(e) => setNewPatientForm({ ...newPatientForm, paterno: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                Apellido Materno
                                            </label>
                                            <input
                                                type="text"
                                                value={newPatientForm.materno}
                                                onChange={(e) => setNewPatientForm({ ...newPatientForm, materno: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                Teléfono Celular
                                            </label>
                                            <input
                                                type="tel"
                                                value={newPatientForm.telefono_celular}
                                                onChange={(e) => setNewPatientForm({ ...newPatientForm, telefono_celular: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                DNI (Opcional)
                                            </label>
                                            <input
                                                type="text"
                                                value={newPatientForm.dni}
                                                onChange={(e) => setNewPatientForm({ ...newPatientForm, dni: e.target.value })}
                                                placeholder="Ej. 74839201"
                                                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                        💡 Selecciona un paciente ya registrado para asignarle los resultados de esta dinámica a su ficha clínica.
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                            Buscar Paciente Registrado
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre o DNI..."
                                            value={patientSearchTerm}
                                            onChange={(e) => setPatientSearchTerm(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white mb-2"
                                        />

                                        <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-xl divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                                            {filteredExistingPatients.length === 0 ? (
                                                <div className="p-3 text-center text-xs text-gray-400">
                                                    No se encontraron pacientes que coincidan.
                                                </div>
                                            ) : (
                                                filteredExistingPatients.map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => setSelectedPacienteId(p.id)}
                                                        className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                                            selectedPacienteId === p.id
                                                                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 font-bold'
                                                                : 'hover:bg-gray-50 dark:hover:bg-slate-900 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="font-semibold">{p.nombre} {p.paterno} {p.materno || ''}</div>
                                                            <div className="text-[10px] text-gray-400">DNI: {p.dni || 'S/D'} • Cel: {p.telefono_celular || 'S/C'}</div>
                                                        </div>
                                                        {selectedPacienteId === p.id && (
                                                            <CheckCircle2 size={16} className="text-purple-600" />
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsVincularModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmVincular}
                                disabled={linking}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {linking ? 'Vinculando...' : vincularMode === 'nuevo' ? 'Registrar y Vincular Paciente' : 'Vincular a Paciente Seleccionado'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestsInvitadosList;
