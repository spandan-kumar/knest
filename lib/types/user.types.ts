export interface User {
  id: string;
  email: string;
  name: string;
  hashedPassword: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
  };
}