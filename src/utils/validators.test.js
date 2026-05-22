import {
  validateEmail,
  validateLogin,
  validateRegister,
} from './validators';

describe('validateEmail', () => {
  test('acepta correo válido', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('a.b+c@sub.domain.org')).toBe(true);
  });

  test('rechaza correo sin @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  test('rechaza correo sin dominio', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  test('rechaza cadena vacía', () => {
    expect(validateEmail('')).toBe(false);
  });

  test('rechaza espacios', () => {
    expect(validateEmail('user @example.com')).toBe(false);
  });
});

describe('validateLogin', () => {
  test('retorna vacío cuando datos son válidos', () => {
    expect(validateLogin('user@example.com', 'password123')).toBe('');
  });

  test('retorna error cuando email está vacío', () => {
    expect(validateLogin('', 'password123')).not.toBe('');
  });

  test('retorna error cuando password está vacío', () => {
    expect(validateLogin('user@example.com', '')).not.toBe('');
  });

  test('retorna error cuando email tiene formato inválido', () => {
    expect(validateLogin('not-an-email', 'password123')).not.toBe('');
  });

  test('retorna error cuando ambos campos están vacíos', () => {
    expect(validateLogin('', '')).not.toBe('');
  });
});

describe('validateRegister', () => {
  const valid = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'pass123',
    confirm: 'pass123',
  };

  test('retorna vacío cuando todos los datos son válidos', () => {
    expect(validateRegister(valid)).toBe('');
  });

  test('retorna error si username está vacío', () => {
    expect(validateRegister({ ...valid, username: '' })).not.toBe('');
  });

  test('retorna error si username es solo espacios', () => {
    expect(validateRegister({ ...valid, username: '   ' })).not.toBe('');
  });

  test('retorna error si email está vacío', () => {
    expect(validateRegister({ ...valid, email: '' })).not.toBe('');
  });

  test('retorna error si email tiene formato inválido', () => {
    expect(validateRegister({ ...valid, email: 'bad-email' })).not.toBe('');
  });

  test('retorna error si password es menor a 6 caracteres', () => {
    expect(validateRegister({ ...valid, password: '123', confirm: '123' })).not.toBe('');
  });

  test('retorna error si passwords no coinciden', () => {
    expect(validateRegister({ ...valid, confirm: 'different' })).not.toBe('');
  });
});
