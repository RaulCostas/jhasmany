import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilidadesService } from './utilidades.service';
import { UtilidadesController } from './utilidades.controller';

// Entities for Income
import { Pago } from '../pagos/entities/pago.entity';

// Entities for Expenses
import { Egreso } from '../egresos/entities/egreso.entity';
import { PagosGastosFijos } from '../pagos_gastos_fijos/entities/pagos_gastos_fijos.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Pago,
            Egreso,
            PagosGastosFijos
        ])
    ],
    controllers: [UtilidadesController],
    providers: [UtilidadesService],
})
export class UtilidadesModule { }
