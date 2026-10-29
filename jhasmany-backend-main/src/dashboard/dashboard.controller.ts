import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Req() req: any) {
    const usuarioId = req.user.id;
    return this.dashboardService.getSummary(usuarioId);
  }

  @Get('atendidos-ayer')
  async getAtendidosAyer(@Query('fecha') fecha?: string) {
    return this.dashboardService.getAtendidosAyer(fecha);
  }
}
