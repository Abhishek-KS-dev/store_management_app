import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { mockProducts, mockCategories, mockSales, mockStockHistory } from './src/data/mockData';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  
  app.use(express.json());

  // In-memory data store for the mock backend
  let products = [...mockProducts];
  let categories = [...mockCategories];
  let sales = [...mockSales];
  let stockHistory = [...mockStockHistory];

  const SECRET_KEY = "my_super_secret_key"; // Basic mock token mechanism
  
  const users = [
    { username: 'owner', password: 'password123', role: 'owner', name: 'Store Owner' },
    { username: 'staff', password: 'password123', role: 'staff', name: 'Store Staff' }
  ];

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      req.user = users.find(u => u.username === decoded.username);
      if (!req.user) {
         return res.status(401).json({ error: 'Invalid user' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
      next();
    };
  };

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => (u.username === username || u.username === username.split('@')[0]) && u.password === password);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    // Generate simple base64 token
    const token = Buffer.from(JSON.stringify({ username: user.username, role: user.role })).toString('base64');
    res.json({ token, user: { username: user.username, name: user.name, role: user.role } });
  });
  
  app.get("/api/me", authenticate, (req: any, res: any) => {
    res.json({ user: { username: req.user.username, name: req.user.name, role: req.user.role } });
  });

  app.get("/api/products", authenticate, (req, res) => {
    res.json(products);
  });

  app.post("/api/products", authenticate, requireRole(['owner']), (req, res) => {
    const product = req.body;
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    res.json({ success: true, product });
  });

  app.delete("/api/products/:id", authenticate, requireRole(['owner']), (req, res) => {
    const index = products.findIndex((p) => p.id === req.params.id);
    if (index >= 0) {
      products[index].status = 'inactive';
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  app.get("/api/categories", authenticate, (req, res) => {
    res.json(categories);
  });

  app.get("/api/sales", authenticate, (req, res) => {
    res.json(sales);
  });

  app.post("/api/sales", authenticate, (req, res) => {
    const sale = req.body;
    sales.push(sale);
    // Deduct stock
    sale.items.forEach((item: any) => {
      const productIndex = products.findIndex(p => p.id === item.productId);
      if (productIndex >= 0) {
        products[productIndex].stock -= item.quantity;
      }
    });
    res.json({ success: true, sale });
  });

  app.get("/api/stock-adjustments", authenticate, (req, res) => {
    res.json(stockHistory);
  });

  app.post("/api/stock-adjustments", authenticate, requireRole(['owner']), (req, res) => {
    const adjustment = req.body;
    stockHistory.push(adjustment);
    
    const productIndex = products.findIndex(p => p.id === adjustment.productId);
    if (productIndex >= 0) {
      if (adjustment.adjustmentType === 'Stock Added' || adjustment.adjustmentType === 'Correction') {
         products[productIndex].stock += adjustment.quantity;
      } else {
         products[productIndex].stock -= adjustment.quantity;
      }
    }
    res.json({ success: true, adjustment });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
