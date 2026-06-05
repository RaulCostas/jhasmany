import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { FichaMedica } from './entities/ficha_medica.entity';
import { FichaMedicaDiagnostico } from './entities/ficha_medica_diagnostico.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { Receta } from '../receta/entities/receta.entity';
import { RecetaService } from '../receta/receta.service';

@Injectable()
export class PacientesService {
    constructor(
        @InjectRepository(Paciente)
        private pacientesRepository: Repository<Paciente>,
        @InjectRepository(FichaMedica)
        private fichaRepository: Repository<FichaMedica>,
        private dataSource: DataSource,
        @Inject(forwardRef(() => RecetaService))
        private recetaService: RecetaService,
        @InjectRepository(Receta)
        private recetaRepository: Repository<Receta>,
    ) { }

    // Whitelist de campos permitidos para la entidad Paciente
    private readonly pacienteWhitelistedFields = [
        'fecha_ingreso', 'paterno', 'materno', 'nombre', 'fecha_nacimiento', 
        'genero', 'dni', 'direccion', 'ocupacion', 'telefono_celular', 
        'email', 'tutor_nombre', 'tutor_dni', 'estado', 'observaciones',
        'usuarioId', 'tiempo_residencia_lima', 'lugar_nacimiento', 'raza',
        'estado_civil', 'idioma', 'idioma_otro', 'religion', 'grado_instruccion',
        'vive_con', 'vive_con_otros', 'hora_ingreso',
        'tipo_anamnesis', 'responsable_nombre', 'responsable_telefono'
    ];

    // Whitelist de campos permitidos para la entidad FichaMedica
    private readonly fichaWhitelistedFields = [
        'motivo_consulta', 'recomendado_por',
        'ant_familiares_abuelos', 'ant_familiares_padres', 'ant_familiares_hermanos',
        'ant_pat_tratamiento_medico', 'tratamiento_medico_detalle',
        'ant_pat_hemorragias', 'ant_pat_intervencion_quirurgica',
        'ant_pat_reaccion_anestesia', 'reaccion_anestesia_detalle',
        'ant_pat_toma_medicamentos', 'medicamento_72h_detalle',
        'ant_pat_alteraciones_cicatrizacion', 'ant_pat_alergias', 'alergia_medicamento_detalle',
        'ant_pat_otros',
        'ant_no_pat_fuma', 'fuma_cantidad', 'ant_no_pat_bruxismo', 'ant_no_pat_bebe',
        'ant_no_pat_succion_digital', 'ant_no_pat_onicofagia', 'ant_no_pat_mordisqueo_objetos',
        'ant_no_pat_queilofagia', 'ant_no_pat_otros', 'particularidad',
        'usuarioId',
        // II. ENFERMEDAD ACTUAL
        'enf_actual_tiempo', 'enf_actual_te', 'enf_actual_inicio', 'enf_actual_curso', 'enf_actual_sintomas', 'enf_actual_relato',
        // III. ANTECEDENTES PERSONALES
        'rasgo_aislamiento', 'rasgo_aislamiento_detalle',
        'rasgo_pavor_nocturno', 'rasgo_pavor_nocturno_detalle',
        'rasgo_encopresis', 'rasgo_encopresis_detalle',
        'rasgo_tricotilomania', 'rasgo_tricotilomania_detalle',
        'rasgo_piromania', 'rasgo_piromania_detalle',
        'rasgo_succion_dedo', 'rasgo_succion_dedo_detalle',
        'rasgo_crueldad', 'rasgo_crueldad_detalle',
        'rasgo_tendencia_mentir', 'rasgo_tendencia_mentir_detalle',
        'rasgo_tics', 'rasgo_tics_detalle',
        'rasgo_sonambulismo', 'rasgo_sonambulismo_detalle',
        'rasgo_enuresis', 'rasgo_enuresis_detalle',
        'rasgo_somniloquia', 'rasgo_somniloquia_detalle',
        'rasgo_tartamudez', 'rasgo_tartamudez_detalle',
        'rasgo_hiperactividad', 'rasgo_hiperactividad_detalle',
        'rasgo_rabietas', 'rasgo_rabietas_detalle',
        'rasgo_pesadillas', 'rasgo_pesadillas_detalle',
        'rasgo_fobia', 'rasgo_fobia_detalle',
        'rasgo_pica', 'rasgo_pica_detalle',
        'perinatal', 'desarrollo_psicomotor', 'escolaridad', 'personalidad_previa', 'historia_laboral', 'habitos_intereses',
        'habito_tabaco_consumo', 'habito_tabaco_frecuencia', 'habito_tabaco_cantidad',
        'habito_alcohol_consumo', 'habito_alcohol_frecuencia', 'habito_alcohol_cantidad',
        'habito_drogas_consumo', 'habito_drogas_frecuencia', 'habito_drogas_cantidad',
        'habito_juegos_consumo', 'habito_juegos_frecuencia', 'habito_juegos_cantidad',
        'recreacion_vida_social', 'vida_sexual', 'estresores_psicosociales', 'antecedentes_socio_culturales', 'actitud_enfermedad',
        'antecedentes_gineco_obstetricos',
        'patologia_diabetes', 'patologia_post_parto', 'patologia_cardiovascular_hta', 'patologia_inmunodeficiencia_vih',
        'patologia_hepatica', 'patologia_renal', 'patologia_neurologica', 'patologia_metabolica', 'patologia_embarazo', 'patologia_embarazo_trimestre',
        'patologia_cancer', 'patologia_otros',
        'traumatismo_accidentes', 'alergias_ficha', 'hospitalizaciones', 'transfusiones', 'quirurgicos', 'antecedentes_psicopatologicos',
        // IV. ANTECEDENTES FAMILIARES
        'ant_fam_padre', 'ant_fam_madre', 'ant_fam_hermanos', 'ant_fam_dinamica', 'ant_fam_estructura',
        // V. ANTECEDENTES GENERALES
        'ant_generales',
        // VI. EXAMEN FISICO
        'examen_bio_apetito', 'examen_bio_sed', 'examen_bio_orina', 'examen_bio_deposiciones', 'examen_bio_sueno', 'examen_bio_alimentacion',
        'examen_vit_fc', 'examen_vit_fr', 'examen_vit_temp', 'examen_vit_sat', 'examen_vit_pa', 'examen_vit_peso', 'examen_vit_talla', 'examen_vit_imc',
        'examen_aspecto_general', 'examen_piel_faneras', 'examen_cabeza', 'examen_ojos', 'examen_nariz', 'examen_oidos', 'examen_boca', 'examen_cuello',
        'examen_torax', 'examen_cardiovascular', 'examen_abdomen', 'examen_urogenital', 'examen_extremidades_columnas', 'examen_neurologicos', 'examen_linfaticos',
        // VII. EXAMEN MENTAL
        'examen_mental_apariencia', 'examen_mental_lenguaje', 'examen_mental_afecto', 'examen_mental_pensamiento', 'examen_mental_percepcion',
        'examen_mental_cognicion_conciencia', 'examen_mental_cognicion_atencion', 'examen_mental_cognicion_memoria', 'examen_mental_cognicion_inteligencia', 'examen_mental_cognicion_juicio',
        'examen_mental_funciones_ejecutivas', 'examen_mental_conciencia_enfermedad',
        // VIII. IMPRESION DIAGNOSTICA
        'diagnosticos', 'receta'
    ];

    private splitDto(dto: any): { pacienteData: any; fichaData: any } {
        const pacienteData: any = {};
        const fichaData: any = {};
        
        for (const [key, value] of Object.entries(dto)) {
            if (key === 'usuarioId') {
                pacienteData[key] = value;
                fichaData[key] = value;
            } else if (this.pacienteWhitelistedFields.includes(key)) {
                pacienteData[key] = value;
            } else if (this.fichaWhitelistedFields.includes(key)) {
                fichaData[key] = value;
            } else {
                if (key !== 'id' && !key.startsWith('_')) {
                    console.log(`[PacientesService] Campo ignorado: ${key}`);
                }
            }
        }
        return { pacienteData, fichaData };
    }

    async create(createPacienteDto: CreatePacienteDto): Promise<Paciente> {
        const { pacienteData, fichaData } = this.splitDto(createPacienteDto);

        // --- DUPLICATE CHECK ---
        const whereConditions: any[] = [];
        
        if (pacienteData.dni) {
            whereConditions.push({ dni: pacienteData.dni });
        }

        if (pacienteData.nombre && pacienteData.paterno && pacienteData.fecha_nacimiento) {
            whereConditions.push({
                nombre: pacienteData.nombre,
                paterno: pacienteData.paterno,
                fecha_nacimiento: pacienteData.fecha_nacimiento
            });
        }

        if (whereConditions.length > 0) {
            const existing = await this.pacientesRepository.findOne({
                where: whereConditions
            });
            if (existing) {
                const dupField = existing.dni === pacienteData.dni ? `DNI: ${existing.dni}` : `Nombre y Fecha Nac.`;
                throw new BadRequestException(`Ya existe un paciente registrado con estos datos (${dupField}). Registrado como: ${existing.nombre} ${existing.paterno}`);
            }
        }
        // -----------------------

        return await this.dataSource.transaction(async (manager) => {
            const paciente = manager.create(Paciente, pacienteData);
            if (pacienteData.usuarioId) {
                paciente.usuario = { id: Number(pacienteData.usuarioId) } as any;
            }
            const savedPaciente = await manager.save(Paciente, paciente);

            const { receta, ...fichaCleanData } = fichaData;
            const ficha = manager.create(FichaMedica, {
                ...fichaCleanData,
                pacienteId: savedPaciente.id,
            });
            const savedFicha = await manager.save(FichaMedica, ficha);

            if (receta && receta.detalles && receta.detalles.length > 0) {
                const validDetalles = receta.detalles.filter((d: any) => d.medicamentoId > 0);
                if (validDetalles.length > 0) {
                    await this.recetaService.create({
                        pacienteId: savedPaciente.id,
                        userId: savedPaciente.usuarioId,
                        fecha: savedPaciente.fecha_ingreso,
                        fichaMedicaId: savedFicha.id,
                        detalles: validDetalles
                    });
                }
            }

            return (await manager.findOne(Paciente, {
                where: { id: savedPaciente.id },
                relations: [
                    'fichaClinica', 
                    'fichaClinica.diagnosticos',
                    'fichaClinica.receta',
                    'fichaClinica.receta.detalles',
                    'fichaClinica.receta.detalles.medicamento'
                ],
            }))!;
        });
    }

    async findAll(
        page: number = 1, 
        limit: number = 10, 
        search: string = '', 
        tipo?: 'particular' | 'seguro'
    ): Promise<{ data: Paciente[], total: number, page: number, limit: number, totalPages: number }> {
        const skip = (page - 1) * limit;

        const queryBuilder = this.pacientesRepository.createQueryBuilder('paciente');

        // Note: The 'pacientes' table currently only contains private patients.
        // Insurance patients are in the 'pacientes_seguro' table and handled by another module.
        // If type 'seguro' is requested here, we return an empty list to be technically correct.
        if (tipo === 'seguro') {
            queryBuilder.where('1=0'); 
        }

        if (search) {
            const searchTerm = `%${search}%`;
            queryBuilder.where(
                "(paciente.nombre ILIKE :search OR paciente.paterno ILIKE :search OR paciente.materno ILIKE :search OR CONCAT(paciente.nombre, ' ', paciente.paterno, ' ', paciente.materno) ILIKE :search OR CONCAT(paciente.paterno, ' ', paciente.materno, ' ', paciente.nombre) ILIKE :search)",
                { search: searchTerm }
            );
        }

        queryBuilder
            .orderBy('paciente.paterno', 'ASC')
            .addOrderBy('paciente.materno', 'ASC')
            .addOrderBy('paciente.nombre', 'ASC')
            .skip(skip)
            .take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number): Promise<Paciente> {
        const paciente = await this.pacientesRepository.findOne({
            where: { id },
            relations: [
                'fichaClinica', 
                'fichaClinica.diagnosticos',
                'fichaClinica.receta',
                'fichaClinica.receta.detalles',
                'fichaClinica.receta.detalles.medicamento'
            ],
        });
        if (!paciente) {
            throw new NotFoundException(`Paciente #${id} not found`);
        }
        return paciente;
    }

    async update(id: number, updatePacienteDto: UpdatePacienteDto): Promise<Paciente> {
        return await this.dataSource.transaction(async (manager) => {
            const { pacienteData, fichaData } = this.splitDto(updatePacienteDto);

            const paciente = await manager.findOne(Paciente, { where: { id } });
            if (!paciente) throw new NotFoundException(`Paciente #${id} not found`);

            manager.merge(Paciente, paciente, pacienteData);
            if (pacienteData.usuarioId) {
                paciente.usuario = { id: Number(pacienteData.usuarioId) } as any;
            }
            await manager.save(Paciente, paciente);

            const { receta, ...fichaCleanData } = fichaData;

            // Update or create ficha
            if (Object.keys(fichaCleanData).length > 0 || receta !== undefined) {
                let ficha = await manager.findOne(FichaMedica, { where: { pacienteId: id } });
                if (ficha) {
                    if (fichaCleanData.diagnosticos) {
                        await manager.delete(FichaMedicaDiagnostico, { fichaMedicaId: ficha.id });
                    }
                    manager.merge(FichaMedica, ficha, fichaCleanData);
                    await manager.save(FichaMedica, ficha);
                } else {
                    const newFicha = manager.create(FichaMedica, { ...fichaCleanData, pacienteId: id });
                    ficha = await manager.save(FichaMedica, newFicha);
                }

                if (receta) {
                    const existingReceta = await this.recetaRepository.findOne({
                        where: { fichaMedicaId: ficha.id }
                    });

                    const validDetalles = receta.detalles ? receta.detalles.filter((d: any) => d.medicamentoId > 0) : [];

                    if (validDetalles.length > 0) {
                        const recetaPayload = {
                            detalles: validDetalles,
                            pacienteId: id,
                            userId: paciente.usuarioId || updatePacienteDto.usuarioId,
                            fecha: paciente.fecha_ingreso,
                            fichaMedicaId: ficha.id
                        };

                        if (existingReceta) {
                            await this.recetaService.update(existingReceta.id, recetaPayload);
                        } else {
                            await this.recetaService.create(recetaPayload);
                        }
                    } else if (existingReceta) {
                        // If they cleared all medicines, delete the prescription
                        await this.recetaService.remove(existingReceta.id);
                    }
                }
            }

            return (await manager.findOne(Paciente, {
                where: { id },
                relations: [
                    'fichaClinica', 
                    'fichaClinica.diagnosticos',
                    'fichaClinica.receta',
                    'fichaClinica.receta.detalles',
                    'fichaClinica.receta.detalles.medicamento'
                ],
            }))!;
        });
    }

    async remove(id: number): Promise<void> {
        await this.pacientesRepository.delete(id);
    }

    async getDashboardStats(): Promise<{ totalPacientes: number, totalPacientesSeguro: number, birthdayPacientes: Paciente[] }> {
        const totalPacientes = await this.pacientesRepository.count({ where: { estado: 'activo' } });
        const totalPacientesSeguro = 0;

        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        const birthdayPacientes = await this.pacientesRepository
            .createQueryBuilder('paciente')
            .where('EXTRACT(MONTH FROM paciente.fecha_nacimiento) = :month', { month })
            .andWhere('EXTRACT(DAY FROM paciente.fecha_nacimiento) = :day', { day })
            .andWhere('paciente.estado = :estado', { estado: 'activo' })
            .getMany();

        return { totalPacientes, totalPacientesSeguro, birthdayPacientes };
    }

    async findByCelular(celular: string): Promise<Paciente | null> {
        let paciente = await this.pacientesRepository.findOne({
            where: { telefono_celular: celular },
        });
        if (paciente) return paciente;

        const cleanCelular = celular.replace(/[^0-9]/g, '');
        if (!cleanCelular || cleanCelular.length < 7) return null;

        try {
            paciente = await this.pacientesRepository.createQueryBuilder('p')
                .where("REGEXP_REPLACE(p.telefono_celular, '[^0-9]', '', 'g') LIKE :suffix", { suffix: `%${cleanCelular}` })
                .orWhere(":cleanCelular LIKE CONCAT('%', REGEXP_REPLACE(p.telefono_celular, '[^0-9]', '', 'g'))", { cleanCelular })
                .getOne();
        } catch (e) {
            console.error('Error in fuzzy search:', e);
        }

        return paciente || null;
    }


    async findNoRegistrados() {
        const today = new Date().toISOString().split('T')[0];
        const query = `
            SELECT 
                p.id as "pacienteId",
                p.nombre, p.paterno, p.materno,
                a.fecha, a.hora,
                'particular' as tipo,
                NULL as "seguroColor"
            FROM agenda a
            JOIN pacientes p ON p.id = a."pacienteId"
            WHERE a.fecha <= '${today}' 
              AND LOWER(a.estado) = 'atendido'
              AND NOT EXISTS (
                  SELECT 1 
                  FROM historia_clinica hc 
                  WHERE hc."pacienteId" = a."pacienteId" 
                    AND hc.fecha = a.fecha
              )
            ORDER BY fecha DESC
        `;
        return await this.pacientesRepository.query(query);
    }

    async getStatistics(year: number): Promise<any[]> {
        const rawParticular = await this.pacientesRepository.createQueryBuilder('p')
            .select('EXTRACT(MONTH FROM p.fecha_ingreso)', 'month')
            .addSelect('COUNT(p.id)', 'count')
            .where('EXTRACT(YEAR FROM p.fecha_ingreso) = :year', { year })
            .groupBy('EXTRACT(MONTH FROM p.fecha_ingreso)')
            .getRawMany();

        const rawSeguro: any[] = [];

        const monthlyStats = Array.from({ length: 12 }, (_, i) => ({ 
            month: i + 1, 
            countParticular: 0,
            countSeguro: 0,
            count: 0 
        }));

        rawParticular.forEach(r => {
            const mIndex = parseInt(r.month) - 1;
            if (mIndex >= 0 && mIndex < 12) {
                const count = parseInt(r.count);
                monthlyStats[mIndex].countParticular = count;
                monthlyStats[mIndex].count += count;
            }
        });

        rawSeguro.forEach(r => {
            const mIndex = parseInt(r.month) - 1;
            if (mIndex >= 0 && mIndex < 12) {
                const count = parseInt(r.count);
                monthlyStats[mIndex].countSeguro = count;
                monthlyStats[mIndex].count += count;
            }
        });

        return monthlyStats;
    }
}
