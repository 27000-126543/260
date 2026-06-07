import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Droplets,
  Leaf,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { CropRecommendation, FertilizerPlan, Land } from '../../shared/types';

export default function Recommendation() {
  const [crops, setCrops] = useState<CropRecommendation[]>([]);
  const [fertilizerPlan, setFertilizerPlan] = useState<FertilizerPlan | null>(null);
  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLandId, setSelectedLandId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'crops' | 'fertilizer'>('crops');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.recommendations.crops(),
      api.recommendations.fertilizer(),
      api.lands.list(),
    ])
      .then(([cropsData, fertilizerData, landsData]) => {
        setCrops(cropsData as CropRecommendation[]);
        setFertilizerPlan(fertilizerData as FertilizerPlan);
        const lands = landsData as Land[];
        setLands(lands);
        if (lands.length > 0) {
          setSelectedLandId(lands[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const riskColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  const riskLabels = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">智能推荐</h1>
        <p className="text-gray-500 mt-1">基于土壤数据和历史产量，AI为您推荐最优种植方案</p>
      </div>

      {/* Land Selector */}
      {lands.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-600">选择地块：</span>
              <div className="flex flex-wrap gap-2">
                {lands.map((land) => (
                  <button
                    key={land.id}
                    onClick={() => setSelectedLandId(land.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedLandId === land.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {land.name} ({land.area}亩)
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('crops')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'crops'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          作物推荐
        </button>
        <button
          onClick={() => setActiveTab('fertilizer')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'fertilizer'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Droplets className="w-4 h-4 inline mr-2" />
          施肥方案
        </button>
      </div>

      {/* Crop Recommendations */}
      {activeTab === 'crops' && (
        <div className="space-y-4">
          {crops.map((crop, index) => (
            <Card key={crop.id} className="overflow-hidden">
              <div className="md:flex">
                <div className="md:w-2 bg-gradient-to-b from-primary-400 to-primary-600" />
                <CardContent className="flex-1 p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl font-bold text-gray-900">{crop.crop}</span>
                        <Badge variant="secondary">{crop.variety}</Badge>
                        {index === 0 && (
                          <Badge variant="primary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            最佳推荐
                          </Badge>
                        )}
                      </div>

                      {/* Match Score Circle */}
                      <div className="flex items-center gap-4 my-4">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="35"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="6"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="35"
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeDasharray={`${crop.matchScore * 2.2} 220`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-900">{crop.matchScore}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">匹配度</p>
                          <Badge className={riskColors[crop.riskLevel]}>
                            {riskLabels[crop.riskLevel]}
                          </Badge>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                          <p className="text-lg font-bold text-gray-900">{crop.expectedYield}</p>
                          <p className="text-xs text-gray-500">预计产量(kg/亩)</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary-500" />
                          <p className="text-lg font-bold text-gray-900">¥{crop.expectedIncome}</p>
                          <p className="text-xs text-gray-500">预计收益(元/亩)</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                          <p className="text-lg font-bold text-gray-900">{crop.growthPeriod}</p>
                          <p className="text-xs text-gray-500">生长周期(天)</p>
                        </div>
                      </div>

                      {/* Reasons */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">推荐理由：</p>
                        <div className="flex flex-wrap gap-2">
                          {crop.reasons.map((reason, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-3 md:w-48">
                      <Button className="flex-1 md:flex-none">
                        采纳此方案
                      </Button>
                      <Button variant="outline" className="flex-1 md:flex-none">
                        查看详情
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Fertilizer Plan */}
      {activeTab === 'fertilizer' && fertilizerPlan && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {fertilizerPlan.crop} 施肥方案
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    基于土壤检测数据定制的科学施肥方案
                  </p>
                </div>
                <Badge variant="primary" className="text-lg px-4 py-1">
                  总费用 ¥{fertilizerPlan.totalCost}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fertilizerPlan.stages.map((stage, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-50 to-transparent px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{stage.stage}</h4>
                          <p className="text-sm text-gray-500">{stage.period}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3 mb-4">
                      {stage.fertilizers.map((fert, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Leaf className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="font-medium text-gray-900">{fert.name}</p>
                              <p className="text-xs text-gray-500">{fert.type}</p>
                            </div>
                          </div>
                          <span className="font-medium text-gray-900">
                            {fert.amount} {fert.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">{stage.notes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button variant="outline" className="flex-1">
                导出方案
              </Button>
              <Button className="flex-1">
                一键采购肥料
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
