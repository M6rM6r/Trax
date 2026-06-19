import { Wallet } from "@/lib/types/responseTypes";
import { DataTable } from "../DataTable/data-table";
import { columns } from "./columns";
import { WalletAvailable, WalletBalance, WalletWithdraw } from "@/public/SVG";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react";

const Index = ({ wallet }: { wallet: Wallet }) => {
  const getTransactionStats = () => {
    const transactions = wallet.transactions || [];
    const totalTransactions = transactions.length;
    const totalDeposits = transactions.filter(
      (t) => t.type === "deposit"
    ).length;
    const totalWithdrawals = transactions.filter(
      (t) => t.type === "withdrawal"
    ).length;

    return { totalTransactions, totalDeposits, totalWithdrawals };
  };

  const stats = getTransactionStats();

  return (
    <div className="space-y-6">
      {/* Wallet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance Card */}
        <Card className="border border-blue-200 bg-blue-50 rounded-2xl hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-600 font-medium text-sm">
                  رصيد المحفظة
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {wallet.total_balance?.toFixed(2) || "0.00"} ر.س
                </p>
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-700 border-blue-200 text-xs"
                >
                  الرصيد الكلي
                </Badge>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <WalletBalance className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Balance Card */}
        <Card className="border border-green-200 bg-green-50 rounded-2xl hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-green-600 font-medium text-sm">
                  المبلغ القابل للسحب
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {wallet.withdrawal_balance?.toFixed(2) || "0.00"} ر.س
                </p>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-700 border-green-200 text-xs"
                >
                  متاح للسحب
                </Badge>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <WalletAvailable className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Summary Card */}
        <Card className="border border-purple-200 bg-purple-50 rounded-2xl hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-purple-600 font-medium text-sm">
                  إجمالي المعاملات
                </p>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-purple-700">
                    {stats.totalTransactions}
                  </p>
                  <p className="text-xs text-purple-600">إجمالي</p>
                </div>
                <div className="border-r border-purple-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ArrowUpCircle className="w-3 h-3 text-green-600" />
                    <p className="text-sm font-bold text-green-600">
                      {stats.totalDeposits}
                    </p>
                  </div>
                  <p className="text-xs text-green-600">إيداع</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ArrowDownCircle className="w-3 h-3 text-red-600" />
                    <p className="text-sm font-bold text-red-600">
                      {stats.totalWithdrawals}
                    </p>
                  </div>
                  <p className="text-xs text-red-600">سحب</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="border border-gray-200 bg-white rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  سجل المعاملات
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  عرض جميع معاملات المحفظة والمدفوعات
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-700 border-gray-300"
              >
                {stats.totalTransactions} معاملة
              </Badge>
            </div>
          </div>
          <DataTable columns={columns} data={Array.isArray(wallet.transactions) ? wallet.transactions : []} />
        </CardContent>
      </Card>

      {/* Empty State */}
      {(!wallet.transactions || wallet.transactions.length === 0) && (
        <Card className="border border-gray-200 bg-gray-50 rounded-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              لا توجد معاملات
            </h3>
            <p className="text-gray-500 text-sm">
              لم يتم تسجيل أي معاملات في المحفظة حتى الآن
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
