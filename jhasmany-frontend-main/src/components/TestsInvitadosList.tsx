import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import { formatDateTime } from '../utils/dateUtils';
import Swal from 'sweetalert2';
import { 
    FileText, Download, Printer, Users, CheckCircle, 
    Sparkles, Copy, MessageCircle, Eye, UserPlus, 
    Trash2, X, Phone, ExternalLink, Link2, Search, Send
} from 'lucide-react';
import ValoresResultadosModal from './ValoresResultadosModal';

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

const countryCodes = [
    { code: '+51', label: '🇵🇪 +51' },
    { code: '+591', label: '🇧🇴 +591' },
    { code: '+54', label: '🇦🇷 +54' },
    { code: '+55', label: '🇧🇷 +55' },
    { code: '+56', label: '🇨🇱 +56' },
    { code: '+595', label: '🇵🇾 +595' },
    { code: '+598', label: '🇺🇾 +598' },
    { code: '+57', label: '🇨🇴 +57' },
    { code: '+52', label: '🇲🇽 +52' },
    { code: '+34', label: '🇪🇸 +34' },
    { code: '+1', label: '🇺🇸 +1' },
];

const TestsInvitadosList: React.FC = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<PacienteTestInvitado[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completado' | 'enviado'>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Modals
    const [showManual, setShowManual] = useState(false);
    const [selectedTest, setSelectedTest] = useState<PacienteTestInvitado | null>(null);
    const [isResultadosModalOpen, setIsResultadosModalOpen] = useState(false);

    // WhatsApp Share Modal
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [wsCountryCode, setWsCountryCode] = useState('+51');
    const [wsLocalPhone, setWsLocalPhone] = useState('');
    const [sendingViaChatbot, setSendingViaChatbot] = useState(false);

    // Vincular Modal
    const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);
    const [testToLink, setTestToLink] = useState<PacienteTestInvitado | null>(null);
    const [vincularMode, setVincularMode] = useState<'nuevo' | 'existente'>('nuevo');
    const [existingPacientes, setExistingPacientes] = useState<PacienteSimple[]>([]);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [selectedPacienteId, setSelectedPacienteId] = useState<number | ''>('');

    // Form for new patient
    const [newPatientForm, setNewPatientForm] = useState({
        nombre: '',
        paterno: '',
        materno: '',
        telefono_celular: '',
        countryCode: '+51',
        dni: '',
    });
    const [linking, setLinking] = useState(false);

    // Share link
    const publicUrl = `${window.location.origin}/juego-valores/invitado`;
    const [copied, setCopied] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Tests y Dinámicas de Invitados',
            content: 'Este módulo permite gestionar los tests psicológicos e interactivas (como Explorando Valores) realizados por personas que aún no están formalmente registradas como pacientes.'
        },
        {
            title: 'Enlace Público y WhatsApp',
            content: 'Use el botón "Copiar Link" o "WhatsApp" en la barra superior para compartir el link con el código de país correcto. El invitado ingresará sus datos básicos antes de empezar.'
        },
        {
            title: 'Resultados y Reportes',
            content: 'Cuando el participante completa la dinámica, aparecerá con estado "Completado". Use el botón morado (ojo) para ver sus respuestas, reflexiones y generar el reporte clínico para impresión.'
        },
        {
            title: 'Vincular a Paciente',
            content: 'Use el botón azul (usuario+) para registrar a la persona formalmente como paciente en el sistema (con 1 solo clic y datos pre-llenados) o asociar el test a un paciente ya existente.'
        }
    ];

    const fetchTests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/paciente-test/invitados');
            setTests(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching guest tests:', error);
            setTests([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPacientesList = async () => {
        try {
            const res = await api.get('/pacientes?limit=1000');
            const data = res.data.data || res.data;
            setExistingPacientes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    useEffect(() => {
        fetchTests();
        fetchPacientesList();
    }, []);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchInput);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchInput]);

    const handleClearSearch = () => {
        setSearchInput('');
        setDebouncedSearch('');
        setCurrentPage(1);
    };

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

    const handleSendWhatsApp = async (e: React.FormEvent) => {
        e.preventDefault();
        let cleanNumber = wsLocalPhone.replace(/\D/g, '');
        let cleanCode = wsCountryCode.replace(/\D/g, '');

        if (!cleanNumber || cleanNumber.length < 6) {
            Swal.fire({
                icon: 'warning',
                title: 'Número Inválido',
                text: 'Por favor ingrese un número de celular válido.',
                confirmButtonColor: '#3498db'
            });
            return;
        }

        // Avoid duplicating country code if user typed it in local phone
        if (cleanNumber.startsWith(cleanCode) && cleanNumber.length > cleanCode.length + 5) {
            cleanNumber = cleanNumber.slice(cleanCode.length);
        }

        const fullPhone = `${cleanCode}${cleanNumber}`;
        const jid = `${fullPhone}@s.whatsapp.net`;
        const rawMessage = `Hola, te invito a realizar la dinámica terapéutica interactiva *Explorando Valores*.\n\nPuedes ingresar desde tu celular o computadora en el siguiente enlace:\n🔗 ${publicUrl}\n\n¡Esperamos que disfrutes la experiencia!`;

        setSendingViaChatbot(true);
        try {
            Swal.fire({
                title: 'Enviando invitación...',
                text: 'Enviando enlace a través del Chatbot de WhatsApp...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            await api.post('/chatbot/send', {
                jid,
                text: rawMessage
            });

            setShowWhatsAppModal(false);
            setWsLocalPhone('');

            Swal.fire({
                icon: 'success',
                title: '¡Enviado con Éxito!',
                text: `El enlace de la dinámica ha sido enviado a +${fullPhone} mediante el Chatbot.`,
                confirmButtonColor: '#3498db',
                timer: 3000
            });
        } catch (error: any) {
            console.error('Error sending via chatbot:', error);
            const errMsg = error.response?.data?.message || error.message || 'No se pudo enviar el mensaje por Chatbot.';
            
            const isDisconnected = errMsg.toLowerCase().includes('no está conectado') || errMsg.toLowerCase().includes('desconectado');

            if (isDisconnected) {
                const res = await Swal.fire({
                    icon: 'warning',
                    title: 'Chatbot Desconectado',
                    text: 'El Chatbot no está conectado a WhatsApp en este momento. ¿Deseas abrir WhatsApp Web para enviarlo manualmente?',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, abrir WhatsApp Web',
                    cancelButtonText: 'Cerrar',
                    confirmButtonColor: '#10b981',
                    cancelButtonColor: '#6b7280'
                });

                if (res.isConfirmed) {
                    const encodedMsg = encodeURIComponent(rawMessage);
                    window.open(`https://wa.me/${fullPhone}?text=${encodedMsg}`, '_blank');
                    setShowWhatsAppModal(false);
                    setWsLocalPhone('');
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar por Chatbot',
                    text: errMsg,
                    confirmButtonColor: '#dc3545'
                });
            }
        } finally {
            setSendingViaChatbot(false);
        }
    };

    const formatCelular = (celular: string | null | undefined) => {
        if (!celular) return '-';
        return celular;
    };

    const handleOpenVincularModal = (test: PacienteTestInvitado) => {
        setTestToLink(test);
        setVincularMode('nuevo');

        let rawPhone = test.invitadoCelular || '';
        let detectedCode = '+51';
        let localNum = rawPhone;

        const found = countryCodes.find(c => rawPhone.startsWith(c.code));
        if (found) {
            detectedCode = found.code;
            localNum = rawPhone.substring(found.code.length).trim();
        }

        setNewPatientForm({
            nombre: test.invitadoNombre || '',
            paterno: test.invitadoPaterno || '',
            materno: test.invitadoMaterno || '',
            telefono_celular: localNum,
            countryCode: detectedCode,
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

            const fullCelular = newPatientForm.telefono_celular.trim()
                ? `${newPatientForm.countryCode} ${newPatientForm.telefono_celular.trim()}`
                : '';

            const payload = vincularMode === 'nuevo'
                ? {
                    crearNuevo: true,
                    nombre: newPatientForm.nombre.trim(),
                    paterno: newPatientForm.paterno.trim(),
                    materno: newPatientForm.materno.trim(),
                    telefono_celular: fullCelular,
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

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar registro?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/paciente-test/${id}`);
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

    // Filtered data
    const filteredTests = tests.filter(t => {
        const fullName = `${t.invitadoNombre || ''} ${t.invitadoPaterno || ''} ${t.invitadoMaterno || ''} ${t.invitadoCelular || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(debouncedSearch.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.estado === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalRecords = filteredTests.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const paginatedTests = filteredTests.slice((currentPage - 1) * limit, currentPage * limit);

    // Export to Excel
    const exportToExcel = () => {
        const dataToExport = filteredTests.map((t, index) => ({
            '#': index + 1,
            'Participante': `${t.invitadoNombre || ''} ${t.invitadoPaterno || ''} ${t.invitadoMaterno || ''}`.trim(),
            'Dinámica / Test': t.nombreTest,
            'Celular': t.invitadoCelular || '-',
            'Fecha Envío': formatDateTime(t.fechaEnvio),
            'Fecha Completado': t.fechaCompletado ? formatDateTime(t.fechaCompletado) : '-',
            'Estado': t.estado.toUpperCase(),
            'Resultado': t.resultado || '-',
            'Paciente Vinculado': t.paciente ? `${t.paciente.nombre} ${t.paciente.paterno}` : 'No vinculado'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tests Invitados');
        XLSX.writeFile(wb, `tests_invitados_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Lista de Tests y Dinámicas de Invitados', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 22);

        const tableData = filteredTests.map((t, index) => [
            index + 1,
            `${t.invitadoNombre || ''} ${t.invitadoPaterno || ''}`.trim(),
            t.nombreTest,
            t.invitadoCelular || '-',
            formatDateTime(t.fechaEnvio),
            t.estado.toUpperCase(),
            t.paciente ? 'Vinculado' : 'No'
        ]);

        autoTable(doc, {
            head: [['#', 'Participante', 'Dinámica', 'Celular', 'Fecha', 'Estado', 'Vinculado']],
            body: tableData,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [124, 58, 237] }
        });

        doc.save(`tests_invitados_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Print
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Tests y Dinámicas de Invitados</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
                    h1 { color: #5b21b6; margin-bottom: 5px; }
                    p { color: #666; margin-top: 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #7c3aed; color: white; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <h1>Lista de Tests y Dinámicas de Invitados</h1>
                <p>Generado el: ${new Date().toLocaleString('es-ES')}</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Participante</th>
                            <th>Dinámica</th>
                            <th>Celular</th>
                            <th>Fecha Envío</th>
                            <th>Fecha Completado</th>
                            <th>Estado</th>
                            <th>Vinculado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredTests.map((t, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${t.invitadoNombre || ''} ${t.invitadoPaterno || ''} ${t.invitadoMaterno || ''}</td>
                                <td>${t.nombreTest}</td>
                                <td>${t.invitadoCelular || '-'}</td>
                                <td>${formatDateTime(t.fechaEnvio)}</td>
                                <td>${t.fechaCompletado ? formatDateTime(t.fechaCompletado) : '-'}</td>
                                <td>${t.estado.toUpperCase()}</td>
                                <td>${t.paciente ? `${t.paciente.nombre} ${t.paciente.paterno}` : 'No'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    // Filtered patient list for linking
    const filteredExistingPatients = existingPacientes.filter(p => {
        const search = patientSearchTerm.toLowerCase();
        const name = `${p.nombre || ''} ${p.paterno || ''} ${p.materno || ''}`.toLowerCase();
        const dni = (p.dni || '').toLowerCase();
        const phone = (p.telefono_celular || '').toLowerCase();
        return name.includes(search) || dni.includes(search) || phone.includes(search);
    });

    return (
        <div className="content-card">
            {/* Header - exactly styled like PacienteList */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        Tests y Dinámicas de Invitados
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Administre los tests y dinámicas de participantes no registrados en el sistema.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5 gap-2"
                        title="Exportar a Excel"
                    >
                        <FileText size={18} />
                        <span className="text-sm">Excel</span>
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5 gap-2"
                        title="Exportar a PDF"
                    >
                        <Download size={18} />
                        <span className="text-sm">PDF</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5 gap-2"
                        title="Imprimir"
                    >
                        <Printer size={18} />
                        <span className="text-sm">Imprimir</span>
                    </button>

                    {/* Vertical Divider */}
                    <div className="hidden md:block h-8 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    {/* Action buttons: WhatsApp & Copiar Link */}
                    <button
                        onClick={() => setShowWhatsAppModal(true)}
                        className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all transform hover:-translate-y-0.5 active:scale-95 gap-2 cursor-pointer"
                        title="Compartir por WhatsApp"
                    >
                        <MessageCircle size={18} />
                        <span>WhatsApp</span>
                    </button>

                    <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center px-4 py-2.5 bg-[#3498db] hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5 active:scale-95 gap-2 cursor-pointer"
                        title="Copiar Enlace Público"
                    >
                        <Copy size={18} />
                        <span>{copied ? '¡Copiado!' : 'Copiar Link'}</span>
                    </button>
                </div>
            </div>

            {/* Search Bar - Exactly styled like PacienteList */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex gap-2 w-full md:max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, apellidos o celular..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchInput && (
                        <button
                            onClick={handleClearSearch}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            statusFilter === 'all'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Todos ({tests.length})
                    </button>
                    <button
                        onClick={() => { setStatusFilter('completado'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            statusFilter === 'completado'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Completados ({tests.filter(t => t.estado === 'completado').length})
                    </button>
                    <button
                        onClick={() => { setStatusFilter('enviado'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            statusFilter === 'enviado'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        En Proceso ({tests.filter(t => t.estado === 'enviado').length})
                    </button>
                </div>
            </div>

            {/* Record Counter - Exactly like PacienteList */}
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalRecords)} de {totalRecords} registros
            </div>

            {/* Table - Exactly like PacienteList */}
            <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Participante Invitado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dinámica / Test</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Celular</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Inicio</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Completado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="no-print px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                                    <p className="mt-2 text-sm">Cargando tests de participantes...</p>
                                </td>
                            </tr>
                        ) : paginatedTests.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    No se encontraron registros de tests de invitados.
                                </td>
                            </tr>
                        ) : (
                            paginatedTests.map((test, index) => {
                                const isCompletado = test.estado === 'completado';
                                const fullName = `${test.invitadoNombre || ''} ${test.invitadoPaterno || ''} ${test.invitadoMaterno || ''}`.trim() || 'Invitado sin nombre';

                                return (
                                    <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-3 text-gray-800 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                        <td className="p-3 text-gray-800 dark:text-gray-300">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    {fullName}
                                                </span>
                                                {test.paciente && (
                                                    <span 
                                                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 mt-0.5"
                                                        onClick={() => navigate(`/pacientes/${test.pacienteId}/test`)}
                                                    >
                                                        <CheckCircle size={12} className="text-emerald-500" />
                                                        Vinculado a: {test.paciente.nombre} {test.paciente.paterno}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-gray-800 dark:text-gray-300">
                                            <span className="font-medium text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full">
                                                {test.nombreTest}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-800 dark:text-gray-300">
                                            {test.invitadoCelular ? (
                                                <a 
                                                    href={`https://wa.me/${test.invitadoCelular.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1"
                                                    title="Abrir WhatsApp"
                                                >
                                                    <MessageCircle size={14} />
                                                    {formatCelular(test.invitadoCelular)}
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="p-3 text-gray-800 dark:text-gray-300 text-xs">
                                            {formatDateTime(test.fechaEnvio)}
                                        </td>
                                        <td className="p-3 text-gray-800 dark:text-gray-300 text-xs">
                                            {test.fechaCompletado ? formatDateTime(test.fechaCompletado) : '-'}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                                                isCompletado
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                                            }`}>
                                                {isCompletado ? 'Completado' : 'En Proceso'}
                                            </span>
                                        </td>
                                        <td className="no-print p-3 flex gap-2">
                                            {isCompletado && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedTest(test);
                                                        setIsResultadosModalOpen(true);
                                                    }}
                                                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Ver Resultados"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            )}

                                            {!test.pacienteId ? (
                                                <button
                                                    onClick={() => handleOpenVincularModal(test)}
                                                    className="p-2 bg-[#3498db] hover:bg-blue-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Vincular / Registrar como Paciente"
                                                >
                                                    <UserPlus size={18} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/pacientes/${test.pacienteId}/test`)}
                                                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Ver Ficha del Paciente"
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleDelete(test.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Eliminar Registro"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination - Exactly like PacienteList */}
            {totalPages > 1 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Tests de Invitados"
                sections={manualSections}
            />

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

            {/* WhatsApp Share Modal with Country Code (Item 3) */}
            {showWhatsAppModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                    <MessageCircle size={22} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Compartir por WhatsApp
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowWhatsAppModal(false)}
                                className="bg-gray-100 hover:bg-red-500 text-gray-500 hover:text-white dark:bg-gray-700 dark:hover:bg-red-600 dark:text-gray-300 p-2 rounded-xl transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-sm flex items-center justify-center cursor-pointer border border-gray-200 dark:border-gray-600"
                                title="Cerrar modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Número de WhatsApp del invitado para enviarle la dinámica:
                        </p>

                        <form onSubmit={handleSendWhatsApp} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                    Celular con Código de País
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={wsCountryCode}
                                        onChange={(e) => setWsCountryCode(e.target.value)}
                                        className="py-2 px-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans text-sm cursor-pointer"
                                    >
                                        {countryCodes.map(c => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </select>
                                    <div className="relative flex-1">
                                        <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="tel"
                                            required
                                            value={wsLocalPhone}
                                            onChange={(e) => setWsLocalPhone(e.target.value)}
                                            placeholder="Ej: 70012345"
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700/60 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowWhatsAppModal(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer text-sm"
                                >
                                    <X size={16} />
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingViaChatbot}
                                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2 px-5 rounded-xl text-sm shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                                >
                                    {sendingViaChatbot ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Enviar por Chatbot
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Vincular / Registrar Paciente Modal */}
            {isVincularModalOpen && testToLink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full border border-gray-150 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-150 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Vincular Test a Paciente
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Participante: <strong className="text-blue-600 dark:text-blue-400">{testToLink.invitadoNombre} {testToLink.invitadoPaterno}</strong>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsVincularModalOpen(false)}
                                className="bg-gray-100 hover:bg-red-500 text-gray-500 hover:text-white dark:bg-gray-700 dark:hover:bg-red-600 dark:text-gray-300 p-2 rounded-xl transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-sm flex items-center justify-center cursor-pointer border border-gray-200 dark:border-gray-600"
                                title="Cerrar modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Mode Switcher */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-150 dark:border-gray-700 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setVincularMode('nuevo')}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    vincularMode === 'nuevo'
                                        ? 'bg-[#3498db] text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                <UserPlus size={14} /> Registrar como Nuevo Paciente
                            </button>
                            <button
                                type="button"
                                onClick={() => setVincularMode('existente')}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    vincularMode === 'existente'
                                        ? 'bg-[#3498db] text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                <Link2 size={14} /> Asociar a Paciente Existente
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            {vincularMode === 'nuevo' ? (
                                <div className="space-y-3.5">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
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
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
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
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
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
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Celular with Country Code */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                            Teléfono Celular
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={newPatientForm.countryCode}
                                                onChange={(e) => setNewPatientForm({ ...newPatientForm, countryCode: e.target.value })}
                                                className="py-2 px-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none text-sm cursor-pointer"
                                            >
                                                {countryCodes.map(c => (
                                                    <option key={c.code} value={c.code}>{c.label}</option>
                                                ))}
                                            </select>
                                            <div className="relative flex-1">
                                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                <input
                                                    type="tel"
                                                    value={newPatientForm.telefono_celular}
                                                    onChange={(e) => setNewPatientForm({ ...newPatientForm, telefono_celular: e.target.value })}
                                                    placeholder="Ej: 70012345"
                                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white outline-none text-sm"
                                                />
                                            </div>
                                        </div>
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
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        />
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
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white mb-2 outline-none"
                                        />

                                        <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
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
                                                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-bold'
                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="font-semibold">{p.nombre} {p.paterno} {p.materno || ''}</div>
                                                            <div className="text-[10px] text-gray-400">DNI: {p.dni || 'S/D'} • Cel: {p.telefono_celular || 'S/C'}</div>
                                                        </div>
                                                        {selectedPacienteId === p.id && (
                                                            <CheckCircle size={16} className="text-blue-600" />
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
                        <div className="p-4 border-t border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsVincularModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer text-xs"
                            >
                                <X size={14} />
                                Cerrar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmVincular}
                                disabled={linking}
                                className="bg-[#3498db] hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer"
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
