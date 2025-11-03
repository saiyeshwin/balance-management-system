import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Admin() {
  const [add, setAdd] = useState(0); // 0 = hidden, 1 = add, 2 = edit
  const [editId, setEditId] = useState(null);
  const nav = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "Credit",
  });
  const [isConnecting, setIsConnecting] = useState(true);
  const token = localStorage.getItem("sessionToken");

  // ✅ Fetch transactions
  const fetchTransactions = useCallback(() => {
    API.get("/transactions", { headers: { Authorization: token } })
      .then((res) => {
        const sortedData = [...res.data].sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
          return new Date(a.createdAt) - new Date(b.createdAt);
        });

        const withBalances = calculateClosingBalances(sortedData);
        setTransactions(withBalances.reverse());
        setIsConnecting(false);
      })
      .catch(() => nav("/login"));
  }, [token, nav]);

  // ✅ useEffect
  useEffect(() => {
    if (!token) {
      nav("/login");
      return;
    }
    fetchTransactions();
  }, [nav, token, fetchTransactions]);

  // ✅ Balance logic
  const calculateClosingBalances = (transactions) => {
    let balance = 0;
    return transactions.map((t) => {
      const type =
        t.type === "CR" ? "Credit" : t.type === "DR" ? "Debit" : t.type;
      if (type === "Credit") balance += t.amount;
      else if (type === "Debit") balance -= t.amount;
      return { ...t, type, closingBalance: balance };
    });
  };

  // ✅ Logout
  const handleLogout = () => {
    API.post("/logout", { token }).finally(() => {
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("role");
      nav("/login");
    });
  };

  // ✅ Add or Update Transaction
  const handleSaveTransaction = () => {
    setIsConnecting(true);
    const payload = {
      ...form,
      type: form.type === "Credit" ? "CR" : "DR",
    };

    if (add === 2 && editId) {
      // 🟡 Edit Mode
      API.put(`/transactions/${editId}`, payload, {
        headers: { Authorization: token },
      })
        .then(() => {
          setAdd(0);
          setEditId(null);
          resetForm();
          fetchTransactions();
        })
        .finally(() => setIsConnecting(false));
    } else {
      // 🟢 Add Mode
      API.post("/transactions", payload, {
        headers: { Authorization: token },
      })
        .then(() => {
          setAdd(0);
          resetForm();
          fetchTransactions();
        })
        .finally(() => setIsConnecting(false));
    }
  };

  // ✅ Delete Transaction
  const handleDeleteTransaction = (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;
    API.delete(`/transactions/${id}`, {
      headers: { Authorization: token },
    }).then(() => fetchTransactions());
  };

  // ✅ Open Edit Modal
  const handleEditTransaction = (t) => {
    setForm({
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
    });
    setEditId(t._id);
    setAdd(2);
  };

  // ✅ Reset form
  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      type: "Credit",
    });
  };

  // ✅ Last transaction time
  const getLastTransactionTime = () => {
    if (transactions.length === 0) return "No transactions yet";
    const latest = new Date(transactions[0].createdAt);
    const diffHours = Math.floor((new Date() - latest) / (1000 * 60 * 60));
    return diffHours === 0
      ? "Last Transaction added Just now"
      : `Last Transaction added ${diffHours} hour${
          diffHours > 1 ? "s" : ""
        } ago`;
  };

  // ✅ Loading Screen
  if (isConnecting) {
    return (
      <div id="connecting-container">
        <div id="connecting-screen">
          <i className="fa-solid fa-spinner fa-spin"></i> Loading
        </div>
      </div>
    );
  }

  return (
    <div id="container" className="flex column">
      {/* ===== Top Bar ===== */}
      <div
        id="topBar"
        className="flex row justify-content-space-between padding-24"
      >
        <h1>Balance Manage</h1>
        <p className="lockBtn" onClick={handleLogout}>
          <i className="fa-solid fa-lock"></i>
        </p>
      </div>

      {/* ===== Balance Summary ===== */}
      <div id="balanceBar">
        <div id="balanceBox">
          <h1>
            Rs.{" "}
            {transactions.length > 0
              ? transactions
                  .reduce(
                    (total, t) =>
                      t.type === "Credit"
                        ? total + parseFloat(t.amount)
                        : total - parseFloat(t.amount),
                    0
                  )
                  .toFixed(2)
              : "0.00"}
          </h1>
          <p>
            <i className="fa-solid fa-clock"></i>
            {getLastTransactionTime()}
          </p>
        </div>
      </div>

      {/* ===== Transaction Table ===== */}
      <div id="transactiontable">
        <h2>Transaction Log</h2>
        <button onClick={() => setAdd(1)}>New Transaction</button>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Closing Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={i}>
                <td>{t.date}</td>
                <td>{t.description}</td>
                <th
                  style={{
                    color: t.type === "Credit" ? "green" : "red",
                  }}
                >
                  {t.amount} {t.type}
                </th>
                <td>{t.closingBalance.toFixed(2)}</td>
                <td>
                  <i
                    className="fa-solid fa-pen"
                    style={{
                      cursor: "pointer",
                      marginRight: "12px",
                      color: "#ffaa00",
                    }}
                    onClick={() => handleEditTransaction(t)}
                    title="Edit"
                  ></i>
                  <i
                    className="fa-solid fa-trash"
                    style={{ cursor: "pointer", color: "#ff4d4d" }}
                    onClick={() => handleDeleteTransaction(t._id)}
                    title="Delete"
                  ></i>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Modal (Add/Edit) ===== */}
      <div id="modalContainer" className={add !== 0 ? "dispaly" : "hidden"}>
        <div id="add-form" className="flex column">
          <div className="flex row justify-content-space-between">
            <h2>{add === 2 ? "Edit Transaction" : "Add Transaction"}</h2>
            <p
              className="lockBtn"
              onClick={() => {
                setAdd(0);
                setEditId(null);
                resetForm();
              }}
            >
              <i className="fa-solid fa-x"></i>
            </p>
          </div>

          {["date", "description", "amount"].map((field) => (
            <div key={field} className="inputBox flex row">
              <p>{field.charAt(0).toUpperCase() + field.slice(1)}:</p>
              <input
                type={
                  field === "amount"
                    ? "number"
                    : field === "date"
                    ? "date"
                    : "text"
                }
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </div>
          ))}

          <div className="inputBox flex row">
            <p>Transaction Type:</p>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>
          </div>

          <div className="inputBox flex column flex-end">
            <button onClick={handleSaveTransaction}>
              {add === 2 ? "Update Transaction" : "Add Transaction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
