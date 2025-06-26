import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, User } from 'lucide-react';

export default function DeferredPayments() {
  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--primary))] flex items-center gap-3">
            <Clock className="text-[hsl(var(--primary))]" />
            المدفوعات المؤجلة
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            إدارة المدفوعات والاستحقاقات المؤجلة
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* إجمالي المدفوعات المؤجلة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              إجمالي المدفوعات المؤجلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0 دينار عراقي</div>
            <p className="text-sm text-muted-foreground">لا توجد مدفوعات مؤجلة حالياً</p>
          </CardContent>
        </Card>

        {/* المستفيدون */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              عدد المستفيدين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-sm text-muted-foreground">لا يوجد مستفيدون</p>
          </CardContent>
        </Card>

        {/* إضافة مدفوعات جديدة */}
        <Card>
          <CardHeader>
            <CardTitle>إدارة المدفوعات</CardTitle>
            <CardDescription>
              إضافة أو تعديل المدفوعات المؤجلة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              إضافة مدفوعات مؤجلة
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}