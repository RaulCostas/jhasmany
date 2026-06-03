import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoriaClinica } from '../historia_clinica/entities/historia_clinica.entity';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

@Injectable()
export class HistoriaClinicaPdfService {
    private printer: any;

    constructor(
        @InjectRepository(HistoriaClinica)
        private historiaClinicaRepository: Repository<HistoriaClinica>,
    ) {
        const fonts = {
            Helvetica: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        };
        this.printer = new PdfPrinter(fonts);
    }

    async generateHistoriaClinicaPdf(pacienteId: number): Promise<Buffer> {
        // Fetch all historia clinica records for this patient
        const historiaRecords = await this.historiaClinicaRepository.find({
            where: {
                pacienteId
            },
            relations: ['paciente', 'diagnosticos'],
            order: { fecha: 'DESC' }
        });

        if (historiaRecords.length === 0) {
            throw new Error('No se encontraron registros de historia clínica');
        }

        const paciente = historiaRecords[0].paciente;

        // Format date
        const formatDate = (dateString: string | Date): string => {
            const date = dateString instanceof Date ? dateString : new Date(dateString);
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };

        const content: any[] = [
            // Header
            {
                text: 'HISTORIAL CLÍNICO Y SEGUIMIENTO',
                style: 'header',
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0, y1: 5,
                        x2: 515, y2: 5,
                        lineWidth: 2,
                        lineColor: '#3498db'
                    }
                ],
                margin: [0, 10, 0, 15]
            },
            // Patient info box with blue border
            {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                stack: [
                                    {
                                        text: [
                                            { text: 'PACIENTE: ', bold: true },
                                            { text: `${paciente.paterno} ${paciente.materno} ${paciente.nombre}`.toUpperCase() }
                                        ]
                                    },
                                    {
                                        text: [
                                            { text: 'D.N.I. / PASAPORTE: ', bold: true },
                                            { text: paciente.dni || 'N/A' }
                                        ],
                                        margin: [0, 4, 0, 0]
                                    }
                                ],
                                margin: [8, 8, 8, 8]
                            }
                        ]
                    ]
                },
                layout: {
                    fillColor: () => '#f8f9fa',
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#3498db',
                    vLineColor: () => '#3498db'
                },
                margin: [0, 0, 0, 15]
            }
        ];

        // Loop through records
        historiaRecords.forEach((record) => {
            const diags = (record.diagnosticos || [])
                .map(d => `- [${d.tipo}] ${d.diagnostico}`)
                .join('\n');

            content.push({
                stack: [
                    {
                        text: `CONSULTA MÉDICA - ${formatDate(record.fecha)}`,
                        style: 'sectionHeader',
                        margin: [0, 10, 0, 5]
                    },
                    {
                        columns: [
                            { text: 'Modalidad:', bold: true, width: 80, fontSize: 9 },
                            { text: record.modalidad || '-', width: 120, fontSize: 9 },
                            { text: 'Servicio:', bold: true, width: 60, fontSize: 9 },
                            { text: record.servicio || '-', width: '*', fontSize: 9 }
                        ],
                        margin: [0, 2, 0, 8]
                    },
                    {
                        text: [
                            { text: 'Motivo de Visita:\n', bold: true, fontSize: 9 },
                            { text: record.motivo_visita || '-', fontSize: 9 }
                        ],
                        margin: [0, 0, 0, 6]
                    },
                    {
                        columns: [
                            {
                                stack: [
                                    { text: 'Examen Físico:', bold: true, fontSize: 9 },
                                    { text: record.examen_fisico || '-', fontSize: 9 }
                                ]
                            },
                            {
                                stack: [
                                    { text: 'Examen Mental:', bold: true, fontSize: 9 },
                                    { text: record.examen_mental || '-', fontSize: 9 }
                                ]
                            }
                        ],
                        columnGap: 15,
                        margin: [0, 0, 0, 6]
                    },
                    {
                        text: [
                            { text: 'Exámenes Auxiliares:\n', bold: true, fontSize: 9 },
                            { text: record.examenes_auxiliares || '-', fontSize: 9 }
                        ],
                        margin: [0, 0, 0, 6]
                    },
                    {
                        text: [
                            { text: 'Diagnósticos:\n', bold: true, fontSize: 9 },
                            { text: diags || 'Sin diagnósticos registrados.', fontSize: 9 }
                        ],
                        margin: [0, 0, 0, 6]
                    },
                    {
                        text: [
                            { text: 'Plan de Trabajo:\n', bold: true, fontSize: 9 },
                            { text: record.plan_trabajo || '-', fontSize: 9 }
                        ],
                        margin: [0, 0, 0, 6]
                    },
                    {
                        text: [
                            { text: 'Derivación:\n', bold: true, fontSize: 9 },
                            { text: record.derivar_consulta === 'SI' ? `SÍ - ${record.derivar_consulta_detalle || ''}` : 'NO', fontSize: 9 }
                        ],
                        margin: [0, 0, 0, 10]
                    },
                    {
                        canvas: [
                            {
                                type: 'line',
                                x1: 0, y1: 5,
                                x2: 515, y2: 5,
                                lineWidth: 0.5,
                                lineColor: '#ccc'
                            }
                        ],
                        margin: [0, 5, 0, 15]
                    }
                ]
            });
        });

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 80],
            defaultStyle: {
                font: 'Helvetica'
            },
            content: content,
            footer: (currentPage: number, pageCount: number) => {
                return {
                    stack: [
                        {
                            canvas: [
                                {
                                    type: 'line',
                                    x1: 40, y1: 0,
                                    x2: 555, y2: 0,
                                    lineWidth: 1,
                                    lineColor: '#999'
                                }
                            ],
                            margin: [0, 0, 0, 5]
                        },
                        {
                            text: `Fecha de impresión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
                            alignment: 'right',
                            fontSize: 9,
                            color: '#333',
                            margin: [0, 0, 40, 20]
                        }
                    ]
                };
            },
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    color: '#2c3e50'
                },
                sectionHeader: {
                    fontSize: 12,
                    bold: true,
                    color: '#2c3e50',
                    borderBottom: '1px solid #3498db'
                }
            }
        };

        return new Promise((resolve, reject) => {
            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            const chunks: Buffer[] = [];

            pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);

            pdfDoc.end();
        });
    }
}
