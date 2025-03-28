import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-secondary">
      <Card className="w-full max-w-md mx-4 shadow-lg border-0 bg-secondary-light">
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center mb-2">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold text-primary-light">404</h1>
            <h2 className="text-xl font-medium text-neutral-light mt-2">الصفحة غير موجودة</h2>
          </div>
        </CardHeader>
        
        <CardContent className="text-center pb-6 pt-2">
          <p className="mt-2 text-sm text-neutral">
            عذراً، الصفحة التي تبحث عنها غير متوفرة. ربما تم نقلها أو حذفها أو تغيير عنوانها.
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center pb-6">
          <Link href="/">
            <Button className="bg-primary-light hover:bg-primary-dark text-white">
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
