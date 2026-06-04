import { IsNotEmpty, IsOptional, IsNumber, IsString, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHistoriaClinicaDiagnosticoDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsNotEmpty()
    @IsString()
    diagnostico: string;

    @IsNotEmpty()
    @IsString()
    tipo: string; // 'Definitivo' | 'Repetitivo' | 'Presuntivo'
}

export class CreateRecetaDetalleDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsNotEmpty()
    @IsNumber()
    medicamentoId: number;

    @IsNotEmpty()
    @IsString()
    tiempo: string;

    @IsNotEmpty()
    @IsString()
    via: string;

    @IsNotEmpty()
    @IsString()
    posologia: string;

    @IsNotEmpty()
    @IsString()
    cantidad: string;
}

export class CreateRecetaDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateRecetaDetalleDto)
    detalles?: CreateRecetaDetalleDto[];
}

export class CreateHistoriaClinicaDto {
    @IsNotEmpty()
    @IsNumber()
    pacienteId: number;

    @IsNotEmpty()
    @IsDateString()
    fecha: string;

    @IsNotEmpty()
    @IsString()
    modalidad: string; // 'Presencial' | 'Virtual'

    @IsNotEmpty()
    @IsString()
    servicio: string; // 'Psiquiatria' | 'Neuropsiquiatria' | 'Psicologia'

    @IsOptional()
    @IsString()
    motivo_visita?: string;

    @IsOptional()
    @IsString()
    examen_fisico?: string;

    @IsOptional()
    @IsString()
    examen_mental?: string;

    @IsOptional()
    @IsString()
    examenes_auxiliares?: string;

    @IsOptional()
    @IsString()
    plan_trabajo?: string;

    @IsOptional()
    @IsString()
    derivar_consulta?: string; // 'SI' | 'NO'

    @IsOptional()
    @IsString()
    derivar_consulta_detalle?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateHistoriaClinicaDiagnosticoDto)
    diagnosticos?: CreateHistoriaClinicaDiagnosticoDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateRecetaDto)
    receta?: CreateRecetaDto;

    @IsOptional()
    @IsNumber()
    usuarioId?: number;
}
