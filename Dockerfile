FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Phục vụ ứng dụng bằng Nginx
FROM nginx:alpine
# Lưu ý: Nếu dự án dùng Create React App thì sửa /app/dist thành /app/build
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]