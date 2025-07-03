import { useState, useEffect } from 'react';
import { format as formatDate } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type ProductVariantRow = Database['public']['Tables']['product_variants']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'sales' | 'inventory' | 'users' | 'financial';
}

interface DateRange {
  from: Date;
  to: Date;
}

interface OrderWithRelations extends OrderRow {
  profiles?: Pick<ProfileRow, 'first_name' | 'last_name' | 'email'> | null;
  order_items?: Array<OrderItemRow & {
    product_variant?: ProductVariantRow & {
      product?: Pick<ProductRow, 'name' | 'category'> | null;
    } | null;
  }> | null;
}

interface ProductVariantWithProduct extends ProductVariantRow {
  product?: Pick<ProductRow, 'name' | 'category'> | null;
}

interface ProfileWithOrderCount extends ProfileRow {
  orders?: { count: number }[];
}

interface ReportData {
  type: string;
  data: OrderWithRelations[] | ProductVariantWithProduct[] | ProfileWithOrderCount[] | Json;
}

const reportTypes: ReportType[] = [
  {
    id: 'sales-summary',
    name: 'Sales Summary',
    description: 'Overview of sales performance including revenue, orders, and trends',
    icon: TrendingUp,
    category: 'sales'
  },
  {
    id: 'order-details',
    name: 'Order Details',
    description: 'Detailed breakdown of all orders with customer information',
    icon: ShoppingCart,
    category: 'sales'
  },
  {
    id: 'product-performance',
    name: 'Product Performance',
    description: 'Analysis of product sales, revenue, and popularity',
    icon: Package,
    category: 'inventory'
  },
  {
    id: 'inventory-status',
    name: 'Inventory Status',
    description: 'Current stock levels and low inventory alerts',
    icon: BarChart3,
    category: 'inventory'
  },
  {
    id: 'customer-activity',
    name: 'Customer Activity',
    description: 'User engagement, purchase patterns, and loyalty metrics',
    icon: Users,
    category: 'users'
  },
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Revenue, taxes, fees, and profit margins',
    icon: DollarSign,
    category: 'financial'
  }
];

export function AdminReports() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { toast } = useToast();

  const generateReport = async () => {
    if (!selectedReport) {
      toast({
        title: "Select a Report",
        description: "Please select a report type to generate.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      switch (selectedReport) {
        case 'sales-summary':
          await generateSalesSummary();
          break;
        case 'order-details':
          await generateOrderDetails();
          break;
        case 'product-performance':
          await generateProductPerformance();
          break;
        case 'inventory-status':
          await generateInventoryStatus();
          break;
        case 'customer-activity':
          await generateCustomerActivity();
          break;
        case 'financial-summary':
          await generateFinancialSummary();
          break;
      }
      
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully."
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSalesSummary = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          quantity,
          unit_price,
          total_price,
          product_variants(
            sku,
            size,
            products(name, category)
          )
        )
      `)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .neq('status', 'cancelled');

    if (error) throw error;
    setReportData({ type: 'sales-summary', data: data as OrderWithRelations[] });
  };

  const generateOrderDetails = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles(first_name, last_name, email),
        order_items(
          quantity,
          unit_price,
          total_price,
          product_variants(
            sku,
            size,
            products(name, category)
          )
        )
      `)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    setReportData({ type: 'order-details', data: data as OrderWithRelations[] });
  };

  const generateProductPerformance = async () => {
    const { data: stats } = await supabase
      .rpc('get_product_performance', {
        date_from: dateRange.from.toISOString(),
        date_to: dateRange.to.toISOString()
      });

    setReportData({ type: 'product-performance', data: stats as Json });
  };

  const generateInventoryStatus = async () => {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        products(name, category)
      `)
      .order('inventory_count', { ascending: true });

    if (error) throw error;
    setReportData({ type: 'inventory-status', data: data as ProductVariantWithProduct[] });
  };

  const generateCustomerActivity = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        orders(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setReportData({ type: 'customer-activity', data: data as ProfileWithOrderCount[] });
  };

  const generateFinancialSummary = async () => {
    const { data: stats } = await supabase
      .rpc('get_dashboard_stats', {
        date_from: dateRange.from.toISOString(),
        date_to: dateRange.to.toISOString()
      });

    setReportData({ type: 'financial-summary', data: stats as Json });
  };

  const exportReport = (exportFormat: 'csv' | 'json' | 'pdf') => {
    if (!reportData) {
      toast({
        title: "No Report",
        description: "Please generate a report first.",
        variant: "destructive"
      });
      return;
    }

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(reportData.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dankdeals-${selectedReport}-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
    } else if (exportFormat === 'csv') {
      // Convert data to CSV format
      let csvContent = '';
      const reportName = reportTypes.find(r => r.id === reportData.type)?.name || 'Report';
      
      if (Array.isArray(reportData.data)) {
        // Handle array data
        if (reportData.data.length > 0) {
          // Create headers from first object keys
          const firstItem = reportData.data[0] as Record<string, unknown>;
          const headers = Object.keys(firstItem).filter(key => 
            typeof firstItem[key] !== 'object' || firstItem[key] === null
          );
          csvContent = headers.join(',') + '\n';
          
          // Add data rows
          reportData.data.forEach((row: unknown) => {
            const rowData = row as Record<string, unknown>;
            const values = headers.map(header => {
              let value = rowData[header];
              if (value === null || value === undefined) value = '';
              if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                value = `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            });
            csvContent += values.join(',') + '\n';
          });
        }
      } else if (typeof reportData.data === 'object') {
        // Handle object data (like dashboard stats)
        const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
          return Object.keys(obj).reduce((acc: Record<string, unknown>, key) => {
            const value = obj[key];
            const newKey = prefix ? `${prefix}_${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              return { ...acc, ...flattenObject(value as Record<string, unknown>, newKey) };
            }
            return { ...acc, [newKey]: value };
          }, {});
        };
        
        const flattened = flattenObject(reportData.data as Record<string, unknown>);
        const headers = Object.keys(flattened);
        const values = Object.values(flattened);
        
        csvContent = headers.join(',') + '\n' + values.join(',');
      }
      
      if (csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dankdeals-${selectedReport}-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Complete",
          description: `${reportName} has been exported as CSV.`
        });
      }
    } else if (exportFormat === 'pdf') {
      // For PDF, we'll just create a simple text version for now
      toast({
        title: "PDF Export",
        description: "PDF export requires additional setup. Use CSV or JSON format for now.",
        variant: "default"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-600">Generate and export detailed business reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Generator</CardTitle>
          <CardDescription>
            Select a report type and date range to generate comprehensive business insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select a report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((report) => {
                      const Icon = report.icon;
                      return (
                        <SelectItem key={report.id} value={report.id}>
                          <div className="flex items-center">
                            <Icon className="mr-2 h-4 w-4" />
                            {report.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={(range) => setDateRange(range || dateRange)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button
                onClick={generateReport}
                disabled={!selectedReport || isGenerating}
              >
                {isGenerating ? (
                  <>Generating Report...</>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>

              {reportData && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => exportReport('json')}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportReport('csv')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportReport('pdf')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              {reportTypes.find(r => r.id === reportData.type)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(reportData.data, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Set up automated reports to be generated and emailed on a regular schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 mb-4" />
                <p>No scheduled reports configured</p>
                <Button className="mt-4" variant="outline">
                  Create Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                View and download previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>No reports in history</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 