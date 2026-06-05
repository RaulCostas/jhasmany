import { IsString, IsInt, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateFirmaDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['historia_clinica', 'receta', 'paciente', 'usuario'])
    tipoDocumento: string;

    @IsInt()
    @IsNotEmpty()
    documentoId: number;

    @IsString()
    @IsNotEmpty()
    @IsIn(['dibujada', 'imagen'])
    tipoFirma: string;

    @IsString()
    @IsNotEmpty()
    firmaData: string; // Base64 encoded image

    @IsString()
    @IsNotEmpty()
    @IsIn(['paciente', 'doctor', 'personal', 'administrador'])
    rolFirmante: string;

    @IsString()
    @IsOptional()
    hashDocumento?: string;

    @IsString()
    @IsOptional()
    ipAddress?: string;

    @IsString()
    @IsOptional()
    userAgent?: string;

    @IsInt()
    @IsOptional()
    usuarioId?: number;

    @IsString()
    @IsOptional()
    observaciones?: string;
}
