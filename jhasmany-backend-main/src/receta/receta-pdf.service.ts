import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { FirmasService } from '../firmas/firmas.service';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

@Injectable()
export class RecetaPdfService {
    private printer: any;

    private async getPdfImageSource(imagePathOrUrl: string): Promise<string> {
        if (!imagePathOrUrl) return '';

        if (imagePathOrUrl.startsWith('data:image')) {
            return imagePathOrUrl;
        }

        if (imagePathOrUrl.includes('/uploads/')) {
            try {
                const uploadsIdx = imagePathOrUrl.indexOf('uploads/');
                const relativePath = imagePathOrUrl.substring(uploadsIdx);
                let absolutePath = path.resolve(process.cwd(), relativePath);
                
                if (!fs.existsSync(absolutePath)) {
                    // Try resolving relative to __dirname which is src/receta
                    absolutePath = path.resolve(__dirname, '../../', relativePath);
                }

                if (fs.existsSync(absolutePath)) {
                    const fileBuffer = fs.readFileSync(absolutePath);
                    const ext = path.extname(absolutePath).toLowerCase();
                    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
                    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
                }
            } catch (err) {
                console.error('[getPdfImageSource] Error reading local upload file:', err.message);
            }
        }

        if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
            try {
                const response = await axios.get(imagePathOrUrl, { responseType: 'arraybuffer' });
                const contentType = response.headers['content-type'] || 'image/png';
                const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                return `data:${contentType};base64,${base64Image}`;
            } catch (err) {
                console.error('[getPdfImageSource] Error fetching remote image:', err.message);
            }
        }

        // If it is a URL and we failed to resolve or fetch it, return a 1x1 transparent PNG base64
        // to prevent pdfmake from throwing a fatal "Image not a valid image, path or base64" error.
        if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
            console.warn('[getPdfImageSource] Returning transparent 1x1 fallback to prevent pdfmake crash.');
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        }

        return imagePathOrUrl;
    }

    constructor(
        @Inject(forwardRef(() => FirmasService))
        private readonly firmasService: FirmasService
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


    async generateRecetaPdf(receta: any): Promise<Buffer> {
        // Fetch signatures
        const signatures = await this.firmasService.findByDocumento('receta', receta.id);
        let doctorSignature = signatures.find(s => s.rolFirmante === 'doctor' || s.rolFirmante === 'personal' || s.rolFirmante === 'administrador');

        if (!doctorSignature && receta.esta_firmado) {
            const userId = receta.userId || receta.user?.id;
            if (userId) {
                const userSignatures = await this.firmasService.findByDocumento('usuario', userId);
                doctorSignature = [...userSignatures].reverse().find(s => s.rolFirmante === 'doctor' || s.rolFirmante === 'personal' || s.rolFirmante === 'administrador');
            }
        }

        let signatureImageSrc = '';
        if (doctorSignature && doctorSignature.firmaData) {
            signatureImageSrc = await this.getPdfImageSource(doctorSignature.firmaData);
        }

        return new Promise((resolve, reject) => {
            const content: any[] = [];

            // Header with Doctor details
            content.push({
                stack: [
                    { text: 'Dr. Jhasmany Ricardo Ojeda Cardona', fontSize: 18, bold: true, color: '#2c3e50' },
                    { text: 'Médico Cirujano - Ocupacional', fontSize: 12, color: '#7f8c8d', margin: [0, 2, 0, 0] },
                    { text: 'CMP: 86653     RNA: A09485', fontSize: 10, color: '#95a5a6', margin: [0, 2, 0, 0] }
                ],
                alignment: 'left',
                margin: [0, 0, 0, 10]
            });

            // Blue separator line (Header bottom border)
            content.push({
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#3498db' }
                ],
                margin: [0, 0, 0, 20]
            });

            // RECETA MÉDICA Title
            content.push({
                text: 'RECETA MÉDICA',
                fontSize: 20,
                bold: true,
                color: '#2c3e50',
                alignment: 'center',
                characterSpacing: 2,
                margin: [0, 10, 0, 20]
            });

            // Patient Info Box
            // Style: bg #f8f9fa, border-left 4px solid #3498db, padding 15px
            const patientName = this.formatFullName(receta.paciente);
            const dateStr = this.formatDate(receta.fecha);
            const dniStr = receta.paciente?.dni || 'No especificado';
            const edadStr = this.calcularEdad(receta.paciente?.fecha_nacimiento);
            const generoStr = this.formatGenero(receta.paciente?.genero);

            const infoStackChildren: any[] = [
                {
                    columns: [
                        {
                            text: [
                                { text: 'PACIENTE: ', bold: true, color: '#2c3e50', fontSize: 10 },
                                { text: patientName, color: '#333333', fontSize: 10 }
                            ],
                            width: '55%'
                        },
                        {
                            text: [
                                { text: 'FECHA: ', bold: true, color: '#2c3e50', fontSize: 10 },
                                { text: dateStr, color: '#333333', fontSize: 10 }
                            ],
                            width: '45%'
                        }
                    ],
                    margin: [0, 0, 0, 8]
                },
                {
                    columns: [
                        {
                            text: [
                                { text: 'DNI: ', bold: true, color: '#2c3e50', fontSize: 10 },
                                { text: dniStr, color: '#333333', fontSize: 10 }
                            ],
                            width: '55%'
                        },
                        {
                            text: [
                                { text: 'EDAD: ', bold: true, color: '#2c3e50', fontSize: 10 },
                                { text: edadStr, color: '#333333', fontSize: 10 },
                                { text: '      ' },
                                { text: 'SEXO: ', bold: true, color: '#2c3e50', fontSize: 10 },
                                { text: generoStr, color: '#333333', fontSize: 10 }
                            ],
                            width: '45%'
                        }
                    ]
                }
            ];

            const listDiags = receta.historiaClinica?.diagnosticos || receta.fichaMedica?.diagnosticos || [];
            if (listDiags && listDiags.length > 0) {
                // Separator line before diagnostics
                infoStackChildren.push({
                    canvas: [
                        { type: 'line', x1: 0, y1: 0, x2: 475, y2: 0, lineWidth: 0.5, lineColor: '#dddddd' }
                    ],
                    margin: [0, 10, 0, 10]
                });

                const diagsList: any[] = [];
                diagsList.push({
                    text: 'DIAGNÓSTICO(S):',
                    bold: true,
                    color: '#2c3e50',
                    fontSize: 10,
                    margin: [0, 0, 0, 4]
                });

                listDiags.forEach((d: any) => {
                    diagsList.push({
                        text: `• ${d.diagnostico} (${d.tipo})`,
                        color: '#333333',
                        fontSize: 9,
                        margin: [5, 1, 0, 1]
                    });
                });

                infoStackChildren.push({
                    stack: diagsList
                });
            }

            content.push({
                table: {
                    widths: ['*'],
                    body: [
                        [{
                            stack: infoStackChildren,
                            fillColor: '#f8f9fa',
                            margin: [15, 15, 15, 15]
                        }]
                    ]
                },
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: (i: number) => (i === 0) ? 4 : 0, // Left border only
                    vLineColor: () => '#3498db',
                    paddingLeft: () => 0,
                    paddingRight: () => 0,
                    paddingTop: () => 0,
                    paddingBottom: () => 0
                },
                margin: [0, 0, 0, 20]
            });

            // Medications Table
            if (receta.detalles && receta.detalles.length > 0) {
                const tableBody: any[] = [
                    [
                        { text: 'Medicamento', style: 'tableHeader', alignment: 'left', fillColor: '#3498db' },
                        { text: 'Cantidad', style: 'tableHeader', alignment: 'center', fillColor: '#3498db' },
                        { text: 'Tiempo (días)', style: 'tableHeader', alignment: 'left', fillColor: '#3498db' },
                        { text: 'VIA (adm.)', style: 'tableHeader', alignment: 'left', fillColor: '#3498db' },
                        { text: 'Posología', style: 'tableHeader', alignment: 'left', fillColor: '#3498db' }
                    ]
                ];

                receta.detalles.forEach((detalle: any, index: number) => {
                    const rowColor = index % 2 === 0 ? '#f8f9fa' : null;
                    const medName = detalle.medicamento ? detalle.medicamento.medicamento : (detalle.medicamentoId || '');
                    tableBody.push([
                        { text: medName, alignment: 'left', fillColor: rowColor, fontSize: 9 },
                        { text: detalle.cantidad || '', alignment: 'center', fillColor: rowColor, fontSize: 9 },
                        { text: detalle.tiempo || '', alignment: 'left', fillColor: rowColor, fontSize: 9 },
                        { text: detalle.via || '', alignment: 'left', fillColor: rowColor, fontSize: 9 },
                        { text: detalle.posologia || '', alignment: 'left', fillColor: rowColor, fontSize: 9 }
                    ]);
                });

                content.push({
                    table: {
                        headerRows: 1,
                        widths: ['35%', '10%', '13%', '12%', '30%'],
                        body: tableBody
                    },
                    layout: {
                        hLineWidth: (i: number, node: any) => (i === 0) ? 0 : 1,
                        vLineWidth: () => 0,
                        hLineColor: () => '#eeeeee',
                        paddingLeft: () => 10,
                        paddingRight: () => 10,
                        paddingTop: () => 8,
                        paddingBottom: () => 8
                    },
                    margin: [0, 0, 0, 20]
                });
            }

            // Signature Section in main flow
            const signatureStack: any[] = [];
            if (signatureImageSrc) {
                signatureStack.push({
                    image: signatureImageSrc,
                    width: 120,
                    alignment: 'center',
                    margin: [0, 0, 0, -5]
                });
            } else {
                signatureStack.push({
                    text: '',
                    margin: [0, 0, 0, 60] // Spacer when no signature
                });
            }

            // Divider line (200 width, centered)
            signatureStack.push({
                table: {
                    widths: [200],
                    body: [['']]
                },
                layout: {
                    hLineWidth: (i: number) => (i === 0) ? 1 : 0,
                    vLineWidth: () => 0,
                    hLineColor: () => '#333333',
                    paddingTop: () => 0,
                    paddingBottom: () => 0
                },
                margin: [0, 5, 0, 5],
                alignment: 'center'
            });

            signatureStack.push({
                text: 'OS - 419883 O+',
                fontSize: 10,
                alignment: 'center',
                color: '#333333',
                margin: [0, 2, 0, 0]
            });
            signatureStack.push({
                text: 'Jhasmany Ricardo OJEDA',
                fontSize: 10,
                bold: true,
                alignment: 'center',
                color: '#333333',
                margin: [0, 2, 0, 0]
            });
            signatureStack.push({
                text: 'CARDONA',
                fontSize: 10,
                bold: true,
                alignment: 'center',
                color: '#333333',
                margin: [0, 2, 0, 0]
            });
            signatureStack.push({
                text: 'CAP. S PNP',
                fontSize: 10,
                alignment: 'center',
                color: '#333333',
                margin: [0, 2, 0, 0]
            });
            signatureStack.push({
                text: 'MR. PSIQUIATRIA',
                fontSize: 10,
                alignment: 'center',
                color: '#333333',
                margin: [0, 2, 0, 0]
            });
            signatureStack.push({
                text: 'HN PNP LNS',
                fontSize: 10,
                alignment: 'center',
                color: '#333333',
                margin: [0, 2, 0, 0]
            });
            signatureStack.push({
                text: 'CMP 86653 DNI',
                fontSize: 10,
                alignment: 'center',
                color: '#333333',
                margin: [0, 2, 0, 0]
            });
            signatureStack.push({
                text: '44996179',
                fontSize: 10,
                alignment: 'center',
                color: '#333333',
                margin: [0, 2, 0, 0]
            });

            content.push({
                stack: signatureStack,
                margin: [0, 40, 0, 20],
                alignment: 'center',
                unbreakable: true
            });

            const docDefinition = {
                defaultStyle: {
                    font: 'Helvetica',
                    fontSize: 10
                },
                content: content,
                footer: (currentPage: number, pageCount: number) => {
                    if (pageCount <= 1) return null;
                    return {
                        text: `Página ${currentPage} de ${pageCount}`,
                        fontSize: 8,
                        color: '#7f8c8d',
                        alignment: 'center',
                        margin: [0, 20, 0, 0]
                    };
                },
                styles: {
                    tableHeader: {
                        bold: true,
                        fontSize: 10,
                        color: 'white',
                        fillColor: '#3498db'
                    }
                },
                pageSize: 'A4',
                pageMargins: [56, 56, 42, 56]
            };

            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            const chunks: any[] = [];
            pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err: any) => reject(err));
            pdfDoc.end();
        });
    }

    async generatePagoDoctorPdf(pago: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const content: any[] = [];
            const isDollar = ['Dólares', '$us', 'Sus', 'USD'].includes(pago.moneda);
            const currencySymbol = isDollar ? '$us' : 'Bs';

            // Header (Title + Quote No)
            content.push({
                stack: [
                    { text: 'RECIBO DE PAGO A DOCTOR', fontSize: 18, bold: true, color: '#2c3e50', margin: [0, 0, 0, 5] },
                    { text: `Nº Recibo: ${String(pago.id).padStart(6, '0')}`, fontSize: 10, color: '#7f8c8d' }
                ],
                alignment: 'center',
                margin: [0, 0, 0, 20]
            });

            // Blue separator line
            content.push({
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#3498db' }
                ],
                margin: [0, 0, 0, 20]
            });

            // Info Box
            // Mimicking the HTML: bg #f8f9fa, border-left 4px #3498db.
            // Using a table created to look like a box.
            const doctorName = pago.doctor
                ? `${pago.doctor.nombre} ${pago.doctor.paterno} ${pago.doctor.materno || ''}`.trim()
                : 'N/A';

            content.push({
                table: {
                    widths: ['50%', '50%'],
                    body: [
                        [
                            {
                                stack: [
                                    { text: 'DOCTOR:', fontSize: 9, bold: true, color: '#2c3e50' },
                                    { text: doctorName, fontSize: 10, color: '#333333', margin: [0, 2, 0, 10] },
                                    { text: 'FORMA DE PAGO:', fontSize: 9, bold: true, color: '#2c3e50' },
                                    { text: pago.formaPago?.forma_pago || 'No especificado', fontSize: 10, color: '#333333', margin: [0, 2, 0, 0] }
                                ],
                                border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    { text: 'FECHA DE PAGO:', fontSize: 9, bold: true, color: '#2c3e50' },
                                    { text: this.formatDate(pago.fecha), fontSize: 10, color: '#333333', margin: [0, 2, 0, 10] },
                                    { text: 'MONEDA:', fontSize: 9, bold: true, color: '#2c3e50' },
                                    { text: pago.moneda || 'Bs', fontSize: 10, color: '#333333', margin: [0, 2, 0, 0] }
                                ],
                                border: [false, false, false, false]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: (i: number) => (i === 0) ? 4 : 0,
                    vLineColor: () => '#3498db',
                    paddingLeft: () => 15,
                    paddingTop: () => 10,
                    paddingBottom: () => 10,
                    fillColor: () => '#f8f9fa'
                },
                margin: [0, 0, 0, 20]
            });

            // Treatments Table
            if (pago.detalles && pago.detalles.length > 0) {
                const tableBody: any[] = [
                    [
                        { text: 'Paciente', style: 'tableHeader', alignment: 'left' },
                        { text: 'Tratamiento', style: 'tableHeader', alignment: 'left' },
                        { text: 'Pza', style: 'tableHeader', alignment: 'center' },
                        { text: 'Precio', style: 'tableHeader', alignment: 'right' },
                        { text: 'Costo Lab.', style: 'tableHeader', alignment: 'right' },
                        { text: 'Fact.', style: 'tableHeader', alignment: 'center' },
                        { text: 'Imp. 16%', style: 'tableHeader', alignment: 'right' },
                        { text: 'Neto', style: 'tableHeader', alignment: 'right' },
                        { text: 'Com%', style: 'tableHeader', alignment: 'right' },
                        { text: 'Pago Doc.', style: 'tableHeader', alignment: 'right' }
                    ]
                ];

                pago.detalles.forEach((detalle: any, index: number) => {
                    const rowColor = index % 2 === 0 ? '#f8f9fa' : null;
                    const hc = detalle.historiaClinica;
                    const paciente = hc?.paciente
                        ? `${hc.paciente.nombre} ${hc.paciente.paterno}`
                        : 'Desconocido';

                    // Calculos para la vista
                    const base = Number(hc?.precio) || 0;
                    const desc = Number(detalle.descuento) || 0;
                    const lab = Number(detalle.costo_laboratorio) || 0;
                    const com = Number(detalle.comision) || 0;
                    const factura = Boolean(detalle.fecha_pago_paciente && detalle.forma_pago_paciente); // Simple check if paid
                    
                    let taxableBase = base - ((base * desc) / 100);
                    if (factura) taxableBase = taxableBase * 0.84;
                    const neto = Math.max(0, taxableBase - lab);
                    const impuestoStr = factura ? (taxableBase * 0.16).toFixed(2) : '-';

                    tableBody.push([
                        { text: paciente, fontSize: 8, alignment: 'left', fillColor: rowColor },
                        { text: hc?.tratamiento || '-', fontSize: 8, alignment: 'left', fillColor: rowColor },
                        { text: hc?.pieza || '-', fontSize: 8, alignment: 'center', fillColor: rowColor },
                        { text: base.toFixed(2), fontSize: 8, alignment: 'right', fillColor: rowColor },
                        { text: lab > 0 ? lab.toFixed(2) : '-', fontSize: 8, alignment: 'right', fillColor: rowColor },
                        { text: factura ? 'SI' : 'NO', fontSize: 8, alignment: 'center', fillColor: rowColor },
                        { text: impuestoStr, fontSize: 8, alignment: 'right', color: '#e74c3c', fillColor: rowColor },
                        { text: neto.toFixed(2), fontSize: 8, alignment: 'right', color: '#2980b9', fillColor: rowColor },
                        { text: com > 0 ? com + '%' : '-', fontSize: 8, alignment: 'right', fillColor: rowColor },
                        { text: Number(detalle.total).toFixed(2), fontSize: 8, alignment: 'right', bold: true, color: '#27ae60', fillColor: rowColor }
                    ]);
                });

                content.push({
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: tableBody
                    },
                    layout: {
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#dddddd',
                        vLineColor: () => '#dddddd',
                        paddingLeft: () => 5,
                        paddingRight: () => 5,
                        paddingTop: () => 3,
                        paddingBottom: () => 3
                    },
                    margin: [0, 0, 0, 15]
                });
            }

            // Totals Section
            const totalsContent: any[] = [];

            totalsContent.push({
                columns: [
                    { width: '*', text: '' }, // Spacer
                    {
                        width: 'auto',
                        table: {
                            widths: ['auto', 100],
                            body: [
                                [
                                    { text: 'Subtotal:', alignment: 'right', fontSize: 10, bold: true },
                                    { text: `${Number(pago.total).toFixed(2)} ${currencySymbol}`, alignment: 'right', fontSize: 10 }
                                ]
                            ]
                        },
                        layout: 'noBorders'
                    }
                ],
                margin: [0, 0, 0, 2]
            });



            totalsContent.push({
                columns: [
                    { width: '*', text: '' }, // Spacer
                    {
                        width: 'auto',
                        table: {
                            widths: ['auto', 100],
                            body: [
                                [
                                    { text: 'Total Pagado:', alignment: 'right', fontSize: 11, bold: true },
                                    { text: `${Number(pago.total).toFixed(2)} ${currencySymbol}`, alignment: 'right', fontSize: 11, bold: true }
                                ]
                            ]
                        },
                        layout: 'noBorders'
                    }
                ],
                margin: [0, 5, 0, 0]
            });

            content.push({ stack: totalsContent, margin: [0, 0, 0, 20] });

            const docDefinition = {
                defaultStyle: {
                    font: 'Helvetica',
                    fontSize: 10
                },
                content: content,
                footer: (currentPage: number, pageCount: number) => {
                    const footerStack: any[] = [];

                    // Signature only on the last page
                    if (currentPage === pageCount) {
                        footerStack.push({
                            stack: [
                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#000' }] },
                                { text: 'Firma y Sello', alignment: 'center', fontSize: 12, margin: [0, 5, 0, 0] }
                            ],
                            alignment: 'center',
                            margin: [0, 0, 0, 30] // Spacing before footer line
                        });
                    }

                    // Standard Footer (Line + Date) - Removed Page Number as requested
                    footerStack.push({
                        canvas: [
                            { type: 'line', x1: 56, y1: 0, x2: 538, y2: 0, lineWidth: 0.5, lineColor: '#333333' }
                        ],
                        margin: [0, 0, 0, 10]
                    });

                    footerStack.push({
                        columns: [
                            {
                                text: '', // Empty left side
                                width: '*'
                            },
                            {
                                text: `Fecha de impresión: ${new Date().toLocaleString('es-ES')}`,
                                fontSize: 9,
                                color: '#666666',
                                alignment: 'right',
                                width: 'auto'
                            }
                        ],
                        margin: [56, 0, 42, 0]
                    });

                    return {
                        stack: footerStack
                    };
                },
                styles: {
                    tableHeader: {
                        bold: true,
                        fontSize: 10,
                        color: 'white',
                        fillColor: '#3498db'
                    }
                },
                pageSize: 'A4',
                pageMargins: [56, 56, 42, 110]
            };

            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            const chunks: any[] = [];
            pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err: any) => reject(err));
            pdfDoc.end();
        });
    }

    private formatDate(dateString: string): string {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }

    private formatFullName(person: any): string {
        if (!person) return '-';
        const parts = [
            person.paterno?.trim(),
            person.materno?.trim(),
            person.nombre?.trim()
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
    }

    private calcularEdad(fechaNacimiento: string | undefined): string {
        if (!fechaNacimiento) return 'No especificada';
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
        return `${edad} años`;
    }

    private formatGenero(genero: string | undefined): string {
        if (!genero) return 'No especificado';
        const g = genero.toLowerCase();
        if (g === 'masculino' || g === 'm') return 'Masculino';
        if (g === 'femenino' || g === 'f') return 'Femenino';
        return genero;
    }
}
