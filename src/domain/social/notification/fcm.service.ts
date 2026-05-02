import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FCMService implements OnModuleInit {
    private readonly logger = new Logger(FCMService.name);

    constructor(private config: ConfigService) {}

    onModuleInit() {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: this.config.get<string>('FCM_PROJECT_ID'),
                    clientEmail: this.config.get<string>('FCM_CLIENT_EMAIL'),
                    privateKey: this.config
                        .get<string>('FCM_PRIVATE_KEY')!
                        .replace(/\\n/g, '\n'),
                }),
            });
        }
    }

    async sendToToken(
        token: string,
        title: string,
        body: string,
        data?: Record<string, string>,
    ): Promise<void> {
        try {
            await admin.messaging().send({
                token,
                notification: { title, body },
                data,
            });
        } catch (error) {
            this.logger.warn(
                `FCM delivery failed for token ${token}: ${error}`,
            );
        }
    }
}
