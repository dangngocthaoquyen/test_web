# Sử dụng image JDK chính thức
FROM eclipse-temurin:21-jdk

# Đặt thư mục làm việc
WORKDIR /app

# Copy toàn bộ mã nguồn vào container
COPY . .

# Build project bằng Maven Wrapper
RUN ./mvnw clean package -DskipTests

# Chạy file .jar (Render sẽ tự đặt biến $PORT)
EXPOSE 8080
CMD ["sh", "-c", "java -jar target/*.jar --server.port=$PORT"]
