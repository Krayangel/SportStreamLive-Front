// src/utils/validators.js
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateLogin(email, password) {
  if (!email || !password) return 'Completa todos los campos.';
  if (!validateEmail(email)) return 'Formato de correo inválido.';
  return '';
}

export function validateRegister(data) {
  if (!data.username?.trim())  return 'El nombre de usuario es obligatorio.';
  if (!data.email?.trim())     return 'El correo es obligatorio.';
  if (!validateEmail(data.email)) return 'Formato de correo inválido.';
  if (!data.password || data.password.length < 6)
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (data.password !== data.confirm) return 'Las contraseñas no coinciden.';
  return '';
}
