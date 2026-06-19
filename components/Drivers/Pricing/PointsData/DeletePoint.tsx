import DeleteDialog from "@/components/Authorization/DeleteDialog";
import { DeleteAction } from "@/public/SVG";

const Index = ({ id }: { id: number }) => {
  return (
    <DeleteDialog
      trigger={
        <button>
          <DeleteAction />
        </button>
      }
      id={id}
      url="deleteSurfaceWithPoints"
      title="سيتم حذف المسطح"
      description="عند تأكيد هذا الإجراء، سيتم حذف المسطح  المحدد ولن يمكن استرجاعه لاحقًا."
    />
  );
};

export default Index;
