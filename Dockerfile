# Sử dụng base image chứa Node.js và npm phiên bản 18
FROM node:lts-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép tất cả các tệp package.json và yarn.lock vào thư mục làm việc
COPY package*.json ./
COPY yarn.lock ./

# Cài đặt các gói npm bằng yarn
RUN yarn install

# Sao chép toàn bộ nội dung của thư mục nguồn (trong trường hợp này, dự án NestJS của bạn) vào thư mục làm việc
COPY . .

# Xây dựng ứng dụng NestJS
RUN yarn build

# Mở cổng 5334 để giao tiếp với ứng dụng
EXPOSE 5334

# Khởi chạy ứng dụng khi container được khởi động
CMD ["yarn", "start:prod"]
