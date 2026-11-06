import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { VALORES_CARDS, type ValorCard } from '../data/valoresCards';
import { 
    Check, Sparkles, ChevronRight, ChevronLeft, RotateCcw, 
    Send, Award, HelpCircle, Layers, Heart, CheckCircle2,
    Eye, Flame, Shield, ArrowRight, BookOpen, User, Phone
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TestDetails {
    id: number;
    nombreTest: string;
    estado: string;
    pacienteName: string;
    fechaCompletado?: string;
    resultado?: string;
}

type CategoriaRonda1 = 'muyImportante' | 'importante' | 'menosImportante';

const JuegoValoresPublico: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const isGuestInitial = token === 'invitado' || !token;

    const [activeToken, setActiveToken] = useState<string | null>(isGuestInitial ? null : (token || null));
    const [isGuestMode, setIsGuestMode] = useState<boolean>(isGuestInitial);
    const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
    const [loading, setLoading] = useState(!isGuestInitial);

    // Guest registration form state
    const [guestForm, setGuestForm] = useState({
        nombre: '',
        paterno: '',
        materno: '',
        celular: ''
    });
    const [registeringGuest, setRegisteringGuest] = useState(false);

    // Game state:
    // 0 = Introducción / Instrucciones
    // 1 = Ronda 1 (Clasificación de 53 tarjetas)
    // 1.5 = Resumen / Transición Ronda 1 a 2
    // 2 = Ronda 2 (Selección de 10)
    // 3 = Ronda 3 (Selección de 3)
    // 4 = Reflexión Final y Envío
    // 5 = Completado / Éxito
    const [step, setStep] = useState<number>(0);

    // Ronda 1
    const [currentIndex, setCurrentIndex] = useState(0);
    const [clasificacion, setClasificacion] = useState<Record<number, CategoriaRonda1>>({});
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    // Ronda 2 (Top 10)
    const [selectedTop10, setSelectedTop10] = useState<number[]>([]);

    // Ronda 3 (Top 3)
    const [selectedTop3, setSelectedTop3] = useState<number[]>([]);

    // Reflexiones
    const [reflexiones, setReflexiones] = useState({
        comoEscogio: '',
        algoEnComun: '',
        vidaBienVivida: '',
        adivinarVida: '',
        mensajeTerapeuta: ''
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!activeToken || activeToken === 'invitado') {
            setLoading(false);
            return;
        }

        setLoading(true);
        axios.get<TestDetails>(`${API_URL}/paciente-test/public/${activeToken}`)
            .then(res => {
                setTestDetails(res.data);
                if (res.data.estado === 'completado') {
                    setStep(5);
                }
            })
            .catch(err => {
                console.error('Error fetching test details:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Enlace Inválido',
                    text: 'El enlace de esta dinámica no existe, es inválido o ha expirado.',
                    confirmButtonColor: '#7c3aed'
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [activeToken]);

    const handleStartGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestForm.nombre.trim() || !guestForm.paterno.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos Requeridos',
                text: 'Por favor ingresa tu nombre y apellido paterno.',
                confirmButtonColor: '#7c3aed'
            });
            return;
        }

        if (!guestForm.celular.trim() || guestForm.celular.trim().length < 7) {
            Swal.fire({
                icon: 'warning',
                title: 'Celular Requerido',
                text: 'Por favor ingresa un número de celular válido para contacto.',
                confirmButtonColor: '#7c3aed'
            });
            return;
        }

        try {
            setRegisteringGuest(true);
            const queryParams = new URLSearchParams(window.location.search);
            const doctorIdParam = queryParams.get('doctorId') || queryParams.get('doctor');
            const doctorId = doctorIdParam ? Number(doctorIdParam) : undefined;

            const res = await axios.post(`${API_URL}/paciente-test/public/iniciar-invitado`, {
                nombre: guestForm.nombre.trim(),
                paterno: guestForm.paterno.trim(),
                materno: guestForm.materno.trim(),
                celular: guestForm.celular.trim(),
                doctorId: doctorId || undefined,
                nombreTest: 'Explorando Valores'
            });

            const newToken = res.data.token;
            setActiveToken(newToken);
            setTestDetails({
                id: res.data.id,
                nombreTest: res.data.nombreTest,
                estado: 'enviado',
                pacienteName: `${guestForm.nombre} ${guestForm.paterno} ${guestForm.materno}`.trim()
            });
            setIsGuestMode(false);
            setStep(0); // Go to introduction instructions

            // Update URL without page reload
            window.history.replaceState(null, '', `/juego-valores/${newToken}`);
        } catch (error: any) {
            console.error('Error registrando invitado:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'No se pudo iniciar la dinámica. Intente nuevamente.',
                confirmButtonColor: '#7c3aed'
            });
        } finally {
            setRegisteringGuest(false);
        }
    };

    // Helpers
    const currentCard: ValorCard | undefined = VALORES_CARDS[currentIndex];

    const getCardsByCategory = (cat: CategoriaRonda1) => {
        return VALORES_CARDS.filter(c => clasificacion[c.id] === cat);
    };

    const handleClasificar = (cat: CategoriaRonda1) => {
        if (!currentCard) return;
        setClasificacion(prev => ({
            ...prev,
            [currentCard.id]: cat
        }));

        if (currentIndex < VALORES_CARDS.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Completó las 53 tarjetas
            setStep(1.5);
        }
    };

    const handlePrevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // Toggle Ronda 2
    const maxTop10 = Math.min(10, Math.max(3, getCardsByCategory('muyImportante').length));
    const handleToggleTop10 = (id: number) => {
        if (selectedTop10.includes(id)) {
            setSelectedTop10(prev => prev.filter(item => item !== id));
        } else {
            if (selectedTop10.length >= maxTop10) {
                Swal.fire({
                    icon: 'info',
                    title: `Límite alcanzado`,
                    text: `Ya has seleccionado ${maxTop10} tarjetas. Deselecciona una para elegir otra.`,
                    confirmButtonColor: '#7c3aed'
                });
                return;
            }
            setSelectedTop10(prev => [...prev, id]);
        }
    };

    // Toggle Ronda 3
    const handleToggleTop3 = (id: number) => {
        if (selectedTop3.includes(id)) {
            setSelectedTop3(prev => prev.filter(item => item !== id));
        } else {
            if (selectedTop3.length >= 3) {
                Swal.fire({
                    icon: 'info',
                    title: 'Límite alcanzado',
                    text: 'Ya has seleccionado tus 3 valores cardinales. Deselecciona uno para cambiar.',
                    confirmButtonColor: '#7c3aed'
                });
                return;
            }
            setSelectedTop3(prev => [...prev, id]);
        }
    };

    const handleSubmitFinal = async () => {
        if (selectedTop3.length < 3) {
            Swal.fire({
                icon: 'warning',
                title: 'Selección Incompleta',
                text: 'Por favor selecciona tus 3 valores más importantes antes de enviar.',
                confirmButtonColor: '#7c3aed'
            });
            return;
        }

        const top3Cards = VALORES_CARDS.filter(c => selectedTop3.includes(c.id));
        const top3Names = top3Cards.map(c => c.valor);

        const payload = {
            ronda1: {
                muyImportante: getCardsByCategory('muyImportante').map(c => c.id),
                importante: getCardsByCategory('importante').map(c => c.id),
                menosImportante: getCardsByCategory('menosImportante').map(c => c.id)
            },
            ronda2_top10: selectedTop10,
            ronda3_top3: selectedTop3,
            top3_nombres: top3Names,
            reflexiones
        };

        try {
            setSubmitting(true);
            const tokenToUse = activeToken || token;
            await axios.post(`${API_URL}/paciente-test/public/${tokenToUse}/responder-valores`, payload);
            setStep(5);
            Swal.fire({
                icon: 'success',
                title: '¡Dinámica Completada!',
                text: 'Tus valores han sido guardados y enviados exitosamente a tu terapeuta.',
                confirmButtonColor: '#7c3aed'
            });
        } catch (error: any) {
            console.error('Error guardando dinámica:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al enviar',
                text: error.response?.data?.message || 'Hubo un error al guardar tus respuestas. Por favor intenta nuevamente.',
                confirmButtonColor: '#7c3aed'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="text-center text-white space-y-4">
                    <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
                    <p className="text-lg font-medium text-slate-300">Cargando la dinámica...</p>
                </div>
            </div>
        );
    }

    if (isGuestMode && !activeToken) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
                {/* Background glow effects */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-md w-full relative z-10 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/30">
                            <Sparkles size={28} className="text-white animate-pulse" />
                        </div>
                        <span className="text-[11px] font-bold tracking-widest uppercase text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 inline-block mb-2">
                            Dinámica Terapéutica
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Explorando Valores
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                            Una experiencia interactiva y reflexiva para ayudarte a descubrir y jerarquizar lo que verdaderamente es valioso para ti.
                        </p>
                    </div>

                    <form onSubmit={handleStartGuest} className="space-y-4">
                        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 mb-2">
                            <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                                <User size={14} className="text-purple-400 shrink-0" />
                                Por favor ingresa tus datos para comenzar:
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Nombres <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={guestForm.nombre}
                                onChange={(e) => setGuestForm({ ...guestForm, nombre: e.target.value })}
                                placeholder="Ej. Ana María"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Apellido Paterno <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={guestForm.paterno}
                                    onChange={(e) => setGuestForm({ ...guestForm, paterno: e.target.value })}
                                    placeholder="Ej. Rodríguez"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Apellido Materno
                                </label>
                                <input
                                    type="text"
                                    value={guestForm.materno}
                                    onChange={(e) => setGuestForm({ ...guestForm, materno: e.target.value })}
                                    placeholder="Ej. Gómez"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Teléfono Celular (WhatsApp) <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    required
                                    value={guestForm.celular}
                                    onChange={(e) => setGuestForm({ ...guestForm, celular: e.target.value })}
                                    placeholder="Ej. 912345678"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                />
                                <Phone size={15} className="absolute left-3 top-3 text-slate-500" />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={registeringGuest}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                {registeringGuest ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Preparando tu dinámica...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Comenzar Dinámica</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center pt-2">
                            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                                <Shield size={12} className="text-emerald-500" />
                                Tus respuestas son confidenciales y terapéuticas.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (!testDetails) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full text-center border border-slate-700 shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HelpCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Enlace no disponible</h2>
                    <p className="text-slate-400 text-sm">El enlace solicitado no es válido, ha caducado o no existe.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col font-sans">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                                Explorando Valores
                                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Dinámica Interactiva
                                </span>
                            </h1>
                            <p className="text-xs text-slate-400">
                                Paciente: <strong className="text-purple-300">{testDetails.pacienteName}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Badge de Ronda */}
                    {step >= 1 && step <= 4 && (
                        <div className="text-right">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-purple-300 border border-purple-500/30">
                                {step === 1 && `Ronda 1: ${currentIndex + 1}/${VALORES_CARDS.length}`}
                                {step === 1.5 && `Fin Ronda 1`}
                                {step === 2 && `Ronda 2: ${selectedTop10.length}/${maxTop10}`}
                                {step === 3 && `Ronda 3: ${selectedTop3.length}/3`}
                                {step === 4 && `Reflexión`}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">

                {/* ========================================================= */}
                {/* PASO 0: PORTADA E INSTRUCCIONES INICIALES                  */}
                {/* ========================================================= */}
                {step === 0 && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 my-auto">
                        <div className="text-center space-y-3">
                            <div className="inline-flex p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400 mb-2">
                                <BookOpen size={36} />
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                                Explorando Valores
                            </h2>
                            <p className="text-sm sm:text-base text-purple-300 font-medium">
                                Una brújula para descubrir lo que verdaderamente da sentido y dirección a tu vida
                            </p>
                        </div>

                        <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed bg-slate-950/50 p-5 sm:p-6 rounded-2xl border border-slate-800/80">
                            <p>
                                En las tarjetas a continuación hay palabras que reflejan <strong className="text-white">valores</strong>, aquellas cosas que las personas eligen que sean importantes en sus vidas. No es una lista exhaustiva, pero nos dará un excelente lugar para empezar.
                            </p>
                            <p>
                                Lo que haremos será clasificar estas tarjetas en diferentes categorías basadas en <strong className="text-purple-300">lo que te es importante</strong>, las cosas que querrías que formaran parte de tu vida. Esto no es lo que estés priorizando ahora mismo en tu vida, ni lo que la sociedad crea que deberías valorar, ni siquiera lo que creas que "deberías" valorar.
                            </p>
                            <p className="text-slate-200 bg-purple-950/30 p-3.5 rounded-xl border-l-4 border-purple-500 italic">
                                "En este momento, solo nos importa lo que realmente querrías hacer en tu vida si fueses totalmente libre de elegir, sin obstáculos, imposiciones ni limitaciones."
                            </p>
                            <p>
                                A veces algo se siente importante porque nos ayuda a resolver un problema o reducir sufrimiento (como herramientas). Ahora queremos centrarnos en lo que te parece <strong className="text-white">significativo y satisfactorio en sí mismo</strong>. ¿Qué es lo que todavía te parecería valioso y que vale la pena vivir?
                            </p>
                        </div>

                        {/* Etapas del Juego */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="text-purple-400 font-bold text-xs uppercase mb-1">Ronda 1</div>
                                <div className="text-white font-semibold text-sm">Clasificación</div>
                                <div className="text-slate-400 text-xs mt-1">Clasifica las 53 tarjetas en Muy importante, Importante o Menos importante.</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="text-indigo-400 font-bold text-xs uppercase mb-1">Ronda 2</div>
                                <div className="text-white font-semibold text-sm">Filtrado a 10</div>
                                <div className="text-slate-400 text-xs mt-1">De tus muy importantes, selecciona solo las 10 prioritarias.</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="text-teal-400 font-bold text-xs uppercase mb-1">Ronda 3</div>
                                <div className="text-white font-semibold text-sm">Tus 3 Cardinales</div>
                                <div className="text-slate-400 text-xs mt-1">Destila los 3 valores fundamentales que guiarán tu vida.</div>
                            </div>
                        </div>

                        <div className="pt-2 text-center">
                            <button
                                onClick={() => setStep(1)}
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl shadow-purple-600/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto"
                            >
                                <span>¡Comenzar Primera Ronda!</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* PASO 1: RONDA 1 (CLASIFICAR 53 TARJETAS)                  */}
                {/* ========================================================= */}
                {step === 1 && currentCard && (
                    <div className="space-y-6 my-auto">
                        {/* Barra de Progreso */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                                <span>Tarjeta {currentIndex + 1} de {VALORES_CARDS.length}</span>
                                <span>{Math.round(((currentIndex) / VALORES_CARDS.length) * 100)}% completado</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 rounded-full"
                                    style={{ width: `${((currentIndex + 1) / VALORES_CARDS.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Tarjeta Visual */}
                        <div className="flex flex-col items-center">
                            <div className="relative group max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-slate-900 transition-all transform hover:scale-[1.01]">
                                <img
                                    src={currentCard.imagen}
                                    alt={currentCard.valor}
                                    className="w-full h-auto object-contain block select-none"
                                    loading="eager"
                                />

                                {/* Estado actual asignado a esta tarjeta si ya se clasificó */}
                                {clasificacion[currentCard.id] && (
                                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md border border-white/20 bg-slate-950/80">
                                        {clasificacion[currentCard.id] === 'muyImportante' && '⭐ Muy Importante'}
                                        {clasificacion[currentCard.id] === 'importante' && '👍 Importante'}
                                        {clasificacion[currentCard.id] === 'menosImportante' && '👎 Menos Importante'}
                                    </div>
                                )}
                            </div>

                            {/* Texto accesible / lectura debajo */}
                            <div className="mt-4 text-center max-w-md px-2">
                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase">
                                    {currentCard.valor}
                                </h3>
                                <p className="text-sm text-slate-300 mt-1 italic font-light">
                                    "{currentCard.descripcion}"
                                </p>
                            </div>
                        </div>

                        {/* Botones de Clasificación */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto w-full pt-2">
                            <button
                                type="button"
                                onClick={() => handleClasificar('muyImportante')}
                                className="px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <span className="text-lg">⭐</span>
                                <div className="text-left">
                                    <div className="text-xs uppercase opacity-80 leading-none">Categoría</div>
                                    <div className="text-sm font-extrabold">Muy Importante</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleClasificar('importante')}
                                className="px-4 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <span className="text-lg">👍</span>
                                <div className="text-left">
                                    <div className="text-xs uppercase opacity-80 leading-none">Categoría</div>
                                    <div className="text-sm font-extrabold">Importante</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleClasificar('menosImportante')}
                                className="px-4 py-3.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <span className="text-lg">👎</span>
                                <div className="text-left">
                                    <div className="text-xs uppercase opacity-80 leading-none">Categoría</div>
                                    <div className="text-sm font-extrabold">Menos Importante</div>
                                </div>
                            </button>
                        </div>

                        {/* Controles inferiores (Atrás / Resumen) */}
                        <div className="flex items-center justify-between max-w-lg mx-auto w-full pt-2 text-xs">
                            <button
                                type="button"
                                onClick={handlePrevCard}
                                disabled={currentIndex === 0}
                                className="px-3 py-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={16} />
                                <span>Tarjeta anterior</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowSummaryModal(true)}
                                className="px-3 py-2 text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <Layers size={16} />
                                <span>Ver clasificadas ({Object.keys(clasificacion).length})</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* PASO 1.5: TRANSICIÓN / RESUMEN DE RONDA 1                 */}
                {/* ========================================================= */}
                {step === 1.5 && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 my-auto">
                        <div className="text-center space-y-2">
                            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                                <CheckCircle2 size={36} />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white">
                                ¡Primera Ronda Completada!
                            </h2>
                            <p className="text-sm text-slate-400">
                                Has clasificado todas las 53 tarjetas. Mira cómo quedó tu distribución:
                            </p>
                        </div>

                        {/* Tarjetas resumen de conteo */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl text-center">
                                <div className="text-3xl font-black text-emerald-400">
                                    {getCardsByCategory('muyImportante').length}
                                </div>
                                <div className="text-xs uppercase tracking-wider font-bold text-emerald-200 mt-1">
                                    Muy Importante
                                </div>
                            </div>
                            <div className="bg-blue-950/40 border border-blue-500/40 p-4 rounded-2xl text-center">
                                <div className="text-3xl font-black text-blue-400">
                                    {getCardsByCategory('importante').length}
                                </div>
                                <div className="text-xs uppercase tracking-wider font-bold text-blue-200 mt-1">
                                    Importante
                                </div>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-700/40 p-4 rounded-2xl text-center">
                                <div className="text-3xl font-black text-slate-400">
                                    {getCardsByCategory('menosImportante').length}
                                </div>
                                <div className="text-xs uppercase tracking-wider font-bold text-slate-300 mt-1">
                                    Menos Importante
                                </div>
                            </div>
                        </div>

                        {/* Preguntas de Reflexión de la Ronda 1 */}
                        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 space-y-2">
                            <h4 className="text-sm font-bold text-purple-300 flex items-center gap-1.5">
                                <HelpCircle size={16} />
                                <span>Puntos para reflexionar sobre esta primera ronda:</span>
                            </h4>
                            <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-disc list-inside">
                                <li>¿Cómo se sintió clasificar estas tarjetas?</li>
                                <li>¿Qué pensamientos o sentimientos surgieron al hacerlo?</li>
                                <li>¿Resultó fácil o difícil discernir lo que es importante en tu vida?</li>
                                <li>¿Existió el impulso de elegir las respuestas "correctas"?</li>
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <button
                                onClick={() => {
                                    setCurrentIndex(0);
                                    setStep(1);
                                }}
                                className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-all cursor-pointer"
                            >
                                Revisar clasificación
                            </button>
                            <button
                                onClick={() => {
                                    // Preseleccionar si eran pocas o arrancar vacías
                                    setSelectedTop10([]);
                                    setStep(2);
                                }}
                                className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span>Pasar a la Ronda 2 (Elegir 10)</span>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* PASO 2: RONDA 2 (SELECCIONAR 10 DE LAS MUY IMPORTANTES)   */}
                {/* ========================================================= */}
                {step === 2 && (
                    <div className="space-y-6 my-auto">
                        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                                        <span>🔟</span> Ronda 2: Selecciona tus 10 Valores Más Importantes
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                        De las <strong className="text-emerald-400">{getCardsByCategory('muyImportante').length}</strong> tarjetas que marcaste como "Muy importante", escoge las 10 prioritarias.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-4 py-2 rounded-xl text-sm font-black border ${
                                        selectedTop10.length === maxTop10 
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                                            : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                    }`}>
                                        Seleccionadas: {selectedTop10.length} / {maxTop10}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cuadrícula de Tarjetas Muy Importantes */}
                        {getCardsByCategory('muyImportante').length === 0 ? (
                            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                                <p className="text-slate-300 text-base mb-4">
                                    No marcaste ninguna tarjeta como "Muy importante" en la primera ronda.
                                </p>
                                <button
                                    onClick={() => {
                                        setCurrentIndex(0);
                                        setStep(1);
                                    }}
                                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Volver a la Ronda 1
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-h-[60vh] overflow-y-auto py-4 px-2">
                                {getCardsByCategory('muyImportante').map(card => {
                                    const isSelected = selectedTop10.includes(card.id);
                                    return (
                                        <div
                                            key={card.id}
                                            title={`${card.valor}: "${card.descripcion}"`}
                                            onClick={() => handleToggleTop10(card.id)}
                                            className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 transform hover:scale-[1.45] sm:hover:scale-[1.55] hover:z-40 hover:shadow-2xl hover:shadow-black/80 ${
                                                isSelected 
                                                    ? 'border-emerald-400 ring-4 ring-emerald-500/30 shadow-xl shadow-emerald-950 scale-[1.02]' 
                                                    : 'border-slate-700 hover:border-slate-400 opacity-80 hover:opacity-100'
                                            }`}
                                        >
                                            <img
                                                src={card.imagen}
                                                alt={card.valor}
                                                className="w-full h-auto object-contain block select-none"
                                            />
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                            )}
                                            <div className="p-2 bg-slate-900/90 text-center">
                                                <div className="font-bold text-xs text-white truncate">{card.valor}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <button
                                onClick={() => setStep(1.5)}
                                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                            >
                                ⬅️ Volver
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedTop3([]);
                                    setStep(3);
                                }}
                                disabled={selectedTop10.length !== maxTop10}
                                className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                            >
                                <span>Avanzar a la Ronda 3 (Top 3)</span>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* PASO 3: RONDA 3 (SELECCIONAR LOS 3 CARDINALES)            */}
                {/* ========================================================= */}
                {step === 3 && (
                    <div className="space-y-6 my-auto">
                        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                                        <span>⭐</span> Ronda 3: Tus 3 Valores Fundamentales
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                        Si sólo pudieras escoger <strong className="text-purple-300">tres tarjetas</strong> en las que concentrarte en tu vida, asumiendo que no hay respuestas correctas o incorrectas y que eres completamente libre de elegir, ¿cuáles tres elegirías?
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-4 py-2 rounded-xl text-sm font-black border ${
                                        selectedTop3.length === 3 
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                            : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                    }`}>
                                        Seleccionadas: {selectedTop3.length} / 3
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cuadrícula de las 10 tarjetas seleccionadas */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 max-h-[60vh] overflow-y-auto py-4 px-2">
                            {VALORES_CARDS.filter(c => selectedTop10.includes(c.id)).map(card => {
                                const isSelected = selectedTop3.includes(card.id);
                                return (
                                    <div
                                        key={card.id}
                                        title={`${card.valor}: "${card.descripcion}"`}
                                        onClick={() => handleToggleTop3(card.id)}
                                        className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 transform hover:scale-[1.5] sm:hover:scale-[1.65] hover:z-40 hover:shadow-2xl hover:shadow-black/80 ${
                                            isSelected 
                                                ? 'border-amber-400 ring-4 ring-amber-500/30 shadow-2xl shadow-amber-950 scale-[1.02]' 
                                                : 'border-slate-700 hover:border-slate-400 opacity-80 hover:opacity-100'
                                        }`}
                                    >
                                        <img
                                            src={card.imagen}
                                            alt={card.valor}
                                            className="w-full h-auto object-contain block select-none"
                                        />
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-7 h-7 bg-amber-500 text-slate-950 font-black rounded-full flex items-center justify-center shadow-lg text-xs">
                                                ★
                                            </div>
                                        )}
                                        <div className="p-2 bg-slate-900/90 text-center">
                                            <div className="font-bold text-xs text-white truncate">{card.valor}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <button
                                onClick={() => setStep(2)}
                                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                            >
                                ⬅️ Volver a los 10
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={selectedTop3.length !== 3}
                                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                            >
                                <span>Ver Mis Valores y Reflexión</span>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* PASO 4: REFLEXIÓN FINAL Y RESUMEN                         */}
                {/* ========================================================= */}
                {step === 4 && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
                        <div className="text-center space-y-1">
                            <span className="text-xs uppercase font-extrabold px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                                Elección Final
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                                Tus 3 Valores Fundamentales
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400">
                                Estas son las tres direcciones de vida que has elegido como las más significativas para ti:
                            </p>
                        </div>

                        {/* Podio / Muestra de las 3 Tarjetas Finales */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                            {VALORES_CARDS.filter(c => selectedTop3.includes(c.id)).map((card, idx) => (
                                <div
                                    key={card.id}
                                    title={`${card.valor}: "${card.descripcion}"`}
                                    className="group relative bg-slate-950/70 border-2 border-amber-500/50 rounded-2xl p-4 shadow-xl flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.12] hover:z-30 hover:border-amber-400 cursor-pointer"
                                >
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-black text-sm flex items-center justify-center mb-2 border border-amber-500/40">
                                        #{idx + 1}
                                    </div>
                                    <img
                                        src={card.imagen}
                                        alt={card.valor}
                                        className="w-full max-w-[220px] rounded-xl shadow-md mb-3 transition-transform duration-200 group-hover:scale-105"
                                    />
                                    <h4 className="text-base font-black text-white tracking-wide uppercase">
                                        {card.valor}
                                    </h4>
                                    <p className="text-xs text-slate-300 italic mt-1 font-light">
                                        "{card.descripcion}"
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Preguntas de Reflexión (Opcionales para el paciente) */}
                        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 space-y-4">
                            <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                                <span>✍️</span> Preguntas de Reflexión (Opcionales)
                            </h3>
                            <p className="text-xs text-slate-400">
                                Tómate un momento para responder o escribir cualquier reflexión que quieras compartir con tu doctor/terapeuta:
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        1. ¿Cómo has escogido estos tres valores? ¿Qué tuvieron de especial?
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={reflexiones.comoEscogio}
                                        onChange={e => setReflexiones(prev => ({ ...prev, comoEscogio: e.target.value }))}
                                        placeholder="Escribe tu reflexión aquí..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        2. Viendo las tres tarjetas, ¿dirías que una vida al servicio de esos valores sería una vida bien vivida?
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={reflexiones.vidaBienVivida}
                                        onChange={e => setReflexiones(prev => ({ ...prev, vidaBienVivida: e.target.value }))}
                                        placeholder="Escribe tu reflexión aquí..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        3. Mensaje o comentario adicional para tu terapeuta / doctor:
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={reflexiones.mensajeTerapeuta}
                                        onChange={e => setReflexiones(prev => ({ ...prev, mensajeTerapeuta: e.target.value }))}
                                        placeholder="Cualquier pensamiento adicional..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botones Finales */}
                        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                            >
                                ⬅️ Cambiar selección de 3
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmitFinal}
                                disabled={submitting}
                                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 transition-all"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Finalizar y Enviar Dinámica</span>
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* PASO 5: PANTALLA DE CONFIRMACIÓN / ÉXITO                  */}
                {/* ========================================================= */}
                {step === 5 && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6 max-w-xl mx-auto my-auto">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                            <Award size={44} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl sm:text-3xl font-black text-white">
                                ¡Dinámica Completada con Éxito!
                            </h2>
                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                                Gracias por tu tiempo y apertura, <strong className="text-purple-300">{testDetails.pacienteName}</strong>. Tus valores han sido registrados y enviados directamente al consultorio para revisarlos en tu próxima sesión.
                            </p>
                        </div>

                        {testDetails.resultado && (
                            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-sm text-slate-300">
                                <span className="text-xs uppercase font-bold text-amber-400 block mb-1">Tus 3 Valores Cardinales:</span>
                                <strong className="text-white text-base">{testDetails.resultado.replace('Top 3 Valores: ', '')}</strong>
                            </div>
                        )}

                        <div className="pt-2">
                            <p className="text-xs text-slate-500">
                                Ya puedes cerrar esta ventana con total tranquilidad.
                            </p>
                        </div>
                    </div>
                )}

            </main>

            {/* Modal de Resumen en Ronda 1 */}
            {showSummaryModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                                <Layers size={18} className="text-purple-400" />
                                <span>Resumen de Clasificación ({Object.keys(clasificacion).length}/53)</span>
                            </h3>
                            <button
                                onClick={() => setShowSummaryModal(false)}
                                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <h4 className="text-xs font-bold uppercase text-emerald-400 mb-2">
                                    ⭐ Muy Importante ({getCardsByCategory('muyImportante').length})
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {getCardsByCategory('muyImportante').map(c => (
                                        <span key={c.id} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-200 border border-emerald-800/40">
                                            {c.valor}
                                        </span>
                                    ))}
                                    {getCardsByCategory('muyImportante').length === 0 && (
                                        <span className="text-xs text-slate-500 italic">Ninguna seleccionada</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase text-blue-400 mb-2">
                                    👍 Importante ({getCardsByCategory('importante').length})
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {getCardsByCategory('importante').map(c => (
                                        <span key={c.id} className="text-xs px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-200 border border-blue-800/40">
                                            {c.valor}
                                        </span>
                                    ))}
                                    {getCardsByCategory('importante').length === 0 && (
                                        <span className="text-xs text-slate-500 italic">Ninguna seleccionada</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">
                                    👎 Menos Importante ({getCardsByCategory('menosImportante').length})
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {getCardsByCategory('menosImportante').map(c => (
                                        <span key={c.id} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                                            {c.valor}
                                        </span>
                                    ))}
                                    {getCardsByCategory('menosImportante').length === 0 && (
                                        <span className="text-xs text-slate-500 italic">Ninguna seleccionada</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-3 border-t border-slate-800 text-right">
                            <button
                                onClick={() => setShowSummaryModal(false)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Continuar clasificando
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JuegoValoresPublico;
