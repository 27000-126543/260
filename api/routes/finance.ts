import { Router } from 'express';
import { mockLoanProducts, mockLoanApplications, mockCreditInfo } from '../data/mockData';

const router = Router();

router.get('/loan-products', (req, res) => {
  res.json(mockLoanProducts);
});

router.get('/loan-applications', (req, res) => {
  res.json(mockLoanApplications);
});

router.post('/loan-apply', (req, res) => {
  const application = {
    id: `la${Date.now()}`,
    userId: 'user001',
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  mockLoanApplications.unshift(application);
  res.status(201).json(application);
});

router.get('/credit-score', (req, res) => {
  res.json(mockCreditInfo);
});

export default router;
