import { useState } from 'react';
import {
  Camera,
  Upload,
  Bug,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  FileText,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { PestDetectionResult } from '../../shared/types';

const mockHistory: Array<{
  id: string;
  image: string;
  disease: string;
  severity: string;
  date: string;
  status: 'completed' | 'expert' | 'pending';
}> = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400',
    disease: '稻瘟病',
    severity: '中度',
    date: '2024-03-10',
    status: 'completed',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=400',
    disease: '小麦锈病',
    severity: '轻度',
    date: '2024-03-08',
    status: 'completed',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400',
    disease: '疑似病虫害',
    severity: '待专家确诊',
    date: '2024-03-12',
    status: 'expert',
  },
];

export default function FieldManagement() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<PestDetectionResult | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        simulateDetection();
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateDetection = () => {
    setDetecting(true);
    setResult(null);
    setTimeout(() => {
      setDetecting(false);
      setResult({
        diseaseName: '稻瘟病',
        confidence: 0.92,
        severity: 'moderate',
        description: '稻瘟病是由稻瘟病菌引起的水稻重要病害，可造成水稻减产10-30%。',
        symptoms: ['叶片出现褐色梭形病斑', '病斑中央灰白色，边缘褐色', '潮湿时病斑背面产生灰色霉层'],
        suggestions: [
          '及时摘除病叶，减少菌源',
          '使用三环唑或稻瘟灵喷雾防治',
          '合理施肥，避免偏施氮肥',
          '保持田间通风透光',
        ],
        expertAvailable: true,
      });
    }, 2000);
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'mild':
      case '轻度':
        return 'text-yellow-600 bg-yellow-100';
      case 'moderate':
      case '中度':
        return 'text-orange-600 bg-orange-100';
      case 'severe':
      case '重度':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'mild':
        return '轻度';
      case 'moderate':
        return '中度';
      case 'severe':
        return '重度';
      default:
        return severity;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">田间管理</h1>
        <p className="text-gray-500 mt-1">AI智能识别病虫害，专家在线诊断</p>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-primary-200 bg-primary-50/50">
        <CardContent className="py-12">
          {!selectedImage ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">上传作物照片</h3>
              <p className="text-gray-500 mb-6">支持拍照或从相册选择，AI自动识别病虫害</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button className="w-full sm:w-auto cursor-pointer">
                    <Upload className="w-5 h-5 mr-2" />
                    选择照片
                  </Button>
                </label>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button variant="outline" className="w-full sm:w-auto cursor-pointer">
                    <Camera className="w-5 h-5 mr-2" />
                    拍照上传
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4">
                <img src={selectedImage} alt="上传的图片" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedImage(null);
                    setResult(null);
                  }}
                >
                  重新上传
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detection Result */}
      {detecting && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI正在分析中...</h3>
            <p className="text-gray-500">请稍候，正在识别病虫害类型</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Bug className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-gray-900">{result.diseaseName}</h3>
                    <Badge className={getSeverityStyle(result.severity)}>
                      {getSeverityText(result.severity)}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{result.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    识别置信度：{(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                {result.expertAvailable && (
                  <Button variant="outline">
                    <User className="w-4 h-4 mr-2" />
                    申请专家诊断
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Symptoms */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">主要症状</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.symptoms.map((symptom, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{symptom}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">防治建议</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
                      {i + 1}
                    </div>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Generate Report */}
          <Card>
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="font-medium text-gray-900">生成诊断报告</h4>
                <p className="text-sm text-gray-500">包含详细分析和防治方案，可下载分享</p>
              </div>
              <Button>
                <FileText className="w-5 h-5 mr-2" />
                生成报告
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">最近诊断记录</h3>
          <Button variant="outline" size="sm">
            查看全部
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockHistory.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <img
                  src={record.image}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{record.disease}</h4>
                    <Badge className={getSeverityStyle(record.severity)}>
                      {record.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {record.date}
                    </span>
                    {record.status === 'expert' && (
                      <Badge variant="info" className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        专家诊断中
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    record.status === 'completed'
                      ? 'success'
                      : record.status === 'expert'
                      ? 'info'
                      : 'warning'
                  }
                >
                  {record.status === 'completed'
                    ? '已完成'
                    : record.status === 'expert'
                    ? '专家诊断'
                    : '处理中'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
