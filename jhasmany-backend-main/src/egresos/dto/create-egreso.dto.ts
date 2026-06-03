import { IsString, IsNumber, IsDateString, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEgresoDto {
    @IsDateString()
    @IsNotEmpty()
    fecha: Date;



    @IsString()
    @IsNotEmpty()
    detalle: string;

    @IsNumber()
    @IsNotEmpty()
    monto: number;

    @IsString()
    @IsNotEmpty()
    @IsIn(['Soles', 'Dólares'])
    moneda: string;

    @IsNumber()
    @IsNotEmpty()
    formaPagoId: number;

    
}
