import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from '../services/reportService';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate')
  async generateReport(
    @Body() params: {
      projectId?: string;
      startDate: string;
      endDate: string;
      type: 'csv' | 'xlsx';
    },
    @Res() res: Response,
  ) {
    const buffer = await this.reportService.generateReport({
      ...params,
      startDate: new Date(params.startDate),
      endDate: new Date(params.endDate),
    });

    const filename = `time_report_${new Date().toISOString().split('T')[0]}`;
    const extension = params.type === 'csv' ? 'csv' : 'xlsx';

    res.setHeader(
      'Content-Type',
      params.type === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filename}.${extension}`,
    );

    res.send(buffer);
  }
} 