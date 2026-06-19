"use client";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { TeamResponse } from "@/lib/types/responseTypes";
import { ProfileTick } from "@/public/SVG";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Index = ({
  team,
  id,
  complaint_id,
  team_members,
}: {
  team?: any;
  id: any;
  complaint_id: any;
  team_members?: any;
}) => {
  const [assigned, setAssigned] = useState(id);
  const [teamMembers, setTeamMembers] = useState<TeamResponse>(
    {} as TeamResponse
  );
  const [loading, setLoading] = useState(false);
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  useEffect(() => {
    const getTeamMembers = async () => {
      const res = await fetcherClient<TeamResponse>(`/teams/${team}`);
      setTeamMembers(res);
    };
    team && getTeamMembers();
  }, [team]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="الاسم" />
      ),
      cell: ({ row }) => (
        <AvatarWithName
          image={""}
          name={row.original?.name}
          gender={""}
          online={false}
        />
      ),
    },
    {
      accessorKey: "job",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="الوظيفة" />
      ),
      cell: ({ row }) => <div>{row.original?.job}</div>,
    },

    {
      id: "actions",
      header: "الإجراء",
      cell: ({ row }) => (
        <button
          className={` flex items-center gap-2 text-16 font-[600] ${
            assigned != row.original.id
              ? "text-primaryColor"
              : " text-iconColor"
          }`}
          onClick={() => setAssigned(row.original.id)}
        >
          <ProfileTick
            className={`w-[23px] ${
              assigned != row.original.id
                ? "text-primaryColor"
                : " text-iconColor"
            }`}
          />
          {assigned != row.original.id ? "إسناد" : "إلغاء"}
        </button>
      ),
    },
  ];
  const handleAssign = async () => {
    setLoading(true);
    const formdata = new FormData();
    formdata.append("assigned_to", assigned);
    formdata.append("_method", "put");
    try {
      const response = await fetcherClient<any>(`/complaints/${complaint_id}`, {
        method: "POST",
        body: formdata,
      });

      showResponseToast(response);
      router.refresh();
    } catch (error: any) {
      showResponseToast(error.info);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className=" flex flex-col gap-5">
      <DataTable
        columns={columns}
        data={
          team_members ?? [
            ...(teamMembers?.data?.team?.members ?? []),
            ...(teamMembers?.data?.team?.manager
              ? [teamMembers.data.team.manager]
              : []),
          ]
        }
        heading="فريق إدارة الشكاوى"
        customizeColumnAppear={false}
      />

      <div className="flex justify-between gap-5">
        <DialogClose asChild>
          <Button
            type="submit"
            variant={"primary"}
            className="w-40"
            onClick={handleAssign}
            disabled={loading || !assigned}
          >
            حفظ
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant={"primaryLight"} className="w-40">
            إلغاء
          </Button>
        </DialogClose>
      </div>
    </div>
  );
};

export default Index;
