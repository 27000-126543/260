import { Router } from 'express';
import { mockMarketProducts, mockTraceInfo } from '../data/mockData';

const router = Router();

router.get('/products', (req, res) => {
  res.json(mockMarketProducts);
});

router.post('/products', (req, res) => {
  const newProduct = {
    id: `mp${Date.now()}`,
    farmerId: 'user001',
    farmerName: '张农夫',
    traceCode: `TRACE${Date.now()}`,
    status: 'onsale',
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  mockMarketProducts.unshift(newProduct);
  res.status(201).json(newProduct);
});

router.get('/trace/:code', (req, res) => {
  res.json({ ...mockTraceInfo, code: req.params.code });
});

export default router;
