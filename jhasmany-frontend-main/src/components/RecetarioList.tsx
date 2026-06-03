import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import api from '../services/api';
import type { Receta } from '../types';
import Pagination from './Pagination';
import Swal from 'sweetalert2';
import { formatDate } from '../utils/dateUtils';
import { formatFullName } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import SignatureModal from './SignatureModal';
import RecetarioForm from './RecetarioForm';

import { ClipboardList, Printer } from 'lucide-react';


interface RecetarioListProps {
    pacienteId?: number;
}

const RecetarioList: React.FC<RecetarioListProps> = ({ pacienteId: propPacienteId }) => {
    const { id: urlPacienteId } = useParams<{ id: string }>();
    const pacienteId = propPacienteId || (urlPacienteId ? Number(urlPacienteId) : undefined);
    
    const [recetas, setRecetas] = useState<Receta[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showManual, setShowManual] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEditId, setSelectedEditId] = useState<number | null>(null);
    const limit = 10;


    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Recetas',
            content: 'El módulo de Recetario permite crear y gestionar recetas médicas para los pacientes de la clínica.'
        },
        {
            title: 'Crear Nueva Receta',
            content: 'Use el botón "+ Nueva Receta" para crear una receta. Seleccione el paciente, agregue los medicamentos con sus indicaciones y cantidades.'
        },
        {
            title: 'Acciones Disponibles',
            content: (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>📱 <strong>WhatsApp:</strong> Envía la receta automáticamente por WhatsApp al paciente (requiere chatbot conectado).</li>
                    <li>🖨️ <strong>Imprimir:</strong> Abre el diálogo de impresión para imprimir la receta directamente.</li>
                    <li>✏️ <strong>Editar:</strong> Modifica los datos de la receta existente.</li>
                    <li>🗑️ <strong>Eliminar:</strong> Elimina la receta de forma permanente.</li>
                </ul>
            )
        },
        {
            title: 'Envío por WhatsApp',
            content: 'Para usar la función de WhatsApp, el chatbot debe estar conectado desde Configuración > Chatbot (WhatsApp). El PDF se enviará automáticamente al número de celular del paciente.'
        }];

    useEffect(() => {
        fetchRecetas();
    }, [pacienteId]);

    const fetchRecetas = async () => {
        try {
            const url = pacienteId ? `/receta?pacienteId=${pacienteId}` : '/receta';
            const response = await api.get(url);
            // Assuming backend currently returns flat array, we handle it here
            const data = Array.isArray(response.data) ? response.data : response.data.data || [];
            setRecetas(data);
        } catch (error) {
            console.error('Error fetching recetas:', error);
            Swal.fire('Error', 'No se pudieron cargar las recetas', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar receta?',
            text: 'No podrá revertir esta acción',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/receta/${id}`);
                await Swal.fire('¡Eliminado!', 'La receta ha sido eliminada.', 'success');
                fetchRecetas();
            } catch (error) {
                console.error('Error deleting receta:', error);
                Swal.fire('Error', 'No se pudo eliminar la receta', 'error');
            }
        }
    };

    const handlePrint = async (receta: Receta) => {
        // Fetch signatures
        let signatures: any[] = [];
        try {
            const response = await api.get(`/firmas/documento/receta/${receta.id}`);
            signatures = response.data;

            // Fallback: Si no hay firma del paciente en la receta, buscar en la historia clínica
            const patientSigInReceta = signatures.find(s => s.rolFirmante === 'paciente');
            if (!patientSigInReceta && receta.pacienteId) {
                try {
                    const resHC = await api.get(`/firmas/documento/historia_clinica/${receta.pacienteId}`);
                    const patientSigHC = resHC.data.find((s: any) => s.rolFirmante === 'paciente');
                    if (patientSigHC) {
                        signatures.push(patientSigHC);
                    }
                } catch (error) {
                    console.error('Error fetching patient HC signature for recipe:', error);
                }
            }
        } catch (error) {
            console.error('Error fetching signatures for print:', error);
        }

        const doctorSignature = signatures.find(s => s.rolFirmante === 'doctor' || s.rolFirmante === 'personal' || s.rolFirmante === 'administrador');
        const patientSignature = signatures.find(s => s.rolFirmante === 'paciente');

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
            document.body.removeChild(iframe);
            return;
        }

        const dateStr = formatDate(receta.fecha);

        // Age and gender calculation helpers
        const calcularEdad = (fechaNacimiento: string | undefined): string => {
            if (!fechaNacimiento) return 'No especificada';
            const hoy = new Date();
            const nacimiento = new Date(fechaNacimiento);
            let edad = hoy.getFullYear() - nacimiento.getFullYear();
            const m = hoy.getMonth() - nacimiento.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
            return `${edad} años`;
        };

        const formatGenero = (genero: string | undefined): string => {
            if (!genero) return 'No especificado';
            const g = genero.toLowerCase();
            if (g === 'masculino' || g === 'm') return 'Masculino';
            if (g === 'femenino' || g === 'f') return 'Femenino';
            return genero;
        };

        // Generate medication rows
        let medicationRows = '';
        if (receta.detalles && receta.detalles.length > 0) {
            medicationRows = receta.detalles.map((d: any) => `
                <tr>
                    <td>${d.medicamento ? d.medicamento.medicamento : (d.medicamentoId || '')}</td>
                    <td class="text-center">${d.cantidad || ''}</td>
                    <td>${d.tiempo || ''}</td>
                    <td>${d.via || ''}</td>
                    <td>${d.posologia || ''}</td>
                </tr>
            `).join('');
        }

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receta Médica - ${formatFullName(receta.paciente)}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 2cm 1.5cm 3cm 1.5cm;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #333;
                    }
                    
                    .header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 25px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #3498db;
                    }
                    
                    .header img {
                        height: 75px;
                        margin-right: 25px;
                        object-fit: contain;
                    }
                    
                    .header-text {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    
                    .doctor-name {
                        font-family: Georgia, 'Times New Roman', Times, serif;
                        font-size: 22px;
                        font-weight: bold;
                        color: #1e3a8a;
                        margin: 0 0 4px 0;
                        line-height: 1.2;
                    }
                    
                    .doctor-specialty {
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        font-weight: bold;
                        color: #3b82f6;
                        margin: 0 0 2px 0;
                        line-height: 1.2;
                    }
                    
                    .doctor-credentials {
                        font-family: Arial, sans-serif;
                        font-size: 13px;
                        font-weight: bold;
                        color: #3b82f6;
                        margin: 0;
                        line-height: 1.2;
                    }
                    
                    .doc-title {
                        text-align: center;
                        font-family: Arial, sans-serif;
                        font-size: 20px;
                        font-weight: bold;
                        color: #2c3e50;
                        margin-top: 15px;
                        margin-bottom: 20px;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    
                    th {
                        background-color: #3498db;
                        color: white;
                        padding: 12px 8px;
                        text-align: left;
                        font-weight: bold;
                        border: 1px solid #2980b9;
                        font-size: 11px;
                    }
                    
                    td {
                        padding: 8px;
                        border: 1px solid #ddd;
                        font-size: 10px;
                    }
                    
                    .text-center {
                        text-align: center;
                    }

                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    
                    .signature-box {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin-top: 40px;
                        margin-bottom: 20px;
                    }
                    
                    .signature-image {
                        max-width: 150px;
                        max-height: 80px;
                        margin-bottom: 5px;
                    }

                    .signature-technical {
                        font-size: 6px;
                        color: #999;
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    
                    .info-box {
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        padding: 15px;
                        margin-bottom: 20px;
                    }

                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        row-gap: 8px;
                        column-gap: 15px;
                    }
                    
                    .info-item {
                        font-size: 12px;
                        color: #333;
                    }
                    
                    .info-item strong {
                        color: #2c3e50;
                        margin-right: 5px;
                    }

                    .section-title {
                        font-size: 14px;
                        font-weight: bold;
                        color: #2c3e50;
                        margin-top: 20px;
                        margin-bottom: 10px;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 5px;
                    }
                    
                    @media print {
                        body {
                            margin: 0;
                        }
                        
                        th {
                            background-color: #3498db !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        tr:nth-child(even) {
                            background-color: #f8f9fa !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-text">
                        <div class="doctor-name">Dr. Jhasmany Ricardo Ojeda Cardona</div>
                        <div class="doctor-specialty">Médico Cirujano - Ocupacional</div>
                        <div class="doctor-credentials">CMP: 86653 &nbsp;&nbsp;&nbsp;&nbsp; RNA: A09485</div>
                    </div>
                </div>
                
                <div class="doc-title">RECETA MÉDICA</div>
                
                <div class="info-box">
                    <div class="info-grid">
                        <div class="info-item"><strong>PACIENTE:</strong> ${formatFullName(receta.paciente)}</div>
                        <div class="info-item"><strong>FECHA:</strong> ${dateStr}</div>
                        <div class="info-item"><strong>DNI:</strong> ${receta.paciente?.dni || 'No especificado'}</div>
                        <div class="info-item">
                            <strong>EDAD:</strong> ${calcularEdad(receta.paciente?.fecha_nacimiento)}
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            <strong>SEXO:</strong> ${formatGenero(receta.paciente?.genero)}
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 35%;">Medicamento</th>
                            <th class="text-center" style="width: 10%;">Cantidad</th>
                            <th style="width: 13%;">Tiempo (días)</th>
                            <th style="width: 12%;">VIA (adm.)</th>
                            <th style="width: 30%;">Posología</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${medicationRows}
                    </tbody>
                </table>
                
                <div class="signature-section" style="display: flex; justify-content: center; margin-top: 40px; width: 100%;">
                    <div class="signature-box" style="width: 300px; text-align: center;">
                        ${doctorSignature ? `
                            <img src="${doctorSignature.firmaData}" class="signature-image" style="max-height: 80px; margin-bottom: -5px;" />
                        ` : '<div style="height: 60px;"></div>'}
                        <div style="border-top: 1px solid #333; width: 250px; margin: 5px auto;"></div>
                        <div style="font-size: 11px; font-weight: bold; margin-top: 5px;">
                           Dr. Jhasmany Ricardo Ojeda Cardona
                        </div>
                        <div style="font-size: 9px; color: #555;">
                           Médico Cirujano - Ocupacional
                        </div>
                        <div style="font-size: 8px; color: #777;">
                           CMP: 86653 &nbsp;&nbsp; RNA: A09485
                        </div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            // Do not close automatically or it might close before print dialog opens fully on some browsers
                            // window.close(); 
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        doc.open();
        doc.write(printContent);
        doc.close();

        // Wait for images to load (like logo) before printing
        const logo = doc.querySelector('img');

        const doPrint = () => {
            // Let the script inside iframe handle the print invocation, 
            // but we keep the cleanup logic here if needed, 
            // or rely on user action. 
            // However, to ensure functionality we can also trigger from here if needed.
            // But the injected script is safer for loading timing.

            // Cleanup
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 5000); // Give user time to print
        };

        if (logo) {
            if (logo.complete) {
                doPrint();
            } else {
                logo.onload = doPrint;
                logo.onerror = doPrint;
            }
        } else {
            doPrint();
        }
    };

    const handleWhatsApp = async (receta: Receta) => {
        if (!receta.paciente?.celular) {
            Swal.fire('Atención', 'El paciente no tiene número de celular registrado', 'warning');
            return;
        }

        // Show loading
        Swal.fire({
            title: 'Enviando...',
            text: 'Enviando receta por WhatsApp',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await api.post(`/receta/${receta.id}/send-whatsapp`);

            Swal.fire({
                icon: 'success',
                title: '¡Enviado!',
                text: response.data.message || 'Receta enviada por WhatsApp exitosamente',
                timer: 3000,
                showConfirmButton: false
            });
        } catch (error: any) {
            console.error('Error sending WhatsApp:', error);

            let errorMessage = 'No se pudo enviar la receta por WhatsApp';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 503) {
                errorMessage = 'El chatbot no está conectado. Por favor, conecte el chatbot primero desde Configuración > Chatbot (WhatsApp).';
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonText: 'Entendido'
            });
        }
    };

    // Filter logic
    const filteredRecetas = recetas.filter(r => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;

        const pacienteNombre = formatFullName(r.paciente).toLowerCase();
        const userName = (r.user?.name || '').toLowerCase();
        const detailsStr = r.detalles?.map(d => d.medicamento?.medicamento || '').join(' ').toLowerCase() || '';

        if (pacienteId) {
            return userName.includes(term) || detailsStr.includes(term);
        } else {
            return pacienteNombre.includes(term) || userName.includes(term);
        }
    });

    // Pagination logic
    const paginatedRecetas = filteredRecetas.slice((currentPage - 1) * limit, currentPage * limit);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className={pacienteId 
            ? "content-card bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 transition-colors" 
            : "content-card p-6 bg-gray-50 dark:bg-gray-800 min-h-screen"
        }>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ClipboardList className="text-blue-500" size={22} />
                        {pacienteId ? 'Recetas del Paciente' : 'Recetario'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {pacienteId ? 'Historial de recetas emitidas al paciente.' : 'Gestión y emisión de recetas médicas.'}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={() => { setSelectedEditId(null); setIsFormOpen(true); }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <span className="text-xl font-bold">+</span> Nueva Receta
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center gap-4">
                <div className="flex gap-2 w-full md:max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder={pacienteId ? "Buscar por medicamento o usuario..." : "Buscar por paciente o usuario..."}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-4 text-gray-600 dark:text-gray-400 text-sm">
                Mostrando {filteredRecetas.length === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, filteredRecetas.length)} de {filteredRecetas.length} registros
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            {!pacienteId && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>}
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Registrado por</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Medicamentos</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedRecetas.map((receta, index) => (
                            <tr key={receta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(receta.fecha)}</td>
                                {!pacienteId && (
                                    <td className="p-3 text-gray-700 dark:text-gray-300">
                                        {formatFullName(receta.paciente)}
                                    </td>
                                )}
                                <td className="p-3 text-gray-700 dark:text-gray-300">
                                    {receta.user ? receta.user.name : 'N/A'}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                    {receta.detalles && receta.detalles.length > 0
                                        ? `${receta.detalles.length} medicamento${receta.detalles.length !== 1 ? 's' : ''} (${receta.detalles[0].medicamento?.medicamento || ''}...)`
                                        : ''}
                                </td>

                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => handleWhatsApp(receta)}
                                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Enviar por WhatsApp"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handlePrint(receta)}
                                        className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Imprimir"
                                    >
                                        <Printer size={20} />
                                    </button>

                                    <button
                                        onClick={() => { setSelectedEditId(receta.id); setIsFormOpen(true); }}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(receta.id)}
                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Eliminar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedRecetas.length === 0 && (
                            <tr><td colSpan={pacienteId ? 5 : 6} className="text-center p-4 text-gray-500 dark:text-gray-400">No hay recetas registradas</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center mt-4">
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredRecetas.length / limit)}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Recetario"
                sections={manualSections}
            />

            {/* Signature Modal */}
            {showSignatureModal && selectedReceta && (
                <SignatureModal
                    isOpen={showSignatureModal}
                    onClose={() => {
                        setShowSignatureModal(false);
                        setSelectedReceta(null);
                    }}
                    tipoDocumento="receta"
                    documentoId={selectedReceta.id}
                    rolFirmante="doctor"
                    onSuccess={() => {
                        fetchRecetas();
                    }}
                />
            )}

            <RecetarioForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedEditId}
                pacienteId={pacienteId}
                onSaveSuccess={() => {
                    fetchRecetas();
                    setIsFormOpen(false);
                }}
            />
        </div>
    );
};

export default RecetarioList;
