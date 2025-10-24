# Sử dụng image JDK chính thức
FROM eclipse-temurin:21-jdk

# Đặt thư mục làm việc
WORKDIR /app

# Copy toàn bộ project vào container
COPY . .

# ✅ Cấp quyền thực thi cho Maven Wrapper
RUN chmod +x ./mvnw

# ✅ Build project bằng Maven Wrapper
RUN ./mvnw clean package -DskipTests

# Mở cổng cho ứng dụng
EXPOSE 8080

# ✅ Chạy file .jar, Render sẽ tự đặt biến $PORT
CMD ["sh", "-c", "java -jar target/*.jar --server.port=$PORT"]
