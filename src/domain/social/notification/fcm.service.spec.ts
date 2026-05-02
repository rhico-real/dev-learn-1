import { Test, TestingModule } from '@nestjs/testing';
import { FCMService } from './fcm.service';
import { ConfigService } from '@nestjs/config';

describe('FCM Service', () => {
    let service: FCMService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FCMService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const map: Record<string, string> = {
                                FCM_PROJECT_ID: 'test-project',
                                FCM_CLIENT_EMAIL:
                                    'test@test.iam.gserviceaccount.com',
                                FCM_PRIVATE_KEY: 'test-private-key',
                            };

                            return map[key];
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<FCMService>(FCMService);
    });

    it('is defined', async () => {
        expect(service).toBeDefined();
    });
});
