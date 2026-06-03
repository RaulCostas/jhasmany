import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TestDetails {
    id: number;
    nombreTest: string;
    estado: string;
    pacienteName: string;
}

const questions = [
    { id: 1, text: "Me siento una persona tan valiosa como las otras." },
    { id: 2, text: "Generalmente me inclino a pensar que soy un fracaso." },
    { id: 3, text: "Creo que tengo algunas cualidades buenas." },
    { id: 4, text: "Soy capaz de hacer las cosas tan bien como los demás." },
    { id: 5, text: "Creo que no tengo mucho de lo que estar orgulloso." },
    { id: 6, text: "Tengo una actitud positiva hacia mí mismo." },
    { id: 7, text: "En general me siento satisfecho conmigo mismo." },
    { id: 8, text: "Me gustaría tener más respeto por mí mismo." },
    { id: 9, text: "Realmente me siento inútil en algunas ocasiones." },
    { id: 10, text: "A veces pienso que no sirvo para nada." }
];

const options = [
    { value: 1, label: "Muy en desacuerdo" },
    { value: 2, label: "En desacuerdo" },
    { value: 3, label: "De acuerdo" },
    { value: 4, label: "Muy de acuerdo" }
];

const TestPublico: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [completed, setCompleted] = useState(false);
    const [scoreResult, setScoreResult] = useState<{ score: number; result: string } | null>(null);

    useEffect(() => {
        if (!token) return;

        axios.get<TestDetails>(`${API_URL}/paciente-test/public/${token}`)
            .then(res => {
                setTestDetails(res.data);
                if (res.data.estado === 'completado') {
                    setCompleted(true);
                }
            })
            .catch(err => {
                console.error('Error fetching test details:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Enlace Inválido',
                    text: 'El enlace de este test no existe, es inválido o ha expirado.',
                    confirmButtonColor: '#3b82f6'
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token]);

    const handleOptionSelect = (qId: number, value: number) => {
        setAnswers(prev => ({
            ...prev,
            [qId]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if all questions are answered
        const unanswered = questions.filter(q => answers[q.id] === undefined);
        if (unanswered.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Preguntas pendientes',
                text: 'Por favor, responde a todas las preguntas antes de enviar el test.',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        try {
            Swal.fire({
                title: 'Enviando respuestas...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const res = await axios.post(`${API_URL}/paciente-test/public/${token}/responder`, {
                respuestas: answers
            });

            Swal.close();
            setScoreResult({
                score: res.data.score,
                result: res.data.result
            });
            setCompleted(true);

            Swal.fire({
                icon: 'success',
                title: '¡Respuestas registradas!',
                text: 'El test ha sido completado y enviado exitosamente a tu especialista.',
                confirmButtonColor: '#10b981'
            });
        } catch (error: any) {
            Swal.close();
            console.error('Error submitting answers:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al enviar',
                text: error.response?.data?.message || 'No se pudieron guardar las respuestas del test.',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-500 dark:text-gray-400 font-semibold">Cargando test...</span>
                </div>
            </div>
        );
    }

    if (!testDetails) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Test No Disponible</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">El enlace proporcionado no es válido o el test ya no se encuentra disponible.</p>
                </div>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center border border-gray-100 dark:border-gray-700 animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-500 mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/255/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Test Completado!</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        Hola <strong>{testDetails.pacienteName}</strong>, has completado con éxito la <strong>{testDetails.nombreTest}</strong>.
                    </p>
                    
                    {scoreResult && (
                        <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-800/30 p-6 rounded-2xl mb-6">
                            <span className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider block mb-1">Tu Resultado</span>
                            <div className="text-4xl font-black text-gray-800 dark:text-white mb-2">{scoreResult.score} <span className="text-lg font-semibold text-gray-400">/ 30 pts</span></div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{scoreResult.result}</p>
                        </div>
                    )}

                    <p className="text-xs text-gray-450 dark:text-gray-500">Tus respuestas ya fueron sincronizadas con la clínica del Dr. Ojeda. Puedes cerrar esta pestaña.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
            <div className="max-w-3xl w-full mx-auto bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-10 shadow-xl border border-gray-150 dark:border-gray-700 animate-fade-in">
                
                {/* Header */}
                <div className="text-center border-b dark:border-gray-700 pb-6 mb-8">
                    <h1 className="text-xl md:text-2xl font-black text-blue-900 dark:text-blue-400 tracking-wide uppercase">
                        {testDetails.nombreTest}
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 font-semibold italic">
                        (Rosenberg, 1965; Atienza, Balaguer, & Moreno, 2000)
                    </p>
                    
                    <div className="mt-4 inline-block bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 py-2 px-4 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Paciente: </span>
                        <strong className="text-sm text-blue-700 dark:text-blue-300">{testDetails.pacienteName}</strong>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mb-8 border dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong className="text-gray-800 dark:text-white block mb-1">Instrucciones:</strong>
                    Por favor, lee las frases que figuran a continuación y señala el nivel de acuerdo o desacuerdo que tienes con cada una de ellas, seleccionando la alternativa de tu preferencia.
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="py-6 first:pt-0 last:pb-0">
                                <div className="flex gap-3 mb-4">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold text-xs flex items-center justify-center mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">
                                        {q.text}
                                    </h3>
                                </div>

                                {/* Options list (responsive layout: grid on larger screens, vertical list on mobile) */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pl-9">
                                    {options.map((opt) => {
                                        const isSelected = answers[q.id] === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleOptionSelect(q.id, opt.value)}
                                                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center flex items-center justify-center min-h-[42px] cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-650 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-650'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Submit Section */}
                    <div className="pt-8 border-t dark:border-gray-700 flex justify-center">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-10 rounded-2xl flex items-center gap-2 shadow-lg shadow-green-500/20 hover:shadow-green-500/35 transform hover:-translate-y-0.5 transition-all text-sm cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Enviar Respuestas
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TestPublico;
