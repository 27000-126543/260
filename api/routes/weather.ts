import { Router } from 'express';
import { mockWeather } from '../data/mockData';

const router = Router();

router.get('/current', (req, res) => {
  res.json(mockWeather.current);
});

router.get('/forecast', (req, res) => {
  res.json(mockWeather.forecast);
});

router.get('/warnings', (req, res) => {
  res.json(mockWeather.warnings);
});

export default router;
