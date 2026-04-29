import { describe, it, expect } from '@jest/globals';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { MORNING_COMMISSION, EVENING_COMMISSION } from '../../common/constants/commission.constants';

describe('CreateUserDto', () => {
    it('deberia pasar validacion con datos correctos', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = '12345678';
        dto.role = 'PROFESSOR';
        dto.commission = MORNING_COMMISSION;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia pasar validacion con commission MAÑANA', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = '12345678';
        dto.role = 'STUDENT';
        dto.commission = MORNING_COMMISSION;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia pasar validacion con commission NOCHE', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = '12345678';
        dto.role = 'STUDENT';
        dto.commission = EVENING_COMMISSION;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia fallar validacion con commission invalida', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = '12345678';
        dto.role = 'STUDENT';
        dto.commission = 'TARDE';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('deberia pasar validacion con role PROFESSOR', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = '12345678';
        dto.role = 'PROFESSOR';
        dto.commission = MORNING_COMMISSION;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia pasar validacion con role STUDENT', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = '12345678';
        dto.role = 'STUDENT';
        dto.commission = MORNING_COMMISSION;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia fallar validacion con role invalido', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = '12345678';
        dto.role = 'INVALID_ROLE';
        dto.commission = MORNING_COMMISSION;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('deberia fallar validacion con email invalido', async () => {
        const dto = new CreateUserDto();
        dto.email = 'invalid-email';
        dto.password = '12345678';
        dto.role = 'STUDENT';
        dto.commission = MORNING_COMMISSION;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('deberia fallar con password demasiado corta', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = '123';
        dto.role = 'STUDENT';
        dto.commission = MORNING_COMMISSION;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('deberia fallar validacion con dto vacio (todos los campos requeridos)', async () => {
        const dto = new CreateUserDto();
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia fallar si falta commission', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = '12345678';
        dto.role = 'STUDENT';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
