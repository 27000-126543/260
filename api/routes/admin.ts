import { Router } from 'express';
import { mockDashboard, mockMonthlyReport, mockNews } from '../data/mockData';

const router = Router();

router.get('/dashboard', (req, res) => {
  res.json(mockDashboard);
});

router.get('/reports', (req, res) => {
  res.json(mockMonthlyReport);
});

router.get('/news', (req, res) => {
  res.json(mockNews);
});

export default router;
