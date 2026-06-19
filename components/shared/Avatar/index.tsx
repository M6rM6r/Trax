import React from "react";
import Image from "next/image";

export type Permission = {
  id: number;
  permission: string;
  title: string;
  group: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  permissions?: Permission[];
  created_at?: string;
  avatar?: string | null; // URL to avatar image
};

type SizeKey = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<SizeKey, { px: number; text: string }> = {
  xs: { px: 24, text: "text-xs" },
  sm: { px: 32, text: "text-sm" },
  md: { px: 40, text: "text-base" },
  lg: { px: 56, text: "text-lg" },
  xl: { px: 80, text: "text-2xl" },
};

interface UserAvatarProps {
  user?: User | null;
  size?: SizeKey;
  showName?: boolean; // show user's name next to avatar
  fallbackBg?: string; // tailwind bg color class for initials fallback
  className?: string;
  onClick?: () => void;
  status?: "online" | "away" | "offline" | null; // small status dot
}

export default function UserAvatar({
  user = null,
  size = "md",
  showName = false,
  fallbackBg = "bg-primaryColor/10",
  className = "",
  onClick,
  status = null,
}: UserAvatarProps) {
  const s = SIZE_MAP[size];
  const initials = user?.name
    ? user.name
        ?.split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      role={onClick ? "button" : undefined}
      onClick={onClick}
    >
      <div
        className={`relative rounded-full overflow-hidden`}
        style={{ width: s.px, height: s.px }}
      >
        {user?.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name}
            width={s.px}
            height={s.px}
            className={`object-cover rounded-full w-[${s.px}px] h-[${s.px}px]`}
            // If your avatar URLs are external, ensure next.config.js `domains` is set.
          />
        ) : (
          <div
            className={`flex items-center justify-center rounded-full ${fallbackBg} text-gray-800 font-semibold ${s.text}`}
            style={{ width: s.px, height: s.px }}
            aria-hidden
          >
            {initials}
          </div>
        )}

        {/* status dot */}
        {status && (
          <span
            className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white ${
              status === "online"
                ? "bg-green-500"
                : status === "away"
                ? "bg-yellow-400"
                : "bg-gray-400"
            }`}
            style={{
              width: Math.round(s.px / 4),
              height: Math.round(s.px / 4),
            }}
          />
        )}
      </div>

      {showName && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-medium text-gray-900">
            {user?.name ?? "User"}
          </span>
          {user?.email && (
            <span className="text-xs text-muted-foreground">{user.email}</span>
          )}
        </div>
      )}
    </div>
  );
}
