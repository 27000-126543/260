import { useState, useEffect, useRef } from 'react';
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
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { PestDetectionResult } from '../../shared/types';

export default function FieldManagement() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await api.field.detections() as any[];
      setHistory(data);
    } catch (err: any) {
      console.error('加载检测历史失败:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setResult(null);
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetection = async () => {
    if (!selectedImage) return;

    try {
      setDetecting(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const data = await api.field.detectPest(formData);
      setResult(data);
      loadHistory();
    } catch (err: any) {
      console.error('病虫害识别失败:', err);
      setError(err.message || '识别失败，请重试');
    } finally {
      setDetecting(false);
    }
  };

  const handleApplyExpert = async () => {
    if (!result) return;
    try {
      await api.field.applyExpert(result.id);
      alert('已提交专家诊断申请');
      loadHistory();
    } catch (err: any) {
      console.error('申请专家诊断失败:', err);
      alert('申请失败: ' + err.message);
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'mild':
      case '轻度':
      case 'healthy':
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
      case 'mild': return '轻度';
      case 'moderate': return '中度';
      case 'severe': return '重度';
      case 'healthy': return '健康';
      default: return severity;
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
                    ref={fileInputRef}
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
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4 relative">
                <img src={selectedImagePreview || ''} alt="上传的图片" className="w-full h-full object-cover" />
                <button
                  onClick={clearSelection}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              {!result && !detecting && (
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleDetection}>
                    <Bug className="w-5 h-5 mr-2" />
                    开始识别
                  </Button>
                  <Button variant="outline" onClick={clearSelection}>
                    重新上传
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

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
                    {result.severity === 'healthy' ? (
                      <Leaf className="w-6 h-6 text-green-500" />
                    ) : (
                      <Bug className="w-6 h-6 text-orange-500" />
                    )}
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
                {result.needsExpert && (
                  <Button variant="outline" onClick={handleApplyExpert}>
                    <User className="w-4 h-4 mr-2" />
                    申请专家诊断
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Symptoms */}
          {result.symptoms && result.symptoms.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">主要症状</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.symptoms.map((symptom: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{symptom}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">防治建议</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.suggestions.map((suggestion: string, i: number) => (
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
          )}

          {/* Treatment */}
          {result.treatment && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">推荐用药</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.treatment.pesticides?.map((p: any, i: number) => (
                    <li key={i} className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900">{p.name}</p>
                      <p className="text-sm text-blue-700">用量：{p.dosage}</p>
                      <p className="text-sm text-blue-600">频次：{p.frequency}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">最近诊断记录</h3>
          <Button variant="outline" size="sm" onClick={loadHistory}>
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="py-8 text-center text-gray-500">加载中...</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Leaf className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无诊断记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={record.image_url?.startsWith('http') ? record.image_url : `http://localhost:3001${record.image_url}`}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="%23ccc"><rect width="64" height="64" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999">图片</text></svg>';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{record.disease_name}</h4>
                      <Badge className={getSeverityStyle(record.severity)}>
                        {getSeverityText(record.severity)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(record.created_at).toLocaleDateString('zh-CN')}
                      </span>
                      {record.status === 'expert_completed' && (
                        <Badge variant="info" className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          专家已诊断
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      record.status === 'completed' || record.status === 'expert_completed'
                        ? 'success'
                        : record.status === 'expert_pending'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    {record.status === 'completed'
                      ? '已完成'
                      : record.status === 'expert_completed'
                      ? '专家诊断'
                      : record.status === 'expert_pending'
                      ? '专家诊断中'
                      : '处理中'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
