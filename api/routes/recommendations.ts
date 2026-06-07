import { Router } from 'express';
import { mockCropRecommendations, mockFertilizerPlan } from '../data/mockData';

const router = Router();

router.get('/crops', (req, res) => {
  res.json(mockCropRecommendations);
});

router.get('/fertilizer', (req, res) => {
  res.json(mockFertilizerPlan);
});

export default router;
