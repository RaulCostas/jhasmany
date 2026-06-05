import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import api from '../services/api';
import type { Receta } from '../types';
import Pagination from './Pagination';
import Swal from 'sweetalert2';
import { formatDate } from '../utils/dateUtils';
import { formatFullName } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import SignatureModal from './SignatureModal';
import RecetarioForm from './RecetarioForm';
import { handlePrintReceta, handleWhatsAppReceta } from '../utils/recetaActions';

import { ClipboardList, Printer, FileSignature, CheckCircle } from 'lucide-react';


interface RecetarioListProps {
    pacienteId?: number;
}

const RecetarioList: React.FC<RecetarioListProps> = ({ pacienteId: propPacienteId }) => {
    const { id: urlPacienteId } = useParams<{ id: string }>();
    const pacienteId = propPacienteId || (urlPacienteId ? Number(urlPacienteId) : undefined);
    
    const [recetas, setRecetas] = useState<Receta[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showManual, setShowManual] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEditId, setSelectedEditId] = useState<number | null>(null);
    const limit = 10;


    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Recetas',
            content: 'El módulo de Recetario permite crear y gestionar recetas médicas para los pacientes de la clínica.'
        },
        {
            title: 'Crear Nueva Receta',
            content: 'Use el botón "+ Nueva Receta" para crear una receta. Seleccione el paciente, agregue los medicamentos con sus indicaciones y cantidades.'
        },
        {
            title: 'Acciones Disponibles',
            content: (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>📱 <strong>WhatsApp:</strong> Envía la receta automáticamente por WhatsApp al paciente (requiere chatbot conectado).</li>
                    <li>🖨️ <strong>Imprimir:</strong> Abre el diálogo de impresión para imprimir la receta directamente.</li>
                    <li>✏️ <strong>Editar:</strong> Modifica los datos de la receta existente.</li>
                    <li>🗑️ <strong>Eliminar:</strong> Elimina la receta de forma permanente.</li>
                </ul>
            )
        },
        {
            title: 'Envío por WhatsApp',
            content: 'Para usar la función de WhatsApp, el chatbot debe estar conectado desde Configuración > Chatbot (WhatsApp). El PDF se enviará automáticamente al número de celular del paciente.'
        }];

    useEffect(() => {
        fetchRecetas();
    }, [pacienteId]);

    const fetchRecetas = async () => {
        try {
            const url = pacienteId ? `/receta?pacienteId=${pacienteId}` : '/receta';
            const response = await api.get(url);
            // Assuming backend currently returns flat array, we handle it here
            const data = Array.isArray(response.data) ? response.data : response.data.data || [];
            setRecetas(data);
        } catch (error) {
            console.error('Error fetching recetas:', error);
            Swal.fire('Error', 'No se pudieron cargar las recetas', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar receta?',
            text: 'No podrá revertir esta acción',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/receta/${id}`);
                await Swal.fire('¡Eliminado!', 'La receta ha sido eliminada.', 'success');
                fetchRecetas();
            } catch (error) {
                console.error('Error deleting receta:', error);
                Swal.fire('Error', 'No se pudo eliminar la receta', 'error');
            }
        }
    };

    // Filter logic
    const filteredRecetas = recetas.filter(r => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;

        const pacienteNombre = formatFullName(r.paciente).toLowerCase();
        const userName = (r.user?.name || '').toLowerCase();
        const detailsStr = r.detalles?.map(d => d.medicamento?.medicamento || '').join(' ').toLowerCase() || '';

        if (pacienteId) {
            return userName.includes(term) || detailsStr.includes(term);
        } else {
            return pacienteNombre.includes(term) || userName.includes(term);
        }
    });

    // Pagination logic
    const paginatedRecetas = filteredRecetas.slice((currentPage - 1) * limit, currentPage * limit);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className={pacienteId 
            ? "content-card bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 transition-colors" 
            : "content-card p-6 bg-gray-50 dark:bg-gray-800 min-h-screen"
        }>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ClipboardList className="text-blue-500" size={22} />
                        {pacienteId ? 'Recetas del Paciente' : 'Recetario'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {pacienteId ? 'Historial de recetas emitidas al paciente.' : 'Gestión y emisión de recetas médicas.'}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={() => { setSelectedEditId(null); setIsFormOpen(true); }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <span className="text-xl font-bold">+</span> Nueva Receta
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center gap-4">
                <div className="flex gap-2 w-full md:max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder={pacienteId ? "Buscar por medicamento o usuario..." : "Buscar por paciente o usuario..."}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-4 text-gray-600 dark:text-gray-400 text-sm">
                Mostrando {filteredRecetas.length === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, filteredRecetas.length)} de {filteredRecetas.length} registros
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            {!pacienteId && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>}
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Registrado por</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Medicamentos</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedRecetas.map((receta, index) => (
                            <tr key={receta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    <div>{formatDate(receta.fecha)}</div>
                                    <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                                        {receta.historiaClinica ? 'Seguimiento Clínico' : receta.fichaMedica ? 'Ficha Médica' : 'Recetario'}
                                    </div>
                                </td>
                                {!pacienteId && (
                                    <td className="p-3 text-gray-700 dark:text-gray-300">
                                        {formatFullName(receta.paciente)}
                                    </td>
                                )}
                                <td className="p-3 text-gray-700 dark:text-gray-300">
                                    {receta.user ? receta.user.name : 'N/A'}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                    {receta.detalles && receta.detalles.length > 0
                                        ? `${receta.detalles.length} medicamento${receta.detalles.length !== 1 ? 's' : ''} (${receta.detalles[0].medicamento?.medicamento || ''}...)`
                                        : ''}
                                </td>

                                <td className="p-3 flex gap-2">
                                    {receta.esta_firmado ? (
                                        <div className="p-2 text-green-600 dark:text-green-400 font-bold flex items-center justify-center" title="Receta Firmada">
                                            <CheckCircle size={20} />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSelectedReceta(receta);
                                                setShowSignatureModal(true);
                                            }}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Firmar Receta"
                                        >
                                            <FileSignature size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleWhatsAppReceta(receta)}
                                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Enviar por WhatsApp"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handlePrintReceta(receta)}
                                        className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Imprimir"
                                    >
                                        <Printer size={20} />
                                    </button>

                                    <button
                                        onClick={() => { setSelectedEditId(receta.id); setIsFormOpen(true); }}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(receta.id)}
                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Eliminar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedRecetas.length === 0 && (
                            <tr><td colSpan={pacienteId ? 5 : 6} className="text-center p-4 text-gray-500 dark:text-gray-400">No hay recetas registradas</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center mt-4">
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredRecetas.length / limit)}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Recetario"
                sections={manualSections}
            />

            {/* Signature Modal */}
            {showSignatureModal && selectedReceta && (
                <SignatureModal
                    isOpen={showSignatureModal}
                    onClose={() => {
                        setShowSignatureModal(false);
                        setSelectedReceta(null);
                    }}
                    tipoDocumento="receta"
                    documentoId={selectedReceta.id}
                    rolFirmante="doctor"
                    onSuccess={() => {
                        fetchRecetas();
                    }}
                />
            )}

            <RecetarioForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedEditId}
                pacienteId={pacienteId}
                onSaveSuccess={() => {
                    fetchRecetas();
                    setIsFormOpen(false);
                }}
            />
        </div>
    );
};

export default RecetarioList;
