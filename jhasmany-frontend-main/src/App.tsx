import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import UserList from './components/UserList';
import Home from './components/Home';
import DoctorList from './components/DoctorList';
import EspecialidadList from './components/EspecialidadList';
import MedicamentoList from './components/MedicamentoList';
import EgresoList from './components/EgresoList';
import { ErrorBoundary } from './components/ErrorBoundary';
import PacienteList from './components/PacienteList';
import PacienteForm from './components/PacienteForm';
import HistoriaClinica from './components/HistoriaClinica';
import ComisionTarjetaList from './components/ComisionTarjetaList';
import GastosFijosList from './components/GastosFijosList';
import AgendaView from './components/AgendaView';
import CorreosList from './components/CorreosList';
import Configuration from './components/Configuration';
import ChatbotConfig from './components/ChatbotConfig';
import FormaPagoList from './components/FormaPagoList';
import { ChatProvider } from './context/ChatContext';
import { CorreosProvider } from './context/CorreosContext';
import ProtectedRoute from './components/ProtectedRoute';
import HojaDiaria from './components/HojaDiaria';
import Utilidades from './components/Utilidades';
import Estadisticas from './components/Estadisticas';
import EstadisticasPacientesNuevos from './components/EstadisticasPacientesNuevos';
import PacientePerfil from './components/PacientePerfil';
import PacienteTabFicha from './components/PacienteTabFicha';
import PacienteTabCitas from './components/PacienteTabCitas';
import PacienteTabPagos from './components/PacienteTabPagos';
import PacienteTabTest from './components/PacienteTabTest';
import TestPublico from './components/TestPublico';


import EstadisticasUtilidades from './components/EstadisticasUtilidades';
import RecetarioList from './components/RecetarioList';
import RecordatorioList from './components/RecordatorioList';
import ContactosList from './components/ContactosList';
import BackupManager from './components/BackupManager';
import CambiarPassword from './components/CambiarPassword';


import { ThemeProvider } from './context/ThemeContext';

const RootRedirect = () => {
    const user = localStorage.getItem('user');
    return user ? <Home /> : <Navigate to="/login" replace />;
};

function App() {
    return (
        <Router>
            <ChatProvider>
                <CorreosProvider>
                    <ThemeProvider>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/test-publico/:token" element={<TestPublico />} />
                            <Route path="/" element={<Layout />}>
                                <Route index element={<RootRedirect />} />

                                {/* Agenda */}
                                <Route element={<ProtectedRoute moduleId="agenda" />}>
                                    <Route path="/agenda" element={<AgendaView />} />
                                </Route>

                                {/* Usuarios & Configuration */}
                                <Route element={<ProtectedRoute moduleId="usuarios" />}>
                                    <Route path="/users" element={<UserList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="configuracion" />}>
                                    <Route path="/configuration" element={<Configuration />} />
                                    <Route path="/configuration/chatbot" element={<ChatbotConfig />} />
                                    <Route path="/medicamento" element={<MedicamentoList />} />
                                    <Route element={<ProtectedRoute moduleId="config-backup" />}>
                                        <Route path="/backup" element={<BackupManager />} />
                                    </Route>
                                    <Route path="/correos" element={<CorreosList />} />
                                </Route>


                                {/* Doctores & Especialidades */}
                                <Route element={<ProtectedRoute moduleId="doctores" />}>
                                    <Route element={<ProtectedRoute moduleId="doctores-registro" />}>
                                        <Route path="/doctors" element={<DoctorList />} />
                                    </Route>
                                    <Route path="/especialidad" element={<EspecialidadList />} />
                                </Route>




                                {/* Egresos & Gastos */}
                                <Route element={<ProtectedRoute moduleId="egresos" />}>
                                    <Route path="/egresos" element={<ErrorBoundary><EgresoList /></ErrorBoundary>} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="gastos" />}>
                                    <Route path="/gastos-fijos" element={<ErrorBoundary><GastosFijosList /></ErrorBoundary>} />
                                </Route>

                                {/* Pacientes Particulares */}
                                <Route element={<ProtectedRoute moduleId="pacientes" />}>
                                    <Route element={<ProtectedRoute moduleId="pacientes-registro" />}>
                                        <Route path="/pacientes" element={<PacienteList />} />
                                        <Route path="/pacientes/create" element={<PacienteForm />} />
                                        <Route path="/pacientes/edit/:id" element={<PacienteForm />} />
                                        
                                        {/* Nested Patient Profile Routes (Particular) */}
                                        <Route path="/pacientes/:id" element={<PacientePerfil tipo="particular" />}>
                                            <Route path="ficha" element={<PacienteTabFicha tipo="particular" />} />
                                            <Route path="citas" element={<PacienteTabCitas tipo="particular" />} />
                                            <Route path="historia-clinica" element={<HistoriaClinica />} />
                                            <Route path="pagos" element={<PacienteTabPagos tipo="particular" />} />
                                            <Route path="recetario" element={<RecetarioList />} />
                                            <Route path="test" element={<PacienteTabTest />} />
                                        </Route>

                                        <Route path="/pacientes/:id/historia-clinica" element={<HistoriaClinica />} />
                                    </Route>
                                </Route>

                                <Route element={<ProtectedRoute moduleId="pacientes" />}>
                                    <Route element={<ProtectedRoute moduleId="recetario" />}>
                                        <Route path="/recetario" element={<RecetarioList />} />
                                    </Route>
                                </Route>

                                {/* Pagos */}
                                <Route element={<ProtectedRoute moduleId="pagos" />}>
                                    <Route path="/comision-tarjeta" element={<ComisionTarjetaList />} />
                                    <Route path="/forma-pago" element={<FormaPagoList />} />
                                </Route>

                                {/* Nuevos Módulos */}
                                <Route element={<ProtectedRoute moduleId="hoja-diaria" />}>
                                    <Route path="/hoja-diaria" element={<HojaDiaria />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="utilidades" />}>
                                    <Route path="/utilidades" element={<Utilidades />} />
                                </Route>
                                <Route path="/estadisticas" element={<Estadisticas />} />
                                <Route path="/estadisticas/pacientes-nuevos" element={<EstadisticasPacientesNuevos />} />
                                <Route path="/estadisticas/utilidades" element={<EstadisticasUtilidades />} />

                                {/* Recordatorios */}
                                <Route path="/recordatorio" element={<RecordatorioList />} />

                                {/* Contactos */}
                                <Route path="/contactos" element={<ContactosList />} />

                                {/* Cambiar Contraseña */}
                                <Route element={<ProtectedRoute moduleId="cambiar-password" />}>
                                    <Route path="/cambiar-password" element={<CambiarPassword />} />
                                </Route>

                                {/* Wildcard catch-all redirect */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Route>
                        </Routes>
                    </ThemeProvider>
                </CorreosProvider>
            </ChatProvider>
        </Router>
    );
}

export default App;