import { Switch } from "@/components/ui/switch";

interface ServiceSwitchesProps {
  is_coming_soon: boolean;
  is_hidden: boolean;
  onIsComingSoonChange: (value: boolean) => void;
  onIsHiddenChange: (value: boolean) => void;
}

const ServiceSwitches = ({
  is_coming_soon,
  is_hidden,
  onIsComingSoonChange,
  onIsHiddenChange,
}: ServiceSwitchesProps) => {
  return (
    <div className="p-7 border border-gray200 rounded-6 flex flex-col gap-5">
      <div className="flex items-center gap-5">
        <Switch
          checked={is_coming_soon}
          onCheckedChange={onIsComingSoonChange}
        />
        <p className="text-30 text-textMain font-[600]">
          ايقاف الخدمة مؤقتاً &quot;جعلها قريبا&quot;
        </p>
      </div>
      <div className="flex items-center gap-5">
        <Switch
          checked={is_hidden}
          onCheckedChange={onIsHiddenChange}
        />
        <p className="text-30 text-textMain font-[600]">
          اخفاء الخدمة من التطبيق
        </p>
      </div>
    </div>
  );
};

export default ServiceSwitches;
