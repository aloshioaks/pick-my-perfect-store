import { getSampleProducts, normalizeProduct, formatPrice } from "./catalog.js";
import { shopConfig } from "./config.js";
import { hasSupabaseConfig, supabase } from "./supabase.js";
import { startWhatsAppCheckout } from "./checkout/whatsapp.js";
import "./styles.css";

const state = {
  products: [],
  category: "All",
  query: "",
  sort: "featured",
  maxPrice: 70,
  cart: loadCart(),
  selectedProduct: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const storefront = $("#storefront");
const adminPage = $("#admin-page");
const productGrid = $("#product-grid");
const categoryTabs = $("#category-tabs");
const drawer = $("#cart-drawer");
const drawerBackdrop = $("#drawer-backdrop");
const productDialog = $("#product-dialog");
let toastTimeout;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("pick-my-perfect-cart") ?? "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => typeof item.id === "string" && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch (error) {
    console.warn("The saved shopping bag could not be read.", error);
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem("pick-my-perfect-cart", JSON.stringify(state.cart));
  } catch (error) {
    console.error("The shopping bag could not be saved.", error);
    showToast("Your bag could not be saved on this device. Please keep this tab open.");
  }
}

function showToast(message) {
  const region = $("#toast-region");
  region.textContent = message;
  region.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => region.classList.remove("is-visible"), 4200);
}

function getVisibleProducts() {
  const query = state.query.trim().toLocaleLowerCase();
  const visible = state.products.filter((product) => {
    const matchesCategory = state.category === "All" || product.category === state.category;
    const matchesPrice = product.price <= state.maxPrice;
    const matchesQuery =
      !query ||
      `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase().includes(query);
    return product.is_active && matchesCategory && matchesPrice && matchesQuery;
  });

  if (state.sort === "name-asc") visible.sort((a, b) => a.name.localeCompare(b.name));
  if (state.sort === "price-asc") visible.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  if (state.sort === "price-desc") visible.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
  if (state.sort === "featured") visible.sort((a, b) => a.featured_order - b.featured_order);
  return visible;
}

function renderCategories() {
  const categories = ["All", ...new Set(state.products.map((product) => product.category).filter(Boolean))];
  categoryTabs.innerHTML = categories
    .map((category) => {
      const active = state.category === category;
      return `<button type="button" class="category-tab${active ? " is-active" : ""}" data-category="${escapeAttribute(category)}" aria-pressed="${active}">${escapeHtml(category)}</button>`;
    })
    .join("");
}

function getPriceCeiling() {
  return Math.max(70, ...state.products.map((product) => product.price));
}

function syncPriceRange() {
  const priceRange = $("#price-range");
  const previousCeiling = Number(priceRange.max);
  const ceiling = Math.ceil(getPriceCeiling());
  if (state.maxPrice >= previousCeiling) state.maxPrice = ceiling;
  priceRange.max = String(ceiling);
  priceRange.value = String(Math.min(state.maxPrice, ceiling));
  $("#price-range-value").textContent = formatPrice(state.maxPrice);
}

function renderProducts() {
  syncPriceRange();
  const products = getVisibleProducts();
  productGrid.innerHTML = products
    .map((product) => `
      <article class="product-card">
        <button class="product-image-button" type="button" data-action="details" data-id="${escapeAttribute(product.id)}" aria-label="View ${escapeAttribute(product.name)} details">
          <span class="product-image-wrap"><img src="${escapeAttribute(product.image)}" alt="${escapeAttribute(product.name)}" loading="lazy" /></span>
          <span class="product-image-action">View details <span aria-hidden="true">↗</span></span>
        </button>
        <div class="product-meta">
          <span class="product-category">${escapeHtml(product.category)}</span>
          <button type="button" class="quick-add" data-action="add" data-id="${escapeAttribute(product.id)}" aria-label="Add ${escapeAttribute(product.name)} to your bag">+</button>
        </div>
        <button class="product-title-button" type="button" data-action="details" data-id="${escapeAttribute(product.id)}"><h3>${escapeHtml(product.name)}</h3></button>
        <div class="product-price-line"><span>${formatPrice(product.price)}</span><span>${escapeHtml(product.size)}</span></div>
      </article>
    `)
    .join("");

  $("#results-count").textContent = `Showing ${products.length} ${products.length === 1 ? "artwork" : "artworks"}`;
  $("#empty-state").hidden = products.length > 0;
  productGrid.hidden = products.length === 0;
  const hasFilters = state.category !== "All" || state.query !== "" || state.maxPrice < 70;
  $("#clear-filters").hidden = !hasFilters;
  renderCategories();
}

function getCartLines() {
  return state.cart
    .map((item) => {
      const product = state.products.find((candidate) => candidate.id === item.id);
      return product ? { product, quantity: item.quantity } : null;
    })
    .filter(Boolean);
}

function renderCart() {
  const lines = getCartLines();
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  $("#cart-count").textContent = totalQuantity;
  $("#drawer-count").textContent = `(${totalQuantity})`;
  $("#cart-empty").hidden = lines.length > 0;
  $("#cart-footer").hidden = lines.length === 0;
  $("#cart-items").innerHTML = lines.map(({ product, quantity }) => `
    <article class="cart-item">
      <img src="${escapeAttribute(product.image)}" alt="" />
      <div class="cart-item-info">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <span class="cart-item-size">${escapeHtml(product.size)}</span>
        <div class="quantity-control" aria-label="Quantity for ${escapeAttribute(product.name)}">
          <button type="button" data-action="quantity" data-id="${escapeAttribute(product.id)}" data-change="-1" aria-label="Decrease quantity">−</button>
          <span>${quantity}</span>
          <button type="button" data-action="quantity" data-id="${escapeAttribute(product.id)}" data-change="1" aria-label="Increase quantity">+</button>
          <button type="button" class="remove-item" data-action="remove" data-id="${escapeAttribute(product.id)}">Remove</button>
        </div>
      </div>
      <strong class="cart-item-price">${formatPrice(product.price * quantity)}</strong>
    </article>
  `).join("");
  $("#cart-subtotal").textContent = formatPrice(total);
}

function renderProductDetails(product) {
  state.selectedProduct = product;
  $("#product-detail-content").innerHTML = `
    <div class="product-detail">
      <div class="product-detail-image"><img src="${escapeAttribute(product.image)}" alt="${escapeAttribute(product.name)}" /></div>
      <div class="product-detail-copy">
        <p class="eyebrow">${escapeHtml(product.category)}</p>
        <h2>${escapeHtml(product.name)}</h2>
        <p class="product-detail-price">${formatPrice(product.price)}</p>
        <p class="product-detail-description">${escapeHtml(product.description)}</p>
        <dl class="product-spec"><div><dt>Size</dt><dd>${escapeHtml(product.size)}</dd></div><div><dt>Type</dt><dd>Acrylic print</dd></div></dl>
        <p class="product-detail-note">Shipping and availability can be confirmed with us on WhatsApp.</p>
        <div class="detail-actions">
          <button type="button" class="button button-dark" data-action="buy-now" data-id="${escapeAttribute(product.id)}">Buy through WhatsApp <span aria-hidden="true">↗</span></button>
          <button type="button" class="button button-outline" data-action="add" data-id="${escapeAttribute(product.id)}">Add to bag</button>
        </div>
      </div>
    </div>
  `;
  productDialog.showModal();
}

function addToCart(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product) {
    showToast("That artwork is no longer available.");
    return;
  }
  const existing = state.cart.find((item) => item.id === id);
  if (existing) existing.quantity += 1;
  else state.cart.push({ id, quantity: 1 });
  saveCart();
  renderCart();
  showToast(`${product.name} added to your bag.`);
}

function openCart() {
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
  document.body.classList.add("drawer-open");
  $("#close-cart").focus();
}

function closeCart() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.hidden = true;
  document.body.classList.remove("drawer-open");
}

function resetFilters() {
  state.category = "All";
  state.query = "";
  state.maxPrice = Math.ceil(getPriceCeiling());
  $("#search-input").value = "";
  $("#price-range").value = String(Math.ceil(state.maxPrice));
  $("#price-range-value").textContent = formatPrice(state.maxPrice);
  renderProducts();
}

function renderStorefront() {
  storefront.hidden = false;
  adminPage.hidden = true;
  renderCategories();
  renderProducts();
  renderCart();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function escapeAttribute(value = "") {
  return escapeHtml(value);
}

function setAdminMessage(message, type = "info") {
  const status = $("#admin-status");
  if (!status) return;
  status.textContent = message;
  status.className = `admin-status is-${type}`;
}

function renderAdminShell() {
  closeCart();
  if (productDialog.open) productDialog.close();
  storefront.hidden = true;
  adminPage.hidden = false;
  adminPage.innerHTML = `
    <header class="admin-topbar">
      <a class="brand-lockup" href="#" aria-label="Back to shop">
        <img src="/assets/logo.JPG" alt="" class="brand-mark" />
        <span class="brand-copy"><span class="brand-name">pick my perfect</span><span class="brand-tagline">Store admin</span></span>
      </a>
      <a href="#" class="text-link">← Back to shop</a>
    </header>
    <main class="admin-content">
      <p class="eyebrow"><span class="eyebrow-line"></span> SHOP MANAGEMENT</p>
      <h1>Your product studio</h1>
      <p class="admin-intro">Add and update the artworks in your collection. Changes appear in the storefront when saved.</p>
      <div id="admin-workspace"><p class="admin-status" id="admin-status" role="status">Preparing your product studio...</p></div>
    </main>
  `;
}

function renderAdminSetup() {
  $("#admin-workspace").innerHTML = `
    <section class="admin-setup-card">
      <span class="admin-setup-icon" aria-hidden="true">✳</span>
      <h2>Connect your shop database</h2>
      <p>The storefront is running with sample listings. To manage products securely from any device, connect a Supabase project first.</p>
      <ol>
        <li>Create a Supabase project and run <code>supabase/setup.sql</code>.</li>
        <li>Copy <code>.env.example</code> to <code>.env.local</code>, then add your project URL and publishable/anon key.</li>
        <li>Restart the development server and create an admin user in Supabase.</li>
      </ol>
      <p class="admin-safety-note">The public key is safe to use in the browser because the database is protected by Row Level Security. Never add a service-role key here.</p>
      <a class="button button-dark" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase <span aria-hidden="true">↗</span></a>
    </section>
  `;
}

function renderAdminLogin() {
  $("#admin-workspace").innerHTML = `
    <section class="admin-login-card">
      <h2>Sign in to your shop</h2>
      <p>Use the admin account created in your Supabase dashboard.</p>
      <form id="admin-login-form" class="admin-form">
        <label>Email<input name="email" type="email" autocomplete="username" required /></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required /></label>
        <button class="button button-dark" type="submit">Sign in <span aria-hidden="true">↗</span></button>
      </form>
      <p class="admin-status" id="admin-status" role="status"></p>
    </section>
  `;
}

function renderAdminDashboard(user) {
  $("#admin-workspace").innerHTML = `
    <div class="admin-dashboard-heading">
      <div><span class="admin-signed-in">Signed in as ${escapeHtml(user.email ?? "shop admin")}</span><h2>Manage artworks <span class="admin-product-count">(${state.products.length})</span></h2></div>
      <button type="button" class="button button-outline button-small" id="admin-signout">Sign out</button>
    </div>
    <div class="admin-dashboard-grid">
      <section class="admin-editor-card">
        <h3 id="product-form-title">Add a new artwork</h3>
        <form class="admin-form" id="product-form">
          <input type="hidden" name="id" />
          <label>Product name<input name="name" required maxlength="100" placeholder="e.g. Shiva in Blue Light" /></label>
          <label>Category<input name="category" required maxlength="60" placeholder="e.g. Hindu & Indian Art" /></label>
          <label>Description<textarea name="description" rows="3" maxlength="500" placeholder="A short description of the artwork"></textarea></label>
          <div class="admin-form-row">
            <label>Price (£)<input name="price" type="number" min="0.01" step="0.01" value="70" required /></label>
            <label>Size<input name="size" value="24 × 16" required maxlength="40" /></label>
          </div>
          <label>Product image<input name="image" type="file" accept="image/*" /></label>
          <label class="checkbox-label"><input name="is_active" type="checkbox" checked /> Visible in the shop</label>
          <p class="admin-status" id="admin-status" role="status"></p>
          <div class="admin-form-actions">
            <button class="button button-dark" type="submit">Save artwork <span aria-hidden="true">↗</span></button>
            <button class="button button-outline" id="cancel-edit" type="button" hidden>Cancel edit</button>
          </div>
        </form>
      </section>
      <section class="admin-list-section">
        <h3>Your collection</h3>
        <div class="admin-product-list" id="admin-product-list"></div>
      </section>
    </div>
  `;
  renderAdminProducts();
}

function renderAdminProducts() {
  const list = $("#admin-product-list");
  if (!list) return;
  if (state.products.length === 0) {
    list.innerHTML = `<p class="admin-empty-list">Your collection is empty. Add your first artwork using the form.</p>`;
    return;
  }
  list.innerHTML = state.products.map((product) => `
    <article class="admin-product-row">
      <img src="${escapeAttribute(product.image)}" alt="" />
      <div class="admin-product-row-copy">
        <strong>${escapeHtml(product.name)}</strong>
        <span>${escapeHtml(product.category)} · ${formatPrice(product.price)} · ${product.is_active ? "Visible" : "Hidden"}</span>
      </div>
      <button class="text-button" type="button" data-admin-action="edit" data-id="${escapeAttribute(product.id)}">Edit</button>
      <button class="text-button danger-text" type="button" data-admin-action="delete" data-id="${escapeAttribute(product.id)}">Delete</button>
    </article>
  `).join("");
}

async function loadAdminProducts(user) {
  setAdminMessage("Loading your collection...");
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) {
    setAdminMessage(`Could not load products: ${error.message}`, "error");
    return false;
  }
  state.products = data.map(normalizeProduct);
  renderAdminDashboard(user);
  return true;
}

async function showAdmin() {
  renderAdminShell();
  if (!hasSupabaseConfig) {
    renderAdminSetup();
    return;
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      renderAdminLogin();
      setAdminMessage(`Could not check the admin session: ${error.message}`, "error");
      return;
    }
    if (!data.session) {
      renderAdminLogin();
      return;
    }
    await loadAdminProducts(data.session.user);
  } catch (error) {
    setAdminMessage(`Could not load the admin session: ${error.message}`, "error");
  }
}

async function uploadProductImage(file) {
  if (!file) return null;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

async function saveProduct(form) {
  const formData = new FormData(form);
  const id = String(formData.get("id") ?? "");
  const existing = state.products.find((product) => product.id === id);
  const file = formData.get("image");
  const imageFile = file instanceof File && file.size > 0 ? file : null;
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: Number(formData.get("price")),
    size: String(formData.get("size") ?? "").trim(),
    is_active: formData.get("is_active") === "on",
    featured_order: existing?.featured_order ?? state.products.length,
    image_url: existing?.image ?? "",
  };

  if (imageFile) values.image_url = await uploadProductImage(imageFile);
  if (!values.image_url) throw new Error("Please choose an image for this artwork.");

  const query = id
    ? supabase.from("products").update(values).eq("id", id)
    : supabase.from("products").insert(values);
  const { error } = await query;
  if (error) throw new Error(`Could not save artwork: ${error.message}`);

  if (!await loadAdminProducts((await supabase.auth.getUser()).data.user)) {
    throw new Error("Artwork was saved, but the updated collection could not be loaded.");
  }
  setAdminMessage("Artwork saved.", "success");
  showToast("Your artwork has been saved.");
}

async function deleteProduct(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product || !window.confirm(`Delete “${product.name}” from the shop?`)) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    setAdminMessage(`Could not delete artwork: ${error.message}`, "error");
    return;
  }
  if (await loadAdminProducts((await supabase.auth.getUser()).data.user)) showToast("Artwork deleted.");
}

function startBuyNow(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product) return;
  const result = startWhatsAppCheckout([{ product, quantity: 1 }]);
  if (!result.ok) showToast(result.message);
}

async function handleStoreAction(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const { action, id } = target.dataset;
  if (action === "details") {
    const product = state.products.find((item) => item.id === id);
    if (product) renderProductDetails(product);
  }
  if (action === "add") {
    addToCart(id);
    if (productDialog.open) productDialog.close();
  }
  if (action === "buy-now") startBuyNow(id);
  if (action === "remove") {
    state.cart = state.cart.filter((item) => item.id !== id);
    saveCart();
    renderCart();
  }
  if (action === "quantity") {
    const item = state.cart.find((entry) => entry.id === id);
    if (!item) return;
    item.quantity += Number(target.dataset.change);
    if (item.quantity <= 0) state.cart = state.cart.filter((entry) => entry.id !== id);
    saveCart();
    renderCart();
  }
}

function handleAdminAction(event) {
  const target = event.target.closest("[data-admin-action]");
  if (!target) return;
  const product = state.products.find((item) => item.id === target.dataset.id);
  if (!product) return;
  if (target.dataset.adminAction === "delete") {
    deleteProduct(product.id).catch((error) => setAdminMessage(error.message, "error"));
  }
  if (target.dataset.adminAction === "edit") {
    const form = $("#product-form");
    form.elements.id.value = product.id;
    form.elements.name.value = product.name;
    form.elements.category.value = product.category;
    form.elements.description.value = product.description;
    form.elements.price.value = String(product.price);
    form.elements.size.value = product.size;
    form.elements.is_active.checked = product.is_active;
    $("#product-form-title").textContent = "Edit artwork";
    $("#cancel-edit").hidden = false;
    $("#product-form").scrollIntoView({ behavior: "smooth", block: "start" });
    form.elements.name.focus();
  }
}

document.addEventListener("click", (event) => {
  if (event.target.closest("#open-cart")) openCart();
  if (event.target.closest("#close-cart") || event.target === drawerBackdrop) closeCart();
  if (event.target.closest("#continue-shopping")) {
    closeCart();
    $("#collection").scrollIntoView({ behavior: "smooth" });
  }
  if (event.target.closest("#checkout-button")) {
    const lines = getCartLines();
    if (lines.length === 0) return;
    const result = startWhatsAppCheckout(lines);
    if (!result.ok) showToast(result.message);
  }
  if (event.target.closest("#close-product-dialog")) productDialog.close();
  if (event.target === productDialog) productDialog.close();
  if (event.target.closest("#filter-toggle")) {
    const panel = $("#filter-panel");
    panel.hidden = !panel.hidden;
    $("#filter-toggle").setAttribute("aria-expanded", String(!panel.hidden));
  }
  if (event.target.closest("#clear-filters") || event.target.closest("#empty-clear")) resetFilters();
  const categoryLink = event.target.closest("[data-category-link]");
  if (categoryLink) {
    state.category = categoryLink.dataset.categoryLink;
    renderProducts();
  }
  if (event.target.closest("#admin-signout")) {
    supabase.auth.signOut().then(({ error }) => {
      if (error) setAdminMessage(`Could not sign out: ${error.message}`, "error");
      else showAdmin();
    }).catch((error) => setAdminMessage(`Could not sign out: ${error.message}`, "error"));
  }
  if (event.target.closest("#cancel-edit")) {
    $("#product-form").reset();
    $("#product-form").elements.id.value = "";
    $("#product-form-title").textContent = "Add a new artwork";
    $("#cancel-edit").hidden = true;
    $("#product-form").elements.price.value = "70";
    $("#product-form").elements.size.value = "24 × 16";
  }
});

document.addEventListener("click", handleStoreAction);
document.addEventListener("click", handleAdminAction);

categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderProducts();
});

$("#search-input").addEventListener("input", (event) => {
  state.query = event.target.value;
  renderProducts();
});

$("#sort-select").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderProducts();
});

$("#price-range").addEventListener("input", (event) => {
  state.maxPrice = Number(event.target.value);
  $("#price-range-value").textContent = formatPrice(state.maxPrice);
  renderProducts();
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "admin-login-form") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const submit = event.target.querySelector('button[type="submit"]');
    submit.disabled = true;
    supabase.auth.signInWithPassword({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    }).then(({ error }) => {
      if (error) {
        setAdminMessage(`Sign-in failed: ${error.message}`, "error");
        submit.disabled = false;
        return;
      }
      showAdmin();
    }).catch((error) => {
      setAdminMessage(`Sign-in failed: ${error.message}`, "error");
      submit.disabled = false;
    });
  }

  if (event.target.id === "product-form") {
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setAdminMessage("Saving artwork...");
    saveProduct(form)
      .then(() => {
        form.reset();
        form.elements.id.value = "";
        form.elements.price.value = "70";
        form.elements.size.value = "24 × 16";
        $("#product-form-title").textContent = "Add a new artwork";
        $("#cancel-edit").hidden = true;
      })
      .catch((error) => setAdminMessage(error.message, "error"))
      .finally(() => {
        const currentSubmit = $("#product-form button[type='submit']");
        if (currentSubmit) currentSubmit.disabled = false;
      });
  }
});

window.addEventListener("hashchange", () => {
  if (window.location.hash === "#admin") showAdmin();
  else renderStorefront();
});

async function loadStoreProducts() {
  if (!hasSupabaseConfig) {
    state.products = getSampleProducts();
    return;
  }
  const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("featured_order");
  if (error) throw new Error(`Could not load the product collection: ${error.message}`);
  state.products = data.map(normalizeProduct);
}

async function start() {
  $("#current-year").textContent = String(new Date().getFullYear());
  $("#price-range-value").textContent = formatPrice(70);
  try {
    await loadStoreProducts();
  } catch (error) {
    console.error(error);
    showToast(error.message);
    state.products = [];
  }
  if (window.location.hash === "#admin") await showAdmin();
  else renderStorefront();
}

start();
