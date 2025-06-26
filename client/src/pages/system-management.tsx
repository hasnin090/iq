import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Database, Shield, Activity } from 'lucide-react';

export default function SystemManagement() {
  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--primary))] flex items-center gap-3">
            <Settings className="text-[hsl(var(--primary))]" />
            إدارة النظام
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            أدوات إدارة وصيانة النظام
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* قاعدة البيانات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              إدارة قاعدة البيانات
            </CardTitle>
            <CardDescription>
              مراقبة وصيانة قاعدة البيانات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              فتح إدارة البيانات
            </Button>
          </CardContent>
        </Card>

        {/* الأمان */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              الأمان والصلاحيات
            </CardTitle>
            <CardDescription>
              إدارة أمان النظام والصلاحيات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              إعدادات الأمان
            </Button>
          </CardContent>
        </Card>

        {/* النشاط */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              مراقبة النشاط
            </CardTitle>
            <CardDescription>
              عرض نشاط النظام والإحصائيات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              عرض الإحصائيات
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}