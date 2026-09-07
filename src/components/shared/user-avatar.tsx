import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/types/api";
import { cn } from "@/lib/utils";

type AvatarUser = Pick<
  User,
  "firstName" | "lastName" | "companyName" | "avatar"
>;

type UserAvatarProps = {
  user: AvatarUser;
  size?: "sm" | "default" | "lg";
  className?: string;
};

export function displayName(user: AvatarUser): string {
  const person = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return user.companyName?.trim() || person || "Rate'O user";
}

export function initialsFor(user: AvatarUser): string {
  if (user.firstName || user.lastName) {
    return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  }
  const company = user.companyName?.trim();
  if (company) {
    return company
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }
  return "R";
}

export function UserAvatar({ user, size = "default", className }: UserAvatarProps) {
  const name = displayName(user);

  return (
    <Avatar size={size} className={cn(className)}>
      {user.avatar ? <AvatarImage src={user.avatar} alt={name} /> : null}
      <AvatarFallback className="bg-brand-50 font-semibold text-brand-700">
        {initialsFor(user)}
      </AvatarFallback>
    </Avatar>
  );
}
