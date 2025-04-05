import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Settings, FileText, Shield } from "lucide-react";
import { useLocation } from "wouter";

// استيراد نمط القائمة المنسدلة في الوضع الداكن
import "@/styles/user-menu-dark.css";

export function UserMenu() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      logout();
      queryClient.clear();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "شكراً لاستخدامك التطبيق",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الخروج",
        description: "يرجى المحاولة مرة أخرى",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none">
          <i className="fas fa-user-tie text-sm"></i>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 mt-1 md:ml-1" align="end">
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-sm">
              <i className="fas fa-user-tie text-sm text-white"></i>
            </div>
            <div>
              <div className="font-medium text-sm dark:text-gray-100">{user?.name}</div>
              <div className="text-xs text-muted-foreground dark:text-gray-400">{user?.username}</div>
            </div>
          </div>
          <div className="mt-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md inline-block">
            {user?.role === 'admin' ? 'مدير النظام' : 'مستخدم'}
          </div>
        </div>
        
        <DropdownMenuSeparator className="dark:bg-gray-600" />
        
        <DropdownMenuLabel className="dark:text-gray-300">الحساب</DropdownMenuLabel>
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span>إعدادات الحساب</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700"
          onClick={() => navigate("/activities")}
        >
          <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span>سجل النشاطات</span>
        </DropdownMenuItem>
        
        {user?.role === 'admin' && (
          <DropdownMenuItem 
            className="flex items-center gap-2 cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={() => navigate("/users")}
          >
            <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span>إدارة المستخدمين</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className="dark:bg-gray-600" />
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 text-red-500 dark:text-red-400" />
          <span className="text-red-600 dark:text-red-400">تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}