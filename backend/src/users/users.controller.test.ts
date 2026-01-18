
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { DatabaseService } from "../database/database.service";
import { HttpException, HttpStatus } from "@nestjs/common";

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;
    let databaseService: DatabaseService;

    beforeEach(() => {
        databaseService = new DatabaseService();
        service = new UsersService(databaseService);
        controller = new UsersController(service);
    });

    describe('getProfile', () => {
        it('deberia retornar el perfil si el usuario esta autenticado', async () => {
            const session: any = { userId: 'user1' };
            const mockProfile = { _id: 'user1', email: 'test@test.com', streak: 5, createdAt: new Date() };

            jest.spyOn(service, 'getProfile').mockResolvedValue(mockProfile);

            const result = await controller.getProfile(session);

            expect(result).toEqual({ profile: mockProfile });
        });

        it('deberia lanzar HttpException UNAUTHORIZED si no hay userId en sesion', async () => {
            const session: any = {};

            await expect(controller.getProfile(session)).rejects.toThrow(
                new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED)
            );
        });

        it('deberia lanzar HttpException NOT_FOUND si el servicio lanza error (usuario no encontrado)', async () => {
            const session: any = { userId: 'user1' };

            jest.spyOn(service, 'getProfile').mockRejectedValue(new Error('User not found'));

            await expect(controller.getProfile(session)).rejects.toThrow(
                new HttpException('User not found', HttpStatus.NOT_FOUND)
            );
        });
    });

    describe('getHistory', () => {
        it('deberia retornar el historial si el usuario esta autenticado', async () => {
            const session: any = { userId: 'user1' };
            const mockHistory = [{ id: 1 }, { id: 2 }];

            jest.spyOn(service, 'getHistory').mockResolvedValue(mockHistory as any);

            const result = await controller.getHistory(session, '10');

            expect(result).toEqual({ history: mockHistory });
            expect(service.getHistory).toHaveBeenCalledWith('user1', 10);
        });

        it('deberia usar limite de 50 si no se provee query param', async () => {
            const session: any = { userId: 'user1' };
            const mockHistory: any[] = [];

            jest.spyOn(service, 'getHistory').mockResolvedValue(mockHistory);

            await controller.getHistory(session, undefined);

            expect(service.getHistory).toHaveBeenCalledWith('user1', 50);
        });

        it('deberia lanzar HttpException UNAUTHORIZED si no hay userId en sesion', async () => {
            const session: any = {};

            await expect(controller.getHistory(session)).rejects.toThrow(
                new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED)
            );
        });
    });
});
