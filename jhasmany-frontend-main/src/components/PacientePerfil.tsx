import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import api from '../services/api';
import type { Paciente, Pago, Agenda } from '../types';
import { formatFullName } from '../utils/formatters';
import {
    User, Calendar, FileText, ImageIcon,
    ArrowLeft, Edit, Activity, Heart, CheckCircle, Shield, ClipboardList, HelpCircle
} from 'lucide-react';

// --- Tab definition -----------------------------------------------------------
interface TabDef {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string; 
}

const TABS_PARTICULAR: TabDef[] = [
    { id: 'ficha',       label: 'Ficha Médica',         icon: <Heart size={15} />,           path: 'ficha' },
    { id: 'citas',       label: 'Citas',                icon: <Calendar size={15} />,       path: 'citas' },
    { id: 'seguimiento', label: 'Seguimiento Clínico',  icon: <Activity size={15} />,        path: 'historia-clinica' },
    { id: 'pagos',       label: 'Pagos',                icon: <FileText size={15} />,        path: 'pagos' },
    { id: 'recetario',   label: 'Recetario',            icon: <ClipboardList size={15} />,   path: 'recetario' },
    { id: 'test',        label: 'Tests',                icon: <HelpCircle size={15} />,      path: 'test' },
];

const TABS_SEGURO: TabDef[] = [
    { id: 'ficha',       label: 'Ficha Médica',         icon: <Heart size={15} />,           path: 'ficha' },
    { id: 'citas',       label: 'Citas',                icon: <Calendar size={15} />,       path: 'citas' },
    { id: 'seguimiento', label: 'Seguimiento Clínico',  icon: <Activity size={15} />,        path: 'seguimiento' },
];

// --- Helpers ------------------------------------------------------------------
const calcEdad = (fecha?: string): string => {
    if (!fecha) return '—';
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return `${edad} años`;
};

const formatCelular = (celular: string | undefined) => {
    if (!celular) return '---';
    const countryCodes = ['+591', '+54', '+55', '+56', '+51', '+595', '+598', '+57', '+52', '+34', '+1'];
    const code = countryCodes.find(c => celular && celular.startsWith(c));
    if (code) {
        const number = celular.substring(code.length);
        return `(${code}) ${number}`;
    }
    // If no country code, assume +51
    if (!celular.startsWith('+')) {
        return `(+51) ${celular}`;
    }
    return celular;
};

// --- Main Layout Component ----------------------------------------------------
interface PacientePerfilProps {
    tipo: 'particular' | 'seguro';
}

const PacientePerfil: React.FC<PacientePerfilProps> = ({ tipo }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ citas: 0, pagos: 0, totalPagado: 0, historias: 0, recetas: 0, tests: 0 });

    // --- Filter Tabs based on permissions -----------------------------------------
    const currentTabs = tipo === 'particular' ? TABS_PARTICULAR : TABS_SEGURO;
    const [allowedTabs, setAllowedTabs] = useState<TabDef[]>(currentTabs);

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const user = JSON.parse(userString);
                // JHASMANY uses 'permisos' as restricted modules
                const restricted = Array.isArray(user.permisos) ? user.permisos : [];
                
                const tabToModuleMap: Record<string, string> = {
                    'ficha': 'pacientes',
                    'citas': 'agenda',
                    'seguimiento': 'pacientes',
                    'pagos': 'pagos',
                    'recetario': 'recetario',
                    'test': 'pacientes'
                };

                setAllowedTabs(currentTabs.filter(tab => !restricted.includes(tabToModuleMap[tab.id])));
            } catch (e) {
                console.error("Error parsing user for tabs permissions", e);
            }
        }
    }, [tipo]);

    // Determine active tab from current URL path
    const activeTab = allowedTabs.find(t =>
        location.pathname.endsWith(`/${t.path}`) || 
        location.pathname.includes(`/${t.path}/`) ||
        (location.pathname.includes('/historia-clinica') && t.id === 'seguimiento' && tipo === 'particular')
    ) ?? null;

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            try {
                const baseUrl = tipo === 'particular' ? '/pacientes' : '/pacientes-seguro';
                const agendaUrl = tipo === 'particular' ? `/agenda?pacienteId=${id}` : `/agenda?pacienteSeguroId=${id}`;
                const pagosUrl = `/pagos/paciente/${id}`; // Adjust if seguro pagos are different
                const historiasUrl = `/historia-clinica/paciente/${id}`;
                const recetasUrl = `/receta?pacienteId=${id}`;
                const testsUrl = `/paciente-test/paciente/${id}`;

                const [pacRes, agendaRes, pagosRes, historiasRes, recetasRes, testsRes] = await Promise.allSettled([
                    api.get(tipo === 'particular' ? `${baseUrl}/${id}` : `${baseUrl}/${id}`), 
                    api.get(`${agendaUrl}&limit=1000`),
                    api.get(pagosUrl),
                    api.get(historiasUrl),
                    api.get(recetasUrl),
                    api.get(testsUrl),
                ]);

                if (pacRes.status === 'fulfilled') setPaciente(pacRes.value.data);
                
                const citasData = agendaRes.status === 'fulfilled' ? agendaRes.value.data : null;
                const citasCount = Array.isArray(citasData) ? citasData.length : (citasData?.data?.length || 0);
                
                const pagosData = pagosRes.status === 'fulfilled' ? pagosRes.value.data : [];
                const pagosArray = Array.isArray(pagosData) ? pagosData : [];

                const historiasData = historiasRes.status === 'fulfilled' ? historiasRes.value.data : [];
                const historiasArray = Array.isArray(historiasData) ? historiasData : [];

                const recetasData = recetasRes.status === 'fulfilled' ? recetasRes.value.data : [];
                const recetasArray = Array.isArray(recetasData) ? recetasData : (recetasData?.data || []);

                const testsData = testsRes.status === 'fulfilled' ? testsRes.value.data : [];
                const testsArray = Array.isArray(testsData) ? testsData : [];
                const completedTestsCount = testsArray.filter((t: any) => t.estado === 'completado').length;

                setStats({
                    citas: citasCount,
                    pagos: pagosArray.length,
                    totalPagado: pagosArray.reduce((s: number, p: Pago) => s + Number(p.monto), 0),
                    historias: historiasArray.length,
                    recetas: recetasArray.length,
                    tests: completedTestsCount
                });
            } catch (error) {
                console.error("Error loading patient profile stats:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, tipo]);

    // If we're exactly at the root profile path, redirect to ficha tab
    useEffect(() => {
        if (!loading && id) {
            const rootPath = tipo === 'particular' ? `/pacientes/${id}` : `/pacientes-seguro/${id}`;
            const isRootProfile = location.pathname === rootPath || location.pathname === `${rootPath}/`;
            if (isRootProfile) {
                navigate(`${rootPath}/ficha`, { replace: true });
            }
        }
    }, [loading, id, location.pathname, navigate, tipo]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!paciente) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <p className="text-lg text-gray-500 dark:text-gray-400">Paciente no encontrado</p>
                    <button onClick={() => navigate(tipo === 'particular' ? '/pacientes' : '/pacientes-seguro')}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">
                        Volver a {tipo === 'particular' ? 'Pacientes' : 'Pacientes Seguro'}
                    </button>
                </div>
            </div>
        );
    }

    const nombreCompleto = formatFullName(paciente);
    const basePath = tipo === 'particular' ? `/pacientes/${id}` : `/pacientes-seguro/${id}`;

    return (
        <div className="flex flex-col min-h-full">

            {/* ── Navigation bar ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4 px-1">
                <button
                    onClick={() => navigate(tipo === 'particular' ? '/pacientes' : '/pacientes-seguro')}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                    <ArrowLeft size={16} /> Volver a {tipo === 'particular' ? 'Pacientes' : 'Pacientes Seguro'}
                </button>
                <button
                    onClick={() => navigate(tipo === 'particular' ? `/pacientes/edit/${id}` : `/pacientes-seguro/edit/${id}`)}
                    className="bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                    <Edit size={16} /> Editar Paciente
                </button>
            </div>

            {/* ── Patient Header ──────────────────────────────────────────────── */}
            <div className={`bg-gradient-to-r ${tipo === 'particular' ? 'from-blue-600 to-blue-800' : 'from-purple-600 to-purple-800'} dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 mb-4 text-white shadow-lg`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0">
                            {tipo === 'particular' ? <User size={28} className="text-white" /> : <Shield size={28} className="text-white" />}
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight leading-tight uppercase">{nombreCompleto}</h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-blue-100 text-xs">
                                {paciente.fecha_nacimiento && <span>🎂 {calcEdad(paciente.fecha_nacimiento)}</span>}
                                
                                    <>
                                        {(paciente as Paciente).telefono_celular && <span>📱 {formatCelular((paciente as Paciente).telefono_celular)}</span>}
                                        {paciente.email && <span>✉️ {paciente.email}</span>}
                                    </>

                                <span className={`px-2 py-0.5 rounded-full font-bold ${
                                    paciente.estado === 'activo' ? 'bg-emerald-500/30' : 'bg-red-500/30'
                                }`}>
                                    {paciente.estado === 'activo' ? '● Activo' : '● Inactivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-4 border-t border-white/20">
                    {[
                        { label: 'Citas', value: stats.citas, Icon: Calendar },
                        { label: 'Seguimientos', value: stats.historias, Icon: Activity },
                        { label: 'Recetas', value: stats.recetas, Icon: ClipboardList },
                        { label: 'Tests', value: stats.tests, Icon: HelpCircle },
                        { label: 'Pagos', value: stats.pagos, Icon: FileText },
                        { label: 'Total Pagado', value: `S/. ${stats.totalPagado.toFixed(0)}`, Icon: CheckCircle },
                    ].map(({ label, value, Icon }) => (
                        <div key={label} className="bg-white/10 rounded-xl p-2 text-center hover:bg-white/20 transition-colors">
                            <Icon size={14} className="mx-auto mb-0.5 text-blue-200" />
                            <div className="text-base font-black leading-tight">{value}</div>
                            <div className="text-[9px] text-blue-200 uppercase tracking-wider">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 mb-4 overflow-x-auto no-scrollbar">
                {allowedTabs.map(tab => {
                    const isActive = activeTab?.id === tab.id;
                    return (
                        <Link
                            key={tab.id}
                            to={`${basePath}/${tab.path}`}
                            className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                                isActive
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            {/* ── Tab Content (Outlet renders the matched child route) ──────── */}
            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    );
};

export default PacientePerfil;
