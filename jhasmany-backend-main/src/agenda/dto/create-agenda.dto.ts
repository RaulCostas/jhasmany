import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateAgendaDto {
    @IsNotEmpty()
    @IsDateString()
    fecha: string;

    @IsNotEmpty()
    @IsString()
    hora: string;

    @IsNotEmpty()
    @IsNumber()
    duracion: number;

    @IsOptional()
    @IsNumber()
    pacienteId?: number;

    @IsNotEmpty()
    @IsNumber()
    doctorId: number;

    @IsNotEmpty()
    @IsNumber()
    usuarioId: number;

    @IsOptional()
    @IsString()
    estado?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsOptional()
    @IsString()
    motivoCancelacion?: string;

    
}
