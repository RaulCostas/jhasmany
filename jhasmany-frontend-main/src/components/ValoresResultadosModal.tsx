import React from 'react';
import { VALORES_CARDS, type ValorCard } from '../data/valoresCards';
import { Award, Printer, X, Sparkles, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';

interface ValoresResultadosModalProps {
    isOpen: boolean;
    onClose: () => void;
    test: any;
    pacienteName?: string;
}

const ValoresResultadosModal: React.FC<ValoresResultadosModalProps> = ({
    isOpen,
    onClose,
    test,
    pacienteName
}) => {
    if (!isOpen || !test) return null;

    const respuestas = test.respuestas || {};
    const top3Ids: number[] = respuestas.ronda3_top3 || [];
    const top10Ids: number[] = respuestas.ronda2_top10 || [];
    const ronda1 = respuestas.ronda1 || { muyImportante: [], importante: [], menosImportante: [] };
    const reflexiones = respuestas.reflexiones || {};

    const top3Cards = VALORES_CARDS.filter(c => top3Ids.includes(c.id));
    const top10Cards = VALORES_CARDS.filter(c => top10Ids.includes(c.id));
    const muyImportanteCards = VALORES_CARDS.filter(c => (ronda1.muyImportante || []).includes(c.id));
    const importanteCards = VALORES_CARDS.filter(c => (ronda1.importante || []).includes(c.id));
    const menosImportanteCards = VALORES_CARDS.filter(c => (ronda1.menosImportante || []).includes(c.id));

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Valores - ${pacienteName || 'Paciente'}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 25px; margin: 0; }
                    .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; color: #5b21b6; }
                    .header p { margin: 4px 0 0; font-size: 13px; color: #64748b; }
                    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
                    .section-title { font-size: 16px; font-weight: bold; color: #4c1d95; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 12px; }
                    .top3-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
                    .top3-card { border: 2px solid #f59e0b; border-radius: 10px; padding: 12px; text-align: center; background: #fffbeb; }
                    .top3-card h3 { margin: 0 0 6px; font-size: 15px; color: #b45309; }
                    .top3-card p { margin: 0; font-size: 11px; font-style: italic; color: #475569; }
                    .card-badge { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 6px; font-size: 11px; margin: 3px; font-weight: 600; }
                    .muy-imp { background: #dcfce7; border-color: #86efac; color: #166534; }
                    .reflection-box { background: #f8fafc; border-left: 4px solid #7c3aed; padding: 10px 14px; margin-bottom: 10px; font-size: 12px; }
                    .reflection-box strong { color: #334155; display: block; margin-bottom: 3px; }
                    @media print {
                        body { padding: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>REPORTE CLÍNICO: EXPLORANDO VALORES</h1>
                    <p>Dinámica de Clarificación y Jerarquización de Direcciones Vitales</p>
                </div>
                
                <div class="meta-grid">
                    <div><strong>Paciente:</strong> ${pacienteName || 'Paciente'}</div>
                    <div><strong>Fecha Completado:</strong> ${test.fechaCompletado ? new Date(test.fechaCompletado).toLocaleString('es-ES') : '-'}</div>
                    <div><strong>Profesional Solicitante:</strong> Dr. ${test.doctor ? `${test.doctor.nombre} ${test.doctor.paterno}` : 'Tratante'}</div>
                    <div><strong>Resultado Principal:</strong> ${test.resultado || '-'}</div>
                </div>

                <div class="section-title">🏆 TOP 3: VALORES CARDINALES (RONDA FINAL)</div>
                <div class="top3-grid">
                    ${top3Cards.map((c, i) => `
                        <div class="top3-card">
                            <div style="font-size:10px; font-weight:bold; color:#d97706;">#${i + 1}</div>
                            <h3>${c.valor}</h3>
                            <p>"${c.descripcion}"</p>
                        </div>
                    `).join('')}
                </div>

                <div class="section-title">🔟 TOP 10: VALORES PRIORITARIOS (RONDA 2)</div>
                <div style="margin-bottom: 15px;">
                    ${top10Cards.map(c => `<span class="card-badge muy-imp">★ ${c.valor}</span>`).join('')}
                </div>

                <div class="section-title">📊 RESUMEN DE CLASIFICACIÓN GENERAL (RONDA 1)</div>
                <p style="font-size:12px; margin: 4px 0 8px;"><strong>Muy Importantes (${muyImportanteCards.length}):</strong></p>
                <div style="margin-bottom: 10px;">
                    ${muyImportanteCards.map(c => `<span class="card-badge">${c.valor}</span>`).join('')}
                </div>
                <p style="font-size:12px; margin: 4px 0 8px;"><strong>Importantes (${importanteCards.length}):</strong></p>
                <div style="margin-bottom: 10px;">
                    ${importanteCards.map(c => `<span class="card-badge">${c.valor}</span>`).join('')}
                </div>

                ${(reflexiones.comoEscogio || reflexiones.vidaBienVivida || reflexiones.mensajeTerapeuta) ? `
                    <div class="section-title">✍️ REFLEXIONES ESCRITAS POR EL PACIENTE</div>
                    ${reflexiones.comoEscogio ? `
                        <div class="reflection-box">
                            <strong>¿Cómo escogió estos tres valores?</strong>
                            <span>${reflexiones.comoEscogio}</span>
                        </div>
                    ` : ''}
                    ${reflexiones.vidaBienVivida ? `
                        <div class="reflection-box">
                            <strong>¿Una vida al servicio de estos valores sería una vida bien vivida?</strong>
                            <span>${reflexiones.vidaBienVivida}</span>
                        </div>
                    ` : ''}
                    ${reflexiones.mensajeTerapeuta ? `
                        <div class="reflection-box">
                            <strong>Mensaje adicional para el terapeuta:</strong>
                            <span>${reflexiones.mensajeTerapeuta}</span>
                        </div>
                    ` : ''}
                ` : ''}

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start bg-slate-50 dark:bg-gray-900/40">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <Sparkles size={18} />
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                Resultados: Explorando Valores
                            </h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Paciente: <strong className="text-purple-600 dark:text-purple-400">{pacienteName}</strong> • Completado el {test.fechaCompletado ? new Date(test.fechaCompletado).toLocaleString('es-ES') : '-'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3.5 rounded-xl shadow-md text-xs flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-transparent shadow-purple-500/20"
                            title="Imprimir informe clínico"
                        >
                            <Printer size={15} />
                            <span>Imprimir Reporte</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-100 hover:bg-red-500 text-gray-500 hover:text-white dark:bg-gray-700 dark:hover:bg-red-600 dark:text-gray-300 p-2 rounded-xl transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-sm flex items-center justify-center cursor-pointer border border-gray-200 dark:border-gray-600"
                            title="Cerrar modal"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
                    
                    {/* TOP 3 VALORES CARDINALES */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🏆</span>
                            <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Top 3: Valores Fundamentales (Ronda 3)
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-1">
                            {top3Cards.map((card, idx) => (
                                <div
                                    key={card.id}
                                    title={`${card.valor}: "${card.descripcion}"`}
                                    className="group relative bg-amber-50/40 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-500/40 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-sm transition-all duration-200 hover:scale-[1.12] hover:z-30 hover:shadow-2xl hover:border-amber-400 cursor-pointer"
                                >
                                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center mb-2 shadow">
                                        #{idx + 1}
                                    </div>
                                    <img
                                        src={card.imagen}
                                        alt={card.valor}
                                        className="w-full max-w-[190px] rounded-xl shadow mb-2.5 block transition-transform duration-200 group-hover:scale-105"
                                    />
                                    <h5 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wide">
                                        {card.valor}
                                    </h5>
                                    <p className="text-[11px] text-gray-600 dark:text-gray-300 italic mt-1 font-light leading-snug">
                                        "{card.descripcion}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TOP 10 VALORES SELECCIONADOS */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔟</span>
                            <h4 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Top 10: Valores Prioritarios (Ronda 2)
                            </h4>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-3 px-1">
                            {top10Cards.map(card => {
                                const isTop3 = top3Ids.includes(card.id);
                                return (
                                    <div
                                        key={card.id}
                                        title={`${card.valor}: "${card.descripcion}"`}
                                        className={`group relative rounded-xl p-2.5 border text-center transition-all duration-200 cursor-pointer transform hover:scale-[1.55] sm:hover:scale-[1.65] hover:z-40 hover:shadow-2xl hover:shadow-black/40 ${
                                            isTop3
                                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 font-bold hover:border-amber-500'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-purple-400'
                                        }`}
                                    >
                                        <img
                                            src={card.imagen}
                                            alt={card.valor}
                                            className="w-full rounded-lg mb-1.5 shadow-xs block"
                                        />
                                        <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                                            {isTop3 && '★ '}{card.valor}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RESUMEN DE CLASIFICACIÓN GENERAL (RONDA 1) */}
                    <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex items-center gap-2">
                            <Layers size={16} className="text-purple-500" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                Resumen Completo de Clasificación (Ronda 1)
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3 rounded-xl">
                                <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1.5">
                                    ⭐ Muy Importante ({muyImportanteCards.length})
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {muyImportanteCards.map(c => (
                                        <span key={c.id} className="px-2 py-0.5 rounded text-[10px] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                            {c.valor}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3 rounded-xl">
                                <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1.5">
                                    👍 Importante ({importanteCards.length})
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {importanteCards.map(c => (
                                        <span key={c.id} className="px-2 py-0.5 rounded text-[10px] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                            {c.valor}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-3 rounded-xl">
                                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                                    👎 Menos Importante ({menosImportanteCards.length})
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {menosImportanteCards.map(c => (
                                        <span key={c.id} className="px-2 py-0.5 rounded text-[10px] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                            {c.valor}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* REFLEXIONES ESCRITAS */}
                    {(reflexiones.comoEscogio || reflexiones.vidaBienVivida || reflexiones.mensajeTerapeuta) && (
                        <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 p-4 rounded-2xl space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                <span>✍️</span> Reflexiones del Paciente
                            </h4>

                            <div className="space-y-2.5 text-xs">
                                {reflexiones.comoEscogio && (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                            ¿Cómo escogió estos tres valores?
                                        </span>
                                        <p className="text-gray-600 dark:text-gray-200 italic">
                                            "{reflexiones.comoEscogio}"
                                        </p>
                                    </div>
                                )}

                                {reflexiones.vidaBienVivida && (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                            ¿Una vida al servicio de estos valores sería una vida bien vivida?
                                        </span>
                                        <p className="text-gray-600 dark:text-gray-200 italic">
                                            "{reflexiones.vidaBienVivida}"
                                        </p>
                                    </div>
                                )}

                                {reflexiones.mensajeTerapeuta && (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                            Mensaje o reflexión adicional:
                                        </span>
                                        <p className="text-gray-600 dark:text-gray-200 italic">
                                            "{reflexiones.mensajeTerapeuta}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 bg-gray-50 dark:bg-gray-900/40">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl text-xs transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer border border-transparent"
                    >
                        <X size={14} />
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ValoresResultadosModal;
