	const products = [
		{ id: 1, brand: "Nordgreen", name: "Pioneer Automatic", price: 465, category: "Automatic", tag: "Bestseller", image: "photo-1523170335258-f5ed11844a49", alt: "Silver watch with a white dial and leather strap" },
		{ id: 2, brand: "Junghans", name: "Max Bill Quartz", price: 395, category: "Dress", tag: "Made in Germany", image: "photo-1524805444758-089113d48a6d", alt: "Minimalist classic watch with a clean dial" },
		{ id: 3, brand: "Baltic", name: "Aquascaphe Blue", price: 620, category: "Sport", tag: "Limited edition", image: "photo-1524592094714-0f0654e20314", alt: "Stainless steel diver watch with dark dial" },
		{ id: 4, brand: "Sternglas", name: "Naos Automatik", price: 429, category: "Automatic", tag: "Staff pick", image: "photo-1533139502658-0198f920d8e8", alt: "Elegant steel watch with a dark leather strap" },
		{ id: 5, brand: "Mondaine", name: "Classic 40 mm", price: 285, category: "Dress", tag: "Iconic design", image: "photo-1508685096489-7aacd43bd3b1", alt: "Swiss watch with a distinctive clean face" },
		{ id: 6, brand: "Lorier", name: "Falcon Series III", price: 499, category: "Sport", tag: "Just arrived", image: "photo-1547996160-81dfa63595aa", alt: "Sport watch with a polished steel bracelet" },
		{ id: 7, brand: "Tissot", name: "Heritage Small", price: 545, category: "Dress", tag: "Swiss made", image: "photo-1523275335684-37898b6baf30", alt: "Refined dress watch with a light dial" },
		{ id: 8, brand: "Seiko", name: "Presage Cocktail", price: 385, category: "Automatic", tag: "Customer favorite", image: "photo-1529139574466-a303027c1d8b", alt: "Automatic watch with detailed dial and leather strap" }
	];
	const imageUrl = (id, width = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
	const money = amount => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(amount);
	const readStore = key => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } };
	let cart = readStore("meridian-cart");
	let wishlist = readStore("meridian-wishlist");
	let activeFilter = "All";
	let toastTimer;
	const grid = document.getElementById("productGrid");
	const searchInput = document.getElementById("searchInput");
	const sortSelect = document.getElementById("sortSelect");
	const cartDrawer = document.getElementById("cartDrawer");
	const overlay = document.getElementById("overlay");
	const checkoutModal = document.getElementById("checkoutModal");

	function showToast(message) {
		const toast = document.getElementById("toast");
		toast.textContent = message;
		toast.classList.add("show");
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
	}
	function productCard(product) {
		const saved = Boolean(wishlist[product.id]);
		return `<article class="product-card">
			<div class="product-image"><img src="${imageUrl(product.image)}" alt="${product.alt}" loading="lazy"><span class="product-tag">${product.tag}</span>
				<button class="wish-button" data-wish="${product.id}" aria-label="${saved ? "Remove" : "Add"} ${product.name} ${saved ? "from" : "to"} wishlist" aria-pressed="${saved}"><svg viewBox="0 0 24 24"><path d="M20.5 8.8c0 5.2-8.5 10.2-8.5 10.2S3.5 14 3.5 8.8A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 8.5 1.5Z"/></svg></button>
			</div><div class="product-info"><div class="product-brand">${product.brand}</div><h3 class="product-name">${product.name}</h3><div class="product-bottom"><span class="product-price">${money(product.price)}</span><button class="add-button" data-add="${product.id}">Add to bag</button></div></div>
		</article>`;
	}
	function renderProducts() {
		const query = searchInput.value.trim().toLowerCase();
		let visible = products.filter(product => {
			const matchesCategory = activeFilter === "All" || (activeFilter === "Under 500" ? product.price < 500 : product.category === activeFilter);
			const matchesQuery = `${product.brand} ${product.name} ${product.category}`.toLowerCase().includes(query);
			const matchesWishlist = !showingWishlist || Boolean(wishlist[product.id]);
			return matchesCategory && matchesQuery && matchesWishlist;
		});
		if (sortSelect.value === "low") visible.sort((a, b) => a.price - b.price);
		if (sortSelect.value === "high") visible.sort((a, b) => b.price - a.price);
		if (sortSelect.value === "name") visible.sort((a, b) => a.name.localeCompare(b.name));
		grid.innerHTML = visible.length ? visible.map(productCard).join("") : `<p class="empty-results">No watches found. Try another search.</p>`;
		document.getElementById("shopTitle").textContent = showingWishlist ? "Your saved watches." : "Time, well spent.";
		document.querySelector(".section-heading .eyebrow").textContent = showingWishlist ? "Your wishlist" : "The collection";
	}
	let showingWishlist = false;
	function saveState() {
		localStorage.setItem("meridian-cart", JSON.stringify(cart));
		localStorage.setItem("meridian-wishlist", JSON.stringify(wishlist));
		renderCart();
		renderProducts();
	}
	function renderCart() {
		const entries = Object.entries(cart).filter(([, quantity]) => quantity > 0);
		const count = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
		const subtotal = entries.reduce((sum, [id, quantity]) => sum + products.find(product => product.id === Number(id)).price * quantity, 0);
		document.getElementById("cartCount").textContent = count;
		document.getElementById("drawerCount").textContent = `(${count})`;
		document.getElementById("cartSubtotal").textContent = money(subtotal);
		document.getElementById("cartItems").innerHTML = entries.length ? entries.map(([id, quantity]) => {
			const product = products.find(item => item.id === Number(id));
			return `<div class="cart-line"><img src="${imageUrl(product.image, 200)}" alt=""><div><h3>${product.name}</h3><p>${product.brand}</p><div class="quantity-controls"><button data-quantity="${id}" data-delta="-1" aria-label="Remove one ${product.name}">-</button><span>${quantity}</span><button data-quantity="${id}" data-delta="1" aria-label="Add one ${product.name}">+</button></div></div><span class="cart-line-price">${money(product.price * quantity)}</span></div>`;
		}).join("") : `<p class="cart-empty">Your bag is taking a little time out.</p>`;
		document.getElementById("checkoutButton").disabled = !entries.length;
		document.getElementById("checkoutButton").style.opacity = entries.length ? "1" : ".5";
		document.getElementById("wishCount").textContent = Object.values(wishlist).filter(Boolean).length;
	}
	function setFilter(filter) {
		activeFilter = filter;
		showingWishlist = false;
		document.querySelectorAll(".filter-button").forEach(button => button.classList.toggle("active", button.dataset.filter === filter));
		renderProducts();
	}
	function openCart() {
		cartDrawer.classList.add("open");
		overlay.classList.add("open");
		document.getElementById("closeCart").focus();
	}
	function closeCart() { cartDrawer.classList.remove("open"); overlay.classList.remove("open"); }
	function openCheckout() {
		if (!Object.keys(cart).length) return;
		closeCart();
		checkoutModal.classList.add("open");
		document.getElementById("customerName").focus();
	}

	document.querySelectorAll(".filter-button").forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
	document.querySelectorAll("[data-nav-filter]").forEach(link => link.addEventListener("click", () => setFilter(link.dataset.navFilter)));
	searchInput.addEventListener("input", renderProducts);
	sortSelect.addEventListener("change", renderProducts);
	document.getElementById("searchButton").addEventListener("click", () => {
		document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
		searchInput.focus({ preventScroll: true });
	});
	document.getElementById("viewAllButton").addEventListener("click", () => {
		searchInput.value = "";
		setFilter("All");
	});
	document.getElementById("wishlistButton").addEventListener("click", () => {
		showingWishlist = !showingWishlist;
		activeFilter = "All";
		document.querySelectorAll(".filter-button").forEach(button => button.classList.toggle("active", button.dataset.filter === "All"));
		document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
		renderProducts();
		if (showingWishlist && !Object.values(wishlist).some(Boolean)) showToast("Save a watch with the heart to find it here.");
	});
	document.getElementById("productGrid").addEventListener("click", event => {
		const addButton = event.target.closest("[data-add]");
		const wishButton = event.target.closest("[data-wish]");
		if (addButton) {
			const id = addButton.dataset.add;
			cart[id] = (cart[id] || 0) + 1;
			saveState();
			showToast(`${products.find(product => product.id === Number(id)).name} added to your bag.`);
		}
		if (wishButton) {
			const id = wishButton.dataset.wish;
			if (wishlist[id]) delete wishlist[id]; else wishlist[id] = true;
			saveState();
			showToast(wishlist[id] ? "Saved to your wishlist." : "Removed from your wishlist.");
		}
	});
	document.getElementById("cartItems").addEventListener("click", event => {
		const button = event.target.closest("[data-quantity]");
		if (!button) return;
		const id = button.dataset.quantity;
		cart[id] += Number(button.dataset.delta);
		if (cart[id] <= 0) delete cart[id];
		saveState();
	});
	document.getElementById("cartButton").addEventListener("click", openCart);
	document.getElementById("closeCart").addEventListener("click", closeCart);
	overlay.addEventListener("click", closeCart);
	document.getElementById("checkoutButton").addEventListener("click", openCheckout);
	document.getElementById("cancelCheckout").addEventListener("click", () => checkoutModal.classList.remove("open"));
	checkoutModal.addEventListener("click", event => { if (event.target === checkoutModal) checkoutModal.classList.remove("open"); });
	document.getElementById("checkoutForm").addEventListener("submit", async event => {
		event.preventDefault();
		const submitButton = event.currentTarget.querySelector('[type="submit"]');
		submitButton.disabled = true;
		try {
			const response = await fetch("/api/orders", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
				body: new URLSearchParams({
					name: document.getElementById("customerName").value.trim(),
					email: document.getElementById("customerEmail").value.trim(),
					address: document.getElementById("customerAddress").value.trim(),
					items: Object.entries(cart).map(([id, quantity]) => `${id}:${quantity}`).join(",")
				})
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Could not place the order.");
			const name = document.getElementById("customerName").value.trim().split(" ")[0];
			document.getElementById("successMessage").textContent = `Thank you, ${name}. Test order ${result.reference} received for ${money(result.total)}. No payment has been taken.`;
			event.currentTarget.style.display = "none";
			document.getElementById("successState").style.display = "block";
			cart = {};
			localStorage.setItem("meridian-cart", JSON.stringify(cart));
			renderCart();
		} catch (error) {
			showToast(error.message || "Could not connect to the store server.");
		} finally {
			submitButton.disabled = false;
		}
	});
	document.getElementById("continueShopping").addEventListener("click", () => {
		checkoutModal.classList.remove("open");
		document.getElementById("checkoutForm").reset();
		document.getElementById("checkoutForm").style.display = "block";
		document.getElementById("successState").style.display = "none";
	});
	document.getElementById("newsletterForm").addEventListener("submit", event => {
		event.preventDefault();
		event.currentTarget.reset();
		showToast("You're on the list. Watch this space.");
	});
	document.getElementById("menuButton").addEventListener("click", event => {
		const nav = document.getElementById("mainNav");
		const open = nav.classList.toggle("open");
		event.currentTarget.setAttribute("aria-expanded", String(open));
		event.currentTarget.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
	});
	document.querySelectorAll(".main-nav a").forEach(link => link.addEventListener("click", () => {
		document.getElementById("mainNav").classList.remove("open");
		document.getElementById("menuButton").setAttribute("aria-expanded", "false");
	}));
	document.addEventListener("keydown", event => {
		if (event.key === "Escape") { closeCart(); checkoutModal.classList.remove("open"); }
	});
	renderProducts();
	renderCart();
