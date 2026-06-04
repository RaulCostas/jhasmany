import React from 'react';
import { formatDate } from '../utils/dateUtils';
import { formatFullName } from '../utils/formatters';
import { X, ClipboardList, User, Activity, FileText, Calendar, Printer, MessageCircle } from 'lucide-react';
import type { HistoriaClinica, Paciente } from '../types';
import { handlePrintReceta, handleWhatsAppReceta } from '../utils/recetaActions';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    historia: HistoriaClinica[];
    paciente: Paciente | null;
}

const SeguimientoViewModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    historia, 
    paciente
}) => {
    if (!isOpen) return null;

    // Sort by date descending
    const sortedHistoria = [...historia].sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    const getPacienteFullName = () => {
        if (!paciente) return '';
        return `${paciente.nombre} ${paciente.paterno} ${paciente.materno}`.toUpperCase();
    };



    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#1a1d29] border border-gray-200 dark:border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">Seguimiento Clínico Completo</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-widest mt-1">
                                Cronología completa de tratamientos para <span className="text-blue-600 dark:text-blue-400">{getPacienteFullName()}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50 dark:bg-transparent">
                    {sortedHistoria.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <ClipboardList size={48} className="text-gray-400 mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay seguimientos registrados para este plan.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-gray-200 dark:border-white/5 ml-4 pl-8 space-y-8">
                            {sortedHistoria.map((item, index) => (
                                <div key={item.id || index} className="relative">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[41px] top-0 w-5 h-5 bg-blue-500 rounded-full border-4 border-white dark:border-[#1a1d29] shadow-lg shadow-blue-500/20"></div>
                                    
                                    {/* Card */}
                                    <div className="bg-white dark:bg-[#212533] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-md dark:shadow-xl transition-all hover:border-blue-200 dark:hover:border-white/10 group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                                <Calendar size={12} />
                                                {formatDate(item.fecha)}
                                            </div>
                                            <div className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                {item.modalidad}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Left side: Service, Motivo & Diagnósticos */}
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">Servicio & Motivo</h4>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-lg font-black text-gray-800 dark:text-white tracking-tight uppercase">{item.servicio}</p>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                                                        <span className="font-bold">Motivo:</span> {item.motivo_visita || '-'}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-[#1a1d29]/50 border border-gray-100 dark:border-white/5 rounded-xl p-4">
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Diagnósticos:</span>
                                                    {item.diagnosticos && item.diagnosticos.length > 0 ? (
                                                        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                                                            {item.diagnosticos.map((d, index) => (
                                                                <li key={index}>
                                                                    <span className="font-semibold text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1 rounded mr-1">{d.tipo}</span>
                                                                    {d.diagnostico}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-gray-500 text-sm italic">Sin diagnósticos registrados.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right side: Exámenes & Plan de Trabajo */}
                                            <div className="space-y-4">
                                                <div className="bg-gray-50 dark:bg-[#1a1d29]/50 border border-gray-100 dark:border-white/5 rounded-xl p-4">
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Examen Clínico:</span>
                                                    <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                        <p><span className="font-semibold">Examen Físico:</span> {item.examen_fisico || '-'}</p>
                                                        <p><span className="font-semibold">Examen Mental:</span> {item.examen_mental || '-'}</p>
                                                        <p><span className="font-semibold">Auxiliares:</span> {item.examenes_auxiliares || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-[#1a1d29]/50 border border-gray-100 dark:border-white/5 rounded-xl p-4">
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Plan de Trabajo & Derivación:</span>
                                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                                        {item.plan_trabajo || '-'}
                                                    </p>
                                                    <div className="mt-2 text-xs font-semibold text-gray-500">
                                                        Derivación: {item.derivar_consulta === 'SI' ? `SÍ (${item.derivar_consulta_detalle || ''})` : 'NO'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Receta section if present */}
                                        {item.receta && (
                                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-950/20 p-4 rounded-xl">
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest block mb-2">Receta Médica Asociada:</span>
                                                    {item.receta.detalles && item.receta.detalles.length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {item.receta.detalles.map((det, index) => (
                                                                <div key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                                                                    <span className="text-green-500 font-bold">•</span>
                                                                    <div>
                                                                        <span className="font-semibold">{det.medicamento?.medicamento}</span>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 block">{det.posologia} - {det.tiempo} ({det.via}) - Cant: {det.cantidad}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 text-sm italic">Sin medicamentos en la receta.</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 self-end md:self-center">
                                                    <button
                                                        onClick={() => handlePrintReceta(item.receta!)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-sm"
                                                        title="Imprimir Receta"
                                                    >
                                                        <Printer size={14} />
                                                        Imprimir
                                                    </button>
                                                    <button
                                                        onClick={() => handleWhatsAppReceta(item.receta!)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-sm"
                                                        title="Enviar por WhatsApp"
                                                    >
                                                        <MessageCircle size={14} />
                                                        WhatsApp
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Button */}
                <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#1a1d29] flex justify-end">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-8 py-2.5 bg-gray-200 dark:bg-[#3f4458] hover:bg-gray-300 dark:hover:bg-[#4b526d] text-gray-700 dark:text-white font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-md"
                    >
                        <X size={16} />
                        Cerrar
                    </button>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.2);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
};

export default SeguimientoViewModal;
