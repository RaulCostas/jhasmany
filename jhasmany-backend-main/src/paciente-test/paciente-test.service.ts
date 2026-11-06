import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { PacienteTest } from './entities/paciente-test.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { ChatbotService } from '../chatbot/chatbot.service';
import { PacientesService } from '../pacientes/pacientes.service';

@Injectable()
export class PacienteTestService {
    constructor(
        @InjectRepository(PacienteTest)
        private readonly testRepository: Repository<PacienteTest>,
        @InjectRepository(Paciente)
        private readonly pacienteRepository: Repository<Paciente>,
        @InjectRepository(Doctor)
        private readonly doctorRepository: Repository<Doctor>,
        @Inject(forwardRef(() => ChatbotService))
        private readonly chatbotService: ChatbotService,
        @Inject(forwardRef(() => PacientesService))
        private readonly pacientesService: PacientesService,
    ) {}

    // 1. Create and send a new test (generates a secure token)
    async create(pacienteId: number, doctorId?: number, nombreTest: string = 'Escala de Autoestima de Rosenberg'): Promise<PacienteTest> {
        const paciente = await this.pacienteRepository.findOneBy({ id: pacienteId });
        if (!paciente) {
            throw new NotFoundException('Paciente no encontrado');
        }

        let targetDoctorId = doctorId;
        if (!targetDoctorId) {
            const defaultDoctor = await this.doctorRepository.findOne({
                where: { estado: 'activo' },
                order: { id: 'ASC' }
            });
            if (defaultDoctor) {
                targetDoctorId = defaultDoctor.id;
            }
        }

        const token = crypto.randomBytes(16).toString('hex');
        
        const test = this.testRepository.create({
            pacienteId,
            doctorId: targetDoctorId || null,
            nombreTest,
            token,
            estado: 'enviado',
            fechaEnvio: new Date(),
        });

        return this.testRepository.save(test);
    }

    // 1.1 Create test for an unregistered / guest participant
    async createInvitadoPublic(dto: {
        nombre: string;
        paterno: string;
        materno?: string;
        celular?: string;
        doctorId?: number;
        nombreTest?: string;
    }): Promise<PacienteTest> {
        if (!dto.nombre || !dto.paterno) {
            throw new BadRequestException('El nombre y apellido paterno son requeridos.');
        }

        let targetDoctorId = dto.doctorId;
        if (!targetDoctorId) {
            const defaultDoctor = await this.doctorRepository.findOne({
                where: { estado: 'activo' },
                order: { id: 'ASC' }
            });
            if (defaultDoctor) {
                targetDoctorId = defaultDoctor.id;
            }
        }

        const token = crypto.randomBytes(16).toString('hex');

        const test = this.testRepository.create({
            pacienteId: null,
            doctorId: targetDoctorId || null,
            nombreTest: dto.nombreTest || 'Explorando Valores',
            token,
            estado: 'enviado',
            fechaEnvio: new Date(),
            esInvitado: true,
            invitadoNombre: dto.nombre.trim(),
            invitadoPaterno: dto.paterno.trim(),
            invitadoMaterno: (dto.materno || '').trim() || null,
            invitadoCelular: (dto.celular || '').trim() || null,
        });

        return this.testRepository.save(test);
    }

    // Send test link via WhatsApp
    async sendWhatsApp(testId: number, doctorId: number, frontendUrl: string) {
        const test = await this.testRepository.findOne({
            where: { id: testId },
            relations: ['paciente'],
        });

        if (!test) {
            throw new NotFoundException('Test no encontrado');
        }

        if (!test.paciente) {
            throw new NotFoundException('Paciente no encontrado');
        }

        if (!test.paciente.telefono_celular) {
            throw new BadRequestException('El paciente no tiene un número de celular registrado.');
        }

        const doctor = await this.doctorRepository.findOneBy({ id: doctorId });
        if (!doctor) {
            throw new NotFoundException('Doctor no encontrado');
        }

        // Associate doctor with this test
        test.doctorId = doctorId;
        await this.testRepository.save(test);

        const chatbotStatus = this.chatbotService.getStatus();
        if (chatbotStatus.status !== 'connected') {
            throw new BadRequestException('El chatbot no está conectado. Por favor, conecte el chatbot primero.');
        }

        let phone = test.paciente.telefono_celular.replace(/\D/g, '');
        if (phone.length === 9) {
            phone = '51' + phone;
        }
        const jid = phone + '@s.whatsapp.net';

        const isValores = test.nombreTest?.toLowerCase().includes('valores');
        const link = isValores
            ? `${frontendUrl}/juego-valores/${test.token}`
            : `${frontendUrl}/test-publico/${test.token}`;

        const message = isValores
            ? `Estimado(a) *${test.paciente.nombre} ${test.paciente.paterno}*, el Dr. *${doctor.nombre} ${doctor.paterno}* le ha enviado la dinámica interactiva *Explorando Valores* para que la realice desde su celular o computadora.\n\nPor favor, haga clic en el siguiente enlace para comenzar la actividad:\n🔗 ${link}\n\n¡Esperamos que disfrute la experiencia!`
            : `Estimado(a) *${test.paciente.nombre} ${test.paciente.paterno}*, el Dr. *${doctor.nombre} ${doctor.paterno}* le ha enviado la *${test.nombreTest || 'Escala de Autoestima de Rosenberg'}* para que la complete de forma remota.\n\nPor favor, haga clic en el siguiente enlace para realizar el test:\n🔗 ${link}\n\nGracias por su colaboración.`;

        await this.chatbotService.sendMessage(jid, message);

        return {
            success: true,
            message: 'Enlace enviado por WhatsApp exitosamente'
        };
    }

    // 2. Find all tests for a specific patient
    async findByPaciente(pacienteId: number): Promise<PacienteTest[]> {
        return this.testRepository.find({
            where: { pacienteId },
            relations: ['doctor'],
            order: { fechaEnvio: 'DESC' },
        });
    }

    // 3. Find test by public token (without leaking other patient data)
    async findByTokenPublic(token: string) {
        const test = await this.testRepository.findOne({
            where: { token },
            relations: ['paciente'],
        });

        if (!test) {
            throw new NotFoundException('Test no encontrado');
        }

        const pacienteName = test.paciente
            ? `${test.paciente.nombre || ''} ${test.paciente.paterno || ''} ${test.paciente.materno || ''}`.trim()
            : `${test.invitadoNombre || ''} ${test.invitadoPaterno || ''} ${test.invitadoMaterno || ''}`.trim() || 'Participante Invitado';

        // Return only non-sensitive data
        return {
            id: test.id,
            nombreTest: test.nombreTest,
            estado: test.estado,
            fechaEnvio: test.fechaEnvio,
            fechaCompletado: test.fechaCompletado,
            puntaje: test.puntaje,
            resultado: test.resultado,
            pacienteName,
            esInvitado: test.esInvitado,
        };
    }

    // 4. Submit answers, calculate score and update database record
    async submitAnswers(token: string, respuestas: any) {
        const test = await this.testRepository.findOne({
            where: { token },
            relations: ['paciente'],
        });

        if (!test) {
            throw new NotFoundException('Test no encontrado');
        }

        if (test.estado === 'completado') {
            throw new BadRequestException('Este test ya ha sido completado y enviado anteriormente.');
        }

        // If it is Explorando Valores, handle via submitValores
        if (test.nombreTest?.toLowerCase().includes('valores')) {
            return this.submitValores(token, respuestas);
        }

        // Verify that all 10 questions are answered with valid options (1, 2, 3, or 4)
        for (let i = 1; i <= 10; i++) {
            const ans = respuestas[i];
            if (ans === undefined || ans < 1 || ans > 4) {
                throw new BadRequestException(`La respuesta para la pregunta ${i} es inválida o no fue respondida.`);
            }
        }

        // Calculate Rosenberg Score (0 - 30 points)
        // Positive questions (1, 3, 4, 6, 7): Selection - 1
        // Negative/Reverse questions (2, 5, 8, 9, 10): 4 - Selection
        const positiveQuestions = [1, 3, 4, 6, 7];
        const negativeQuestions = [2, 5, 8, 9, 10];
        
        let totalScore = 0;

        positiveQuestions.forEach(q => {
            const selection = respuestas[q];
            totalScore += (selection - 1);
        });

        negativeQuestions.forEach(q => {
            const selection = respuestas[q];
            totalScore += (4 - selection);
        });

        // Determine Rosenberg Interpretation
        let interpretation = '';
        if (totalScore === 30) {
            interpretation = 'Autoestima alta (puntuación máxima).';
        } else if (totalScore >= 25 && totalScore <= 29) {
            interpretation = 'Autoestima normal/media. Tienes una valoración equilibrada de ti mismo.';
        } else if (totalScore >= 15 && totalScore <= 24) {
            interpretation = 'Autoestima media. Consideras que vales, aunque tienes altibajos o momentos de inseguridad.';
        } else {
            interpretation = 'Autoestima baja. Presentas problemas significativos de autovaloración y confianza en tus capacidades.';
        }

        test.estado = 'completado';
        test.fechaCompletado = new Date();
        test.respuestas = respuestas;
        test.puntaje = totalScore;
        test.resultado = interpretation;

        if (!test.doctorId) {
            const defaultDoctor = await this.doctorRepository.findOne({
                where: { estado: 'activo' },
                order: { id: 'ASC' }
            });
            if (defaultDoctor) {
                test.doctorId = defaultDoctor.id;
            }
        }

        const savedTest = await this.testRepository.save(test);

        // Notify Doctor via WhatsApp if associated
        if (savedTest.doctorId) {
            try {
                const doctor = await this.doctorRepository.findOneBy({ id: savedTest.doctorId });
                if (doctor && doctor.celular) {
                    const chatbotStatus = this.chatbotService.getStatus();
                    if (chatbotStatus.status === 'connected') {
                        let docPhone = doctor.celular.replace(/\D/g, '');
                        if (docPhone.length === 9) {
                            docPhone = '51' + docPhone;
                        }
                        const docJid = docPhone + '@s.whatsapp.net';

                        const patientName = test.paciente
                            ? `${test.paciente.nombre || ''} ${test.paciente.paterno || ''} ${test.paciente.materno || ''}`.trim()
                            : `${test.invitadoNombre || ''} ${test.invitadoPaterno || ''} ${test.invitadoMaterno || ''}`.trim() || 'Invitado(a)';
                        const docMessage = `🔔 *Notificación de Test Completado*\n\nEl paciente *${patientName}* ha completado el test *${savedTest.nombreTest}*.\n\n*Resultado:* ${savedTest.resultado}\n*Puntaje:* ${savedTest.puntaje} / 30 pts.`;

                        await this.chatbotService.sendMessage(docJid, docMessage);
                        console.log(`[Chatbot] [PacienteTest] Notified Doctor ${doctor.id} about test completed by patient ${test.pacienteId}`);
                    }
                }
            } catch (err) {
                console.error('[PacienteTest] Error notifying doctor via WhatsApp:', err);
            }
        }

        return {
            success: true,
            score: savedTest.puntaje,
            result: savedTest.resultado,
            fechaCompletado: savedTest.fechaCompletado,
        };
    }

    // 4.1 Submit Explorando Valores game
    async submitValores(
        token: string,
        data: {
            ronda1?: { muyImportante: number[]; importante: number[]; menosImportante: number[] };
            ronda2_top10?: number[];
            ronda3_top3?: number[];
            top3_nombres?: string[];
            reflexiones?: Record<string, string>;
        }
    ) {
        const test = await this.testRepository.findOne({
            where: { token },
            relations: ['paciente'],
        });

        if (!test) {
            throw new NotFoundException('Dinámica no encontrada');
        }

        if (test.estado === 'completado') {
            throw new BadRequestException('Esta dinámica ya ha sido completada y enviada anteriormente.');
        }

        if (!data.ronda3_top3 || data.ronda3_top3.length === 0) {
            throw new BadRequestException('Debe seleccionar sus 3 valores principales.');
        }

        const top3Formatted = (data.top3_nombres && data.top3_nombres.length > 0)
            ? data.top3_nombres.join(' • ')
            : `Tarjetas: ${data.ronda3_top3.join(', ')}`;

        test.estado = 'completado';
        test.fechaCompletado = new Date();
        test.respuestas = data;
        test.puntaje = 3;
        test.resultado = `Top 3 Valores: ${top3Formatted}`;

        if (!test.doctorId) {
            const defaultDoctor = await this.doctorRepository.findOne({
                where: { estado: 'activo' },
                order: { id: 'ASC' }
            });
            if (defaultDoctor) {
                test.doctorId = defaultDoctor.id;
            }
        }

        const savedTest = await this.testRepository.save(test);

        // Notify Doctor via WhatsApp if associated
        if (savedTest.doctorId) {
            try {
                const doctor = await this.doctorRepository.findOneBy({ id: savedTest.doctorId });
                if (doctor && doctor.celular) {
                    const chatbotStatus = this.chatbotService.getStatus();
                    if (chatbotStatus.status === 'connected') {
                        let docPhone = doctor.celular.replace(/\D/g, '');
                        if (docPhone.length === 9) {
                            docPhone = '51' + docPhone;
                        }
                        const docJid = docPhone + '@s.whatsapp.net';
                        const patientName = test.paciente
                            ? `${test.paciente.nombre || ''} ${test.paciente.paterno || ''} ${test.paciente.materno || ''}`.trim()
                            : `${test.invitadoNombre || ''} ${test.invitadoPaterno || ''} ${test.invitadoMaterno || ''}`.trim() || 'Invitado(a)';
                        const docMessage = `🔔 *Dinámica Completada: Explorando Valores*\n\nEl paciente *${patientName}* ha finalizado la dinámica *Explorando Valores*.\n\n*Sus 3 Valores Principales son:*\n⭐ ${top3Formatted}`;

                        await this.chatbotService.sendMessage(docJid, docMessage);
                        console.log(`[Chatbot] [PacienteTest] Notified Doctor ${doctor.id} about Explorando Valores completed by patient ${test.pacienteId}`);
                    }
                }
            } catch (err) {
                console.error('[PacienteTest] Error notifying doctor via WhatsApp:', err);
            }
        }

        return {
            success: true,
            score: savedTest.puntaje,
            result: savedTest.resultado,
            fechaCompletado: savedTest.fechaCompletado,
        };
    }

    // 5. Find all tests for guests / unregistered participants
    async findAllInvitados(): Promise<PacienteTest[]> {
        return this.testRepository.find({
            where: [
                { esInvitado: true },
                { pacienteId: IsNull() },
            ],
            relations: ['doctor', 'paciente'],
            order: { fechaEnvio: 'DESC' },
        });
    }

    // 6. Link / convert guest test to a registered patient (either create new patient or link to existing)
    async vincularPaciente(
        testId: number,
        data: {
            pacienteId?: number;
            crearNuevo?: boolean;
            nombre?: string;
            paterno?: string;
            materno?: string;
            telefono_celular?: string;
            dni?: string;
            usuarioId?: number;
        }
    ) {
        const test = await this.testRepository.findOne({
            where: { id: testId },
            relations: ['paciente', 'doctor'],
        });

        if (!test) {
            throw new NotFoundException('Test no encontrado');
        }

        let pacienteDestino: Paciente;

        if (data.crearNuevo) {
            const nombre = (data.nombre || test.invitadoNombre || '').trim();
            const paterno = (data.paterno || test.invitadoPaterno || '').trim();
            const materno = (data.materno || test.invitadoMaterno || '').trim();
            const celular = (data.telefono_celular || test.invitadoCelular || '').trim();

            if (!nombre || !paterno) {
                throw new BadRequestException('El nombre y apellido paterno son obligatorios para registrar al paciente.');
            }

            const now = new Date();
            const fechaIngreso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const horaIngreso = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            pacienteDestino = await this.pacientesService.create({
                nombre,
                paterno,
                materno: materno || '',
                telefono_celular: celular || '',
                dni: data.dni ? data.dni.trim() : '',
                fecha_ingreso: fechaIngreso,
                hora_ingreso: horaIngreso,
                estado: 'Activo',
                usuarioId: data.usuarioId ? Number(data.usuarioId) : undefined,
            } as any);
        } else if (data.pacienteId) {
            const pac = await this.pacienteRepository.findOneBy({ id: Number(data.pacienteId) });
            if (!pac) {
                throw new NotFoundException('Paciente a vincular no encontrado.');
            }
            pacienteDestino = pac;
        } else {
            throw new BadRequestException('Debe seleccionar un paciente existente o indicar crear uno nuevo.');
        }

        test.pacienteId = pacienteDestino.id;
        test.paciente = pacienteDestino;
        test.esInvitado = false;
        if (!test.doctorId) {
            const defaultDoctor = await this.doctorRepository.findOne({
                where: { estado: 'activo' },
                order: { id: 'ASC' }
            });
            if (defaultDoctor) {
                test.doctorId = defaultDoctor.id;
            }
        }
        const updatedTest = await this.testRepository.save(test);

        return {
            success: true,
            message: 'Dinámica vinculada exitosamente al historial del paciente',
            paciente: pacienteDestino,
            test: updatedTest,
        };
    }

    // 7. Delete a test (only if not completed)
    async remove(id: number): Promise<{ success: boolean; message: string }> {
        const test = await this.testRepository.findOneBy({ id });
        if (!test) {
            throw new NotFoundException('Test no encontrado');
        }
        if (test.estado === 'completado') {
            throw new BadRequestException('No se puede eliminar un test que ya ha sido completado.');
        }
        await this.testRepository.remove(test);
        return { success: true, message: 'Test eliminado correctamente' };
    }
}
