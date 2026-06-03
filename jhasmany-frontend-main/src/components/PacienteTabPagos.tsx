import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Pago, Paciente, FormaPago } from '../types';
import { formatDate, getLocalDateString } from '../utils/dateUtils';
import { formatFullName, formatNumber, formatCurrency } from '../utils/formatters';
import { FileText, Plus, Trash2, DollarSign, CreditCard, Wallet, Info, X, Calendar, Hash, Tag, MessageSquare, Edit, Printer } from 'lucide-react';
import ManualModal, { type ManualSection } from './ManualModal';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';

interface PacienteTabPagosProps {
    tipo: 'particular' | 'seguro';
}

const PacienteTabPagos: React.FC<PacienteTabPagosProps> = ({ tipo }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [pagos, setPagos] = useState<Pago[]>([]);
    const [historia, setHistoria] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPagoId, setEditingPagoId] = useState<number | null>(null);
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [paymentFormData, setPaymentFormData] = useState({
        fecha: getLocalDateString(),
        monto: '',
        moneda: 'Soles',
        tc: 3.75,
        recibo: '',
        factura: '',
        formaPagoId: 0,
        observaciones: ''
    });
    const [showManual, setShowManual] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Control de Pagos',
            content: 'Aquí puede registrar y visualizar los pagos realizados por el paciente para un Plan de Tratamiento específico.'
        },
        {
            title: 'Resumen Financiero',
            content: 'Al seleccionar un plan, verá el costo total, el monto ya pagado y el saldo pendiente. El sistema calcula automáticamente los totales basándose en los pagos registrados.'
        },
        {
            title: 'Registrar Pago',
            content: 'Use el botón "+ Registrar Pago" para añadir un abono. Puede especificar la moneda (Bolivianos o Dólares) y el método de pago.'
        }
    ];

    const fetchData = async () => {
        if (!id) return;
        try {
            const baseUrl = tipo === 'particular' ? '/pacientes' : '/pacientes-seguro';
            const [pacRes, pagosRes, hcRes] = await Promise.allSettled([
                api.get(`${baseUrl}/${id}`),
                api.get(`/pagos/paciente/${id}`),
                api.get(`/historia-clinica/paciente/${id}`)
            ]);

            if (pacRes.status === 'fulfilled') setPaciente(pacRes.value.data);
            if (pagosRes.status === 'fulfilled') setPagos(pagosRes.value.data || []);
            if (hcRes.status === 'fulfilled') setHistoria(hcRes.value.data || []);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormasPago = async () => {
        try {
            const response = await api.get('/forma-pago?limit=100');
            const data = response.data.data ? response.data.data : response.data;
            setFormasPago(data || []);
            
            // Set default if exists
            if (data && data.length > 0 && !editingPagoId) {
                const efectivo = data.find((fp: any) => fp.forma_pago.toLowerCase() === 'efectivo');
                if (efectivo) {
                    setPaymentFormData(prev => ({ ...prev, formaPagoId: efectivo.id }));
                } else {
                    setPaymentFormData(prev => ({ ...prev, formaPagoId: data[0].id }));
                }
            }
        } catch (error) {
            console.error('Error fetching formas pago:', error);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
        fetchFormasPago();
    }, [id, tipo]);

    const handleDelete = async (pagoId: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar pago?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/pagos/${pagoId}`);
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'El pago ha sido eliminado.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el pago.', 'error');
            }
        }
    };

    const handleOpenModal = (pago?: Pago) => {
        if (pago) {
            setEditingPagoId(pago.id);
            setPaymentFormData({
                fecha: pago.fecha,
                monto: String(pago.monto),
                moneda: pago.moneda,
                tc: Number(pago.tc) || 6.96,
                recibo: pago.recibo || '',
                factura: pago.factura || '',
                formaPagoId: pago.formaPagoRel?.id || 0,
                observaciones: pago.observaciones || ''
            });
        } else {
            setEditingPagoId(null);
            setPaymentFormData(prev => ({
                ...prev,
                fecha: getLocalDateString(),
                monto: '',
                recibo: '',
                factura: '',
                observaciones: ''
            }));
            // Ensure default payment method if none set
            if (formasPago.length > 0 && !paymentFormData.formaPagoId) {
                const efectivo = formasPago.find(fp => fp.forma_pago.toLowerCase() === 'efectivo');
                if (efectivo) setPaymentFormData(p => ({ ...p, formaPagoId: efectivo.id }));
            }
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPagoId(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPaymentFormData(prev => ({
            ...prev,
            [name]: name === 'formaPagoId' ? Number(value) : value
        }));
    };

    const handleSavePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setIsSaving(true);
        try {
            const payload = {
                pacienteId: Number(id),
                fecha: paymentFormData.fecha,
                monto: Number(paymentFormData.monto),
                moneda: paymentFormData.moneda,
                tc: Number(paymentFormData.tc),
                recibo: paymentFormData.recibo,
                factura: paymentFormData.factura,
                formaPagoId: paymentFormData.formaPagoId,
                observaciones: paymentFormData.observaciones,
                usuarioId: (() => {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        try {
                            const user = JSON.parse(userStr);
                            return user.id ? Number(user.id) : undefined;
                        } catch (e) {
                            console.error("Error parsing user for auditing", e);
                        }
                    }
                    return undefined;
                })()
            };

            if (editingPagoId) {
                await api.patch(`/pagos/${editingPagoId}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Pago Actualizado',
                    text: 'El pago ha sido actualizado correctamente.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/pagos', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Pago Registrado',
                    text: 'El pago ha sido registrado correctamente.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }

            handleCloseModal();
            fetchData();
        } catch (error: any) {
            console.error('Error saving payment:', error);
            Swal.fire('Error', error.response?.data?.message || 'No se pudo guardar el pago.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const generatePagosPDF = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // Logo and Header
        try {
            const img = new Image();
            img.src = '/logo-jhasmany.jpg';
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            // [Antigravity: removed logo from print] doc.addImage(img, 'PNG', 14, 10, 40, 15);
        } catch (e) {
            console.warn('Logo could not be loaded');
        }

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('ESTADO DE CUENTA / PAGOS', pageWidth / 2, 20, { align: 'center' });

        // Patient Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Fecha de Impresión: ${formatDate(getLocalDateString())}`, pageWidth - 14, 25, { align: 'right' });

        doc.setDrawColor(52, 152, 219);
        doc.setLineWidth(0.5);
        doc.line(14, 30, pageWidth - 14, 30);

        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS DEL PACIENTE', 14, 38);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${paciente ? formatFullName(paciente) : 'N/A'}`, 14, 45);
        doc.text(`ID: ${id}`, 14, 50);

        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN DE PAGOS', 14, 60);

        // Table
        const tableBody = pagosFiltrados.map((p, idx) => [
            idx + 1,
            formatDate(p.fecha),
            p.moneda === 'Dólares' ? `$ ${p.monto}` : `S/. ${p.monto}`,
            p.moneda,
            p.formaPagoRel?.forma_pago || 'Efectivo',
            `${p.recibo ? 'R:' + p.recibo : ''} ${p.factura ? 'F:' + p.factura : ''}`.trim() || '-'
        ]);

        autoTable(doc, {
            startY: 80,
            head: [['#', 'Fecha', 'Monto', 'Moneda', 'Forma Pago', 'Recibo/Factura']],
            body: tableBody,
            headStyles: { fillColor: [52, 152, 219], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 80 },
        });

        // Summary footer
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN FINANCIERO', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Pagado: ${formatCurrency(totalPagado, 'S/.')}`, 14, finalY + 7);

        doc.autoPrint();
        const blobUrl = doc.output('bloburl');
        window.open(String(blobUrl), '_blank');
    };

    // Filter pagos by selected plan (none, all pagos)
    const pagosFiltrados = pagos;

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedPagos = pagosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

    // Calculations
    const totalTratamiento = historia.reduce((acc, h) => {
        if (h.estadoTratamiento === 'terminado') {
            return acc + Number(h.precio || 0);
        }
        return acc;
    }, 0);

    const totalPagado = pagosFiltrados.reduce((acc, p) => {
        let monto = Number(p.monto);
        if (p.moneda === 'Dólares') monto = monto * Number(p.tc || 1);
        return acc + monto;
    }, 0);

    const saldo = totalTratamiento - totalPagado;

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="content-card bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 transition-colors space-y-6">

            {/* ─── Payments Table ────────────────────────────────────────────── */}
            <div className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 px-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <FileText className="text-blue-500" size={22} />
                                Historial de Pagos
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Control de abonos, recibos, facturas y formas de pago del paciente.
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
                                onClick={generatePagosPDF}
                                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                <Printer size={18} /> Imprimir
                            </button>
                            <button
                                onClick={() => handleOpenModal()}
                                className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                <span className="text-xl font-bold">+</span> Registrar Pago
                            </button>
                        </div>
                    </div>



                    {/* Record Count */}
                    {pagosFiltrados.length > 0 && (
                        <div className="mb-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, pagosFiltrados.length)} de {pagosFiltrados.length} registros
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto transition-colors">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Moneda</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma de Pago</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recibo / Factura</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {pagosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400 italic">
                                            No hay pagos registrados para este plan de tratamiento.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPagos.map((p, index) => (
                                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-800 dark:text-gray-300 font-medium">
                                                {indexOfFirstItem + index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-gray-800 dark:text-gray-300 font-medium">
                                                {formatDate(p.fecha)}
                                            </td>
                                            <td className="px-6 py-4 font-bold">
                                                <span className={p.moneda === 'Dólares' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                                    {p.moneda === 'Dólares'
                                                        ? formatCurrency(Number(p.monto), '$us')
                                                        : formatCurrency(Number(p.monto), 'S/.')}
                                                </span>
                                                {p.moneda === 'Dólares' && (
                                                    <p className="text-[10px] text-gray-400 font-normal">TC: {p.tc}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                                                {p.moneda}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-sm ${
                                                    p.formaPagoRel?.forma_pago?.toLowerCase() === 'efectivo' 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                }`}>
                                                    {p.formaPagoRel?.forma_pago || 'Efectivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                                                {p.recibo ? <span className="block font-medium">R: {p.recibo}</span> : null}
                                                {p.factura ? <span className="block font-medium">F: {p.factura}</span> : null}
                                                {!p.recibo && !p.factura ? <span className="text-gray-300 dark:text-gray-600 italic">—</span> : null}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(p)}
                                                        className="p-2 bg-[#ffc107] hover:bg-yellow-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                        title="Editar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                        title="Eliminar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagosFiltrados.length > itemsPerPage && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(pagosFiltrados.length / itemsPerPage)}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                    )}
                </div>

                {/* Total Pagado */}
                <div className="flex justify-end mt-4">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 w-full md:max-w-xs transition-colors">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Pagado</p>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(totalPagado, 'S/.')}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{pagosFiltrados.length} pago(s)</p>
                        </div>
                    </div>
                </div>

            {/* ─── Modal Registrar Pago ────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                                <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                {editingPagoId ? 'Editar Pago' : 'Registrar Pago'}
                            </h2>
                        </div>

                        {/* Form Content */}
                        <div className="p-5 overflow-y-auto">
                            <form onSubmit={handleSavePayment} id="pago-paciente-form" className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <input
                                                type="date"
                                                name="fecha"
                                                value={paymentFormData.fecha}
                                                onChange={handleFormChange}
                                                required
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monto</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <DollarSign size={18} className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <input
                                                type="number"
                                                name="monto"
                                                value={paymentFormData.monto}
                                                onChange={handleFormChange}
                                                required
                                                step="0.01"
                                                placeholder="0.00"
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Moneda</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Tag size={18} className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <select
                                                name="moneda"
                                                value={paymentFormData.moneda}
                                                onChange={handleFormChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors appearance-none"
                                            >
                                                <option value="Soles">Soles</option>
                                                <option value="Dólares">Dólares</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400 dark:text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Forma de Pago</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CreditCard size={18} className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <select
                                                name="formaPagoId"
                                                value={paymentFormData.formaPagoId}
                                                onChange={handleFormChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors appearance-none"
                                            >
                                                <option value={0}>-- Seleccione --</option>
                                                {formasPago.map(fp => (
                                                    <option key={fp.id} value={fp.id}>{fp.forma_pago}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400 dark:text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {paymentFormData.moneda === 'Dólares' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Cambio (TC)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Hash size={18} className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <input
                                                type="number"
                                                name="tc"
                                                value={paymentFormData.tc}
                                                onChange={handleFormChange}
                                                step="0.01"
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recibo</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FileText size={18} className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                name="recibo"
                                                value={paymentFormData.recibo}
                                                onChange={handleFormChange}
                                                placeholder="No. Recibo"
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Factura</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FileText size={18} className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                name="factura"
                                                value={paymentFormData.factura}
                                                onChange={handleFormChange}
                                                placeholder="No. Factura"
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 pointer-events-none">
                                            <MessageSquare size={18} className="text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <textarea
                                            name="observaciones"
                                            value={paymentFormData.observaciones}
                                            onChange={handleFormChange}
                                            rows={2}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors resize-none"
                                            placeholder="Notas opcionales..."
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-start gap-3 rounded-b-xl">
                            <button
                                type="submit"
                                form="pago-paciente-form"
                                disabled={isSaving}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                            <polyline points="7 3 7 8 15 8"></polyline>
                                        </svg>
                                        {editingPagoId ? 'Actualizar' : 'Guardar'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ManualModal 
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Control de Pagos"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteTabPagos;
