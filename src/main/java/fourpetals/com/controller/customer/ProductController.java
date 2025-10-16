package fourpetals.com.controller.customer;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import fourpetals.com.entity.Product;
import fourpetals.com.entity.Review;
import fourpetals.com.entity.User;
import fourpetals.com.service.ProductService;
import fourpetals.com.service.ReviewService;
import fourpetals.com.service.CartService;
import fourpetals.com.service.UserService;

@Controller
@RequestMapping("/product")
public class ProductController {

	@Autowired
	private ProductService productService;
	@Autowired
	private ReviewService reviewService;
	@Autowired
	private CartService cartService;
	@Autowired
	private UserService userService;
	
	@GetMapping("/{id}")
	public String detailPage(@PathVariable("id") Integer id, Model model) {
	    Product product = productService.getProductById(id);

	    if (product == null) {
	        return "redirect:/product"; // nếu id sai thì về trang danh sách
	    }

	    // Tăng view
	    productService.increaseViewCount(id);

	    // Lấy review + sản phẩm liên quan
	    Double avgRating = reviewService.getAverageRating(id);
	    List<Review> reviews = reviewService.getReviewsByProduct(product);
		/*
		 * List<Product> related =
		 * productService.getRelatedProducts(product.getDanhMuc().getMaDM(),
		 * product.getMaSP());
		 */

	    model.addAttribute("product", product);
	    model.addAttribute("avgRating", avgRating);
	    model.addAttribute("reviews", reviews);
		/* model.addAttribute("relatedProducts", related); */

	    return "customer/product-detail";
	}

	// 🔹 Gửi đánh giá
	@PostMapping("/{id}/review")
	public String addReview(@PathVariable("id") Integer productId, @RequestParam("rating") Integer rating,
			@RequestParam("comment") String comment, Principal principal) {
		User user = userService.findByEmail(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));
		Product product = productService.getProductById(productId);
		reviewService.addReview(product, user, rating, comment);
		return "redirect:/product/" + productId;
	}

	// 🔹 Thêm vào giỏ hàng
	@PostMapping("/add-to-cart")
	@ResponseBody
	public String addToCart(@RequestParam("productId") Integer productId, @RequestParam("quantity") Integer quantity,
			Principal principal) {
		User user = userService.findByEmail(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));
		cartService.addToCart(user, productId, quantity);
		return "Đã thêm vào giỏ hàng!";
	}

	// 🔹 Mua ngay (chuyển sang trang thanh toán)
	@GetMapping("/buy-now/{id}")
	public String buyNow(@PathVariable("id") Integer id) {
		return "redirect:/checkout?productId=" + id;
	}
}
