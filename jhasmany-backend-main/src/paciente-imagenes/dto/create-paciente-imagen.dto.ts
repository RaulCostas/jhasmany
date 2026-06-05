import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePacienteImagenDto {
    @IsInt()
    @IsNotEmpty()
    pacienteId: number;

    @IsString()
    @IsNotEmpty()
    imageData: string; // base64 data URI

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsString()
    @IsOptional()
    tipo?: string; // 'imagen' | 'documento'
}
