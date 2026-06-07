import { Router } from 'express';
import { mockLands } from '../data/mockData';

const router = Router();

router.get('/', (req, res) => {
  res.json(mockLands);
});

router.get('/:id', (req, res) => {
  const land = mockLands.find(l => l.id === req.params.id);
  if (!land) {
    return res.status(404).json({ message: '土地信息不存在' });
  }
  res.json(land);
});

router.post('/', (req, res) => {
  const newLand = {
    id: `land${Date.now()}`,
    userId: 'user001',
    ...req.body,
    plantingHistory: [],
  };
  mockLands.push(newLand);
  res.status(201).json(newLand);
});

router.put('/:id', (req, res) => {
  const index = mockLands.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: '土地信息不存在' });
  }
  mockLands[index] = { ...mockLands[index], ...req.body };
  res.json(mockLands[index]);
});

export default router;
