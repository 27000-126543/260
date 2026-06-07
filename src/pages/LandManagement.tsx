import { useState, useEffect } from 'react';
import {
  Plus,
  MapPin,
  Droplets,
  Leaf,
  Ruler,
  History,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/utils/api';
import type { Land } from '../../shared/types';

export default function LandManagement() {
  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    location: '',
    soilType: '壤土',
    phValue: '6.5',
    organicMatter: '2.0',
  });

  useEffect(() => {
    api.lands.list().then(setLands).catch(() => {});
  }, []);

  const soilGrades = [
    { range: [0, 1.0], grade: '低', color: 'text-red-600' },
    { range: [1.0, 2.0], grade: '中', color: 'text-yellow-600' },
    { range: [2.0, 3.0], grade: '良', color: 'text-green-600' },
    { range: [3.0, 100], grade: '优', color: 'text-primary-600' },
  ];

  const getSoilGrade = (organicMatter: number) => {
    for (const g of soilGrades) {
      if (organicMatter >= g.range[0] && organicMatter < g.range[1]) {
        return { grade: g.grade, color: g.color };
      }
    }
    return { grade: '未知', color: 'text-gray-600' };
  };

  const handleAddLand = () => {
    const newLand = {
      ...formData,
      area: parseFloat(formData.area),
      phValue: parseFloat(formData.phValue),
      organicMatter: parseFloat(formData.organicMatter),
      province: '山东省',
      city: '潍坊市',
      nitrogen: 100,
      phosphorus: 30,
      potassium: 150,
      plantingHistory: [],
    };
    api.lands.create(newLand).then((land) => {
      setLands([...lands, land as Land]);
      setShowAddModal(false);
      setFormData({ name: '', area: '', location: '', soilType: '壤土', phValue: '6.5', organicMatter: '2.0' });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">土地管理</h1>
          <p className="text-gray-500 mt-1">管理您的所有地块信息和种植历史</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          添加土地
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <Ruler className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {lands.reduce((sum, l) => sum + l.area, 0)}
                </p>
                <p className="text-sm text-gray-500">总亩数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{lands.length}</p>
                <p className="text-sm text-gray-500">地块数量</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(lands.reduce((sum, l) => sum + l.organicMatter, 0) / lands.length || 0).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">平均有机质</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <History className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {lands.reduce((sum, l) => sum + l.plantingHistory.length, 0)}
                </p>
                <p className="text-sm text-gray-500">种植记录</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Land List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lands.map((land) => {
          const soilGrade = getSoilGrade(land.organicMatter);
          return (
            <Card
              key={land.id}
              hoverable
              onClick={() => setSelectedLand(land)}
              className={selectedLand?.id === land.id ? 'ring-2 ring-primary-500' : ''}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{land.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" /> {land.location}
                    </p>
                  </div>
                  <Badge variant="primary">{land.area} 亩</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">土壤类型</p>
                    <p className="font-medium text-gray-900">{land.soilType}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">PH值</p>
                    <p className="font-medium text-gray-900">{land.phValue}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">有机质</p>
                    <p className={`font-medium ${soilGrade.color}`}>
                      {land.organicMatter}% ({soilGrade.grade})
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">种植记录</p>
                    <p className="font-medium text-gray-900">{land.plantingHistory.length} 季</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">历史作物</span>
                  <div className="flex gap-1">
                    {land.plantingHistory.slice(0, 3).map((h, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {h.crop}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Land Detail Panel */}
      {selectedLand && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedLand.name} - 详细信息</h3>
              <p className="text-sm text-gray-500">{selectedLand.location}</p>
            </div>
            <button
              onClick={() => setSelectedLand(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Soil Data */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  土壤成分数据
                </h4>
                <div className="space-y-3">
                  {[
                    { label: '氮 (N)', value: selectedLand.nitrogen, unit: 'mg/kg' },
                    { label: '磷 (P)', value: selectedLand.phosphorus, unit: 'mg/kg' },
                    { label: '钾 (K)', value: selectedLand.potassium, unit: 'mg/kg' },
                    { label: '有机质', value: selectedLand.organicMatter, unit: '%' },
                    { label: 'PH值', value: selectedLand.phValue, unit: '' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium text-gray-900">
                        {item.value} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Planting History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <History className="w-5 h-5 text-green-500" />
                  种植历史
                </h4>
                {selectedLand.plantingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {selectedLand.plantingHistory.map((record) => (
                      <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {record.crop} - {record.variety}
                          </span>
                          <Badge variant="success">已收获</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">播种：</span>
                            {record.sowingDate}
                          </div>
                          <div>
                            <span className="text-gray-500">收获：</span>
                            {record.harvestDate}
                          </div>
                          <div>
                            <span className="text-gray-500">产量：</span>
                            <span className="font-medium">{record.yield} kg</span>
                          </div>
                          <div>
                            <span className="text-gray-500">收入：</span>
                            <span className="font-medium text-green-600">¥{record.income}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Leaf className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无种植历史</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => window.location.href = '/recommendation'}>
                <Sparkles className="w-4 h-4 mr-2" />
                获取种植推荐
              </Button>
              <Button variant="outline">
                <ChevronRight className="w-4 h-4 mr-2" />
                查看施肥方案
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Land Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-semibold">添加土地</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="土地名称"
                placeholder="如：东田地"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="面积（亩）"
                  type="number"
                  placeholder="0.0"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                />
                <Input
                  label="土壤类型"
                  placeholder="壤土、沙壤土等"
                  value={formData.soilType}
                  onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                />
              </div>
              <Input
                label="位置"
                placeholder="详细地址"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="PH值"
                  type="number"
                  step="0.1"
                  value={formData.phValue}
                  onChange={(e) => setFormData({ ...formData, phValue: e.target.value })}
                />
                <Input
                  label="有机质（%）"
                  type="number"
                  step="0.1"
                  value={formData.organicMatter}
                  onChange={(e) => setFormData({ ...formData, organicMatter: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                  取消
                </Button>
                <Button className="flex-1" onClick={handleAddLand}>
                  确认添加
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
