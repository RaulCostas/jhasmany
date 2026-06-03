import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { PacienteTest } from './entities/paciente-test.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';

@Injectable()
export class PacienteTestService {
    constructor(
        @InjectRepository(PacienteTest)
        private readonly testRepository: Repository<PacienteTest>,
        @InjectRepository(Paciente)
        private readonly pacienteRepository: Repository<Paciente>,
    ) {}

    // 1. Create and send a new test (generates a secure token)
    async create(pacienteId: number, nombreTest: string = 'Escala de Autoestima de Rosenberg'): Promise<PacienteTest> {
        const paciente = await this.pacienteRepository.findOneBy({ id: pacienteId });
        if (!paciente) {
            throw new NotFoundException('Paciente no encontrado');
        }

        const token = crypto.randomBytes(16).toString('hex');
        
        const test = this.testRepository.create({
            pacienteId,
            nombreTest,
            token,
            estado: 'enviado',
        });

        return this.testRepository.save(test);
    }

    // 2. Find all tests for a specific patient
    async findByPaciente(pacienteId: number): Promise<PacienteTest[]> {
        return this.testRepository.find({
            where: { pacienteId },
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

        return {
            success: true,
            score: savedTest.puntaje,
            result: savedTest.resultado,
            fechaCompletado: savedTest.fechaCompletado,
        };
    }
}
