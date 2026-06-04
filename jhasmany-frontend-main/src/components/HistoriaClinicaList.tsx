import React, { useState } from 'react';
import type { HistoriaClinica } from '../types';
import { formatFullName } from '../utils/formatters';

interface HistoriaClinicaListProps {
    historia: HistoriaClinica[];
    onDelete: (id: number) => void;
    onEdit: (item: HistoriaClinica) => void;
    onNewHistoria?: () => void;
    onViewPlan?: () => void;
    onViewTimeline?: () => void;
    onPrint?: () => void;
    onReminder?: (item: HistoriaClinica) => void;
}

import { formatDate } from '../utils/dateUtils';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';
import { Printer, PenTool, X, Calendar, Activity, MessageCircle } from 'lucide-react';
import { handlePrintReceta, handleWhatsAppReceta } from '../utils/recetaActions';


const HistoriaClinicaList: React.FC<HistoriaClinicaListProps> = ({ historia, onDelete, onEdit, onNewHistoria, onPrint, onViewPlan, onViewTimeline, onReminder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const manualSections: ManualSection[] = [
        {
            title: 'Seguimiento Clínico',
            content: 'Registro detallado del seguimiento psiquiátrico, neuropsiquiátrico o psicológico del paciente.'
        },
        {
            title: 'Diagnósticos (CIE-10)',
            content: 'Cada consulta permite registrar múltiples diagnósticos basados en la codificación CIE-10 (F00-F99), indicando si es de tipo Definitivo, Repetitivo o Presuntivo.'
        },
        {
            title: 'Acciones',
            content: 'Permite Crear, Editar o Eliminar consultas del historial, así como Imprimir el historial de seguimiento clínico.'
        },
        {
            title: 'Recordatorio de Consulta',
            content: 'Utilice el botón de campana/ícono índigo para programar un recordatorio de seguimiento para la consulta. Este recordatorio aparecerá en la página de inicio cuando llegue la fecha programada.'
        }];

    const filteredHistoria = historia.filter(item => {
        const term = searchTerm.toLowerCase();
        const motivo = item.motivo_visita?.toLowerCase() || '';
        const servicio = item.servicio?.toLowerCase() || '';
        const modalidad = item.modalidad?.toLowerCase() || '';
        const diags = (item.diagnosticos || []).map(d => d.diagnostico.toLowerCase()).join(' ');
        return motivo.includes(term) || servicio.includes(term) || modalidad.includes(term) || diags.includes(term);
    });

    // Pagination
    const totalPages = Math.ceil(filteredHistoria.length / itemsPerPage);
    const paginatedHistoria = filteredHistoria.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="content-card bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Activity size={22} className="text-blue-500" />
                        Historial de Seguimiento Clínico
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Historial de consultas, evolución del paciente, diagnósticos CIE-10 y planes de trabajo.
                    </p>
                </div>
            </div>

            {/* Search Bar & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex gap-2 w-full md:max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por Servicio, Motivo o Diagnóstico..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <svg
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    {onViewPlan && (
                        <button
                            onClick={onViewPlan}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Ver Plan
                        </button>
                    )}
                    {onViewTimeline && (
                        <button
                            onClick={onViewTimeline}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Ver Seguimiento
                        </button>
                    )}
                    {onNewHistoria && (
                        <button
                            onClick={onNewHistoria}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nuevo Seguimiento
                        </button>
                    )}
                    {onPrint && (
                        <button
                            onClick={onPrint}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <Printer size={20} />
                            Imprimir
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">
                    Mostrando <span className="text-gray-800 dark:text-gray-200">{filteredHistoria.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredHistoria.length)}</span> de <span>{filteredHistoria.length}</span> registros
                </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Modalidad</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Servicio</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Motivo de Visita</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Examen Físico</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Examen Mental</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Exámenes Aux.</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Diagnósticos</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan de Trabajo</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Derivación</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedHistoria.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatDate(item.fecha)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{item.modalidad}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-medium">{item.servicio}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={item.motivo_visita}>{item.motivo_visita || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={item.examen_fisico}>{item.examen_fisico || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={item.examen_mental}>{item.examen_mental || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={item.examenes_auxiliares}>{item.examenes_auxiliares || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                    {item.diagnosticos && item.diagnosticos.length > 0 ? (
                                        <ul className="list-disc list-inside space-y-0.5 max-w-xs truncate">
                                            {item.diagnosticos.map((d, index) => (
                                                <li key={index} title={`${d.diagnostico} (${d.tipo})`}>
                                                    <span className="font-semibold text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1 rounded mr-1">{d.tipo[0]}</span>
                                                    {d.diagnostico}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs" title={item.plan_trabajo}>
                                    <div className="truncate">{item.plan_trabajo || '-'}</div>
                                    {item.receta && item.receta.detalles && item.receta.detalles.length > 0 && (
                                        <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase block tracking-wider mb-0.5">Receta:</span>
                                            <ul className="list-disc list-inside text-[11px] text-gray-600 dark:text-gray-300 space-y-0.5">
                                                {item.receta.detalles.map((det, index) => (
                                                    <li key={index} className="truncate" title={`${det.medicamento?.medicamento} - Cant: ${det.cantidad}`}>
                                                        <span className="font-semibold">{det.medicamento?.medicamento}</span> ({det.cantidad})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                    {item.derivar_consulta === 'SI' ? `SÍ (${item.derivar_consulta_detalle || ''})` : 'NO'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center gap-2">
                                        {onReminder && (
                                            <button
                                                onClick={() => onReminder(item)}
                                                className="p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Recordatorio de Seguimiento"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                            </button>
                                        )}
                                        {item.receta && (
                                            <>
                                                <button
                                                    onClick={() => handlePrintReceta(item.receta!, item.diagnosticos)}
                                                    className="p-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Imprimir Receta"
                                                >
                                                    <Printer size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleWhatsAppReceta(item.receta!)}
                                                    className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Enviar Receta por WhatsApp"
                                                >
                                                    <MessageCircle size={14} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onDelete(item.id)}
                                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Eliminar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedHistoria.length === 0 && (
                            <tr>
                                <td colSpan={11} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg font-medium">{searchTerm ? 'No se encontraron resultados.' : 'No hay registros en el seguimiento clínico.'}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Seguimiento Clínico"
                sections={manualSections}
            />




        </div>
    );
};

export default HistoriaClinicaList;
