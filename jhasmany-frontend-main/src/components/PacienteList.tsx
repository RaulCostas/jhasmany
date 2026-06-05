import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import type { Paciente } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import { formatDate } from '../utils/dateUtils';
import { formatFullName } from '../utils/formatters';

import Swal from 'sweetalert2';
import { FileText, Download, Printer, Users, CheckCircle } from 'lucide-react';
import SignatureModal from './SignatureModal';


const PacienteList: React.FC = () => {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showManual, setShowManual] = useState(false);

    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedPacienteId, setSelectedPacienteId] = useState<number | null>(null);
    const limit = 10;
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const tipo = queryParams.get('tipo');

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Pacientes',
            content: 'Desde esta pantalla puede administrar todo el registro de pacientes de la clínica.'
        },
        {
            title: 'Agregar Paciente',
            content: 'Use el botón azul "+ Nuevo Paciente" para registrar una nueva ficha. Es importante completar los datos personales y de contacto.'
        },
        {
            title: 'Edición y Estados',
            content: 'Use el botón de lápiz (amarillo) para modificar datos personales. Para pacientes activos, el botón rojo (papelera) cambia el estado a "Inactivo". Para pacientes inactivos, aparece un botón verde (check) que permite reactivarlos.'
        },
        {
            title: 'Exportación e Impresión',
            content: 'Puede exportar la lista de pacientes a Excel o PDF, o imprimir la ficha individual de cada paciente usando los botones correspondientes en la columna de Acciones.'
        }
    ];

    const calcularEdad = (fecha_nacimiento: string | undefined): string => {
        if (!fecha_nacimiento) return '';
        const hoy = new Date();
        const nacimiento = new Date(fecha_nacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
        return `${edad} años`;
    };

    const formatCelular = (celular: string) => {
        if (!celular) return '';
        let clean = celular.trim();
        if (!clean.startsWith('+')) {
            const codesWithoutPlus = ['591', '54', '55', '56', '51', '595', '598', '57', '52', '34', '1'];
            const matchNoPlus = codesWithoutPlus.find(c => clean.startsWith(c));
            if (matchNoPlus) {
                clean = '+' + clean;
            } else {
                clean = '+51' + clean;
            }
        }
        const countryCodes = ['+591', '+54', '+55', '+56', '+51', '+595', '+598', '+57', '+52', '+34', '+1'];
        const code = countryCodes.find(c => clean.startsWith(c));
        if (code) {
            const number = clean.substring(code.length);
            return `(${code}) ${number}`;
        }
        return clean;
    };


    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchInput);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchInput]);

    useEffect(() => {
        setCurrentPage(1);
        fetchPacientes(debouncedSearchTerm);
    }, [debouncedSearchTerm]); // Reset page when search changes

    useEffect(() => {
        fetchPacientes(debouncedSearchTerm);
    }, [currentPage]);

    const fetchPacientes = async (search: string = debouncedSearchTerm) => {
        try {
            let url = `/pacientes?page=${currentPage}&limit=${limit}&search=${search}`;
            const response = await api.get(url);
            setPacientes(Array.isArray(response.data.data) ? response.data.data : []);
            setTotalPages(response.data.totalPages || 0);
            setTotalRecords(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching pacientes:', error);
            setPacientes([]);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja paciente?',
            text: 'El paciente pasará a estado Inactivo sin eliminar el registro de la base de datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/pacientes/${id}`, { estado: 'inactivo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Paciente dado de baja!',
                    text: 'El estado del paciente ha sido cambiado a Inactivo.',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchPacientes();
            } catch (error) {
                console.error('Error al dar de baja paciente:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo dar de baja el paciente'
                });
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar paciente?',
            text: 'El paciente volverá a estado Activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/pacientes/${id}`, { estado: 'activo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Paciente reactivado!',
                    text: 'El estado del paciente ha sido cambiado a Activo.',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchPacientes();
            } catch (error) {
                console.error('Error al reactivar paciente:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo reactivar el paciente'
                });
            }
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchInput('');
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const exportToExcel = async () => {
        try {
            Swal.fire({
                title: 'Generando Excel...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await api.get(`/pacientes?page=1&limit=9999&search=${searchTerm}`);
            const allPacientes = Array.isArray(response.data.data) ? response.data.data : [];

            const dataToExport = allPacientes.map((p: any) => ({
                'Fecha Ingreso': formatDate(p.fecha_ingreso),
                Paciente: formatFullName(p),
                'Fecha de nacimiento': formatDate(p.fecha_nacimiento),
                Celular: p.telefono_celular,
                Direccion: p.direccion || '-',
                Correo: p.email || '-',
                Estado: p.estado === 'activo' ? 'Activo' : 'Inactivo'
            }));
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
            XLSX.writeFile(wb, "pacientes.xlsx");
            Swal.close();
        } catch (error) {
            console.error('Error generating Excel:', error);
            Swal.fire('Error', 'No se pudo generar el Excel', 'error');
        }
    };

    const exportToPDF = async () => {
        try {
            // Show loading alert
            Swal.fire({
                title: 'Generando PDF...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Fetch ALL records for PDF
            const response = await api.get(`/pacientes?page=1&limit=9999&search=${searchTerm}`);
            const allPacientes = Array.isArray(response.data.data) ? response.data.data : [];

            const doc = new jsPDF();
            doc.text("Lista de Pacientes", 20, 10);
            const tableColumn = ["F. Ingreso", "Paciente", "F. Nacimiento", "Celular", "Dirección", "Correo", "Estado"];
            const tableRows = allPacientes.map((p: any) => [
                formatDate(p.fecha_ingreso),
                formatFullName(p),
                formatDate(p.fecha_nacimiento),
                p.telefono_celular,
                p.direccion || '-',
                p.email || '-',
                p.estado === 'activo' ? 'Activo' : 'Inactivo'
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
            });
            doc.save("pacientes.pdf");
            Swal.close();
        } catch (error) {
            console.error('Error generating PDF:', error);
            Swal.fire('Error', 'No se pudo generar el PDF', 'error');
        }
    };


    const handlePrint = async () => {
        try {
            // Fetch ALL records for printing
            const response = await api.get(`/pacientes?page=1&limit=9999&search=${searchTerm}`);
            const allPacientes = Array.isArray(response.data.data) ? response.data.data : [];

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


            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Lista de Pacientes</title>
                    <style>
                        @page {
                            size: A4; /* Vertical */
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
                            margin-bottom: 20px;
                            padding-bottom: 15px;
                            border-bottom: 2px solid #3498db;
                        }
                        
                        .header img {
                            height: 60px;
                            margin-right: 20px;
                        }
                        
                        h1 {
                            color: #2c3e50;
                            margin: 0;
                            font-size: 24px;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                            font-size: 10px;
                        }
                        
                        th {
                            background-color: #3498db;
                            color: white;
                            padding: 8px 6px;
                            text-align: left;
                            font-weight: bold;
                            border: 1px solid #2980b9;
                        }
                        
                        td {
                            padding: 6px;
                            border: 1px solid #ddd;
                        }
                        
                        tr:nth-child(even) {
                            background-color: #f8f9fa;
                        }
                        
                        .status-active {
                            color: #27ae60;
                            font-weight: bold;
                        }
                        
                        .status-inactive {
                            color: #e74c3c;
                            font-weight: bold;
                        }
                        
                        .footer {
                            position: fixed;
                            bottom: 1.5cm;
                            left: 1.5cm;
                            right: 1.5cm;
                            padding-top: 10px;
                            border-top: 1px solid #eee;
                            font-size: 10px;
                            color: #777;
                            display: flex;
                            justify-content: space-between;
                        }
                        
                        @media print {
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
                            
                            .footer {
                                position: fixed;
                                bottom: 0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                    <h1 style="color: #1e40af; font-size: 24px;">Lista de Pacientes</h1>
                    <p style="color: #666; font-size: 14px;">Gestión integral de pacientes y sus historias clínicas</p>
                </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>F. Ingreso</th>
                                <th>Paciente</th>
                                <th>Seguros</th>
                                <th>Celular</th>
                                <th>Fecha Nac.</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allPacientes.map((p: Paciente, index: number) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${formatDate(p.fecha_ingreso)}</td>
                                    <td>${formatFullName(p)}</td>
                                    <td>Particular</td>
                                    <td>${p.telefono_celular}</td>
                                    <td>${formatDate(p.fecha_nacimiento)}</td>
                                    <td class="${p.estado === 'activo' ? 'status-active' : 'status-inactive'}">
                                        ${p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        <div>Sistema de Gestión</div>
                        <div>Página 1</div>
                    </div>
                </body>
                </html>
            `;

            doc.open();
            doc.write(printContent);
            doc.close();

            const doPrint = () => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Print error:', e);
                } finally {
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 2000);
                }
            };

            const logo = doc.querySelector('img');
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
        } catch (error) {
            console.error('Error al imprimir:', error);
            alert('Error al generar el documento de impresión');
        }
    };

    const handlePrintPaciente = async (pacientePreview: Paciente) => {
        try {
            Swal.fire({
                title: 'Generando Ficha...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await api.get<Paciente>(`/pacientes/${pacientePreview.id}`);
            const fullPaciente = response.data;
            const ficha = fullPaciente.fichaClinica;

            let signatures: any[] = [];
            try {
                const resHC = await api.get(`/firmas/documento/historia_clinica/${fullPaciente.id}`);
                signatures = Array.isArray(resHC.data) ? resHC.data : [];
            } catch (error) {
                console.error('Error fetching signatures for patient print:', error);
            }

            const patientSignature = signatures.filter(s => s.rolFirmante === 'paciente').pop();

            const checkIcon = (val: boolean | undefined) => val ? '☒' : '☐';

            // 1. Map infantile traits
            const traitsList = [
                { key: 'rasgo_aislamiento', label: 'Aislamiento' },
                { key: 'rasgo_pavor_nocturno', label: 'Pavor Nocturno' },
                { key: 'rasgo_encopresis', label: 'Encopresis' },
                { key: 'rasgo_tricotilomania', label: 'Tricotilomanía' },
                { key: 'rasgo_piromania', label: 'Piromanía' },
                { key: 'rasgo_succion_dedo', label: 'Succión del dedo' },
                { key: 'rasgo_crueldad', label: 'Crueldad' },
                { key: 'rasgo_tendencia_mentir', label: 'Tendencia a mentir' },
                { key: 'rasgo_tics', label: 'Tics' },
                { key: 'rasgo_sonambulismo', label: 'Sonambulismo' },
                { key: 'rasgo_enuresis', label: 'Enuresis' },
                { key: 'rasgo_somniloquia', label: 'Somniloquia' },
                { key: 'rasgo_tartamudez', label: 'Tartamudez' },
                { key: 'rasgo_hiperactividad', label: 'Hiperactividad' },
                { key: 'rasgo_rabietas', label: 'Rabietas' },
                { key: 'rasgo_pesadillas', label: 'Pesadillas' },
                { key: 'rasgo_fobia', label: 'Fobias' },
                { key: 'rasgo_pica', label: 'Pica' }
            ];
            const traitsHtml = traitsList.map(t => {
                const val = ficha ? (ficha as any)[t.key] === true : false;
                const detail = ficha ? (ficha as any)[`${t.key}_detalle`] : '';
                return `
                    <div class="trait-item ${val ? 'present' : ''}">
                        <span class="checkbox-icon">${val ? '☒' : '☐'}</span>
                        <strong>${t.label}</strong>
                        ${val && detail ? `<div class="detail-text">${detail}</div>` : ''}
                    </div>
                `;
            }).join('');

            // 2. Map non-psychiatric patologies
            const patologiaList = [
                { key: 'patologia_diabetes', label: 'Diabetes' },
                { key: 'patologia_post_parto', label: 'Post-Parto' },
                { key: 'patologia_cardiovascular_hta', label: 'Cardiovascular / HTA' },
                { key: 'patologia_inmunodeficiencia_vih', label: 'VIH / Inmunodef.' },
                { key: 'patologia_hepatica', label: 'Hepática' },
                { key: 'patologia_renal', label: 'Renal' },
                { key: 'patologia_neurologica', label: 'Neurológica' },
                { key: 'patologia_metabolica', label: 'Metabólica' },
                { key: 'patologia_embarazo', label: 'Embarazo' },
                { key: 'patologia_cancer', label: 'Cáncer' }
            ];
            const patologiasHtml = patologiaList.map(p => {
                const val = ficha ? (ficha as any)[p.key] === true : false;
                let extra = '';
                if (p.key === 'patologia_embarazo' && val && ficha?.patologia_embarazo_trimestre) {
                    extra = ` (${ficha.patologia_embarazo_trimestre})`;
                }
                return `
                    <div class="pat-item ${val ? 'present' : ''}">
                        <span class="checkbox-icon">${val ? '☒' : '☐'}</span> ${p.label}${extra}
                    </div>
                `;
            }).join('');

            // 3. Map habits
            const habitosHtml = `
                <table class="nocivo-table">
                    <thead>
                        <tr>
                            <th>Hábito Nocivo</th>
                            <th>Consumo / Uso</th>
                            <th>Frecuencia</th>
                            <th>Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Tabaco</strong></td>
                            <td>${ficha?.habito_tabaco_consumo || '-'}</td>
                            <td>${ficha?.habito_tabaco_frecuencia || '-'}</td>
                            <td>${ficha?.habito_tabaco_cantidad || '-'}</td>
                        </tr>
                        <tr>
                            <td><strong>Alcohol</strong></td>
                            <td>${ficha?.habito_alcohol_consumo || '-'}</td>
                            <td>${ficha?.habito_alcohol_frecuencia || '-'}</td>
                            <td>${ficha?.habito_alcohol_cantidad || '-'}</td>
                        </tr>
                        <tr>
                            <td><strong>Drogas</strong></td>
                            <td>${ficha?.habito_drogas_consumo || '-'}</td>
                            <td>${ficha?.habito_drogas_frecuencia || '-'}</td>
                            <td>${ficha?.habito_drogas_cantidad || '-'}</td>
                        </tr>
                        <tr>
                            <td><strong>Juegos</strong></td>
                            <td>${ficha?.habito_juegos_consumo || '-'}</td>
                            <td>${ficha?.habito_juegos_frecuencia || '-'}</td>
                            <td>${ficha?.habito_juegos_cantidad || '-'}</td>
                        </tr>
                    </tbody>
                </table>
            `;

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
                throw new Error('No se pudo crear el iframe de impresión');
            }

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Historia Clínica - ${formatFullName(fullPaciente)}</title>
                    <style>
                        @page { 
                            size: A4; 
                            margin: 1.2cm 1cm 1.2cm 1cm; 
                        }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            color: #2c3e50; 
                            line-height: 1.35; 
                            font-size: 9.5px; 
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 12px; 
                            border-bottom: 2px solid #3b82f6; 
                            padding-bottom: 6px; 
                        }
                        h1 { color: #1e3a8a; margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
                        
                        .section-block {
                            margin-top: 10px;
                            page-break-inside: avoid;
                        }
                        h2 { 
                            background: #eff6ff; 
                            color: #1e40af; 
                            padding: 4px 8px; 
                            margin: 8px 0 6px 0;
                            font-size: 10.5px; 
                            text-transform: uppercase; 
                            border-left: 4.5px solid #3b82f6; 
                            font-weight: 700;
                        }
                        .info-grid { 
                            display: grid; 
                            grid-template-columns: repeat(4, 1fr); 
                            gap: 5px; 
                        }
                        .field { 
                            border-bottom: 1px solid #edf2f7; 
                            padding: 2.5px 0; 
                        }
                        .label { 
                            font-weight: bold; 
                            color: #718096; 
                            font-size: 7.5px; 
                            text-transform: uppercase; 
                            display: block; 
                            margin-bottom: 1px;
                        }
                        .value { 
                            font-size: 9px; 
                            color: #1a202c; 
                            min-height: 11px; 
                            font-weight: 500;
                        }
                        .span-2 { grid-column: span 2; }
                        .span-3 { grid-column: span 3; }
                        .span-4 { grid-column: span 4; }
                        
                        .detail-block {
                            background: #f7fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            padding: 6px 8px;
                            margin-top: 4px;
                            font-size: 9px;
                            color: #2d3748;
                            white-space: pre-wrap;
                        }
                        
                        .traits-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 4px;
                        }
                        .trait-item {
                            padding: 3.5px 5px;
                            background: #f8fafc;
                            border: 1px solid #edf2f7;
                            border-radius: 5px;
                            font-size: 8.5px;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            flex-wrap: wrap;
                        }
                        .trait-item.present {
                            background: #fffbeb;
                            border-color: #fde68a;
                            color: #92400e;
                        }
                        .checkbox-icon { 
                            font-size: 11px; 
                            font-weight: bold; 
                        }
                        .detail-text {
                            font-size: 8px;
                            color: #4b5563;
                            font-style: italic;
                            width: 100%;
                            margin-left: 15px;
                        }

                        .nocivo-table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 4px;
                        }
                        .nocivo-table th { 
                            background: #f7fafc; 
                            font-weight: bold; 
                            color: #4a5568; 
                            text-transform: uppercase; 
                            font-size: 7.5px; 
                            border: 1px solid #e2e8f0; 
                            padding: 3.5px;
                        }
                        .nocivo-table td { 
                            padding: 3.5px; 
                            border: 1px solid #e2e8f0; 
                            font-size: 8.5px;
                        }
                        
                        .pat-grid {
                            display: grid;
                            grid-template-columns: repeat(5, 1fr);
                            gap: 4px;
                        }
                        .pat-item {
                            padding: 3.5px 5px;
                            background: #f8fafc;
                            border: 1px solid #edf2f7;
                            border-radius: 5px;
                            font-size: 8.5px;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        }
                        .pat-item.present {
                            background: #fef2f2;
                            border-color: #fca5a5;
                            color: #991b1b;
                        }
                        
                        .vital-cards {
                            display: grid;
                            grid-template-columns: repeat(8, 1fr);
                            gap: 4px;
                            margin-top: 4px;
                        }
                        .vital-card {
                            background: #f8fafc;
                            border: 1px solid #e2e8f0;
                            padding: 5px;
                            border-radius: 5px;
                            text-align: center;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                        }
                        .vital-card .v-lbl {
                            font-size: 7px;
                            color: #718096;
                            text-transform: uppercase;
                            font-weight: bold;
                            margin-bottom: 2px;
                        }
                        .vital-card .v-val {
                            font-size: 11px;
                            font-weight: 800;
                            color: #2d3748;
                        }
                        .vital-card .v-unit {
                            font-size: 7px;
                            color: #a0aec0;
                            margin-top: 1px;
                        }
                        
                        .signature-section {
                            margin-top: 30px;
                            page-break-inside: avoid;
                            display: flex;
                            justify-content: center;
                            width: 100%;
                        }
                        .signature-box { 
                            text-align: center; 
                            width: 220px; 
                        }
                        .sig-line { border-top: 1px solid #4a5568; margin-top: 2px; }
                        
                        .footer { 
                            margin-top: 15px;
                            font-size: 7.5px; 
                            color: #a0aec0; 
                            border-top: 1px solid #edf2f7; 
                            padding-top: 4px; 
                            display: flex; 
                            justify-content: space-between; 
                            page-break-inside: avoid;
                        }
                        @media print {
                            .section-block { page-break-inside: avoid; }
                            h2 { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .trait-item.present { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .pat-item.present { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    <!-- I. FILIACION -->
                    <div class="header">
                        <h1>Historia Clínica Mental</h1>
                        <div style="font-size: 9px; color: #718096; margin-top: 2px;">
                            Fecha de Registro: ${new Date(fullPaciente.fecha_ingreso).toLocaleDateString()} | Hora: ${fullPaciente.hora_ingreso || '—'}
                        </div>
                    </div>

                    <div class="section-block">
                        <h2>I. Filiación del Paciente</h2>
                        <div class="info-grid">
                            <div class="field"><span class="label">Ap. Paterno</span><div class="value">${fullPaciente.paterno || '-'}</div></div>
                            <div class="field"><span class="label">Ap. Materno</span><div class="value">${fullPaciente.materno || '-'}</div></div>
                            <div class="field"><span class="label">Nombres</span><div class="value">${fullPaciente.nombre || '-'}</div></div>
                            <div class="field"><span class="label">F. Nacimiento</span><div class="value">${fullPaciente.fecha_nacimiento ? new Date(fullPaciente.fecha_nacimiento).toLocaleDateString() : '-'}</div></div>
                            
                            <div class="field"><span class="label">Edad</span><div class="value">${calcularEdad(fullPaciente.fecha_nacimiento)}</div></div>
                            <div class="field"><span class="label">Sexo (Género)</span><div class="value">${fullPaciente.genero === 'M' ? 'Masculino' : fullPaciente.genero === 'F' ? 'Femenino' : (fullPaciente.genero || '-')}</div></div>
                            <div class="field"><span class="label">D.N.I.</span><div class="value">${fullPaciente.dni || '-'}</div></div>
                            <div class="field"><span class="label">Lugar Nacimiento</span><div class="value">${fullPaciente.lugar_nacimiento || '-'}</div></div>
                            
                            <div class="field"><span class="label">Celular</span><div class="value">${fullPaciente.telefono_celular || '-'}</div></div>
                            <div class="field"><span class="label">Email</span><div class="value">${fullPaciente.email || '-'}</div></div>
                            <div class="field"><span class="label">Raza</span><div class="value">${fullPaciente.raza || '-'}</div></div>
                            <div class="field"><span class="label">Estado Civil</span><div class="value">${fullPaciente.estado_civil || '-'}</div></div>
                            
                            <div class="field"><span class="label">Idioma</span><div class="value">${fullPaciente.idioma === 'Otro' ? `Otro (${fullPaciente.idioma_otro || ''})` : (fullPaciente.idioma || '-')}</div></div>
                            <div class="field"><span class="label">Religión</span><div class="value">${fullPaciente.religion || '-'}</div></div>
                            <div class="field"><span class="label">Instrucción</span><div class="value">${fullPaciente.grado_instruccion || '-'}</div></div>
                            <div class="field"><span class="label">Ocupación</span><div class="value">${fullPaciente.ocupacion || '-'}</div></div>
                            
                            <div class="field"><span class="label">Residencia Lima</span><div class="value">${fullPaciente.tiempo_residencia_lima || '-'}</div></div>
                            <div class="field"><span class="label">Vive con</span><div class="value">${fullPaciente.vive_con === 'Otros' || fullPaciente.vive_con === 'Otros parientes' ? `${fullPaciente.vive_con} (${fullPaciente.vive_con_otros || ''})` : (fullPaciente.vive_con || '-')}</div></div>
                            <div class="field"><span class="label">Tutor / Responsable</span><div class="value">${fullPaciente.responsable_nombre || fullPaciente.tutor_nombre || '-'}</div></div>
                            <div class="field"><span class="label">Teléfono Tutor</span><div class="value">${fullPaciente.responsable_telefono || fullPaciente.tutor_dni || '-'}</div></div>
                            
                            <div class="field"><span class="label">Tipo Anamnesis</span><div class="value">${fullPaciente.tipo_anamnesis || '-'}</div></div>
                            <div class="field"><span class="label">Recomendado Por</span><div class="value">${ficha?.recomendado_por || '-'}</div></div>
                            <div class="field span-2"><span class="label">Dirección</span><div class="value">${fullPaciente.direccion || '-'}</div></div>
                            
                            <div class="field span-4"><span class="label">Motivo de Consulta</span><div class="value">${ficha?.motivo_consulta || '-'}</div></div>
                        </div>
                        ${fullPaciente.observaciones ? `
                            <div style="margin-top: 5px;">
                                <span class="label">Observaciones Generales</span>
                                <div class="detail-block">${fullPaciente.observaciones}</div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- II. ENFERMEDAD ACTUAL -->
                    <div class="section-block">
                        <h2>II. Enfermedad Actual</h2>
                        <div class="info-grid">
                            <div class="field"><span class="label">Tiempo de Enf.</span><div class="value">${ficha?.enf_actual_tiempo || '-'}</div></div>
                            <div class="field"><span class="label">Tiempo Evolución</span><div class="value">${ficha?.enf_actual_te || '-'}</div></div>
                            <div class="field"><span class="label">Inicio</span><div class="value">${ficha?.enf_actual_inicio || '-'}</div></div>
                            <div class="field"><span class="label">Curso</span><div class="value">${ficha?.enf_actual_curso || '-'}</div></div>
                            <div class="field span-4"><span class="label">Síntomas Principales</span><div class="value">${ficha?.enf_actual_sintomas || '-'}</div></div>
                        </div>
                        ${ficha?.enf_actual_relato ? `
                            <div style="margin-top: 5px;">
                                <span class="label">Relato Cronológico</span>
                                <div class="detail-block">${ficha.enf_actual_relato}</div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- III. ANTECEDENTES -->
                    <div class="section-block">
                        <h2>III. Antecedentes Personales</h2>
                        
                        <div style="margin-bottom: 6px;">
                            <span class="label" style="margin-bottom: 3px;">1. Rasgos Psicopatológicos de la Infancia</span>
                            <div class="traits-grid">
                                ${traitsHtml || '<div class="span-3 text-center">- No registra antecedentes de infancia -</div>'}
                            </div>
                        </div>

                        <div class="info-grid" style="margin-top: 8px;">
                            <div class="field span-2"><span class="label">2. Historia Perinatal</span><div class="value">${ficha?.perinatal || '-'}</div></div>
                            <div class="field span-2"><span class="label">3. Desarrollo Psicomotor</span><div class="value">${ficha?.desarrollo_psicomotor || '-'}</div></div>
                            <div class="field span-2"><span class="label">4. Escolaridad</span><div class="value">${ficha?.escolaridad || '-'}</div></div>
                            <div class="field span-2"><span class="label">5. Personalidad Previa</span><div class="value">${ficha?.personalidad_previa || '-'}</div></div>
                            <div class="field span-2"><span class="label">6. Historia Laboral</span><div class="value">${ficha?.historia_laboral || '-'}</div></div>
                            <div class="field span-2"><span class="label">7. Hábitos o Intereses</span><div class="value">${ficha?.habitos_intereses || '-'}</div></div>
                        </div>

                        <div style="margin-top: 8px;">
                            <span class="label">8. Hábitos Nocivos</span>
                            ${habitosHtml}
                        </div>

                        <div style="margin-top: 8px;">
                            <span class="label" style="margin-bottom: 3px;">14. Antecedentes Patológicos (Médicos No Psiquiátricos)</span>
                            <div class="pat-grid">
                                ${patologiasHtml}
                            </div>
                            ${ficha?.patologia_otros ? `
                                <div style="margin-top: 4px;">
                                    <span class="label">Otras Patologías</span>
                                    <div class="detail-block">${ficha.patologia_otros}</div>
                                </div>
                            ` : ''}
                        </div>

                        <div class="info-grid" style="margin-top: 8px;">
                            <div class="field span-2"><span class="label">9. Recreación y Vida Social</span><div class="value">${ficha?.recreacion_vida_social || '-'}</div></div>
                            <div class="field span-2"><span class="label">10. Vida Sexual</span><div class="value">${ficha?.vida_sexual || '-'}</div></div>
                            <div class="field span-2"><span class="label">11. Estresores Psicosociales</span><div class="value">${ficha?.estresores_psicosociales || '-'}</div></div>
                            <div class="field span-2"><span class="label">12. Antecedentes Socio-Culturales</span><div class="value">${ficha?.antecedentes_socio_culturales || '-'}</div></div>
                            <div class="field span-2"><span class="label">12. Actitud ante la Enfermedad</span><div class="value">${ficha?.actitud_enfermedad || '-'}</div></div>
                            <div class="field span-2"><span class="label">13. Gineco-Obstétricos</span><div class="value">${ficha?.antecedentes_gineco_obstetricos || '-'}</div></div>
                            <div class="field span-2"><span class="label">15. Traumatismo y Accidentes</span><div class="value">${ficha?.traumatismo_accidentes || '-'}</div></div>
                            <div class="field span-2"><span class="label">16. Alergias</span><div class="value">${ficha?.alergias_ficha || '-'}</div></div>
                            <div class="field span-2"><span class="label">17. Hospitalizaciones</span><div class="value">${ficha?.hospitalizaciones || '-'}</div></div>
                            <div class="field span-2"><span class="label">18. Transfusiones</span><div class="value">${ficha?.transfusiones || '-'}</div></div>
                            <div class="field span-2"><span class="label">19. Quirúrgicos</span><div class="value">${ficha?.quirurgicos || '-'}</div></div>
                            <div class="field span-2"><span class="label">20. Antecedentes Psicopatológicos</span><div class="value">${ficha?.antecedentes_psicopatologicos || '-'}</div></div>
                        </div>
                    </div>

                    <!-- IV. ANTECEDENTES FAMILIARES & GENERALES -->
                    <div class="section-block">
                        <h2>IV. Antecedentes Familiares / Generales</h2>
                        <div class="info-grid">
                            <div class="field span-2"><span class="label">Padre</span><div class="value">${ficha?.ant_fam_padre || '-'}</div></div>
                            <div class="field span-2"><span class="label">Madre</span><div class="value">${ficha?.ant_fam_madre || '-'}</div></div>
                            <div class="field span-4"><span class="label">Hermanos</span><div class="value">${ficha?.ant_fam_hermanos || '-'}</div></div>
                            <div class="field span-2"><span class="label">Dinámica Familiar</span><div class="value">${ficha?.ant_fam_dinamica || '-'}</div></div>
                            <div class="field span-2"><span class="label">Estructura Familiar / Genograma</span><div class="value">${ficha?.ant_fam_estructura || '-'}</div></div>
                            <div class="field span-4"><span class="label">Condiciones de Vida (Vivienda y Servicios)</span><div class="value">${ficha?.ant_generales || '-'}</div></div>
                        </div>
                    </div>

                    <!-- V. EXAMEN FISICO -->
                    <div class="section-block">
                        <h2>V. Examen Físico</h2>
                        <div class="info-grid">
                            <div class="field"><span class="label">Apetito</span><div class="value">${ficha?.examen_bio_apetito || '-'}</div></div>
                            <div class="field"><span class="label">Sed</span><div class="value">${ficha?.examen_bio_sed || '-'}</div></div>
                            <div class="field"><span class="label">Orina</span><div class="value">${ficha?.examen_bio_orina || '-'}</div></div>
                            <div class="field"><span class="label">Deposiciones</span><div class="value">${ficha?.examen_bio_deposiciones || '-'}</div></div>
                            <div class="field"><span class="label">Sueño</span><div class="value">${ficha?.examen_bio_sueno || '-'}</div></div>
                            <div class="field span-3"><span class="label">Alimentación Diaria</span><div class="value">${ficha?.examen_bio_alimentacion || '-'}</div></div>
                        </div>

                        <div style="margin-top: 6px;">
                            <span class="label">Funciones Vitales</span>
                            <div class="vital-cards">
                                <div class="vital-card"><span class="v-lbl">FC</span><span class="v-val">${ficha?.examen_vit_fc || '—'}</span><span class="v-unit">lpm</span></div>
                                <div class="vital-card"><span class="v-lbl">FR</span><span class="v-val">${ficha?.examen_vit_fr || '—'}</span><span class="v-unit">rpm</span></div>
                                <div class="vital-card"><span class="v-lbl">Temp</span><span class="v-val">${ficha?.examen_vit_temp || '—'}</span><span class="v-unit">°C</span></div>
                                <div class="vital-card"><span class="v-lbl">Sat O₂</span><span class="v-val">${ficha?.examen_vit_sat || '—'}</span><span class="v-unit">%</span></div>
                                <div class="vital-card"><span class="v-lbl">PA</span><span class="v-val">${ficha?.examen_vit_pa || '—'}</span><span class="v-unit">mmHg</span></div>
                                <div class="vital-card"><span class="v-lbl">Peso</span><span class="v-val">${ficha?.examen_vit_peso || '—'}</span><span class="v-unit">kg</span></div>
                                <div class="vital-card"><span class="v-lbl">Talla</span><span class="v-val">${ficha?.examen_vit_talla || '—'}</span><span class="v-unit">m</span></div>
                                <div class="vital-card"><span class="v-lbl">IMC</span><span class="v-val">${ficha?.examen_vit_imc ? parseFloat(ficha.examen_vit_imc).toFixed(1) : '—'}</span><span class="v-unit">Auto</span></div>
                            </div>
                        </div>

                        <div class="info-grid" style="margin-top: 6px;">
                            <div class="field"><span class="label">Aspecto General</span><div class="value">${ficha?.examen_aspecto_general || '-'}</div></div>
                            <div class="field"><span class="label">Piel y Faneras</span><div class="value">${ficha?.examen_piel_faneras || '-'}</div></div>
                            <div class="field"><span class="label">Cabeza</span><div class="value">${ficha?.examen_cabeza || '-'}</div></div>
                            <div class="field"><span class="label">Ojos</span><div class="value">${ficha?.examen_ojos || '-'}</div></div>
                            <div class="field"><span class="label">Nariz</span><div class="value">${ficha?.examen_nariz || '-'}</div></div>
                            <div class="field"><span class="label">Oídos</span><div class="value">${ficha?.examen_oidos || '-'}</div></div>
                            <div class="field"><span class="label">Boca</span><div class="value">${ficha?.examen_boca || '-'}</div></div>
                            <div class="field"><span class="label">Cuello</span><div class="value">${ficha?.examen_cuello || '-'}</div></div>
                            <div class="field"><span class="label">Tórax</span><div class="value">${ficha?.examen_torax || '-'}</div></div>
                            <div class="field"><span class="label">Cardiovascular</span><div class="value">${ficha?.examen_cardiovascular || '-'}</div></div>
                            <div class="field"><span class="label">Abdomen</span><div class="value">${ficha?.examen_abdomen || '-'}</div></div>
                            <div class="field"><span class="label">Urogenital</span><div class="value">${ficha?.examen_urogenital || '-'}</div></div>
                            <div class="field"><span class="label">Extremidades/Columna</span><div class="value">${ficha?.examen_extremidades_columnas || '-'}</div></div>
                            <div class="field"><span class="label">Neurológico</span><div class="value">${ficha?.examen_neurologicos || '-'}</div></div>
                            <div class="field"><span class="label">Linfáticos</span><div class="value">${ficha?.examen_linfaticos || '-'}</div></div>
                        </div>
                    </div>

                    <!-- VI. EXAMEN MENTAL -->
                    <div class="section-block">
                        <h2>VI. Examen Mental</h2>
                        <div class="info-grid">
                            <div class="field span-2"><span class="label">1. Apariencia y Comportamiento</span><div class="value">${ficha?.examen_mental_apariencia || '-'}</div></div>
                            <div class="field span-2"><span class="label">2. Lenguaje</span><div class="value">${ficha?.examen_mental_lenguaje || '-'}</div></div>
                            <div class="field span-2"><span class="label">3. Afecto</span><div class="value">${ficha?.examen_mental_afecto || '-'}</div></div>
                            <div class="field span-2"><span class="label">4. Pensamiento</span><div class="value">${ficha?.examen_mental_pensamiento || '-'}</div></div>
                            <div class="field span-2"><span class="label">5. Percepción</span><div class="value">${ficha?.examen_mental_percepcion || '-'}</div></div>
                            
                            <div class="field span-2"><span class="label">6a. Conciencia y Orientación</span><div class="value">${ficha?.examen_mental_cognicion_conciencia || '-'}</div></div>
                            <div class="field"><span class="label">6b. Atención</span><div class="value">${ficha?.examen_mental_cognicion_atencion || '-'}</div></div>
                            <div class="field"><span class="label">6c. Memoria</span><div class="value">${ficha?.examen_mental_cognicion_memoria || '-'}</div></div>
                            <div class="field"><span class="label">6d. Inteligencia</span><div class="value">${ficha?.examen_mental_cognicion_inteligencia || '-'}</div></div>
                            <div class="field"><span class="label">6e. Juicio</span><div class="value">${ficha?.examen_mental_cognicion_juicio || '-'}</div></div>
                            
                            <div class="field span-2"><span class="label">7. Funciones Ejecutivas</span><div class="value">${ficha?.examen_mental_funciones_ejecutivas || '-'}</div></div>
                            <div class="field span-2"><span class="label">8. Conciencia de Enfermedad</span><div class="value">${ficha?.examen_mental_conciencia_enfermedad || '-'}</div></div>
                        </div>
                    </div>

                    <!-- VII. IMPRESION DIAGNOSTICA -->
                    <div class="section-block">
                        <h2>VII. Impresión Diagnóstica</h2>
                        ${ficha?.diagnosticos && ficha.diagnosticos.length > 0 ? `
                            <div style="margin-top: 4px;">
                                <table style="width:100%; border-collapse:collapse; margin-top:2px;">
                                    <thead>
                                        <tr>
                                            <th style="text-align:left; font-size:7.5px; border-bottom:1px solid #e2e8f0; padding:3px; color:#718096; text-transform:uppercase;">Diagnóstico</th>
                                            <th style="text-align:left; font-size:7.5px; border-bottom:1px solid #e2e8f0; padding:3px; color:#718096; text-transform:uppercase; width:120px;">Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${ficha.diagnosticos.map(d => `
                                            <tr>
                                                <td style="font-size:9px; padding:4px 3px; border-bottom:1px solid #edf2f7; font-weight:600;">${d.diagnostico}</td>
                                                <td style="font-size:8.5px; padding:4px 3px; border-bottom:1px solid #edf2f7;"><span style="font-weight:700; color:#1e40af;">${d.tipo}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div style="font-size: 9px; padding: 4px; font-style: italic; color: #718096;">
                                Sin diagnósticos registrados
                            </div>
                        `}
                    </div>

                    <div class="signature-section">
                        <div class="signature-box">
                            ${patientSignature ? `
                                 <img src="${patientSignature.firmaData}" style="max-height: 70px; margin-bottom: 2px; position: relative; z-index: 1;" />
                             ` : '<div style="height: 60px;"></div>'}
                            <div class="sig-line"></div>
                            <div style="font-weight: bold; margin-top: 4px;">${formatFullName(fullPaciente)}</div>
                            <div style="font-size: 8.5px; color: #718096;">Firma del Paciente</div>
                        </div>
                    </div>

                    <div class="footer">
                        <div>Dr. Ojeda - Sistema de Gestión de Psiquiatría y Psicología</div>
                        <div>Fecha Impresión: ${new Date().toLocaleDateString()}</div>
                    </div>
                </body>
                </html>
            `;

            doc.open();
            doc.write(printContent);
            doc.close();

            const images = Array.from(doc.querySelectorAll('img'));
            let printTriggered = false;

            const doPrint = () => {
                if (printTriggered) return;
                printTriggered = true;
                if (Swal.isVisible()) Swal.close();
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Print error:', e);
                }
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 2000);
            };

            if (images.length === 0) {
                doPrint();
            } else {
                let loadedCount = 0;
                images.forEach(img => {
                    img.onload = () => {
                        loadedCount++;
                        if (loadedCount === images.length) doPrint();
                    };
                    img.onerror = () => {
                        loadedCount++;
                        if (loadedCount === images.length) doPrint();
                    };
                });
            }
        } catch (error) {
            console.error('Error al imprimir:', error);
            Swal.fire('Error', 'No se pudo generar el documento de impresión', 'error');
        }
    };

    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        {tipo === 'particular' ? (
                             <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        ) : tipo === 'seguro' ? (
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            </div>
                        ) : (
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        )}
                        {tipo === 'particular' ? 'Pacientes Particulares' : tipo === 'seguro' ? 'Pacientes Seguro' : 'Gestión de Pacientes'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {tipo === 'particular' ? 'Listado de pacientes sin convenio o particulares.' : tipo === 'seguro' ? 'Listado de pacientes vinculados a seguros y convenios.' : 'Administre todos los pacientes registrados en el sistema.'}
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

                    <button
                        onClick={() => navigate('/pacientes/create' + (tipo ? `?tipo=${tipo}` : ''))}
                        className="inline-flex items-center px-5 py-2.5 bg-[#3498db] hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5 active:scale-95 gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Nuevo Paciente
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex gap-2 w-full md:max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, paterno o materno..."
                            value={searchInput}
                            onChange={handleSearch}
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
            </div>

            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalRecords)} de {totalRecords} registros
            </div>

            <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Celular</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Nacimiento</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Firma HC</th>
                            <th className="no-print px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {Array.isArray(pacientes) && pacientes.map((paciente, index) => (
                            <tr key={paciente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-800 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">
                                    <div className="flex flex-col">
                                        <span 
                                            className="font-bold cursor-pointer text-blue-600 hover:text-blue-800 hover:underline transition-all"
                                            onClick={() => navigate(`/pacientes/${paciente.id}/ficha`)}
                                        >
                                            {formatFullName(paciente)}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{formatDate(paciente.fecha_ingreso)}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{formatCelular(paciente.telefono_celular)}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">
                                    {formatDate(paciente.fecha_nacimiento)}
                                    {paciente.fecha_nacimiento && (
                                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({calcularEdad(paciente.fecha_nacimiento)})</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm ${paciente.estado === 'activo'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        }`}>
                                        {paciente.estado}
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        {(paciente as any).esta_firmado ? (
                                            <div className="flex items-center text-green-600 dark:text-green-400 font-bold" title="Historia Clínica Firmada">
                                                <CheckCircle size={20} className="mr-1" />
                                                <span className="text-xs">Firmado</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedPacienteId(paciente.id);
                                                    setShowSignatureModal(true);
                                                }}
                                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Firmar Historia Clínica"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </td>


                                <td className="no-print p-3 flex gap-2">
                                    <button
                                        onClick={() => handlePrintPaciente(paciente)}
                                        className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Imprimir Ficha"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                            <rect x="6" y="14" width="12" height="8"></rect>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => navigate(`/pacientes/edit/${paciente.id}`)}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    {paciente.estado === 'activo' ? (
                                        <button
                                            onClick={() => handleDelete(paciente.id)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(paciente.id)}
                                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Reactivar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {(!pacientes || pacientes.length === 0) && (
                            <tr>
                                <td colSpan={7} className="p-5 text-center text-gray-500 dark:text-gray-400">No hay pacientes registrados</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Pacientes"
                sections={manualSections}
            />


            {showSignatureModal && selectedPacienteId && (
                <SignatureModal
                    isOpen={showSignatureModal}
                    onClose={() => {
                        setShowSignatureModal(false);
                        setSelectedPacienteId(null);
                    }}
                    tipoDocumento="historia_clinica"
                    documentoId={selectedPacienteId}
                    rolFirmante="paciente"
                    onSuccess={() => {
                        fetchPacientes();
                    }}
                />
            )}
        </div>
    );
};

export default PacienteList;
