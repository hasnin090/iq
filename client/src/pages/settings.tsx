import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
  });
  
  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => {
      return apiRequest('PUT', `/api/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث الإعدادات بنجاح",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في تحديث الإعدادات",
      });
    },
  });
  
  const handleSaveSetting = (key: string, value: string) => {
    mutation.mutate({ key, value });
  };
  
  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="space-y-8 py-6">
        <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">الإعدادات</h2>
        
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4 ml-2" />
          <AlertTitle>غير مصرح</AlertTitle>
          <AlertDescription>
            ليس لديك صلاحيات كافية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير النظام.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 py-6">
      <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">الإعدادات</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="general">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="general">إعدادات عامة</TabsTrigger>
          <TabsTrigger value="financial">إعدادات مالية</TabsTrigger>
          <TabsTrigger value="system">إعدادات النظام</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="text-center py-20">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="mt-4 text-muted">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <>
            <TabsContent value="general">
              <Card className="bg-secondary-light">
                <CardHeader>
                  <CardTitle>إعدادات عامة</CardTitle>
                  <CardDescription>
                    إعدادات عامة للنظام مثل اسم الشركة والعنوان
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SettingField 
                    settings={settings || []} 
                    settingKey="companyName" 
                    label="اسم الشركة" 
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                  
                  <SettingField 
                    settings={settings || []} 
                    settingKey="companyAddress" 
                    label="عنوان الشركة" 
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                  
                  <SettingField 
                    settings={settings || []} 
                    settingKey="companyPhone" 
                    label="رقم هاتف الشركة" 
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="financial">
              <Card className="bg-secondary-light">
                <CardHeader>
                  <CardTitle>إعدادات مالية</CardTitle>
                  <CardDescription>
                    إعدادات خاصة بالنظام المالي مثل العملة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SettingField 
                    settings={settings || []} 
                    settingKey="currency" 
                    label="رمز العملة" 
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                  
                  <SettingField 
                    settings={settings || []} 
                    settingKey="taxRate" 
                    label="نسبة الضريبة (%)" 
                    type="number"
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="system">
              <Card className="bg-secondary-light">
                <CardHeader>
                  <CardTitle>إعدادات النظام</CardTitle>
                  <CardDescription>
                    إعدادات خاصة بنظام المحاسبة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SettingField 
                    settings={settings || []} 
                    settingKey="dateFormat" 
                    label="صيغة التاريخ" 
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                  
                  <SettingField 
                    settings={settings || []} 
                    settingKey="sessionTimeout" 
                    label="مهلة انتهاء الجلسة (بالدقائق)" 
                    type="number"
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

interface SettingFieldProps {
  settings: Setting[];
  settingKey: string;
  label: string;
  type?: string;
  onSave: (key: string, value: string) => void;
  isSaving: boolean;
}

function SettingField({ settings, settingKey, label, type = 'text', onSave, isSaving }: SettingFieldProps) {
  const setting = settings.find(s => s.key === settingKey);
  const [value, setValue] = useState(setting?.value || '');
  const [saved, setSaved] = useState(false);
  
  const handleSave = () => {
    onSave(settingKey, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <div className="md:col-span-2">
        <Label htmlFor={settingKey} className="block text-sm font-medium text-neutral mb-1">{label}</Label>
        <Input
          id={settingKey}
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
        />
      </div>
      <div>
        <Button
          onClick={handleSave}
          disabled={isSaving || value === setting?.value}
          className="px-4 py-2 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg hover:shadow-lg transition-all w-full"
        >
          {isSaving ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="ml-2 h-4 w-4" />
          ) : null}
          حفظ
        </Button>
      </div>
    </div>
  );
}
