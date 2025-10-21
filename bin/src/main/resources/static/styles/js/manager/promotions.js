let productIndex = 1; // index cho các row thêm mới
let currentPage = 0;
const pageSize = 10;

function addRelatedProductRow() {
	const tableBody = document.querySelector('#relatedProductsTable tbody');
	const newRow = document.createElement('tr');
	newRow.classList.add('product-row');

	// Clone options từ select mặc định
	const firstSelect = document.querySelector('.product-row.default-row select');
	const optionsHtml = Array.from(firstSelect.options)
		.map(opt => `<option value="${opt.value}">${opt.textContent}</option>`)
		.join('');

	newRow.innerHTML = `
        <td>
            <select name="products[${productIndex}].productId" required>
                ${optionsHtml}
            </select>
        </td>
        <td>
            <button type="button" class="btn-remove" onclick="removeProductRow(this)">Xóa</button>
        </td>
    `;

	tableBody.appendChild(newRow);
	productIndex++;
}

function removeProductRow(button) {
	const row = button.closest('tr');
	if (!row.classList.contains('default-row')) { // chỉ xóa row không phải mặc định
		row.remove();
		updateProductIndexes();
	}
}

// Cập nhật lại index sau khi xóa
function updateProductIndexes() {
	const rows = document.querySelectorAll('#relatedProductsTable tbody tr.product-row');
	rows.forEach((row, idx) => {
		const select = row.querySelector('select');
		select.name = `products[${idx}].productId`;
	});
}

// ================= THỐNG KÊ KHUYẾN MÃI =================
async function loadPromotionStats() {
	try {
		const res = await fetch('/api/manager/promotions/stats');
		if (!res.ok) {
			console.error('Response not ok:', res.status);
			throw new Error('Không thể tải thống kê khuyến mãi');
		}

		const data = await res.json();

		document.getElementById('totalPromotionsStat').textContent = data.totalPromotions || 0;
		document.getElementById('inactivePromotionsStat').textContent = data.inactivePromotions || 0;
		document.getElementById('activePromotionsStat').textContent = data.activePromotions || 0;
		document.getElementById('expiringPromotionsStat').textContent = data.expiringSoonPromotions || 0;
		document.getElementById('disabledPromotionsStat').textContent = data.disabledPromotions || 0;

	} catch (err) {
		console.error('Lỗi tải thống kê khuyến mãi:', err);
		// Không hiện alert để không làm gián đoạn
	}
}

// --- LOAD DANH SÁCH KHUYẾN MÃI ---
async function loadPromotions(page = 0) {
	try {
		currentPage = page;

		// Lấy các giá trị filter
		let keyword = '';
		let status = '';
		let productId = '';

		const form = document.getElementById('searchFilterForm');
		if (form) {
			keyword = form.elements['keyword']?.value || '';
			status = form.elements['status']?.value || '';
			productId = form.elements['productId']?.value || '';
		}

		// Build URL với các params
		let url = `/api/manager/promotions?page=${page}&size=${pageSize}`;
		if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
		if (status) url += `&status=${status}`;
		if (productId) url += `&productId=${productId}`;

		console.log('🔍 Loading promotions from:', url);

		const tableBody = document.getElementById('promotionTableBody');
		const paginationDiv = document.getElementById('promotionPagination');

		if (!tableBody) {
			console.error('Không tìm thấy promotionTableBody');
			return;
		}

		tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Đang tải dữ liệu...</td></tr>';
		if (paginationDiv) paginationDiv.innerHTML = '';

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		renderPromotionTable(data.content || data);

		if (data.totalPages) {
			renderPromotionPagination(data.number || 0, data.totalPages);
		}

	} catch (error) {
		console.error('❌ Lỗi khi tải khuyến mãi:', error);
		const tableBody = document.getElementById('promotionTableBody');
		if (tableBody) {
			tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:red;">Lỗi: ${error.message}<br/>Vui lòng kiểm tra Console để biết chi tiết</td></tr>`;
		}
		alert('Không thể tải dữ liệu khuyến mãi. Vui lòng kiểm tra Console (F12)');
	}
}

// Hàm chuyển enum sang displayName
function getPromotionTypeDisplay(loaiKm) {
	const types = {
		PERCENT: "Giảm theo %",
		AMOUNT: "Giảm theo số tiền",
		GIFT: "Tặng quà",
		COMBO: "Gói sản phẩm giảm giá",
		BUY_X_GET_Y: "Mua X tặng Y"
	};
	return types[loaiKm] || loaiKm || 'Chưa xác định';
}

// --- RENDER BẢNG KHUYẾN MÃI ---
function renderPromotionTable(promotions) {
	const tableBody = document.getElementById('promotionTableBody');
	if (!tableBody) {
		console.error('Không tìm thấy promotionTableBody');
		return;
	}

	tableBody.innerHTML = '';

	if (!promotions || promotions.length === 0) {
		tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Không có khuyến mãi nào</td></tr>';
		return;
	}

	console.log('Rendering promotions:', promotions.length);

	promotions.forEach(promo => {
		const startDate = promo.thoiGianBd ? new Date(promo.thoiGianBd).toLocaleString('vi-VN') : 'N/A';
		const endDate = promo.thoiGianKt ? new Date(promo.thoiGianKt).toLocaleString('vi-VN') : 'N/A';

		const isActive = promo.trangThai === 'ACTIVE';
		const isDisabled = promo.trangThai === 'DISABLED';

		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${promo.makm || '—'}</td>
			<td>${promo.tenkm || '—'}</td>
			<td>${getPromotionTypeDisplay(promo.loaiKm)}</td>
			<td>${promo.giaTri ?? 0}</td>
			<td>${startDate}</td>
			<td>${endDate}</td>
			<td class="toggle-cell">
				<label class="switch">
					<input type="checkbox" ${isActive ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} data-id="${promo.makm}">
					<span class="slider round"></span>
				</label>
				<button class="btn-block" data-blocked="${isDisabled}" data-id="${promo.makm}">
					<i class="fas ${isDisabled ? 'fa-ban' : 'fa-unlock'}"></i>
				</button>
			</td>
			<td>
				<div class="action-buttons">
					<button class="btn-view" onclick="openPromotionDetailModal(${promo.makm})">
						<i class="fas fa-eye"></i>
					</button>
					<button class="btn-edit" onclick="openEditPromotionModal(${promo.makm})">
						<i class="fas fa-edit"></i>
					</button>
					<button class="btn-delete" onclick="deletePromotion(${promo.makm})">
						<i class="fas fa-trash"></i>
					</button>
				</div>
			</td>
		`;

		// Sự kiện toggle trạng thái
		const checkbox = row.querySelector('input[type="checkbox"]');
		if (checkbox) {
			checkbox.addEventListener('change', e => togglePromotionStatus(e.target));
		}

		const blockBtn = row.querySelector('.btn-block');
		if (blockBtn) {
			blockBtn.addEventListener('click', e => togglePromotionBlock(e.currentTarget));
		}

		tableBody.appendChild(row);
	});
}

// --- PHÂN TRANG ---
function renderPromotionPagination(current, totalPages) {
	const paginationDiv = document.getElementById('promotionPagination');
	if (!paginationDiv) return;

	paginationDiv.innerHTML = '';
	if (totalPages <= 1) return;

	let html = '';
	html += current > 0
		? `<a href="#" data-page="${current - 1}"> <i class="fas fa-chevron-left"></i> Trước </a>`
		: `<span class="disabled"> <i class="fas fa-chevron-left"></i> Trước </span>`;

	for (let i = 0; i < totalPages; i++) {
		const activeClass = i === current ? 'active' : '';
		html += `<a href="#" data-page="${i}" class="${activeClass}">${i + 1}</a>`;
	}

	html += current < totalPages - 1
		? `<a href="#" data-page="${current + 1}"> Sau <i class="fas fa-chevron-right"></i> </a>`
		: `<span class="disabled"> Sau <i class="fas fa-chevron-right"></i> </span>`;

	paginationDiv.innerHTML = html;
}

// -------------------- THAY ĐỔI TRẠNG THÁI (ACTIVE/INACTIVE) --------------------
async function togglePromotionStatus(checkbox) {
	const promoId = checkbox.getAttribute('data-id');
	const newStatus = checkbox.checked ? 'ACTIVE' : 'INACTIVE';

	try {
		const res = await fetch(`/api/manager/promotions/${promoId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: newStatus })
		});

		if (!res.ok) {
			throw new Error('Cập nhật trạng thái thất bại');
		}

		// Load lại thống kê và bảng
		await loadPromotionStats();

	} catch (err) {
		console.error(err);
		alert('Cập nhật trạng thái thất bại!');
		// revert checkbox nếu lỗi
		checkbox.checked = !checkbox.checked;
	}
}


// -------------------- VÔ HIỆU HÓA / MỞ LẠI KHUYẾN MÃI --------------------
async function togglePromotionBlock(button) {
	const promoId = button.getAttribute('data-id');
	const isBlocked = button.dataset.blocked === 'true';
	const newStatus = isBlocked ? 'INACTIVE' : 'DISABLED';

	try {
		const res = await fetch(`/api/manager/promotions/${promoId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: newStatus })
		});

		if (!res.ok) throw new Error('Cập nhật thất bại');

		button.dataset.blocked = (!isBlocked).toString();
		button.querySelector('i').className = `fas ${newStatus === 'DISABLED' ? 'fa-ban' : 'fa-unlock'}`;

		await loadPromotionStats();
	} catch (err) {
		console.error(err);
		alert('Cập nhật trạng thái thất bại!');
	}
}

let pendingToggle = null; // Lưu toggle đang chờ xác nhận

// Khi click toggle
document.addEventListener('change', (e) => {
	const checkbox = e.target;
	if (!checkbox.classList.contains('promo-toggle')) return;

	pendingToggle = checkbox;

	const action = checkbox.checked ? 'kích hoạt' : 'vô hiệu hóa';
	document.getElementById('activatePromotionActionText').innerText = action;
	document.getElementById('activatePromotionName').innerText = checkbox.dataset.name;

	// Mở modal
	document.getElementById('activatePromotionModal').style.display = 'block';

	// Revert trạng thái tạm thời, đợi xác nhận
	checkbox.checked = !checkbox.checked;
});

// Xác nhận modal
async function confirmConfirmation() {
	if (!pendingToggle) return;

	const checkbox = pendingToggle;
	const promoId = checkbox.dataset.id;
	const newStatus = checkbox.checked ? 'INACTIVE' : 'ACTIVE'; // Vì đã revert trước đó

	try {
		const res = await fetch(`/api/manager/promotions/${promoId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: newStatus })
		});

		if (!res.ok) throw new Error('Cập nhật trạng thái thất bại');

		// Cập nhật checkbox theo trạng thái mới
		checkbox.checked = newStatus === 'ACTIVE';
	} catch (err) {
		alert('Cập nhật thất bại!');
	} finally {
		cancelConfirmation();
	}
}

// Hủy modal
function cancelConfirmation() {
	if (pendingToggle) {
		// Nếu hủy, giữ checkbox ở trạng thái cũ
		pendingToggle = null;
	}
	document.getElementById('activatePromotionModal').style.display = 'none';
}


function logNullFields(obj) {
	const nullFields = [];
	Object.entries(obj).forEach(([key, value]) => {
		if (value === null || value === undefined || value === '') {
			nullFields.push(key);
		}
	});

	if (nullFields.length) {
		console.warn("⚠️ Các trường null/empty:", nullFields.join(', '));
	} else {
		console.log("✅ Không có trường null/empty");
	}
}

// --- THÊM KHUYẾN MÃI ---
async function createPromotion() {
	const form = document.getElementById('promotionForm');
	clearErrors(); // ✅ Clear lỗi cũ trước khi submit

	const productSelects = document.querySelectorAll('#relatedProductsTable tbody select');
	const productIds = Array.from(productSelects)
		.map(select => parseInt(select.value))
		.filter(id => !isNaN(id));

	const formData = {
		tenkm: document.getElementById('tenkm').value.trim(),
		loaiKm: document.getElementById('loaiKm').value,
		giaTri: parseFloat(document.getElementById('giaTri').value) || 1.0,
		moTa: document.getElementById('moTa').value.trim(),
		thoiGianBd: document.getElementById('thoiGianBd').value,
		thoiGianKt: document.getElementById('thoiGianKt').value,
		loaiKhachHang: document.getElementById('customerRank').value || null,
		sanPhamIds: productIds
	};

	console.log(JSON.stringify(formData, null, 2));

	console.log('[CREATE PROMOTION] Payload:', formData);

	try {
		const res = await fetch('/api/manager/promotions/add', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		});

		const contentType = res.headers.get('content-type') || '';
		console.log('📌 Content-Type:', contentType);
		console.log('📌 Status:', res.status);

		if (!res.ok) {
			// ✅ Xử lý response dạng JSON
			if (contentType.includes('application/json')) {
				try {
					const errorData = await res.json();
					console.log('📋 Error JSON:', errorData);

					// Xử lý các cấu trúc khác nhau
					if (errorData.errors) {
						displayErrors(errorData.errors);
					} else if (errorData.message) {
						alert(`❌ ${errorData.message}`);
					} else {
						displayErrors(errorData);
					}
				} catch (e) {
					console.error('Parse JSON error:', e);
					alert('Lỗi không xác định từ server');
				}
			}
			// ✅ Xử lý response dạng TEXT (HTML/Plain text)
			else {
				const textError = await res.text();
				console.log('📋 Error Text:', textError);

				// ✅ Hiển thị lỗi text trong alert
				alert(`❌ Lỗi (${res.status}):\n${textError.substring(0, 500)}`);

				// ✅ Hoặc hiển thị trong một div chung
				showGlobalError(textError);
			}
			return;
		}

		// ✅ Success
		await res.json();
		alert("✅ Thêm khuyến mãi thành công!");
		closeModal('addPromotionModal');
		form.reset();
		await loadPromotionStats();
		await loadPromotions(currentPage);

	} catch (err) {
		console.error("❌ Network/Parse Error:", err);
		alert(`❌ Lỗi kết nối: ${err.message}`);
	}
}

function showGlobalError(errorText) {
	// Tìm hoặc tạo div hiển thị lỗi global
	let errorDiv = document.getElementById('global-error-message');

	if (!errorDiv) {
		errorDiv = document.createElement('div');
		errorDiv.id = 'global-error-message';
		errorDiv.style.cssText = `
            background: #fee;
            border: 1px solid #f00;
            color: #c00;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
        `;

		// Thêm vào đầu modal body
		const modalBody = document.querySelector('#addPromotionModal .modal-body');
		modalBody.insertBefore(errorDiv, modalBody.firstChild);
	}

	// Parse nếu là HTML để lấy text thuần
	const parser = new DOMParser();
	const doc = parser.parseFromString(errorText, 'text/html');
	const cleanText = doc.body.textContent || errorText;

	errorDiv.innerHTML = `
        <strong>⚠️ Lỗi từ server:</strong><br>
        <pre style="white-space: pre-wrap; margin: 5px 0;">${cleanText.substring(0, 1000)}</pre>
    `;
	errorDiv.style.display = 'block';
}

const customerRankDisplayNames = {
	THUONG: "Thường",
	BAC: "Bạc",
	VANG: "Vàng",
	KIM_CUONG: "Kim Cương"
};

// XEM THÔNG TIN CHI TIẾT KHUYẾN MÃI
async function openPromotionDetailModal(makm) {
	try {
		const res = await fetch(`/api/manager/promotions/view/${makm}`);
		if (!res.ok) throw new Error(`Lỗi khi tải khuyến mãi: ${res.status}`);

		const data = await res.json();

		// --- 1. Điền thông tin cơ bản ---
		document.getElementById('viewTenkm').textContent = data.tenkm || '—';
		document.getElementById('viewLoaiKm').textContent = getPromotionTypeDisplay(data.loaiKm) || '—';
		document.getElementById('viewMoTa').textContent = data.moTa || '—';
		document.getElementById('viewThoiGianBd').textContent = data.thoiGianBd ? new Date(data.thoiGianBd).toLocaleString('vi-VN') : '—';
		document.getElementById('viewThoiGianKt').textContent = data.thoiGianKt ? new Date(data.thoiGianKt).toLocaleString('vi-VN') : '—';

		// Giữ nguyên logic này cho khách hàng

		document.getElementById('viewCustomerRank').textContent =
			customerRankDisplayNames[data.loaiKhachHang] || 'Tất cả khách hàng';

		// Định dạng giá trị
		let giaTriDisplay = '—';
		if (data.giaTri != null) {
			if (data.loaiKm === 'PERCENT') {
				giaTriDisplay = `${data.giaTri}%`;
			} else if (data.loaiKm === 'AMOUNT') {
				giaTriDisplay = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.giaTri);
			} else {
				giaTriDisplay = data.giaTri;
			}
		}
		document.getElementById('viewGiaTri').textContent = giaTriDisplay;


		// --- 2. Điền bảng danh sách sản phẩm (Sửa logic lặp) ---
		const productsBody = document.getElementById('viewProductsBody');
		productsBody.innerHTML = '';

		// === CẬP NHẬT LOGIC KIỂM TRA TẠI ĐÂY ===
		// Thêm điều kiện: data.sanPhamIds[0] != null
		// Điều này sẽ loại bỏ trường hợp [null]
		if (data.sanPhamIds && data.sanPhamIds.length > 0 && data.sanPhamIds[0] != null) {

			// Lặp qua mảng IDs
			data.sanPhamIds.forEach((productId, index) => {
				const tr = document.createElement('tr');
				const productName = data.sanPhamNames[index];

				tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${productId || '—'}</td>
                    <td>${productName || '(Lỗi: Tên SP bị thiếu)'}</td> 
                `;
				productsBody.appendChild(tr);
			});

		} else {
			// Bất kỳ trường hợp nào khác (mảng rỗng [], hoặc mảng [null])
			// đều sẽ rơi vào đây.
			const tr = document.createElement('tr');
			tr.innerHTML = `<td colspan="3" style="text-align: center;">Áp dụng cho toàn bộ sản phẩm</td>`;
			productsBody.appendChild(tr);
		}

		openModal('viewPromotionModal');
	} catch (error) {
		console.error("Lỗi khi mở chi tiết khuyến mãi:", error);
		alert('Không thể tải thông tin khuyến mãi!');
	}
}

// Hàm này giữ nguyên
function getPromotionTypeDisplay(type) {
	switch (type) {
		case 'PERCENT': return 'Giảm theo %';
		case 'AMOUNT': return 'Giảm theo tiền';
		case 'GIFT': return 'Tặng quà';
		case 'COMBO': return 'Combo khuyến mãi';
		case 'BUY_X_GET_Y': return 'Mua X tặng Y';
		default: return type || '—';
	}
}

async function openEditPromotionModal(makm) {
	try {
		const res = await fetch(`/api/manager/promotions/view/${makm}`);
		if (!res.ok) throw new Error(`Lỗi khi tải khuyến mãi: ${res.status}`);
		const data = await res.json();

		// Helper gán value an toàn
		const setValue = (id, value) => {
			const el = document.getElementById(id);
			if (el) el.value = value ?? '';
		};

		// --- 1. Điền thông tin cơ bản ---
		setValue('editPromotionId', data.makm);
		setValue('editTenkm', data.tenkm);
		setValue('editLoaiKm', data.loaiKm);
		setValue('editGiaTri', data.giaTri != null ? data.giaTri : '');
		setValue('editMoTa', data.moTa);
		setValue('editThoiGianBd', data.thoiGianBd ? data.thoiGianBd.slice(0, 16) : '');
		setValue('editThoiGianKt', data.thoiGianKt ? data.thoiGianKt.slice(0, 16) : '');
		setValue('editCustomerRank', data.loaiKhachHang);

		// --- 2. Xử lý danh sách sản phẩm ---
		const tableBody = document.querySelector('#editRelatedProductsTable tbody'); // sửa id
		if (tableBody) {
			tableBody.innerHTML = ''; // reset
			if (data.sanPhamIds && data.sanPhamIds.length > 0 && data.sanPhamIds[0] != null) {
				data.sanPhamIds.forEach((productId, idx) => {
					const row = createEditProductRow(productId);
					tableBody.appendChild(row);
				});
			} else {
				const tr = document.createElement('tr');
				tr.innerHTML = `<td colspan="2" style="text-align:center;">Áp dụng cho toàn bộ sản phẩm</td>`;
				tableBody.appendChild(tr);
			}
		}


		// --- 3. Hiển thị/ẩn field Giá trị theo loại khuyến mãi ---
		if (typeof toggleGiaTriFieldEdit === 'function') toggleGiaTriFieldEdit();

		// --- 4. Mở modal ---
		openModal('editPromotionModal');

	} catch (err) {
		console.error('Lỗi mở form edit:', err);
		alert('Không thể tải dữ liệu khuyến mãi để chỉnh sửa!');
	}
}

// --- Hiển thị/ẩn giá trị trong edit form ---
function toggleGiaTriFieldEdit() {
	const loaiKmSelect = document.getElementById('editLoaiKm');
	const giaTriGroup = document.querySelector('#editGiaTri').closest('.form-group');

	if (!loaiKmSelect || !giaTriGroup) return;

	const value = loaiKmSelect.value;
	if (value === 'PERCENT' || value === 'AMOUNT') {
		giaTriGroup.style.display = 'block';
	} else {
		giaTriGroup.style.display = 'none';
		document.getElementById('editGiaTri').value = '';
	}

	// gắn sự kiện onchange để update khi người dùng đổi loại khuyến mãi
	loaiKmSelect.onchange = toggleGiaTriFieldEdit;
}


// TẠO DÒNG SẢN PHẨM TRONG FORM EDIT
function createEditProductRow(selectedId = "") {
	const row = document.createElement("tr");
	row.classList.add("product-row");

	// Clone select từ bảng gốc
	const originalSelect = document.querySelector("#relatedProductsTable select");
	if (!originalSelect) {
		console.error('Không tìm thấy select gốc');
		return row;
	}

	const selectHTML = originalSelect.outerHTML;
	const td1 = document.createElement("td");
	td1.innerHTML = selectHTML;

	const select = td1.querySelector("select");
	if (selectedId && select) select.value = selectedId;

	const td2 = document.createElement("td");
	const btnRemove = document.createElement("button");
	btnRemove.type = "button";
	btnRemove.classList.add("btn-remove");
	btnRemove.textContent = "Xóa";
	btnRemove.onclick = () => row.remove();
	td2.appendChild(btnRemove);

	row.appendChild(td1);
	row.appendChild(td2);
	return row;
}

// THÊM DÒNG SẢN PHẨM TRONG EDIT FORM
function addEditProductRow() {
	const tableBody = document.querySelector("#editRelatedProductsTable tbody");
	if (tableBody) {
		tableBody.appendChild(createEditProductRow());
	}
}

// SUBMIT FORM EDIT
// SUBMIT FORM EDIT
async function submitEditPromotion(e) {
	e.preventDefault();
	clearErrors();

	const id = document.getElementById('editPromotionId').value;

	const formData = {
		makm: parseInt(id),
		tenkm: document.getElementById('editTenkm').value.trim(),
		loaiKm: document.getElementById('editLoaiKm').value,
		giaTri: parseFloat(document.getElementById('editGiaTri').value) || 1.0,
		moTa: document.getElementById('editMoTa').value.trim(),
		thoiGianBd: document.getElementById('editThoiGianBd').value,
		thoiGianKt: document.getElementById('editThoiGianKt').value,
		loaiKhachHang: document.getElementById('editCustomerRank').value || null,
		sanPhamIds: Array.from(document.querySelectorAll('#editRelatedProductsTable tbody select'))
			.map(s => parseInt(s.value))
			.filter(id => !isNaN(id))
	};

	console.log('[UPDATE PROMOTION] Payload:', formData);

	try {
		const response = await fetch(`/api/manager/promotions/edit/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		});

		const contentType = response.headers.get('content-type') || '';

		if (!response.ok) {
			if (contentType.includes('application/json')) {
				const errorData = await response.json();
				console.log('📋 Error JSON:', errorData);

				// map lỗi backend về form edit
				// khi nhận lỗi backend
				if (errorData.errors) {
					Object.keys(errorData.errors).forEach(key => {
						const errorDiv = document.getElementById(`edit${key}-error`);
						if (errorDiv) errorDiv.textContent = errorData.errors[key];
					});
				}
				else if (errorData.message) {
					alert(`❌ ${errorData.message}`);
				} else {
					displayErrors(errorData);
				}
			} else {
				const textError = await response.text();
				console.log('📋 Error Text:', textError);
				alert(`❌ Lỗi (${response.status}):\n${textError.substring(0, 500)}`);
				showGlobalError(textError);
			}
			return;
		}

		const updated = await response.json();
		alert(`✅ Cập nhật thành công: ${updated.tenkm}`);
		closeModal('editPromotionModal');
		await loadPromotionStats();
		await loadPromotions(currentPage);

	} catch (err) {
		console.error("❌ Network/Parse Error:", err);
		alert(`❌ Lỗi kết nối: ${err.message}`);
	}
}





// --- XÓA KHUYẾN MÃI ---
async function deletePromotion(makm) {
	if (!confirm("Bạn có chắc muốn xóa khuyến mãi này không?")) {
		return;
	}

	try {
		const response = await fetch(`/api/manager/promotions/${makm}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			alert("Xóa khuyến mãi thành công!");
			await loadPromotionStats();
			await loadPromotions(currentPage);
		} else {
			const text = await response.text();
			throw new Error(text);
		}
	} catch (error) {
		console.error(error);
		alert("Đã có lỗi xảy ra: " + error.message);
	}
}

// --- SỰ KIỆN KHI TRANG ĐƯỢC TẢI ---
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOM Content Loaded - Starting initialization');


	// ================= ẨN / HIỆN GIÁ TRỊ THEO LOẠI KHUYẾN MÃI =================
	function toggleGiaTriField() {
		const loaiKmSelect = document.getElementById('loaiKm');
		const giaTriGroup = document.querySelector('#giaTri').closest('.form-group');

		if (!loaiKmSelect || !giaTriGroup) return;

		const value = loaiKmSelect.value;
		if (value === 'PERCENT' || value === 'AMOUNT') {
			giaTriGroup.style.display = 'block';
		} else {
			giaTriGroup.style.display = 'none';
			document.getElementById('giaTri').value = ''; // reset value khi ẩn
		}
	}

	// Gắn sự kiện change cho dropdown loại khuyến mãi
	const loaiKmSelect = document.getElementById('loaiKm');
	if (loaiKmSelect) {
		loaiKmSelect.addEventListener('change', toggleGiaTriField);
	}

	// Load dữ liệu ban đầu
	loadPromotionStats();
	loadPromotions(0);

	// Form tìm kiếm
	const searchForm = document.getElementById('searchFilterForm');
	if (searchForm) {
		searchForm.addEventListener('submit', e => {
			e.preventDefault();
			loadPromotions(0);
		});
	}

	// Filter dropdowns
	const productFilter = document.getElementById('productFilter');
	if (productFilter) {
		productFilter.addEventListener('change', () => loadPromotions(0));
	}

	const statusFilter = document.getElementById('statusFilter');
	if (statusFilter) {
		statusFilter.addEventListener('change', () => loadPromotions(0));
	}

	// Phân trang
	const paginationDiv = document.getElementById('promotionPagination');
	if (paginationDiv) {
		paginationDiv.addEventListener('click', e => {
			e.preventDefault();
			const target = e.target.closest('a');
			if (target && target.dataset.page) {
				loadPromotions(parseInt(target.dataset.page, 10));
			}
		});
	}

	// Form thêm khuyến mãi
	const addForm = document.getElementById('promotionForm');
	if (addForm) {
		addForm.addEventListener('submit', e => {
			e.preventDefault();
			createPromotion();
		});
	}

	// Form edit khuyến mãi
	const editForm = document.getElementById('editPromotionForm');
	if (editForm) {
		editForm.addEventListener('submit', submitEditPromotion);
	}
});

// --- MỞ / ĐÓNG MODAL ---
function openModal(modalId) {
	const modal = document.getElementById(modalId);
	if (!modal) {
		console.error('❌ Không tìm thấy modal: ' + modalId);
		return;
	}
	modal.classList.add('show');
	document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
	const modal = document.getElementById(modalId);
	if (!modal) return;
	modal.classList.remove('show');
	document.body.style.overflow = '';
}

document.addEventListener('click', function(event) {
	if (event.target.classList.contains('modal')) {
		const modalId = event.target.id;
		if (modalId) closeModal(modalId);
	}
});

document.addEventListener('keydown', function(event) {
	if (event.key === 'Escape') {
		const modals = document.querySelectorAll('.modal.show');
		modals.forEach(modal => closeModal(modal.id));
	}
});


function clearErrors() {
	document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}
function displayErrors(errors = {}) {
	clearErrors();

	console.log('🔍 Errors object nhận được:', errors);
	const globalErrors = [];

	if (!errors) return;

	// Nếu backend trả { message: "..." }
	if (errors.message) {
		alert(`❌ ${errors.message}`);
		return;
	}

	// Nếu backend trả object { field: message, ... }
	Object.entries(errors).forEach(([field, message]) => {
		if (message == null) return; // bỏ qua null hoặc undefined

		const el = document.getElementById(`${field}-error`);
		if (el) {
			el.textContent = message;
			console.log(`✅ Hiển thị lỗi cho field: ${field}`);
		} else {
			console.log(`⚠️ Không tìm thấy element: ${field}-error`);
			globalErrors.push(`${field}: ${message}`);
		}
	});

	if (globalErrors.length) {
		alert("⚠️ Lỗi validation:\n" + globalErrors.join("\n"));
	}
}
