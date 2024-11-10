import { Injectable } from '@nestjs/common';
import { PrismaService } from './prismaService';
import * as ExcelJS from 'exceljs';

interface GenerateReportParams {
  projectId?: string;
  startDate: Date;
  endDate: Date;
  type: 'csv' | 'xlsx';
}

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReport(params: GenerateReportParams): Promise<Buffer> {
    const { projectId, startDate, endDate, type } = params;

    const workEntries = await this.prisma.workEntry.findMany({
      where: {
        projectId: projectId || undefined,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        project: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Time Report");

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Project', key: 'project', width: 20 },
      { header: 'Start Time', key: 'startTime', width: 12 },
      { header: 'End Time', key: 'endTime', width: 12 },
      { header: 'Duration (hours)', key: 'duration', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    workEntries.forEach((entry) => {
      const startTime = new Date(entry.startTime);
      const endTime = new Date(entry.endTime);
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      worksheet.addRow({
        date: startTime.toLocaleDateString(),
        project: entry.project.name,
        startTime: startTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        endTime: endTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        duration: duration.toFixed(2),
      });
    });

    const totalRow = worksheet.addRow({
      date: 'Total',
      project: '',
      startTime: '',
      endTime: '',
      duration: workEntries.reduce((acc, entry) => {
        const duration = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
        return acc + duration;
      }, 0).toFixed(2),
    });
    totalRow.font = { bold: true };

    if (type === "csv") {
      return Buffer.from(await workbook.csv.writeBuffer());
    } else {
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }
  }
}