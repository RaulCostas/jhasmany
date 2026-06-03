import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { formatFullName } from '../utils/formatters';
import './Layout.css';
import ChatWidget from './Chat/ChatWidget';

import { useChat } from '../context/ChatContext';
import { useCorreos } from '../context/CorreosContext';
import { ThemeToggle } from './ThemeToggle';
import { Brain } from 'lucide-react';


const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logoutUser } = useChat();
    const { unreadCount } = useCorreos();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLabsOpen, setIsLabsOpen] = useState(false);
    const [isPersonalOpen, setIsPersonalOpen] = useState(false);
    const [isProvidersOpen, setIsProvidersOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isSeguroOpen, setIsSeguroOpen] = useState(false);

    // Permission Logic
    const [permisos, setPermisos] = useState<string[]>([]);

    const fetchUserData = async () => {
        const userStr = localStorage.getItem('user');
        const lastFetchStr = localStorage.getItem('user_last_fetch');
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;

        if (userStr) {
            try {
                const localUser = JSON.parse(userStr);

                // If we have a local user and it was fetched recently, skip API call
                if (localUser && localUser.id && lastFetchStr) {
                    const lastFetch = parseInt(lastFetchStr);
                    if (now - lastFetch < FIVE_MINUTES) {
                        console.log('[Layout] Using cached user data (less than 5 mins old)');
                        setCurrentUser(localUser);
                        setPermisos(Array.isArray(localUser.permisos) ? localUser.permisos : []);
                        return;
                    }
                }

                if (localUser && localUser.id) {
                    console.log(`[Layout] Fetching fresh data for user ID: ${localUser.id}`);
                    const response = await api.get(`/users/${localUser.id}`);
                    const freshUser = response.data;

                    if (freshUser && freshUser.id) {
                        setCurrentUser(freshUser);
                        setPermisos(Array.isArray(freshUser.permisos) ? freshUser.permisos : []);
                        
                        localStorage.setItem('user', JSON.stringify(freshUser));
                        localStorage.setItem('user_last_fetch', now.toString());
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                try {
                    const user = JSON.parse(userStr);
                    setCurrentUser(user);
                    setPermisos(Array.isArray(user.permisos) ? user.permisos : []);
                } catch (e) {
                    setCurrentUser(null);
                    setPermisos([]);
                }
            }
        }
    };

    useEffect(() => {
        fetchUserData();

        // Listen for user updates (e.g. photo change)
        const handleUserUpdate = () => {
            fetchUserData();
        };

        window.addEventListener('user-updated', handleUserUpdate);

        return () => {
            window.removeEventListener('user-updated', handleUserUpdate);
        };
    }, []);

    const hasAccess = (moduleId: string) => {
        return !permisos.includes(moduleId);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        logoutUser();
        navigate('/login');
    };

    const isActive = (path: string, search?: string) => {
        if (search) {
            return location.pathname === path && location.search === search ? 'active' : '';
        }
        return location.pathname === path ? 'active' : '';
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="dashboard-container">
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={closeSidebar}
            />

            <aside className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
                <div className="sidebar-header flex items-center justify-center gap-2">
                    <Brain className="text-blue-400 h-6 w-6 shrink-0" />
                    <h1 className="sidebar-logo-text">
                        Dr. Ojeda
                    </h1>
                    <button className="close-sidebar-btn" onClick={closeSidebar}>×</button>
                </div>
               <nav className="sidebar-nav">
                    <ul className="nav-list">
                        {hasAccess('agenda') && (
                            <li className="nav-item">
                                <Link
                                    to="/"
                                    className={`nav-link ${isActive('/')}`}
                                    onClick={closeSidebar}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                    </svg>
                                    Inicio
                                </Link>
                            </li>
                        )}
                        {hasAccess('agenda') && (
                            <li className="nav-item">
                                <Link
                                    to="/agenda"
                                    className={`nav-link ${isActive('/agenda')}`}
                                    onClick={closeSidebar}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    Agenda
                                </Link>
                            </li>
                        )}
                        {/* PACIENTES */}
                        {hasAccess('pacientes') && (
                            <li className="nav-item">
                                <Link
                                    to="/pacientes"
                                    className={`nav-link ${isActive('/pacientes')}`}
                                    onClick={closeSidebar}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                    Pacientes
                                </Link>
                            </li>
                        )}

                        {/* DOCTORES */}
                        {hasAccess('doctores') && (
                            <li className="nav-item">
                                <Link
                                    to="/doctors"
                                    className={`nav-link ${isActive('/doctors')}`}
                                    onClick={closeSidebar}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                    </svg>
                                    Doctores
                                </Link>
                            </li>
                        )}


                        {/* EGRESOS - part of Caja Diaria? */}
                        {hasAccess('egresos') && (
                            <li className="nav-item">
                                <Link
                                    to="/egresos"
                                    className={`nav-link ${isActive('/egresos')}`}
                                    onClick={closeSidebar}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                    Egresos Diarios
                                </Link>
                            </li>
                        )}

                        {hasAccess('gastos') && (
                            <li className="nav-item">
                                <Link
                                    to="/gastos-fijos"
                                    className={`nav-link ${isActive('/gastos-fijos')}`}
                                    onClick={closeSidebar}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                        <polyline points="17 18 23 18 23 12"></polyline>
                                    </svg>
                                    Gastos Fijos
                                </Link>
                            </li>
                        )}
                        {hasAccess('hoja-diaria') && (
                            <li className="nav-item">
                                <Link
                                    to="/hoja-diaria"
                                    className={`nav-link ${isActive('/hoja-diaria')}`}
                                    onClick={closeSidebar}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    Hoja Diaria
                                </Link>
                            </li>
                        )}

                        {hasAccess('utilidades') && (
                            <li className="nav-item">
                                <Link
                                    to="/utilidades"
                                    className={`nav-link ${isActive('/utilidades')}`}
                                    onClick={closeSidebar}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                        <line x1="12" y1="1" x2="12" y2="23"></line>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                    Utilidades
                                </Link>
                            </li>
                        )}

                        {/* ESTADÍSTICAS MENU */}
                        {hasAccess('estadisticas') && (
                            <li className="nav-item">
                                <div
                                    className={`nav-link ${isStatsOpen || isActive('/estadisticas') ? 'active' : ''}`}
                                    onClick={() => setIsStatsOpen(!isStatsOpen)}
                                    style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                            <line x1="18" y1="20" x2="18" y2="10"></line>
                                            <line x1="12" y1="20" x2="12" y2="4"></line>
                                            <line x1="6" y1="20" x2="6" y2="14"></line>
                                        </svg>
                                        Estadísticas
                                    </div>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ transform: isStatsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                                {isStatsOpen && (
                                    <ul className="submenu-list" style={{ paddingLeft: '20px', listStyle: 'none', background: 'rgba(0,0,0,0.05)' }}>
                                        {hasAccess('estadisticas-pacientes') && (
                                            <li className="nav-item">
                                                <Link
                                                    to="/estadisticas/pacientes-nuevos"
                                                    className={`nav-link ${isActive('/estadisticas/pacientes-nuevos')}`}
                                                    onClick={closeSidebar}
                                                    style={{ fontSize: '0.9em' }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="9" cy="7" r="4"></circle>
                                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                    </svg>
                                                    Pacientes
                                                </Link>
                                            </li>
                                        )}
                                        {hasAccess('estadisticas-utilidades') && (
                                            <li className="nav-item">
                                                <Link
                                                    to="/estadisticas/utilidades"
                                                    className={`nav-link ${isActive('/estadisticas/utilidades')}`}
                                                    onClick={closeSidebar}
                                                    style={{ fontSize: '0.9em' }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                                        <line x1="12" y1="1" x2="12" y2="23"></line>
                                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                                    </svg>
                                                    Utilidades
                                                </Link>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        )}

                        {hasAccess('configuracion') && (
                            <li className="nav-item">
                                <Link
                                    to="/configuration"
                                    className={`nav-link ${isActive('/configuration') || isActive('/comision-tarjeta') || isActive('/especialidad') || isActive('/forma-pago') || isActive('/cambiar-password') ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                            <circle cx="12" cy="12" r="3"></circle>
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                        </svg>
                                        Configuración
                                    </div>
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <button className="hamburger-btn" onClick={toggleSidebar}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className="header-actions">
                        {currentUser && (
                            <div className="user-profile-header">
                                {currentUser.foto ? (
                                    <img src={currentUser.foto} alt={currentUser.name} className="user-avatar" />
                                ) : (
                                    <div className="user-avatar-placeholder">
                                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                                <span className="user-name dark:text-white">{formatFullName(currentUser)}</span>
                            </div>
                        )}
                        <div className="header-buttons">
                            {/* Selector Modificado: Modalidad Clínica Única (JHASMANY) */}
                            <ThemeToggle />

                            <button
                                onClick={() => navigate('/correos')}
                                className="header-icon-btn relative dark:text-white"
                                title="Correos"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="header-icon-btn dark:text-white"
                                title="Inicio"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="header-icon-btn logout-header-btn dark:text-white"
                                title="Cerrar Sesión"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>
                <main className="content-area">
                    <Outlet />
                </main>
            </div>
            <ChatWidget />
        </div>
    );
};

export default Layout;
