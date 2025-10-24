# Sử dụng image JDK chính thức
FROM eclipse-temurin:21-jdk

# Đặt thư mục làm việc
WORKDIR /app

# Copy toàn bộ project vào container
COPY . .

# ✅ Cấp quyền thực thi cho Maven Wrapper (nếu có)
RUN chmod +x mvnw

# ✅ Build project bằng Maven Wrapper
RUN ./mvnw clean package -DskipTests

# ✅ Chạy file .jar, sử dụng PORT do Render cung cấp
CMD ["sh", "-c", "java -jar target/*.jar --server.port=$PORT"]
