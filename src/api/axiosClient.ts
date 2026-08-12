import axios from 'axios';

// ⚠️ LƯU Ý: Kiểm tra lại Port ở Backend .NET của bạn và thay vào đây (Ví dụ: 7123, 5000, 5178...)
const BASE_URL = 'http://localhost:7143/api'; 

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động gắn Token JWT vào Header nếu người dùng đã đăng nhập
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tự động xử lý khi Token hết hạn (Lỗi 401)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;