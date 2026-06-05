import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { PacienteTest } from './entities/paciente-test.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { ChatbotService } from '../chatbot/chatbot.service';

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
    ) {}

    // 1. Create and send a new test (generates a secure token)
    async create(pacienteId: number, doctorId?: number, nombreTest: string = 'Escala de Autoestima de Rosenberg'): Promise<PacienteTest> {
        const paciente = await this.pacienteRepository.findOneBy({ id: pacienteId });
        if (!paciente) {
            throw new NotFoundException('Paciente no encontrado');
        }

        const token = crypto.randomBytes(16).toString('hex');
        
        const test = this.testRepository.create({
            pacienteId,
            doctorId: doctorId || null,
            nombreTest,
            token,
            estado: 'enviado',
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

        const link = `${frontendUrl}/test-publico/${test.token}`;
        const message = `Estimado(a) *${test.paciente.nombre} ${test.paciente.paterno}*, el Dr. *${doctor.nombre} ${doctor.paterno}* le ha enviado la *Escala de Autoestima de Rosenberg* para que la complete de forma remota.\n\nPor favor, haga clic en el siguiente enlace para realizar el test:\n🔗 ${link}\n\nGracias por su colaboración.`;

        await this.chatbotService.sendMessage(jid, message);

        return {
            success: true,
            message: 'Enlace de test enviado por WhatsApp exitosamente'
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

        // Return only non-sensitive data
        return {
            id: test.id,
            nombreTest: test.nombreTest,
            estado: test.estado,
            fechaEnvio: test.fechaEnvio,
            fechaCompletado: test.fechaCompletado,
            puntaje: test.puntaje,
            resultado: test.resultado,
            pacienteName: `${test.paciente.nombre || ''} ${test.paciente.paterno || ''} ${test.paciente.materno || ''}`.trim(),
        };
    }

    // 4. Submit answers, calculate score and update database record
    async submitAnswers(token: string, respuestas: Record<number, number>) {
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

                        const patientName = `${test.paciente.nombre || ''} ${test.paciente.paterno || ''} ${test.paciente.materno || ''}`.trim();
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

    // 5. Delete a test (only if not completed)
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
