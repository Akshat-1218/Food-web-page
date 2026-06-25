// gsap
function animateFirstPage(){

var tl = gsap.timeline();
tl.from("#nav",{
    y:-40,
    duration:1,
    stagger:1,
    opacity:0
})
tl.from("#content",{
    y:-20,
    transition:0.5,
    opacity:0,
    delay:-0.3
})
tl.from("#center img",{
    x:20,
    transition:0.5,
    opacity:0,
    delay:-0.4
})
}

animateFirstPage();

const cart = [];

// open/close the cart drawer
function toggleCart() {
    document.getElementById("cart-drawer").classList.toggle("open");
}

// add item or increase qty if already exists
function addToCart(item) {
    const found = cart.find(c => c.name === item.name);
    if (found) {
        found.qty++;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    renderCart();
    showToast("🍽️ " + item.name + " added!");
}

// decrease qty or remove item completely
function removeFromCart(name) {
    const idx = cart.findIndex(c => c.name === name);
    if (idx === -1) return;

    if (cart[idx].qty > 1) {
        cart[idx].qty--;
    } else {
        cart.splice(idx, 1);
    }
    renderCart();
}

// update badge, total, and cart item list
function renderCart() {
    const itemsEl = document.getElementById("cart-items");
    const badge = document.getElementById("cart-badge");
    const totalSpan = document.querySelector("#cart-total span");

    const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
    const totalPrice = cart.reduce((sum, c) => sum + c.qty * c.price, 0);

    badge.textContent = totalItems;
    badge.style.display = totalItems === 0 ? "none" : "flex";
    totalSpan.textContent = "$" + totalPrice.toFixed(2);

    if (cart.length === 0) {
        itemsEl.innerHTML = '<p id="empty-cart">Your cart is empty 🥺<br><small>Add something delicious!</small></p>';
        return;
    }

    itemsEl.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span class="cart-item-name">${item.name}</span>
            <div class="cart-qty-ctrl">
                <button onclick="removeFromCart('${item.name}')">−</button>
                <span>${item.qty}</span>
                <button onclick="addToCart({name:'${item.name}',price:${item.price}})">+</button>
            </div>
            <span class="cart-item-price">$${(item.qty * item.price).toFixed(2)}</span>
        </div>
    `).join("");
}

function handleCheckout() {
    if (cart.length === 0) {
        showToast("⚠️ Add some items first!");
        return;
    }
    toggleCart();
    showToast("✅ Order placed! On its way 🛵", "success");
    cart.length = 0;
    renderCart();
}

// briefly change button text to confirm the add
function animateBtn(btn) {
    btn.textContent = "✓ Added!";
    btn.style.background = "#28a745";
    btn.style.color = "#fff";
    setTimeout(() => {
        btn.textContent = "Add To Cart";
        btn.style.background = "";
        btn.style.color = "";
    }, 1200);
}

// small toast that pops at the bottom
function showToast(msg, type) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast" + (type ? " " + type : "");
    toast.textContent = msg;
    document.body.appendChild(toast);

    // slight delay so the transition actually plays
    requestAnimationFrame(() => {
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 400);
        }, 2600);
    });
}

function initCart() {
    // inject the drawer markup once on load
    const drawer = document.createElement("div");
    drawer.id = "cart-drawer";
    drawer.innerHTML = `
        <div id="cart-overlay"></div>
        <div id="cart-panel">
            <div id="cart-header">
                <h2>🛒 Your Order</h2>
                <button id="close-cart">✕</button>
            </div>
            <div id="cart-items"></div>
            <div id="cart-footer">
                <div id="cart-total">Total: <span>$0.00</span></div>
                <button id="checkout-btn">Checkout →</button>
            </div>
        </div>
    `;
    document.body.appendChild(drawer);

    // clicking the bag icon opens the drawer
    const bagIcon = document.querySelector(".ri-shopping-bag-line");
    if (bagIcon) {
        const badge = document.createElement("span");
        badge.id = "cart-badge";
        badge.textContent = "0";
        badge.style.display = "none";
        bagIcon.parentElement.style.position = "relative";
        bagIcon.parentElement.style.cursor = "pointer";
        bagIcon.parentElement.appendChild(badge);
        bagIcon.parentElement.addEventListener("click", toggleCart);
    }

    document.getElementById("close-cart").addEventListener("click", toggleCart);
    document.getElementById("cart-overlay").addEventListener("click", toggleCart);
    document.getElementById("checkout-btn").addEventListener("click", handleCheckout);

    // wire up all the food card buttons
    document.querySelectorAll(".card1 button").forEach(btn => {
        btn.addEventListener("click", e => {
            const card = e.target.closest(".card1");
            const name = card.querySelector("h1").textContent;
            const price = parseFloat(card.querySelector("p").textContent.replace("$", ""));
            addToCart({ name, price });
            animateBtn(e.target);
        });
    });

    // newsletter — just checks for an @ sign
    const subBtn = document.querySelector("#newsletter button");
    if (subBtn) {
        subBtn.addEventListener("click", () => {
            const input = document.querySelector("#newsletter input");
            if (!input.value.includes("@")) {
                showToast("⚠️ Enter a valid email address!");
                return;
            }
            showToast("✅ Subscribed! Welcome to Foodie. 🎉", "success");
            input.value = "";
        });
    }

    renderCart();
}

function initMenuSearch() {
    const menuSection = document.querySelector(".menu");
    if (!menuSection) return;

    // drop the search bar and filter buttons right below the heading
    const wrap = document.createElement("div");
    wrap.id = "menu-search-wrap";
    wrap.innerHTML = `
        <input type="text" id="menu-search" placeholder="🔍  Search menu items..." />
        <div id="menu-filters">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="under10">Under $10</button>
            <button class="filter-btn" data-filter="over10">Over $10</button>
        </div>
    `;
    menuSection.insertAdjacentElement("afterend", wrap);

    const input = document.getElementById("menu-search");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const cards = document.querySelectorAll(".card1");
    const menuRow = document.querySelector(".menu-card-row");
    let activeFilter = "all";

    function applyFilters() {
        const query = input.value.toLowerCase().trim();
        let anyVisible = false;

        cards.forEach(card => {
            const name = card.querySelector("h1").textContent.toLowerCase();
            const price = parseFloat(card.querySelector("p").textContent.replace("$", ""));

            const matchesName = name.includes(query);
            const matchesPrice =
                activeFilter === "all" ||
                (activeFilter === "under10" && price < 10) ||
                (activeFilter === "over10" && price >= 10);

            const show = matchesName && matchesPrice;
            card.style.display = show ? "flex" : "none";
            if (show) anyVisible = true;
        });

        // show/hide "no results" message
        let noResult = document.getElementById("no-results");
        if (!anyVisible) {
            if (!noResult) {
                noResult = document.createElement("p");
                noResult.id = "no-results";
                noResult.textContent = "😕 No items match your search.";
                menuRow.insertAdjacentElement("afterend", noResult);
            }
        } else {
            if (noResult) noResult.remove();
        }
    }

    input.addEventListener("input", applyFilters);

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeFilter = btn.dataset.filter;
            applyFilters();
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initCart();
    initMenuSearch();
});