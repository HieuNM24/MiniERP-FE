export interface LoginRequest {
  username: string;
  password: string; // 💡 Kiểm tra lại nếu Backend DTO của bạn dùng tên "password" hay "passwordHash" nhé
}

export interface LoginResponse {
  token: string;
  username: string;
  roleName: string;
}