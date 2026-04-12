import { validate } from 'class-validator';
import { LoginDto } from './login.dto';
import { AnswerSubmitDto } from '../../answers/dto/answer-submit.dto';
import { AppealCreateDto } from '../../appeals/dto/appeal-create.dto';
import { AppealResolveDto } from '../../appeals/dto/appeal-resolve.dto';
import { PasswordUpdateDto } from '../../users/dto/password-update.dto';

describe('DTOs Validation', () => {
    describe('LoginDto', () => {
        it('should validate correct login data', async () => {
            const dto = new LoginDto();
            dto.email = 'test@example.com';
            dto.password = 'password123';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject invalid email', async () => {
            const dto = new LoginDto();
            dto.email = 'invalid-email';
            dto.password = 'password123';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should reject short password', async () => {
            const dto = new LoginDto();
            dto.email = 'test@example.com';
            dto.password = 'short';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should reject empty email', async () => {
            const dto = new LoginDto();
            dto.email = '';
            dto.password = 'password123';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should reject empty password', async () => {
            const dto = new LoginDto();
            dto.email = 'test@example.com';
            dto.password = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('AnswerSubmitDto', () => {
        it('should valid answer submit data', async () => {
            const dto = new AnswerSubmitDto();
            dto.questionId = 'question123';
            dto.userAnswer = 'my answer';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject empty questionId', async () => {
            const dto = new AnswerSubmitDto();
            dto.questionId = '';
            dto.userAnswer = 'my answer';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should reject empty userAnswer', async () => {
            const dto = new AnswerSubmitDto();
            dto.questionId = 'question123';
            dto.userAnswer = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('AppealCreateDto', () => {
        it('should valid appeal create data', async () => {
            const dto = new AppealCreateDto();
            dto.answerId = 'answer123';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject empty answerId', async () => {
            const dto = new AppealCreateDto();
            dto.answerId = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('AppealResolveDto', () => {
        it('should valid appeal resolve data with accepted status', async () => {
            const dto = new AppealResolveDto();
            dto.status = 'accepted';
            dto.feedback = 'Good work';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should valid appeal resolve data with rejected status', async () => {
            const dto = new AppealResolveDto();
            dto.status = 'rejected';
            dto.feedback = 'Needs improvement';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject invalid status', async () => {
            const dto = new AppealResolveDto();
            (dto as any).status = 'invalid';
            dto.feedback = 'feedback';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should reject empty feedback', async () => {
            const dto = new AppealResolveDto();
            dto.status = 'accepted';
            dto.feedback = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('PasswordUpdateDto', () => {
        it('should valid password update data', async () => {
            const dto = new PasswordUpdateDto();
            dto.currentPassword = 'oldpassword123';
            dto.newPassword = 'newpassword123';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject short new password', async () => {
            const dto = new PasswordUpdateDto();
            dto.currentPassword = 'oldpassword123';
            dto.newPassword = 'short';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should reject empty currentPassword', async () => {
            const dto = new PasswordUpdateDto();
            dto.currentPassword = '';
            dto.newPassword = 'newpassword123';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should reject empty newPassword', async () => {
            const dto = new PasswordUpdateDto();
            dto.currentPassword = 'oldpassword123';
            dto.newPassword = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});
