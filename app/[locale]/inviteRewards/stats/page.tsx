import FilterTabs from "@/components/invite-rewards/stats/FilterTabs";
import BreadCrumb from "@/components/shared/BreadCrumb";
import MainLayout from "@/components/shared/MainLayout";
import { fetcher } from "@/lib/fetcher";
import { ReferralStatistics } from "@/lib/types/responseTypes";
import {
  Flash,
  TotalInvitesSent,
  TotalSuccessfullInvites,
  TransferRate,
  TotalRewards,
  TotalWithdrawals,
  TotalPendingPrice,
  SuccessRate,
  TotalDriversRewards,
  TotalDriversWithdrawals,
  TotalReferrerCustomers,
  TotalRewardedUsers,
  DriversStatsTotalInvitesSent,
} from "@/public/SVG";
import { Star } from "lucide-react";
import React from "react";

const Page = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  const filterDate = searchParams.filter_date || "all";
  const url = `/referral/statistics?filter_date=${filterDate}`;

  const data = await fetcher<ReferralStatistics>(url);
  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "الدعوات والمكآفأت",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "إحصائيات عامة",
          },
        ]}
      />

      {/* فلتر */}
      <div className="py-5">
        <FilterTabs />
      </div>
      {/* إحصائيات عامة */}
      <div className=" flex flex-col gap-4 border border-gray200 rounded-12 p-5">
        <p className="text-20 text-textMain font-[700]">إحصائيات عامة</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                إجمالي الدعوات المرسلة
              </p>
              <TotalInvitesSent />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {data?.data?.general_stats?.total_invites_sent}
            </p>
          </div>

          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                إجمالي الدعوات الناجحة
              </p>
              <TotalSuccessfullInvites />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.general_stats?.total_successfull_invites}
            </p>
          </div>

          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">معدل التحويل </p>
              <TransferRate />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.general_stats?.transfer_rate}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                إجمالي المكافآت الممنوحة{" "}
              </p>
              <TotalRewards />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.general_stats?.total_rewards} ر.س
            </p>
          </div>

          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                اجمالي المكافأت ـ المسحوبة
              </p>
              <TotalWithdrawals />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.general_stats?.total_withdrawals} ر.س
            </p>
          </div>

          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                إجمالي الرصيد المعلّق{" "}
              </p>
              <TotalPendingPrice />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.general_stats?.total_pending_price} ر.س
            </p>
          </div>
        </div>
      </div>
      {/* إحصائيات السائقين كداعين ,  إحصائيات الركاب كداعين */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        <div className=" flex flex-col gap-4 border border-gray200 rounded-12 p-5">
          <p className="text-20 text-textMain font-[700]">
            إحصائيات السائقين كداعين
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex flex-col items-start justify-between flex-wrap gap-5">
                <TotalReferrerCustomers />
                <p className="text-16 text-textMain font-[300]">
                  عدد السائقين الداعين لمستخدمين
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {" "}
                {data?.data?.drivers_stats?.total_referrer_customers}
              </p>
            </div>
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex flex-col items-start justify-between flex-wrap gap-5">
                <DriversStatsTotalInvitesSent />
                <p className="text-16 text-textMain font-[300]">
                  عدد الدعوات المرسلة بواسطة السائقين{" "}
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {" "}
                {data?.data?.drivers_stats?.total_invites_sent}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex flex-col items-start justify-between flex-wrap gap-5">
                <TotalRewardedUsers />
                <p className="text-16 text-textMain font-[300]">
                  الحاصلون على مكافآت من الدعوات{" "}
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {" "}
                {data?.data?.drivers_stats?.total_rewarded_users}
              </p>
            </div>
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex items-start flex-col justify-between flex-wrap gap-5">
                {" "}
                <SuccessRate />
                <p className="text-16 text-textMain font-[300]">
                  نسبة نجاح دعوات السائقين{" "}
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {" "}
                {data?.data?.drivers_stats?.success_rate}
              </p>
            </div>
          </div>{" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex items-start flex-col justify-between flex-wrap gap-5">
                <TotalDriversRewards />
                <p className="text-16 text-textMain font-[300]">
                  إجمالي مكافآت السائقين{" "}
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {" "}
                {data?.data?.drivers_stats?.total_drivers_rewards} ر.س
              </p>
            </div>
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex items-start flex-col justify-between flex-wrap gap-5">
                <TotalDriversWithdrawals />
                <p className="text-16 text-textMain font-[300]">
                  إجمالي السحب المنفذ للسائقين
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {data?.data?.drivers_stats?.total_drivers_withdrawals} ر.س
              </p>
            </div>
          </div>
        </div>

        {/*إحصائيات الركاب كداعين */}
        <div className=" flex flex-col gap-4 border border-gray200 rounded-12 p-5">
          <p className="text-20 text-textMain font-[700]">
            إحصائيات الركاب كداعين
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex items-start flex-col justify-between flex-wrap gap-5">
                {" "}
                <TotalReferrerCustomers />{" "}
                <p className="text-16 text-textMain font-[300]">
                  عدد الركاب الداعين لمستخدمين{" "}
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {" "}
                {data?.data?.customers_stats?.total_referrer_customers}
              </p>
            </div>
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex items-start flex-col justify-between flex-wrap gap-5">
                {" "}
                <DriversStatsTotalInvitesSent />
                <p className="text-16 text-textMain font-[300]">
                  عدد الدعوات المرسلة بواسطة الركاب{" "}
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {" "}
                {data?.data?.customers_stats?.total_invites_sent}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex items-start flex-col justify-between flex-wrap gap-5">
                <TotalRewardedUsers />
                <p className="text-16 text-textMain font-[300]">
                  الحاصلون على مكافآت من الدعوات{" "}
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {" "}
                {data?.data?.customers_stats?.total_rewarded_users}
              </p>
            </div>
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex items-start flex-col justify-between flex-wrap gap-5">
                {" "}
                <SuccessRate />
                <p className="text-16 text-textMain font-[300]">
                  نسبة نجاح دعوات الركاب{" "}
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {" "}
                {data?.data?.customers_stats?.success_rate}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex items-start flex-col justify-between flex-wrap gap-5">
                {" "}
                <TotalDriversRewards />
                <p className="text-16 text-textMain font-[300]">
                  إجمالي مكافآت الركاب
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {" "}
                {data?.data?.customers_stats?.total_drivers_rewards} ر.س
              </p>
            </div>
            <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
              <div className="flex items-start flex-col justify-between flex-wrap gap-5">
                {" "}
                <TotalDriversWithdrawals />
                <p className="text-16 text-textMain font-[300]">
                  إجمالي السحب المنفذ للركاب{" "}
                </p>
              </div>
              <p className="text-18 text-textMain font-[500]">
                {data?.data?.customers_stats?.total_drivers_withdrawals} ر.س
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* إحصائيات الدعوات بين الركاب */}
      <div className=" flex flex-col gap-4 border border-gray200 rounded-12 p-5">
        <p className="text-20 text-textMain font-[700]">
          إحصائيات الدعوات بين الركاب
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">عدد الدعوات </p>
              <DriversStatsTotalInvitesSent />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {data?.data?.customer_to_customer_stats?.total_invites}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">نسبة النجاح </p>
              <SuccessRate />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.customer_to_customer_stats?.success_rate}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">معدل التحويل </p>
              <TransferRate />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.customer_to_customer_stats?.transfer_rate}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                المكافآت الممنوحة{" "}
              </p>
              <TotalDriversRewards />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.customer_to_customer_stats?.total_rewards} ر.س
            </p>
          </div>

          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                المكافآت المسحوبة
              </p>
              <TotalDriversWithdrawals />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.customer_to_customer_stats?.total_withdrawals} ر.س
            </p>
          </div>
        </div>
      </div>
      {/* إحصائيات دعوات الركاب للسائقين */}
      <div className=" flex flex-col gap-4 border border-gray200 rounded-12 p-5">
        <p className="text-20 text-textMain font-[700]">
          إحصائيات دعوات الركاب للسائقين{" "}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">عدد الدعوات </p>
              <DriversStatsTotalInvitesSent />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {data?.data?.customer_to_driver_stats?.total_invites}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">نسبة النجاح </p>
              <SuccessRate />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.customer_to_driver_stats?.success_rate}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">معدل التحويل </p>
              <TransferRate />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.customer_to_driver_stats?.transfer_rate}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                المكافآت الممنوحة{" "}
              </p>
              <TotalDriversRewards />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.customer_to_driver_stats?.total_rewards} ر.س
            </p>
          </div>

          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                المكافآت المسحوبة
              </p>
              <TotalDriversWithdrawals />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.customer_to_driver_stats?.total_withdrawals} ر.س
            </p>
          </div>
        </div>
      </div>
      {/* إحصائيات دعوات السائقين للركاب */}
      <div className=" flex flex-col gap-4 border border-gray200 rounded-12 p-5">
        <p className="text-20 text-textMain font-[700]">
          إحصائيات دعوات السائقين للركاب{" "}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">عدد الدعوات </p>
              <DriversStatsTotalInvitesSent />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {data?.data?.driver_to_customer_stats?.total_invites}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">نسبة النجاح </p>
              <SuccessRate />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.driver_to_customer_stats?.success_rate}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">معدل التحويل </p>
              <TransferRate />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.driver_to_customer_stats?.transfer_rate}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                المكافآت الممنوحة{" "}
              </p>
              <TotalDriversRewards />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.driver_to_customer_stats?.total_rewards} ر.س
            </p>
          </div>

          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                المكافآت المسحوبة
              </p>
              <TotalDriversWithdrawals />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.driver_to_customer_stats?.total_withdrawals} ر.س
            </p>
          </div>
        </div>
      </div>
      {/* إحصائيات الدعوات بين السائقين */}
      <div className=" flex flex-col gap-4 border border-gray200 rounded-12 p-5">
        <p className="text-20 text-textMain font-[700]">
          إحصائيات الدعوات بين السائقين{" "}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">عدد الدعوات </p>
              <DriversStatsTotalInvitesSent />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {data?.data?.driver_to_driver_stats?.total_invites}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">نسبة النجاح </p>
              <SuccessRate />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.driver_to_driver_stats?.success_rate}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">معدل التحويل </p>
              <TransferRate />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.driver_to_driver_stats?.transfer_rate}
            </p>
          </div>
          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                المكافآت الممنوحة{" "}
              </p>
              <TotalDriversRewards />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.driver_to_driver_stats?.total_rewards} ر.س
            </p>
          </div>

          <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5 bg-[#F9FAFB]">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <p className="text-16 text-textMain font-[300]">
                المكافآت المسحوبة
              </p>
              <TotalDriversWithdrawals />
            </div>
            <p className="text-18 text-textMain font-[500]">
              {" "}
              {data?.data?.driver_to_driver_stats?.total_withdrawals} ر.س
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
