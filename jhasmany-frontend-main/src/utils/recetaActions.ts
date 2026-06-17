import api from '../services/api';
import Swal from 'sweetalert2';
import { formatDate } from './dateUtils';
import { formatFullName } from './formatters';
import type { Receta } from '../types';

export const handlePrintReceta = async (receta: Receta, diagnosticos?: any[]) => {
    // Fetch signatures
    let signatures: any[] = [];
    try {
        const response = await api.get(`/firmas/documento/receta/${receta.id}`);
        signatures = response.data;

        // Fallback: Si no hay firma del paciente en la receta, buscar en la historia clínica
        const patientSigInReceta = signatures.find(s => s.rolFirmante === 'paciente');
        if (!patientSigInReceta && receta.pacienteId) {
            try {
                const resHC = await api.get(`/firmas/documento/historia_clinica/${receta.pacienteId}`);
                const patientSigHC = resHC.data.find((s: any) => s.rolFirmante === 'paciente');
                if (patientSigHC) {
                    signatures.push(patientSigHC);
                }
            } catch (error) {
                console.error('Error fetching patient HC signature for recipe:', error);
            }
        }
    } catch (error) {
        console.error('Error fetching signatures for print:', error);
    }

    const doctorSignature = signatures.find(s => s.rolFirmante === 'doctor' || s.rolFirmante === 'personal' || s.rolFirmante === 'administrador');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
        document.body.removeChild(iframe);
        return;
    }

    const dateStr = formatDate(receta.fecha);

    // Age and gender calculation helpers
    const calcularEdad = (fechaNacimiento: string | undefined): string => {
        if (!fechaNacimiento) return 'No especificada';
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
        return `${edad} años`;
    };

    const formatGenero = (genero: string | undefined): string => {
        if (!genero) return 'No especificado';
        const g = genero.toLowerCase();
        if (g === 'masculino' || g === 'm') return 'Masculino';
        if (g === 'femenino' || g === 'f') return 'Femenino';
        return genero;
    };

    // Diagnoses display helper
    const listDiags = diagnosticos || (receta as any).historiaClinica?.diagnosticos || (receta as any).fichaMedica?.diagnosticos || [];
    let diagnosticosHtml = '';
    if (listDiags && listDiags.length > 0) {
        const diagsRowsHtml = listDiags.map((d: any) => `
            <div style="margin-top: 4px; padding-left: 5px;">• ${d.diagnostico} (${d.tipo})</div>
        `).join('');
        diagnosticosHtml = `
            <div style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px; font-size: 11px; color: #333;">
                <strong>DIAGNÓSTICO(S):</strong>
                <div style="margin-top: 2px;">
                    ${diagsRowsHtml}
                </div>
            </div>
        `;
    }

    // Generate medication rows
    let medicationRows = '';
    if (receta.detalles && receta.detalles.length > 0) {
        medicationRows = receta.detalles.map((d: any) => `
            <tr>
                <td>${d.medicamento ? d.medicamento.medicamento : (d.medicamentoId || '')}</td>
                <td class="text-center">${d.cantidad}</td>
                <td>${d.tiempo}</td>
                <td>${d.via}</td>
                <td>${d.posologia}</td>
            </tr>
        `).join('');
    }

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Receta Médica</title>
            <style>
                body {
                    font-family: 'Helvetica', 'Arial', sans-serif;
                    color: #333;
                    margin: 20px;
                    padding: 0;
                }
                
                .header {
                    display: flex;
                    justify-content: flex-start;
                    align-items: center;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                
                .header-text {
                    text-align: left;
                }
                
                .doctor-name {
                    font-size: 18px;
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .doctor-specialty {
                    font-size: 12px;
                    color: #7f8c8d;
                    margin-top: 2px;
                }
                
                .doctor-credentials {
                    font-size: 10px;
                    color: #95a5a6;
                    margin-top: 2px;
                }
                
                .doc-title {
                    font-size: 20px;
                    font-weight: bold;
                    text-align: center;
                    margin-top: 10px;
                    margin-bottom: 20px;
                    color: #2c3e50;
                    letter-spacing: 2px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    margin-bottom: 20px;
                }
                
                th {
                    background-color: #3498db;
                    color: white;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                    padding: 8px 10px;
                    text-align: left;
                }
                
                td {
                    font-size: 11px;
                    padding: 8px 10px;
                    border-bottom: 1px solid #eee;
                }
                
                tr:nth-child(even) td {
                    background-color: #f8f9fa;
                }
                
                .text-center {
                    text-align: center;
                }
                
                .signature-section {
                    margin-top: 40px;
                    page-break-inside: avoid;
                }
                
                .signature-technical {
                    font-size: 6px;
                    color: #999;
                    text-align: center;
                    margin-bottom: 10px;
                }
                
                .info-box {
                    background-color: #f8f9fa;
                    border-left: 4px solid #3498db;
                    padding: 15px;
                    margin-bottom: 20px;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    row-gap: 8px;
                    column-gap: 15px;
                }
                
                .info-item {
                    font-size: 12px;
                    color: #333;
                }
                
                .info-item strong {
                    color: #2c3e50;
                    margin-right: 5px;
                }

                .section-title {
                    font-size: 14px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-top: 20px;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }
                
                @media print {
                    body {
                        margin: 0;
                    }
                    
                    th {
                        background-color: #3498db !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    tr:nth-child(even) td {
                        background-color: #f8f9fa !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-text">
                    <div class="doctor-name">Dr. Jhasmany Ricardo Ojeda Cardona</div>
                    <div class="doctor-specialty">Médico Cirujano - Ocupacional</div>
                    <div class="doctor-credentials">CMP: 86653 &nbsp;&nbsp;&nbsp;&nbsp; RNA: A09485</div>
                </div>
            </div>
            
            <div class="doc-title">RECETA MÉDICA</div>
            
            <div class="info-box">
                <div class="info-grid">
                    <div class="info-item"><strong>PACIENTE:</strong> ${formatFullName(receta.paciente)}</div>
                    <div class="info-item"><strong>FECHA:</strong> ${dateStr}</div>
                    <div class="info-item"><strong>DNI:</strong> ${receta.paciente?.dni || 'No especificado'}</div>
                    <div class="info-item">
                        <strong>EDAD:</strong> ${calcularEdad(receta.paciente?.fecha_nacimiento)}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <strong>SEXO:</strong> ${formatGenero(receta.paciente?.genero)}
                    </div>
                </div>
                ${diagnosticosHtml}
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 35%;">Medicamento</th>
                        <th class="text-center" style="width: 10%;">Cantidad</th>
                        <th style="width: 13%;">Tiempo (días)</th>
                        <th style="width: 12%;">VIA (adm.)</th>
                        <th style="width: 30%;">Posología</th>
                    </tr>
                </thead>
                <tbody>
                    ${medicationRows}
                </tbody>
            </table>
            
            <div class="signature-section" style="display: flex; justify-content: center; margin-top: 40px; width: 100%;">
                <div class="signature-box" style="width: 300px; text-align: center;">
                    ${doctorSignature ? `
                        <img src="${doctorSignature.firmaData}" class="signature-image" style="max-height: 80px; margin-bottom: -5px;" />
                    ` : '<div style="height: 60px;"></div>'}
                    <div style="border-top: 1px solid #333; width: 250px; margin: 5px auto;"></div>
                    <div style="font-size: 10px; margin-top: 5px; color: #333; line-height: 1.3;">
                        OS - 419883 O+<br/>
                        <strong>Jhasmany Ricardo OJEDA</strong><br/>
                        <strong>CARDONA</strong><br/>
                        CAP. S PNP<br/>
                        MR. PSIQUIATRIA<br/>
                        HN PNP LNS<br/>
                        CMP 86653 DNI<br/>
                        44996179
                    </div>
                </div>
            </div>

            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `;

    doc.open();
    doc.write(printContent);
    doc.close();

    const logo = doc.querySelector('img');

    const doPrint = () => {
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 5000);
    };

    if (logo) {
        if (logo.complete) {
            doPrint();
        } else {
            logo.onload = doPrint;
            logo.onerror = doPrint;
        }
    } else {
        doPrint();
    }
};

export const handleWhatsAppReceta = async (receta: Receta) => {
    const phone = receta.paciente?.telefono_celular || receta.paciente?.celular;
    if (!phone) {
        Swal.fire('Atención', 'El paciente no tiene número de celular registrado', 'warning');
        return;
    }

    Swal.fire({
        title: 'Enviando...',
        text: 'Enviando receta por WhatsApp',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await api.post(`/receta/${receta.id}/send-whatsapp`);

        Swal.fire({
            icon: 'success',
            title: '¡Enviado!',
            text: response.data.message || 'Receta enviada por WhatsApp exitosamente',
            timer: 3000,
            showConfirmButton: false
        });
    } catch (error: any) {
        console.error('Error sending WhatsApp:', error);

        let errorMessage = 'No se pudo enviar la receta por WhatsApp';

        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.status === 503) {
            errorMessage = 'El chatbot no está conectado. Por favor, conecte el chatbot primero desde Configuración > Chatbot (WhatsApp).';
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage,
            confirmButtonText: 'Entendido'
        });
    }
};
