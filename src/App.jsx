
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000/api";

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [token, setToken] = useState(
    localStorage.getItem("inventory_token") || ""
  );

  const [activePage, setActivePage] = useState("Dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showProductForm, setShowProductForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category_id: "",
    supplier_id: "",
    stock: "",
    unit: "pcs",
    sku: "",
  });

  const [transactionForm, setTransactionForm] = useState({
    product_id: "",
    type: "in",
    quantity: "",
    description: "",
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all([
        fetch(`${API}/products`),
        fetch(`${API}/categories`),
        fetch(`${API}/suppliers`),
        fetch(`${API}/stock-transactions`),
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error("Gagal mengambil data dari Laravel.");
      }

      const [productJson, categoryJson, supplierJson, transactionJson] =
        await Promise.all(responses.map((response) => response.json()));

      setProducts(
        Array.isArray(productJson.data)
          ? productJson.data
          : productJson.data?.data || []
      );

      setCategories(categoryJson.data || []);
      setSuppliers(supplierJson.data || []);
      setTransactions(transactionJson.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function saveToken(value) {
    setToken(value);
    localStorage.setItem("inventory_token", value);
  }

  function handleInputChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token.trim()) {
      setError("Masukkan Bearer Token terlebih dahulu.");
      return;
    }

    try {
      const response = await fetch(`${API}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
          category_id: Number(formData.category_id),
          supplier_id: Number(formData.supplier_id),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Produk gagal ditambahkan.");
      }

      setMessage("Produk berhasil ditambahkan!");
      setFormData({
        name: "",
        price: "",
        category_id: "",
        supplier_id: "",
        stock: "",
        unit: "pcs",
        sku: "",
      });

      setShowProductForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddTransaction(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token.trim()) {
      setError("Masukkan Bearer Token terlebih dahulu.");
      return;
    }

    try {
      const response = await fetch(`${API}/stock-transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...transactionForm,
          product_id: Number(transactionForm.product_id),
          quantity: Number(transactionForm.quantity),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Transaksi gagal disimpan.");
      }

      setMessage("Transaksi stok berhasil disimpan!");
      setTransactionForm({
        product_id: "",
        type: "in",
        quantity: "",
        description: "",
      });

      setShowTransactionForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  const totalValue = products.reduce(
    (total, product) =>
      total + Number(product.price || 0) * Number(product.stock || 0),
    0
  );

  const menuItems = [
    "Dashboard",
    "Produk",
    "Kategori",
    "Supplier",
    "Transaksi Stok",
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">I</div>
          <div>
            <h2>Inventori</h2>
            <span>Management System</span>
          </div>
        </div>

        <p className="menu-label">MENU UTAMA</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={`menu-item ${activePage === item ? "active" : ""}`}
              onClick={() => {
                setActivePage(item);
                setMessage("");
                setError("");
              }}
            >
              {item === "Dashboard" && "▦"}
              {item === "Produk" && "□"}
              {item === "Kategori" && "▤"}
              {item === "Supplier" && "♧"}
              {item === "Transaksi Stok" && "⇄"}
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span>Sistem Inventori</span>
          <small>Laravel API + React</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{activePage}</h1>
            <p>Kelola data inventori dengan mudah.</p>
          </div>

          <div className="user-profile">
            <div className="avatar">S</div>
            <span>Administrator</span>
          </div>
        </header>

        <section className="page-content">
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          {loading && <p>Memuat data...</p>}

          {activePage === "Dashboard" && (
            <>
              <div className="welcome-card">
                <span className="welcome-tag">INVENTORY OVERVIEW</span>
                <h2>Selamat Datang di Sistem Inventori</h2>
                <p>
                  Pantau produk, persediaan barang, dan transaksi stok
                  dalam satu dashboard.
                </p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span>Total Produk</span>
                  <h2>{products.length}</h2>
                  <small>Produk terdaftar</small>
                </div>

                <div className="stat-card">
                  <span>Total Kategori</span>
                  <h2>{categories.length}</h2>
                  <small>Kategori produk</small>
                </div>

                <div className="stat-card">
                  <span>Total Supplier</span>
                  <h2>{suppliers.length}</h2>
                  <small>Supplier terdaftar</small>
                </div>

                <div className="stat-card">
                  <span>Total Stok</span>
                  <h2>{totalStock}</h2>
                  <small>Jumlah seluruh stok</small>
                </div>
              </div>

              <div className="content-card">
                <div className="section-heading">
                  <div>
                    <h3>Produk Terbaru</h3>
                    <p>Daftar produk yang tersimpan dalam sistem.</p>
                  </div>
                  <button
                    className="add-button"
                    onClick={() => setActivePage("Produk")}
                  >
                    Lihat Produk
                  </button>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Nama Produk</th>
                        <th>SKU</th>
                        <th>Kategori</th>
                        <th>Harga</th>
                        <th>Stok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.sku || "-"}</td>
                          <td>{product.category?.name || "-"}</td>
                          <td>
                            Rp{Number(product.price).toLocaleString("id-ID")}
                          </td>
                          <td>{product.stock} {product.unit}</td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr><td colSpan="5">Belum ada produk.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="content-card">
                <h3>Ringkasan Nilai Persediaan</h3>
                <h2 className="inventory-value">
                  Rp{totalValue.toLocaleString("id-ID")}
                </h2>
                <p>
                  Perkiraan nilai seluruh produk berdasarkan harga dan stok.
                </p>
              </div>
            </>
          )}

          {activePage === "Produk" && (
            <div className="content-card">
              <div className="section-heading">
                <div>
                  <h3>Data Produk</h3>
                  <p>Kelola daftar produk inventori.</p>
                </div>
                <button
                  className="add-button"
                  onClick={() => setShowProductForm(!showProductForm)}
                >
                  {showProductForm ? "Tutup Form" : "+ Tambah Produk"}
                </button>
              </div>

              {showProductForm && (
                <form className="product-form" onSubmit={handleAddProduct}>
                  <h3>Form Tambah Produk</h3>

                  <label>Bearer Token</label>
                  <input
                    type="password"
                    placeholder="Tempel token login Laravel"
                    value={token}
                    onChange={(e) => saveToken(e.target.value)}
                  />

                  <div className="form-grid">
                    <div>
                      <label>Nama Produk</label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Contoh: Wortel"
                        required
                      />
                    </div>

                    <div>
                      <label>SKU</label>
                      <input
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        placeholder="Contoh: WRL-001"
                      />
                    </div>

                    <div>
                      <label>Harga</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="12000"
                        required
                      />
                    </div>

                    <div>
                      <label>Stok</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        placeholder="20"
                        required
                      />
                    </div>

                    <div>
                      <label>Satuan</label>
                      <input
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        placeholder="kg"
                        required
                      />
                    </div>

                    <div>
                      <label>Kategori</label>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label>Supplier</label>
                      <select
                        name="supplier_id"
                        value={formData.supplier_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Pilih Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="add-button">
                    Simpan Produk
                  </button>
                </form>
              )}

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nama Produk</th>
                      <th>SKU</th>
                      <th>Kategori</th>
                      <th>Supplier</th>
                      <th>Harga</th>
                      <th>Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.sku || "-"}</td>
                        <td>{product.category?.name || "-"}</td>
                        <td>{product.supplier?.name || "-"}</td>
                        <td>
                          Rp{Number(product.price).toLocaleString("id-ID")}
                        </td>
                        <td>{product.stock} {product.unit}</td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan="6">Belum ada produk.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activePage === "Kategori" && (
            <div className="content-card">
              <h3>Data Kategori</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Nama Kategori</th><th>Deskripsi</th></tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.description || "-"}</td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr><td colSpan="2">Belum ada kategori.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activePage === "Supplier" && (
            <div className="content-card">
              <h3>Data Supplier</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nama Supplier</th>
                      <th>Telepon</th>
                      <th>Email</th>
                      <th>Alamat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td>{supplier.name}</td>
                        <td>{supplier.phone || "-"}</td>
                        <td>{supplier.email || "-"}</td>
                        <td>{supplier.address || "-"}</td>
                      </tr>
                    ))}
                    {suppliers.length === 0 && (
                      <tr><td colSpan="4">Belum ada supplier.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activePage === "Transaksi Stok" && (
            <div className="content-card">
              <div className="section-heading">
                <div>
                  <h3>Riwayat Transaksi Stok</h3>
                  <p>Catatan penambahan dan pengurangan stok produk.</p>
                </div>
                <button
                  className="add-button"
                  onClick={() =>
                    setShowTransactionForm(!showTransactionForm)
                  }
                >
                  {showTransactionForm
                    ? "Tutup Form"
                    : "+ Tambah Transaksi"}
                </button>
              </div>

              {showTransactionForm && (
                <form
                  className="product-form"
                  onSubmit={handleAddTransaction}
                >
                  <h3>Form Transaksi Stok</h3>

                  <label>Bearer Token</label>
                  <input
                    type="password"
                    placeholder="Tempel token login Laravel"
                    value={token}
                    onChange={(e) => saveToken(e.target.value)}
                  />

                  <div className="form-grid">
                    <div>
                      <label>Pilih Produk</label>
                      <select
                        value={transactionForm.product_id}
                        onChange={(e) =>
                          setTransactionForm({
                            ...transactionForm,
                            product_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Pilih Produk</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label>Jenis Transaksi</label>
                      <select
                        value={transactionForm.type}
                        onChange={(e) =>
                          setTransactionForm({
                            ...transactionForm,
                            type: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="in">Stok Masuk</option>
                        <option value="out">Stok Keluar</option>
                      </select>
                    </div>

                    <div>
                      <label>Jumlah</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Masukkan jumlah"
                        value={transactionForm.quantity}
                        onChange={(e) =>
                          setTransactionForm({
                            ...transactionForm,
                            quantity: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label>Keterangan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Penambahan stok sayuran"
                        value={transactionForm.description}
                        onChange={(e) =>
                          setTransactionForm({
                            ...transactionForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <button type="submit" className="add-button">
                    Simpan Transaksi
                  </button>
                </form>
              )}

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Jenis</th>
                      <th>Jumlah</th>
                      <th>Keterangan</th>
                      <th>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.product?.name || "-"}</td>
                        <td>
                          {transaction.type === "in"
                            ? "Stok Masuk"
                            : "Stok Keluar"}
                        </td>
                        <td>{transaction.quantity}</td>
                        <td>{transaction.description || "-"}</td>
                        <td>
                          {transaction.created_at
                            ? new Date(
                                transaction.created_at
                              ).toLocaleDateString("id-ID")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr><td colSpan="5">Belum ada transaksi.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
