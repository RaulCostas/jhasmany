import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { formatFullName, formatNumber } from '../utils/formatters';
import Swal from 'sweetalert2';
import type { Paciente, HistoriaClinica as HistoriaClinicaType, Pago } from '../types';
import HistoriaClinicaForm from './HistoriaClinicaForm';
import HistoriaClinicaList from './HistoriaClinicaList';
import SeguimientoViewModal from './SeguimientoViewModal';
import RecordatorioTratamientoModal from './RecordatorioTratamientoModal';
import { formatDate } from '../utils/dateUtils';
import { Info } from 'lucide-react';



const HistoriaClinica: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [historia, setHistoria] = useState<HistoriaClinicaType[]>([]);
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [musicaPreferences, setMusicaPreferences] = useState<string[]>([]);
    const [televisionPreferences, setTelevisionPreferences] = useState<string[]>([]);


    const [historiaToEdit, setHistoriaToEdit] = useState<HistoriaClinicaType | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showSeguimientoModal, setShowSeguimientoModal] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedReminderHistoria, setSelectedReminderHistoria] = useState<HistoriaClinicaType | null>(null);

    // Tabs States
    const [activeTab, setActiveTab] = useState<'seguimiento'>('seguimiento');



    // Format phone number as (+code) number
    const formatPhoneNumber = (phone: string | undefined): string => {
        if (!phone) return 'N/A';

        // Remove any spaces or special characters
        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.startsWith('51') && cleaned.length === 11) {
            const countryCode = '51';
            const number = cleaned.substring(2);
            return `(+${countryCode}) ${number}`;
        }

        // If it starts with a country code (e.g., 591 for Bolivia)
        if (cleaned.length >= 10) {
            // Assume first 2-3 digits are country code
            const countryCode = cleaned.substring(0, cleaned.length - 8);
            const number = cleaned.substring(cleaned.length - 8);
            return `(+${countryCode}) ${number}`;
        }

        // If it's just a local number
        return phone;
    };

    useEffect(() => {
        if (location.state?.initialTab) {
            setActiveTab(location.state.initialTab as any);
        }
    }, [location.state]);

    useEffect(() => {
        if (id) {
            fetchPaciente();
            fetchHistoria();
            fetchPagos();
            fetchMusicaTelevision();
        }
    }, [id]);



    const fetchPagos = async () => {
        try {
            const response = await api.get(`/pagos/paciente/${id}`);
            setPagos(response.data);
        } catch (error) {
            console.error('Error fetching pagos:', error);
        }
    };

    const fetchPaciente = async () => {
        try {
            const response = await api.get(`/pacientes/${id}`);
            setPaciente(response.data);
        } catch (error) {
            console.error('Error fetching paciente:', error);
        }
    };

    const fetchHistoria = async () => {
        try {
            const response = await api.get(`/historia-clinica/paciente/${id}`);
            setHistoria(response.data);
        } catch (error) {
            console.error('Error fetching historia:', error);
        }
    };



    const fetchMusicaTelevision = async () => {
        if (!id) return;
        try {
            const [musicasRes, televisionesRes, allMusicasRes, allTelevisionesRes] = await Promise.all([
                api.get(`/pacientes/${id}/musica`),
                api.get(`/pacientes/${id}/television`),
                api.get('/musica?limit=100'),
                api.get('/television?limit=100')
            ]);

            const selectedMusicaIds = musicasRes.data || [];
            const selectedTelevisionIds = televisionesRes.data || [];

            const allMusicas = allMusicasRes.data.data || allMusicasRes.data;
            const allTelevisiones = allTelevisionesRes.data.data || allTelevisionesRes.data;

            // Mapear IDs a nombres
            const musicaNames = allMusicas
                .filter((m: any) => selectedMusicaIds.includes(m.id))
                .map((m: any) => m.musica);
            const televisionNames = allTelevisiones
                .filter((t: any) => selectedTelevisionIds.includes(t.id))
                .map((t: any) => t.television);

            setMusicaPreferences(musicaNames);
            setTelevisionPreferences(televisionNames);
        } catch (error) {
            console.error('Error fetching música/televisión:', error);
        }
    };

    const handleVolver = () => {
        if (paciente) {
            const isParticular = !paciente.seguro || paciente.seguro?.nombre?.toLowerCase() === 'particular';
            const tipo = isParticular ? 'particular' : 'seguro';
            navigate(`/pacientes?tipo=${tipo}`);
        } else {
            navigate('/pacientes');
        }
    };

    const handleDelete = async (historiaId: number) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: "No podrá revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/historia-clinica/${historiaId}`);
                fetchHistoria();
                Swal.fire({
                    title: '¡Eliminado!',
                    text: 'El registro ha sido eliminado.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (error) {
                console.error('Error deleting historia:', error);
                Swal.fire(
                    'Error',
                    'Hubo un problema al eliminar el registro.',
                    'error'
                );
            }
        }
    };

    const handleEdit = (item: HistoriaClinicaType) => {
        setHistoriaToEdit(item);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setHistoriaToEdit(null);
        setShowForm(false);
    };






    const filteredHistoria = historia;


    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
        });
    };

    const handlePrintHistory = async () => {
        const doc = new jsPDF();

        try {
            const logoSrc = "/logo-jhasmany.jpg";
            if (logoSrc) {
                const logo = await loadImage(logoSrc);
                // [Antigravity: removed logo from print] doc.addImage(logo, 'PNG', 14, 15, 35, 14);
            }
        } catch (error) {
            console.warn('Could not load logo', error);
        }

        // Header
        const pageWidth = doc.internal.pageSize.width;
        doc.setDrawColor(52, 152, 219); // #3498db
        doc.setLineWidth(1);
        doc.line(15, 35, pageWidth - 15, 35);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(44, 62, 80); // #2c3e50
        doc.text('SEGUIMIENTO CLÍNICO', 105, 25, { align: 'center' });
        doc.setTextColor(0, 0, 0);

        // Patient info box with blue border (matching Próxima Cita format)
        const boxY = 40;
        const boxHeight = 12;

        // Gray background
        doc.setFillColor(248, 249, 250); // #f8f9fa
        doc.rect(15, boxY, pageWidth - 30, boxHeight, 'F');

        // Blue left border
        doc.setFillColor(52, 152, 219); // #3498db
        doc.rect(15, boxY, 2, boxHeight, 'F');

        // Patient info text
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('PACIENTE:', 20, boxY + 6);
        doc.setFont('helvetica', 'normal');
        const pacienteNombre = paciente
            ? formatFullName(paciente)
            : 'N/A';
        doc.text(pacienteNombre.toUpperCase(), 45, boxY + 6);

        // Progress Notes Rendering
        if (filteredHistoria.length > 0) {
            let currentY = boxY + boxHeight + 10;
            const pageHeight = doc.internal.pageSize.height;

            filteredHistoria.forEach(item => {
                const title = `CONSULTA - ${formatDate(item.fecha)} (${item.servicio || ''} - ${item.modalidad || ''})`;
                
                // Estimate block height to handle pagination
                const blockHeight = 60; 
                if (currentY + blockHeight > pageHeight) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(52, 152, 219);
                doc.text(title, 15, currentY);
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(9);
                
                currentY += 6;
                doc.setFont('helvetica', 'bold');
                doc.text('Motivo de visita: ', 15, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(item.motivo_visita || '-', 45, currentY);
                
                currentY += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Examen Físico: ', 15, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(item.examen_fisico || '-', 45, currentY);

                currentY += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Examen Mental: ', 15, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(item.examen_mental || '-', 45, currentY);

                currentY += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Exámenes Aux: ', 15, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(item.examenes_auxiliares || '-', 45, currentY);

                currentY += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Diagnósticos: ', 15, currentY);
                doc.setFont('helvetica', 'normal');
                const diagsStr = (item.diagnosticos || []).map(d => `${d.diagnostico} (${d.tipo})`).join(', ') || '-';
                doc.text(diagsStr, 45, currentY);

                currentY += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Plan de Trabajo: ', 15, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(item.plan_trabajo || '-', 45, currentY);

                currentY += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Derivación: ', 15, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(item.derivar_consulta === 'SI' ? `SÍ (${item.derivar_consulta_detalle || ''})` : 'NO', 45, currentY);

                currentY += 10;
                doc.setDrawColor(220, 220, 220);
                doc.line(15, currentY - 4, doc.internal.pageSize.width - 15, currentY - 4);
            });
        }

        doc.autoPrint();
        const blobUrl = doc.output('bloburl');
        window.open(String(blobUrl), '_blank');
    };



    return (
        <div className="p-6 bg-white dark:bg-gray-800 min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">








            {/* Tab Contents */}
            <div className="animate-fade-in-up">
                {activeTab === 'seguimiento' ? (
                    <>
                        {(showForm || historiaToEdit) && (
                            <div className="mb-6">
                                <HistoriaClinicaForm
                                    pacienteId={Number(id)}
                                    paciente={paciente}
                                    onSuccess={() => {
                                        fetchHistoria();
                                        setShowForm(false);
                                    }}
                                    historiaToEdit={historiaToEdit}
                                    onCancelEdit={handleCancelEdit}
                                />
                            </div>
                        )}

                        <HistoriaClinicaList
                            historia={filteredHistoria}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onNewHistoria={!showForm && !historiaToEdit ? () => setShowForm(true) : undefined}
                            onPrint={handlePrintHistory}
                            onViewTimeline={() => setShowSeguimientoModal(true)}
                            onReminder={(item) => {
                                setSelectedReminderHistoria(item);
                                setShowReminderModal(true);
                            }}
                        />
                    </>
                ) : null}
            </div>

            {/* Seguimiento View Modal */}
            <SeguimientoViewModal
                isOpen={showSeguimientoModal}
                onClose={() => setShowSeguimientoModal(false)}
                historia={historia}
                paciente={paciente}
            />

            {/* Recordatorio Modal */}
            <RecordatorioTratamientoModal
                isOpen={showReminderModal}
                onClose={() => setShowReminderModal(false)}
                historia={selectedReminderHistoria}
                paciente={paciente}
            />
        </div >
    );
};

export default HistoriaClinica;
