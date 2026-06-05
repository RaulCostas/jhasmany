import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { ImageIcon, Upload, Trash2, Edit3, Check, X, ZoomIn, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';

interface PacienteImagen {
    id: number;
    pacienteId: number;
    url: string;
    descripcion: string | null;
    tipo: string;
    createdAt: string;
}

const PacienteTabImagenes: React.FC = () => {
    const { id: pacienteId } = useParams<{ id: string }>();
    const [imagenes, setImagenes] = useState<PacienteImagen[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');
    const [showManual, setShowManual] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    const handlePrevImage = useCallback(() => {
        if (imagenes.length === 0 || lightboxIndex === null) return;
        setLightboxIndex(prev => (prev !== null ? (prev - 1 + imagenes.length) % imagenes.length : null));
    }, [imagenes.length, lightboxIndex]);

    const handleNextImage = useCallback(() => {
        if (imagenes.length === 0 || lightboxIndex === null) return;
        setLightboxIndex(prev => (prev !== null ? (prev + 1) % imagenes.length : null));
    }, [imagenes.length, lightboxIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (e.key === 'ArrowLeft') {
                handlePrevImage();
            } else if (e.key === 'ArrowRight') {
                handleNextImage();
            } else if (e.key === 'Escape') {
                setLightboxIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, handlePrevImage, handleNextImage]);

    // -- Preview state for new upload --
    const [pendingFiles, setPendingFiles] = useState<{ dataUrl: string; descripcion: string; file: File }[]>([]);

    const fetchImagenes = useCallback(async () => {
        try {
            const res = await api.get(`/paciente-imagenes/paciente/${pacienteId}`);
            setImagenes(res.data);
        } catch (e) {
            console.error('Error cargando imágenes:', e);
        } finally {
            setLoading(false);
        }
    }, [pacienteId]);

    useEffect(() => { fetchImagenes(); }, [fetchImagenes]);

    // -- Drag & Drop -----------------------------------------------------------
    useEffect(() => {
        const el = dropRef.current;
        if (!el) return;
        const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
        const onDrop = (e: DragEvent) => {
            prevent(e);
            el.classList.remove('border-blue-400', 'bg-blue-50', 'dark:bg-blue-900/20');
            if (e.dataTransfer?.files) handleFiles(Array.from(e.dataTransfer.files));
        };
        const onEnter = (e: DragEvent) => { prevent(e); el.classList.add('border-blue-400', 'bg-blue-50', 'dark:bg-blue-900/20'); };
        const onLeave = (e: DragEvent) => { prevent(e); el.classList.remove('border-blue-400', 'bg-blue-50', 'dark:bg-blue-900/20'); };
        el.addEventListener('dragover', prevent);
        el.addEventListener('dragenter', onEnter);
        el.addEventListener('dragleave', onLeave);
        el.addEventListener('drop', onDrop);
        return () => {
            el.removeEventListener('dragover', prevent);
            el.removeEventListener('dragenter', onEnter);
            el.removeEventListener('dragleave', onLeave);
            el.removeEventListener('drop', onDrop);
        };
    }, []);

    const handleFiles = (files: File[]) => {
        const valid = files.filter(f => f.type.startsWith('image/'));
        if (!valid.length) return;
        valid.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPendingFiles(prev => [...prev, {
                    dataUrl: ev.target?.result as string,
                    descripcion: '',
                    file,
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePending = (idx: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const updatePendingDesc = (idx: number, desc: string) => {
        setPendingFiles(prev => prev.map((p, i) => i === idx ? { ...p, descripcion: desc } : p));
    };

    const handleUploadAll = async () => {
        if (!pendingFiles.length) return;
        setUploading(true);
        try {
            for (const pf of pendingFiles) {
                await api.post('/paciente-imagenes', {
                    pacienteId: Number(pacienteId),
                    imageData: pf.dataUrl,
                    descripcion: pf.descripcion || null,
                    tipo: 'imagen',
                });
            }
            setPendingFiles([]);
            await fetchImagenes();
            Swal.fire({ icon: 'success', title: 'Imágenes guardadas', timer: 1800, showConfirmButton: false });
        } catch (e: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.message || 'No se pudo guardar las imágenes.' });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar imagen?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        try {
            await api.delete(`/paciente-imagenes/${id}`);
            setImagenes(prev => prev.filter(img => img.id !== id));
        } catch (e: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.message || 'No se pudo eliminar.' });
        }
    };

    const startEdit = (img: PacienteImagen) => {
        setEditingId(img.id);
        setEditingText(img.descripcion ?? '');
    };

    const saveEdit = async (id: number) => {
        try {
            await api.patch(`/paciente-imagenes/${id}/descripcion`, { descripcion: editingText });
            setImagenes(prev => prev.map(img => img.id === id ? { ...img, descripcion: editingText } : img));
            setEditingId(null);
        } catch (e: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar la descripción.' });
        }
    };

    const manualSections: ManualSection[] = [
        {
            title: 'Cargar Imágenes',
            content: 'Arrastre archivos de imagen a la zona punteada o haga clic en "Agregar Imágenes". Se pueden previsualizar y añadir descripciones individuales antes de guardarlas definitivamente.'
        },
        {
            title: 'Visualización y Zoom',
            content: 'Haga clic sobre cualquier imagen de la galería para ampliarla a pantalla completa (lightbox). Utilice el botón cerrar o haga clic fuera para volver.'
        },
        {
            title: 'Editar Notas / Descripción',
            content: 'Haga clic directo sobre la descripción de cualquier imagen o use el icono de lápiz para editar notas clínicas rápidamente.'
        },
        {
            title: 'Eliminar Imágenes',
            content: 'Use el botón rojo de papelera para eliminar permanentemente las imágenes de la ficha del paciente.'
        }
    ];

    return (
        <div className="content-card bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 transition-colors">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ImageIcon size={22} className="text-blue-500" />
                        Imágenes del Paciente
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Galería y cargador de imágenes clínicas y archivos del paciente.
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
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm active:scale-95"
                    >
                        <Plus size={18} /> Agregar Imágenes
                    </button>
                </div>
            </div>

            {/* ── Drop Zone ───────────────────────────────────────────────────── */}
            <div
                ref={dropRef}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
            >
                <Upload size={32} className="mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Arrastra imágenes aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    PNG, JPG, GIF, WEBP — múltiples archivos permitidos
                </p>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)); e.target.value = ''; }}
            />

            {/* ── Pending Previews ─────────────────────────────────────────────── */}
            {pendingFiles.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 space-y-4">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <Upload size={13} /> {pendingFiles.length} imagen{pendingFiles.length !== 1 ? 'es' : ''} pendiente{pendingFiles.length !== 1 ? 's' : ''} — Agrega una descripción y guarda
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingFiles.map((pf, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-amber-200 dark:border-amber-700">
                                <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                    <img src={pf.dataUrl} alt="preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePending(idx)}
                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                                <div className="p-3">
                                    <textarea
                                        value={pf.descripcion}
                                        onChange={e => updatePendingDesc(idx, e.target.value)}
                                        placeholder="Descripción de la imagen (opcional)..."
                                        rows={2}
                                        className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleUploadAll}
                        disabled={uploading}
                        className="w-full bg-[#3498db] hover:bg-blue-600 disabled:bg-gray-400 text-white font-black py-3 rounded-xl shadow transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 text-sm"
                    >
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Upload size={15} /> Guardar {pendingFiles.length} imagen{pendingFiles.length !== 1 ? 'es' : ''}
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* ── Gallery ─────────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando imágenes...</p>
                    </div>
                </div>
            ) : imagenes.length === 0 && pendingFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon size={28} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No hay imágenes registradas</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Arrastra imágenes o usa el botón "Agregar Imágenes"</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {imagenes.map((img, idx) => (
                        <div
                            key={img.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md group"
                        >
                            {/* Image */}
                            <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden cursor-zoom-in" onClick={() => setLightboxIndex(idx)}>
                                <img
                                    src={img.url}
                                    alt={img.descripcion ?? 'imagen paciente'}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><rect fill="%23e5e7eb" width="100" height="60"/><text x="50" y="35" text-anchor="middle" fill="%239ca3af" font-size="10">Sin imagen</text></svg>'; }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-3 space-y-2">
                                {/* Description */}
                                {editingId === img.id ? (
                                    <div className="flex gap-1">
                                        <textarea
                                            value={editingText}
                                            onChange={e => setEditingText(e.target.value)}
                                            rows={2}
                                            autoFocus
                                            className="flex-1 text-xs border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                        />
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => saveEdit(img.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg transition-all active:scale-95">
                                                <Check size={11} />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="bg-gray-400 hover:bg-gray-500 text-white p-1.5 rounded-lg transition-all active:scale-95">
                                                <X size={11} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p
                                        className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[1.5rem]"
                                        onClick={() => startEdit(img)}
                                        title="Clic para editar descripción"
                                    >
                                        {img.descripcion || <span className="italic text-gray-400 dark:text-gray-500">Sin descripción — clic para agregar</span>}
                                    </p>
                                )}

                                {/* Date + Actions */}
                                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                        {new Date(img.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => startEdit(img)}
                                            className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg transition-all active:scale-95"
                                            title="Editar descripción"
                                        >
                                            <Edit3 size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(img.id)}
                                            className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 p-1.5 rounded-lg transition-all active:scale-95"
                                            title="Eliminar imagen"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Lightbox ─────────────────────────────────────────────────────── */}
            {lightboxIndex !== null && imagenes[lightboxIndex] && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Botón Cerrar */}
                    <button
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-all z-10"
                        onClick={() => setLightboxIndex(null)}
                        title="Cerrar (Esc)"
                    >
                        <X size={20} />
                    </button>

                    {/* Botón Anterior */}
                    <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/25 hover:bg-white/40 text-white rounded-full p-3 transition-all z-10 hover:scale-105 active:scale-95"
                        onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                        title="Anterior (Flecha Izquierda)"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* Imagen principal */}
                    <img
                        src={imagenes[lightboxIndex].url}
                        alt={imagenes[lightboxIndex].descripcion ?? 'Imagen ampliada'}
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl transition-all duration-300"
                        onClick={e => e.stopPropagation()}
                    />

                    {/* Botón Siguiente */}
                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/25 hover:bg-white/40 text-white rounded-full p-3 transition-all z-10 hover:scale-105 active:scale-95"
                        onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                        title="Siguiente (Flecha Derecha)"
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Contador de imágenes */}
                    <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full z-10">
                        {lightboxIndex + 1} de {imagenes.length}
                    </div>

                    {/* Fecha y descripción en pie de imagen */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-lg max-w-[80%] text-center space-y-1 z-10"
                        onClick={e => e.stopPropagation()}
                    >
                        <p className="text-white/60 text-[11px] flex items-center justify-center gap-1">
                            📅 {new Date(imagenes[lightboxIndex].createdAt).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'America/Lima',
                            })}
                        </p>
                        {imagenes[lightboxIndex].descripcion && (
                            <p className="text-white">{imagenes[lightboxIndex].descripcion}</p>
                        )}
                    </div>
                </div>
            )}

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Imágenes del Paciente"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteTabImagenes;
