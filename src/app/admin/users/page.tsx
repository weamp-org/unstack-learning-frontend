"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminOnly } from "@/components/admin-only";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchCurrentUser,
  listUsers,
  type ManagedUser,
  USER_ROLES,
  type UserRole,
  updateUserRole,
  userErrorMessage,
} from "@/lib/users";

export default function AdminUsersPage() {
  return (
    <AdminOnly>
      <UsersManager />
    </AdminOnly>
  );
}

function UsersManager() {
  const queryClient = useQueryClient();
  const [draftQ, setDraftQ] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | UserRole>("");

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
  });

  const usersQuery = useQuery({
    queryKey: ["users", "admin", q, role],
    queryFn: () =>
      listUsers({
        ...(q ? { q } : {}),
        ...(role ? { role } : {}),
      }),
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      updateUserRole(id, role),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`${user.name} is now ${user.role}.`);
    },
    onError: (error) =>
      toast.error(userErrorMessage(error, "Could not update role.")),
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Manage users</h1>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQ(draftQ.trim());
        }}
      >
        <Input
          value={draftQ}
          onChange={(event) => setDraftQ(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search users"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="flex gap-2">
        {(
          [{ value: "", label: "All roles" }] as {
            value: "" | UserRole;
            label: string;
          }[]
        )
          .concat(
            USER_ROLES.map((value) => ({
              value,
              label: value[0] + value.slice(1).toLowerCase(),
            })),
          )
          .map((option) => (
            <Button
              key={option.value || "all"}
              variant={role === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRole(option.value)}
            >
              {option.label}
            </Button>
          ))}
      </div>

      {usersQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : usersQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load users.
          </p>
          <Button variant="outline" onClick={() => usersQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : usersQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {usersQuery.data.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === meQuery.data?.id}
              disabled={updateMutation.isPending}
              onRoleChange={(nextRole) =>
                updateMutation.mutate({ id: user.id, role: nextRole })
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  disabled,
  onRoleChange,
}: {
  user: ManagedUser;
  isSelf: boolean;
  disabled: boolean;
  onRoleChange: (role: UserRole) => void;
}) {
  return (
    <li>
      <Card>
        <CardHeader>
          <CardTitle>
            {user.name}
            {isSelf ? " (you)" : null}
          </CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Role</span>
            <select
              value={user.role}
              disabled={disabled || isSelf}
              title={isSelf ? "You cannot change your own role" : "Change role"}
              onChange={(event) => onRoleChange(event.target.value as UserRole)}
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {USER_ROLES.map((value) => (
                <option key={value} value={value}>
                  {value[0] + value.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>
    </li>
  );
}
