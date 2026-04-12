import { GlobalExceptionFilter } from './global-exception.filter';
import { HttpException, HttpStatus, ArgumentsHost, HttpCode } from '@nestjs/common';
import { Request, Response } from 'express';

describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;

    beforeEach(() => {
        filter = new GlobalExceptionFilter();
    });

    it('should be defined', () => {
        expect(filter).toBeDefined();
    });

    describe('catch', () => {
        it('should return generic message for internal server errors', () => {
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as unknown as Response;

            const mockRequest = {
                url: '/test',
            } as Request;

            const mockHost = {
                switchToHttp: jest.fn().mockReturnValue({
                    getResponse: () => mockResponse,
                    getRequest: () => mockRequest,
                }),
            } as unknown as ArgumentsHost;

            const error = new Error('Internal database error mongodb://user:pass@host');

            filter.catch(error, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Internal server error',
                timestamp: expect.any(String),
                path: '/test',
            });
        });

        it('should return original message for client errors', () => {
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as unknown as Response;

            const mockRequest = {
                url: '/test',
            } as Request;

            const mockHost = {
                switchToHttp: jest.fn().mockReturnValue({
                    getResponse: () => mockResponse,
                    getRequest: () => mockRequest,
                }),
            } as unknown as ArgumentsHost;

            const error = new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

            filter.catch(error, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: 'Invalid credentials',
                timestamp: expect.any(String),
                path: '/test',
            });
        });

        it('should sanitize MongoDB connection strings from error messages', () => {
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as unknown as Response;

            const mockRequest = {
                url: '/test',
            } as Request;

            const mockHost = {
                switchToHttp: jest.fn().mockReturnValue({
                    getResponse: () => mockResponse,
                    getRequest: () => mockRequest,
                }),
            } as unknown as ArgumentsHost;

            const error = new HttpException('Error: mongodb://admin:secret@localhost:27017/db', HttpStatus.BAD_REQUEST);

            filter.catch(error, mockHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'An error occurred while processing your request',
                })
            );
        });

        it('should sanitize MongoDB duplicate key errors', () => {
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as unknown as Response;

            const mockRequest = {
                url: '/test',
            } as Request;

            const mockHost = {
                switchToHttp: jest.fn().mockReturnValue({
                    getResponse: () => mockResponse,
                    getRequest: () => mockRequest,
                }),
            } as unknown as ArgumentsHost;

            const error = new HttpException('E11000 duplicate key error', HttpStatus.BAD_REQUEST);

            filter.catch(error, mockHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'An error occurred while processing your request',
                })
            );
        });

        it('should handle unknown errors as internal server errors', () => {
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as unknown as Response;

            const mockRequest = {
                url: '/test',
            } as Request;

            const mockHost = {
                switchToHttp: jest.fn().mockReturnValue({
                    getResponse: () => mockResponse,
                    getRequest: () => mockRequest,
                }),
            } as unknown as ArgumentsHost;

            filter.catch('unknown error', mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Internal server error',
                timestamp: expect.any(String),
                path: '/test',
            });
        });
    });
});
