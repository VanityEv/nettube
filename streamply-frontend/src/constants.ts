/**
 * 1024 >= - desktop
 * 1024 < - mobile
 */
export const VIEWPORT_BREAKPOINT = 1024;
export const SERVER_ADDR = 'http://localhost';
export const SERVER_PORT = 3001;
/**
 * Min. 8 characters, with one letter and one number
 */
export const PASSWORD_REGEX = new RegExp(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/);
//export const EMAIL_REGEX = new RegExp("[tttt6]");
//export const PASSWORD_REGEX = new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})");
export const EMAIL_REGEX = new RegExp(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i);
