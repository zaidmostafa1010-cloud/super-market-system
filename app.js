import { createClient } from
  "https://esm.sh/@supabase/supabase-js@2";

// ضع بيانات مشروعك هنا
const SUPABASE_URL = "YOUR_PROJECT_URL";
const SUPABASE_KEY = "YOUR_ANON_OR_PUBLISHABLE_KEY";

const db = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let products = [];
let cart = {};
let currentLang = "ar";

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]
  );
}

// تغيير اللغة
function changeLanguage() {
  currentLang =
    currentLang === "ar" ? "en" : "ar";

  document.documentElement.lang = currentLang;
  document.documentElement.dir =
    currentLang === "ar" ? "rtl" : "ltr";

  $("languageBtn").textContent =
    currentLang === "ar" ? "English" : "العربية";

  $("heroTitle").textContent =
    currentLang === "ar"
      ? "كل احتياجات بيتك في مكان واحد"
      : "Everything Your Home Needs";

  $("heroText").textContent =
    currentLang === "ar"
      ? "تسوق منتجاتك اليومية بسهولة وبأفضل الأسعار"
      : "Shop your daily essentials at great prices";

  $("productsTitle").textContent =
    currentLang === "ar" ? "منتجاتنا" : "Our Products";

  $("cartTitle").textContent =
    currentLang === "ar" ? "سلة المشتريات" : "Shopping Cart";

  $("checkoutTitle").textContent =
    currentLang === "ar" ? "بيانات التوصيل" : "Delivery Information";

  $("totalLabel").textContent =
    currentLang === "ar" ? "الإجمالي:" : "Total:";

  $("paymentText").textContent =
    currentLang === "ar"
      ? "طريقة الدفع: الدفع عند الاستلام"
      : "Payment: Cash on Delivery";

  $("orderBtn").textContent =
    currentLang === "ar" ? "تأكيد الطلب" : "Confirm Order";

  $("customerName").placeholder =
    currentLang === "ar" ? "الاسم بالكامل" : "Full Name";

  $("customerPhone").placeholder =
    currentLang === "ar" ? "رقم الهاتف" : "Phone Number";

  $("customerAddress").placeholder =
    currentLang === "ar"
      ? "عنوان التوصيل بالتفصيل"
      : "Full Delivery Address";

  $("searchInput").placeholder =
    currentLang === "ar"
      ? "ابحث عن منتج..."
      : "Search Products...";

  renderProducts();
  renderCart();
}

// تحميل المنتجات
async function loadProducts() {

  $("productsGrid").textContent =
    currentLang === "ar"
      ? "جاري تحميل المنتجات..."
      : "Loading products...";

  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    $("productsGrid").textContent =
      "حدث خطأ في تحميل المنتجات";
    return;
  }

  products = data || [];

  renderProducts();
}

// عرض المنتجات
function renderProducts() {

  const search = $("searchInput").value
    .trim()
    .toLowerCase();

  const filtered = products.filter(product => {
    const name = currentLang === "ar"
      ? product.name_ar
      : product.name_en;

    return String(name || "")
      .toLowerCase()
      .includes(search);
  });

  if (filtered.length === 0) {
    $("productsGrid").textContent =
      currentLang === "ar"
        ? "لا توجد منتجات"
        : "No products found";

    return;
  }

  $("productsGrid").innerHTML =
    filtered.map(product => {

      const name = currentLang === "ar"
        ? product.name_ar
        : product.name_en;

      const description = currentLang === "ar"
        ? product.description_ar
        : product.description_en;

      const image = product.image_url
        ? escapeHTML(product.image_url)
        : "";

      const available = product.stock > 0;

      return `
        <div class="product-card">

          <img
            src="${image}"
            alt="${escapeHTML(name)}"
            loading="lazy"
            onerror="this.style.display='none'"
          >

          <h3>${escapeHTML(name)}</h3>

          <p>${escapeHTML(description)}</p>

          <p class="price">
            ${Number(product.price).toFixed(2)} EGP
          </p>

          <p class="stock-text">
            ${
              available
                ? currentLang === "ar"
                  ? `المتاح: ${product.stock}`
                  : `Available: ${product.stock}`
                : currentLang === "ar"
                  ? "نفد المخزون"
                  : "Out of Stock"
            }
          </p>

          <button
            class="add-btn"
            data-action="add"
            data-id="${product.id}"
            ${!available ? "disabled" : ""}
          >
            ${
              currentLang === "ar"
                ? "أضف للسلة"
                : "Add to Cart"
            }
          </button>

        </div>
      `;
    }).join("");
}

// إضافة منتج للسلة
function addToCart(id) {

  const product = products.find(p => p.id === id);

  if (!product) return;

  const currentQty = cart[id]?.quantity || 0;

  if (currentQty >= product.stock) {
    alert(
      currentLang === "ar"
        ? "الكمية غير متاحة"
        : "Not enough stock"
    );
    return;
  }

  if (!cart[id]) {
    cart[id] = {
      product,
      quantity: 0
    };
  }

  cart[id].quantity++;

  renderCart();
}

// التحكم في السلة
function changeQuantity(id, amount) {

  const item = cart[id];

  if (!item) return;

  const newQty = item.quantity + amount;

  if (newQty <= 0) {
    delete cart[id];
  } else if (newQty <= item.product.stock) {
    item.quantity = newQty;
  } else {
    alert("الكمية المطلوبة غير متاحة");
  }

  renderCart();
}

// عرض السلة
function renderCart() {

  const items = Object.values(cart);

  const count = items.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  const total = items.reduce(
    (sum, item) =>
      sum + item.product.price * item.quantity,
    0
  );

  $("cartCount").textContent = count;

  $("cartTotal").textContent =
    total.toFixed(2);

  $("cartItems").innerHTML = items.map(item => {

    const name = currentLang === "ar"
      ? item.product.name_ar
      : item.product.name_en;

    return `
      <div class="cart-item">

        <div>
          <strong>${escapeHTML(name)}</strong>

          <p>
            ${Number(item.product.price).toFixed(2)} EGP
          </p>
        </div>

        <div>
          <button
            data-action="minus"
            data-id="${item.product.id}"
          >-</button>

          ${item.quantity}

          <button
            data-action="plus"
            data-id="${item.product.id}"
          >+</button>
        </div>

      </div>
    `;
  }).join("");
}

// أزرار المنتجات والسلة
document.addEventListener("click", event => {

  const button = event.target.closest(
    "button[data-action]"
  );

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "add") addToCart(id);

  if (action === "plus") changeQuantity(id, 1);

  if (action === "minus") changeQuantity(id, -1);

});

// البحث
$("searchInput").addEventListener(
  "input",
  renderProducts
);

// تغيير اللغة
$("languageBtn").addEventListener(
  "click",
  changeLanguage
);

// الانتقال للسلة
$("cartBtn").addEventListener("click", () => {
  $("cartSection").scrollIntoView({
    behavior: "smooth"
  });
});

// تأكيد الطلب
$("checkoutForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const items = Object.values(cart);

    if (items.length === 0) {
      alert("السلة فارغة");
      return;
    }

    const customerName =
      $("customerName").value.trim();

    const phone =
      $("customerPhone").value.trim();

    const address =
      $("customerAddress").value.trim();

    if (!customerName || !phone || !address) {
      alert("من فضلك أكمل بيانات التوصيل");
      return;
    }

    const orderItems = items.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));

    const button = $("orderBtn");

    button.disabled = true;
    button.textContent = "جاري تسجيل الطلب...";

    try {

      const { data, error } = await db.rpc(
        "place_order",
        {
          p_customer_name: customerName,
          p_phone: phone,
          p_address: address,
          p_items: orderItems
        }
      );

      if (error) throw error;

      // عرض الفاتورة
      showInvoice(data, customerName);

      cart = {};

      $("checkoutForm").reset();

      $("cartSection").hidden = true;

      await loadProducts();

      renderCart();

      $("invoiceSection").hidden = false;

      $("invoiceSection").scrollIntoView({
        behavior: "smooth"
      });

    } catch (error) {

      console.error(error);

      alert(
        currentLang === "ar"
          ? "تعذر تسجيل الطلب: " + error.message
          : "Order failed: " + error.message
      );

    } finally {

      button.disabled = false;

      button.textContent =
        currentLang === "ar"
          ? "تأكيد الطلب"
          : "Confirm Order";
    }
  }
);

// إنشاء الفاتورة
function showInvoice(data, customerName) {

  const lines = data.items.map(item => {

    const name = currentLang === "ar"
      ? item.name_ar
      : item.name_en;

    return `
      <tr>
        <td>${escapeHTML(name)}</td>
        <td>${item.quantity}</td>
        <td>${Number(item.price).toFixed(2)}</td>
        <td>${Number(item.line_total).toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  $("invoiceContent").innerHTML = `

    <h2>
      ${currentLang === "ar"
        ? "فاتورة المشتريات"
        : "Purchase Invoice"}
    </h2>

    <p>
      ${currentLang === "ar" ? "رقم الطلب:" : "Order ID:"}
      ${escapeHTML(data.order_id)}
    </p>

    <p>
      ${currentLang === "ar" ? "العميل:" : "Customer:"}
      ${escapeHTML(customerName)}
    </p>

    <p>
      ${currentLang === "ar" ? "التاريخ:" : "Date:"}
      ${new Date(data.created_at).toLocaleString(
        currentLang === "ar" ? "ar-EG" : "en-US"
      )}
    </p>

    <table width="100%" border="1" cellpadding="10">

      <thead>
        <tr>
          <th>${currentLang === "ar" ? "المنتج" : "Product"}</th>
          <th>${currentLang === "ar" ? "الكمية" : "Quantity"}</th>
          <th>${currentLang === "ar" ? "السعر" : "Price"}</th>
          <th>${currentLang === "ar" ? "الإجمالي" : "Total"}</th>
        </tr>
      </thead>

      <tbody>
        ${lines}
      </tbody>

    </table>

    <h3>
      ${currentLang === "ar" ? "الإجمالي النهائي:" : "Grand Total:"}
      ${Number(data.total).toFixed(2)} EGP
    </h3>

    <p>
      ${currentLang === "ar"
        ? "شكراً لطلبك من متجرنا"
        : "Thank you for shopping with us"}
    </p>
  `;
}

// تشغيل الموقع
loadProducts();