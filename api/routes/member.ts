import { Router } from 'express';
import { mockMemberInfo } from '../data/mockData';

const router = Router();

router.get('/level', (req, res) => {
  res.json(mockMemberInfo);
});

router.get('/benefits', (req, res) => {
  res.json(mockMemberInfo.benefits);
});

export default router;
