import { Router } from 'express';
import { mockProducts, mockOrders, mockLogistics } from '../data/mockData';
import type { Product, Order } from '../../shared/types';

const router = Router();

router.get('/products', (req, res) => {
  const { category, search } = req.query;
  let products: Product[] = [...mockProducts];
  
  if (category) {
    products = products.filter(p => p.category === category);
  }
  if (search) {
    const keyword = String(search).toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(keyword) || 
      p.description.toLowerCase().includes(keyword)
    );
  }
  
  res.json(products);
});

router.get('/products/:id', (req, res) => {
  const product = mockProducts.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: '商品不存在' });
  }
  res.json(product);
});

router.get('/orders', (req, res) => {
  res.json(mockOrders);
});

router.post('/orders', (req, res) => {
  const newOrder: Order = {
    id: `o${Date.now()}`,
    orderNo: `AG${Date.now()}`,
    userId: 'user001',
    ...req.body,
    status: 'paid',
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  };
  mockOrders.unshift(newOrder);
  res.status(201).json(newOrder);
});

router.get('/logistics/:id', (req, res) => {
  res.json({ ...mockLogistics, orderId: req.params.id });
});

export default router;
