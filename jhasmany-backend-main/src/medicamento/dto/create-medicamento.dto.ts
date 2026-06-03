import { IsString, IsOptional } from 'class-validator';

export class CreateMedicamentoDto {
    @IsString()
    medicamento: string;

    @IsString()
    @IsOptional()
    estado?: string;
}
