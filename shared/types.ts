export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'farmer' | 'supplier' | 'expert' | 'logistics' | 'admin';
  avatar?: string;
  idCardVerified: boolean;
  memberLevel: 'normal' | 'silver' | 'gold' | 'diamond';
  creditScore: number;
  createdAt: string;
}

export interface Address {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
}

export interface PlantingRecord {
  id: string;
  landId: string;
  crop: string;
  variety: string;
  sowingDate: string;
  harvestDate?: string;
  yield: number;
  income: number;
}

export interface Land {
  id: string;
  userId: string;
  name: string;
  area: number;
  location: string;
  province: string;
  city: string;
  soilType: string;
  phValue: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  plantingHistory: PlantingRecord[];
}

export interface CropRecommendation {
  id: string;
  crop: string;
  variety: string;
  matchScore: number;
  expectedYield: number;
  expectedIncome: number;
  growthPeriod: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
}

export interface FertilizerItem {
  name: string;
  type: string;
  amount: number;
  unit: string;
}

export interface FertilizerStage {
  stage: string;
  period: string;
  fertilizers: FertilizerItem[];
  notes: string;
}

export interface FertilizerPlan {
  id: string;
  landId: string;
  crop: string;
  stages: FertilizerStage[];
  totalCost: number;
}

export interface ProductSpec {
  name: string;
  value: string;
  priceAdjust: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'seed' | 'fertilizer' | 'pesticide' | 'tool';
  images: string[];
  price: number;
  originalPrice?: number;
  specs: ProductSpec[];
  description: string;
  stock: number;
  sales: number;
  supplierId: string;
  supplierName: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  specIndex: number;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  spec: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  address: Address;
  warehouseId?: string;
  logisticsId?: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface LogisticsTrack {
  time: string;
  location: string;
  status: string;
}

export interface LogisticsInfo {
  orderId: string;
  company: string;
  trackingNo: string;
  status: string;
  currentLocation: string;
  estimatedArrival: string;
  temperature?: number;
  humidity?: number;
  tracks: LogisticsTrack[];
}

export interface PesticideRecommendation {
  name: string;
  dosage: string;
  frequency: string;
}

export interface TreatmentPlan {
  immediateMeasures: string[];
  pesticides: PesticideRecommendation[];
  preventionTips: string[];
}

export interface PestDetectionResult {
  diseaseName?: string;
  pestName?: string;
  scientificName?: string;
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number;
  symptoms: string[];
  description?: string;
  suggestions?: string[];
  treatment?: TreatmentPlan;
  needsExpert?: boolean;
  expertAvailable?: boolean;
}

export interface Expert {
  id: string;
  name: string;
  avatar: string;
  title: string;
  specialty: string;
  experience: number;
  rating: number;
  consultationCount: number;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  condition: string;
  icon: string;
  updateTime: string;
}

export interface DailyForecast {
  date?: string;
  day?: string;
  high?: number;
  low?: number;
  highTemp?: number;
  lowTemp?: number;
  condition: string;
  icon?: string;
  precipitation?: number;
  windSpeed?: number;
}

export interface WeatherWarning {
  id: string;
  type: string;
  level: 'blue' | 'yellow' | 'orange' | 'red';
  title: string;
  content: string;
  suggestions: string[];
  publishTime: string;
}

export interface WeatherAlert {
  id: string;
  type: string;
  level: 'blue' | 'yellow' | 'orange' | 'red';
  title: string;
  content: string;
  suggestions: string[];
  publishTime: string;
  affectedArea: string;
}

export interface WeatherInfo {
  province?: string;
  city?: string;
  location?: string;
  current?: CurrentWeather;
  temperature: number;
  humidity: number;
  windLevel: number;
  condition: string;
  forecast: DailyForecast[];
  warnings?: WeatherWarning[];
}

export interface MarketProduct {
  id: string;
  farmerId: string;
  farmerName: string;
  name: string;
  category: string;
  images: string[];
  price: number;
  suggestedPrice?: number;
  stock: number;
  unit: string;
  origin: string;
  harvestDate: string;
  description?: string;
  traceCode?: string;
  status: 'presale' | 'selling' | 'pending' | 'onsale' | 'soldout' | 'offline';
  createdAt?: string;
  sales?: number;
  smartPricing?: boolean;
}

export interface FertilizationRecord {
  date: string;
  fertilizer: string;
  amount: string;
}

export interface PesticideRecord {
  date: string;
  pesticide: string;
  purpose: string;
}

export interface InspectionReport {
  date: string;
  agency: string;
  result: 'passed' | 'failed';
  items: { name: string; result: string; standard: string }[];
}

export interface TraceInfo {
  code: string;
  productId: string;
  productName: string;
  farmerName: string;
  origin: string;
  sowingDate: string;
  fertilizationRecords: FertilizationRecord[];
  pesticideRecords: PesticideRecord[];
  inspectionReport: InspectionReport;
  harvestDate: string;
  warehouseDate: string;
  deliveryDate?: string;
  receiveDate?: string;
}

export interface LoanProduct {
  id: string;
  name: string;
  maxAmount: number;
  minAmount: number;
  interestRate: number;
  termOptions?: number[];
  requirements?: string[];
  description?: string;
  guaranteeType?: string;
  term?: number;
}

export interface LoanApplication {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  amount: number;
  term: number;
  status: 'pending' | 'approved' | 'rejected' | 'repaying' | 'repaid';
  approvedAmount?: number;
  interestRate?: number;
  repaymentDate?: string;
  startDate: string;
  endDate: string;
  remainingAmount?: number;
  createdAt?: string;
}

export interface CreditInfo {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  factors: { factor: string; impact: 'positive' | 'negative'; description: string }[];
  maxLoanAmount: number;
}

export interface MemberBenefit {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

export interface MemberGift {
  id: string;
  name: string;
  description: string;
  expireDate: string;
  used: boolean;
}

export interface MemberInfo {
  userId: string;
  memberId: string;
  level: 'normal' | 'silver' | 'gold' | 'diamond';
  levelName?: string;
  points: number;
  currentPoints?: number;
  nextLevelPoints?: number;
  upgradeProgress?: number;
  totalAmount: number;
  plantArea: number;
  totalTradeAmount?: number;
  totalPlantingArea?: number;
  benefits?: MemberBenefit[];
  gifts?: MemberGift[];
}

export interface DashboardData {
  overview?: {
    totalFarmers: number;
    totalLands: number;
    totalArea: number;
    todayOrders: number;
    todaySales: number;
  };
  totalCropArea?: number;
  storeSales?: number;
  orderCompletionRate?: number;
  pestRate?: number;
  weatherAlerts?: number;
  logisticsOnTime?: number;
  regionalCrops?: { region: string; area: number; crop: string }[];
  agriculturalSales?: { category: string; sales: number; growth: number }[];
  orderCompletion?: { date: string; completionRate: number }[];
  pestIncidence?: { region: string; rate: number }[];
  weatherWarnings?: { level: string; count: number }[];
}

export interface MonthlyReport {
  month: string;
  revenueByCategory: { category: string; revenue: number }[];
  farmerActiveRate: number;
  loanDefaultRate: number;
  logisticsCost: number;
  satisfactionScore: number;
  keyMetrics: {
    newUsers: number;
    totalOrders: number;
    totalSales: number;
    avgOrderValue: number;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  image: string;
  date: string;
  category: string;
}
