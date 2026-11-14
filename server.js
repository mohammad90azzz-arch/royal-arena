const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let users = { 
    "user_1": { id: "user_1", name: "محمد أشرف", balance: 2500.00, role: "admin" } 
};
let transactions = [];

app.get('/api/user/:id', (req, res) => {
    const user = users[req.params.id];
    if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });
    res.json(user);
});

app.post('/api/wallet/transaction', (req, res) => {
    const { userId, type, method, amount, reference } = req.body;
    if (amount <= 0) return res.status(400).json({ error: "مبلغ غير صالح" });
    if (type === 'withdraw' && users[userId].balance < amount) {
        return res.status(400).json({ error: "عذراً، الرصيد غير كافٍ لإتمام السحب" });
    }
    if (type === 'withdraw') users[userId].balance -= amount;

    const tx = {
        id: crypto.randomUUID(),
        userId,
        userName: users[userId].name,
        type, method, amount, reference,
        status: 'pending',
        createdAt: new Date()
    };
    transactions.push(tx);
    res.json({ message: "تم تسجيل الطلب بنجاح", transaction: tx, balance: users[userId].balance });
});

app.get('/api/admin/transactions', (req, res) => {
    res.json(transactions);
});

app.post('/api/admin/action', (req, res) => {
    const { adminId, transactionId, action } = req.body;
    if (users[adminId]?.role !== 'admin') return res.status(403).json({ error: "غير مصرح لك" });

    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.status !== 'pending') return res.status(404).json({ error: "العملية غير موجودة" });

    if (action === 'approve') {
        tx.status = 'completed';
        if (tx.type === 'deposit') users[tx.userId].balance += tx.amount;
    } else {
        tx.status = 'rejected';
        if (tx.type === 'withdraw') users[tx.userId].balance += tx.amount;
    }
    res.json({ message: "تم التحديث بنجاح", balance: users[tx.userId].balance });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
