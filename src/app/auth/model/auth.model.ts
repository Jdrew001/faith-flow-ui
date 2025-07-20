export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'leader' | 'admin';
  churchName?: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  churchName?: string;
}

export interface LoginRequest {
  phoneNumber: string;
}

export interface VerifyCodeRequest {
  phoneNumber: string;
  verificationCode: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
  accessToken: string;
  refreshToken: string;
}