import { describe, it, expect, beforeAll } from '@jest/globals';
import { validate } from 'class-validator';
import { UserUpdateDto } from '../dto/user-update.dto';
import { MORNING_COMMISSION, EVENING_COMMISSION } from '../../common/constants/commission.constants';

describe('UserUpdateDto', () => {
    it('deberia pasar validacion con commission valida MAÑANA', async () => {
        const dto = new UserUpdateDto();
        dto.commission = MORNING_COMMISSION;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia pasar validacion con commission valida NOCHE', async () => {
        const dto = new UserUpdateDto();
        dto.commission = EVENING_COMMISSION;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia fallar validacion con commission invalida', async () => {
        const dto = new UserUpdateDto();
        dto.commission = 'TARDE';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('deberia permitir dto vacio (todos los campos opcionales)', async () => {
        const dto = new UserUpdateDto();
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia validar email si se proporciona', async () => {
        const dto = new UserUpdateDto();
        dto.email = 'invalid-email';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('deberia validar role si se proporciona', async () => {
        const dto = new UserUpdateDto();
        dto.role = 'INVALID_ROLE';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia validar role valido', async () => {
        const dto = new UserUpdateDto();
        dto.role = 'PROFESSOR';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });
});
