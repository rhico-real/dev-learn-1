import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_NAMES } from '../queue.constants';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';

type RegistrationJobData = {
    type: 'APPROVE' | 'REJECT';
    registrationId: string;
    rejectionCount: number;
};

@Injectable()
@Processor(QUEUE_NAMES.REGISTRATION)
export class RegistrationProcessor extends WorkerHost {
    private readonly logger = new Logger(RegistrationProcessor.name);

    constructor(
        private prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    async handleRejectRegistration(
        registrationId: string,
        rejectionCount: number,
    ) {
        if (
            rejectionCount >=
            this.configService.get<number>('MAX_PAYMENT_ATTEMPTS', 3)
        ) {
            await this.prisma.registration.update({
                where: { id: registrationId },
                data: { status: 'CANCELLED' },
            });

            return;
        }
    }

    async handleApproveRegistration(registrationId: string) {
        await this.prisma.registration.update({
            where: { id: registrationId },
            data: { status: 'CONFIRMED' },
        });

        return;
    }

    async process(job: Job<RegistrationJobData>): Promise<void> {
        const { type, registrationId, rejectionCount } = job.data;

        this.logger.log(`Confirming registration ${registrationId}`);

        if (type === 'APPROVE') {
            await this.handleApproveRegistration(registrationId);
        }

        if (type === 'REJECT') {
            await this.handleRejectRegistration(registrationId, rejectionCount);
        }
    }
}
