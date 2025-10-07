package fourpetals.com.dto.request;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
	@NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;
    
    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}
