/**
 * Unit tests for AuthManager
 * Tests the authentication flow including login functionality
 * Uses real HTML from index.html
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { AuthManager } from '../src/auth';
import * as apiModule from '../src/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AuthManager', () => {
  beforeEach(() => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    document.documentElement.innerHTML = htmlContent;
    jest.clearAllMocks();
  });

  describe('Login functionality', () => {
    it('should call api.login when login form is submitted', async () => {
      const testEmail = 'test@example.com';
      const testPassword = 'password123';

      const mockUser = {
        _id: '123',
        email: testEmail,
        streak: 0,
        createdAt: new Date().toISOString(),
      };

      const loginSpy = jest.spyOn(apiModule.api, 'login').mockResolvedValue(mockUser);

      new AuthManager();

      const loginForm = document.getElementById('login-form') as HTMLFormElement;
      const emailInput = document.getElementById('login-email') as HTMLInputElement;
      const passwordInput = document.getElementById('login-password') as HTMLInputElement;
      expect(loginForm).toBeTruthy();
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();

      emailInput.value = testEmail;
      passwordInput.value = testPassword;

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      loginForm.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(loginSpy).toHaveBeenCalledTimes(1);
      expect(loginSpy).toHaveBeenCalledWith(testEmail, testPassword);
      loginSpy.mockRestore();
    });

    it('should dispatch auth-success event when login is successful', async () => {
      const testEmail = 'test@example.com';
      const testPassword = 'password123';

      const mockUser = {
        _id: '123',
        email: testEmail,
        streak: 0,
        createdAt: new Date().toISOString(),
      };

      const loginSpy = jest.spyOn(apiModule.api, 'login').mockResolvedValue(mockUser);

      new AuthManager();

      const loginForm = document.getElementById('login-form') as HTMLFormElement;
      const emailInput = document.getElementById('login-email') as HTMLInputElement;
      const passwordInput = document.getElementById('login-password') as HTMLInputElement;

      emailInput.value = testEmail;
      passwordInput.value = testPassword;

      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      loginForm.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 50));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(dispatchEventSpy).toHaveBeenCalled();
      const customEvent = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(customEvent.type).toBe('auth-success');
      loginSpy.mockRestore();
      dispatchEventSpy.mockRestore();
    });

    it('should display error message when login fails', async () => {
      const testEmail = 'test@example.com';
      const testPassword = 'wrongpassword';
      const errorMessage = 'Credenciales inválidas';

      const loginSpy = jest.spyOn(apiModule.api, 'login').mockRejectedValue(new Error(errorMessage));

      new AuthManager();

      const loginForm = document.getElementById('login-form') as HTMLFormElement;
      const emailInput = document.getElementById('login-email') as HTMLInputElement;
      const passwordInput = document.getElementById('login-password') as HTMLInputElement;
      const errorDiv = document.getElementById('login-error') as HTMLElement;

      emailInput.value = testEmail;
      passwordInput.value = testPassword;

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      loginForm.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(loginSpy).toHaveBeenCalledWith(testEmail, testPassword);
      expect(errorDiv.textContent).toBe(errorMessage);

      loginSpy.mockRestore();
    });

    it('should clear error message when switching tabs', () => {
      new AuthManager();

      const errorDiv = document.getElementById('login-error') as HTMLElement;
      const registerTab = document.getElementById('register-tab') as HTMLButtonElement;

      errorDiv.textContent = 'Some error';

      registerTab.click();

      expect(errorDiv.textContent).toBe('');
    });
  });

  describe('Tab switching', () => {
    it('should switch to register form when register tab is clicked', () => {
      new AuthManager();

      const loginTab = document.getElementById('login-tab') as HTMLButtonElement;
      const registerTab = document.getElementById('register-tab') as HTMLButtonElement;
      const loginForm = document.getElementById('login-form') as HTMLFormElement;
      const registerForm = document.getElementById('register-form') as HTMLFormElement;

      registerTab.click();

      expect(registerTab.classList.contains('active')).toBe(true);
      expect(loginTab.classList.contains('active')).toBe(false);
      expect(registerForm.classList.contains('active')).toBe(true);
      expect(loginForm.classList.contains('active')).toBe(false);
    });

    it('should switch back to login form when login tab is clicked', () => {
      new AuthManager();

      const loginTab = document.getElementById('login-tab') as HTMLButtonElement;
      const registerTab = document.getElementById('register-tab') as HTMLButtonElement;
      const loginForm = document.getElementById('login-form') as HTMLFormElement;
      const registerForm = document.getElementById('register-form') as HTMLFormElement;

      registerTab.click();

      loginTab.click();

      expect(loginTab.classList.contains('active')).toBe(true);
      expect(registerTab.classList.contains('active')).toBe(false);
      expect(loginForm.classList.contains('active')).toBe(true);
      expect(registerForm.classList.contains('active')).toBe(false);
    });
  });
});
