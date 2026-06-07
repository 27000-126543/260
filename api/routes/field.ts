import { Router } from 'express';
import { mockPestResult, mockExperts } from '../data/mockData';

const router = Router();

router.post('/detect-pest', (req, res) => {
  setTimeout(() => {
    res.json(mockPestResult);
  }, 1500);
});

router.get('/experts', (req, res) => {
  res.json(mockExperts);
});

router.post('/diagnosis', (req, res) => {
  res.status(201).json({
    id: `diag${Date.now()}`,
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
});

export default router;
