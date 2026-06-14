"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Loader2,
  Mail,
  UserCheck,
  Clock,
  Lock,
  AlertCircle,
  XCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useProjectMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useProjectInvitations,
  useRevokeInvitation,
  type ProjectMember,
  type ProjectInvitation,
} from "@/lib/queries/settings";
import { useSubscription } from "@/lib/queries/billing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: "admin" | "developer" | "viewer" }) {
  const styles = {
    admin: "border-red-500/30 bg-red-500/10 text-red-400",
    developer: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    viewer: "border-gray-500/30 bg-gray-500/10 text-gray-400",
  }[role];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        styles
      )}
    >
      <Shield className="h-3 w-3" />
      {role}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MembersClient() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id;

  const { data: members = [], isLoading: membersLoading } = useProjectMembers(projectId);
  const { data: invitations = [], isLoading: invitesLoading } = useProjectInvitations(projectId);
  const { data: subData, isLoading: subLoading } = useSubscription();

  const inviteMutation = useInviteMember(projectId);
  const updateRoleMutation = useUpdateMemberRole(projectId);
  const removeMemberMutation = useRemoveMember(projectId);
  const revokeInviteMutation = useRevokeInvitation(projectId);

  // Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "developer" | "viewer">("developer");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const planName = subData?.plan?.name ?? "Free";
  const seatLimit = subData?.plan?.teamMembersLimit ?? 1;
  const currentSeatsUsed = 1 + members.length + invitations.length; // 1 for the implicit owner
  const reachedLimit = currentSeatsUsed >= seatLimit;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setErrorMsg("");
    setSuccessMsg("");

    if (reachedLimit) {
      setErrorMsg(`Seat limit reached for plan: ${planName} (${seatLimit} seats max).`);
      return;
    }

    inviteMutation.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setSuccessMsg(`Invitation successfully sent to ${inviteEmail}.`);
          setInviteEmail("");
          setInviteRole("developer");
        },
        onError: (err: any) => {
          setErrorMsg(err?.message ?? "Failed to send invitation.");
        },
      }
    );
  };

  const handleRoleChange = (memberId: string, newRole: "admin" | "developer" | "viewer") => {
    setErrorMsg("");
    setSuccessMsg("");
    updateRoleMutation.mutate(
      { memberId, role: newRole },
      {
        onSuccess: () => {
          setSuccessMsg("Member role updated successfully.");
        },
        onError: (err: any) => {
          setErrorMsg(err?.message ?? "Failed to update member role.");
        },
      }
    );
  };

  const handleRemoveMember = (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this project?`)) return;

    setErrorMsg("");
    setSuccessMsg("");
    removeMemberMutation.mutate(memberId, {
      onSuccess: () => {
        setSuccessMsg("Member removed successfully.");
      },
      onError: (err: any) => {
        setErrorMsg(err?.message ?? "Failed to remove member.");
      },
    });
  };

  const handleRevokeInvite = (inviteId: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke the pending invite for ${email}?`)) return;

    setErrorMsg("");
    setSuccessMsg("");
    revokeInviteMutation.mutate(inviteId, {
      onSuccess: () => {
        setSuccessMsg("Invitation revoked successfully.");
      },
      onError: (err: any) => {
        setErrorMsg(err?.message ?? "Failed to revoke invitation.");
      },
    });
  };

  if (!projectId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Users className="mx-auto h-10 w-10 opacity-30 mb-3" />
          <p className="text-sm text-muted-foreground">Select a project to manage team members.</p>
        </div>
      </div>
    );
  }

  const isLoading = membersLoading || invitesLoading || subLoading;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Members & Settings</h1>
          <p className="text-xs text-muted-foreground">
            Manage roles, pending invitations, and seat access for your project.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          <XCircle className="h-4 w-4 shrink-0" />
          <div className="flex-1">{errorMsg}</div>
          <button onClick={() => setErrorMsg("")} className="opacity-60 hover:opacity-100">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-xs text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <div className="flex-1">{successMsg}</div>
          <button onClick={() => setSuccessMsg("")} className="opacity-60 hover:opacity-100">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Seat Limits Stats */}
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <Card className="border-border/55 bg-muted/20 backdrop-blur-md">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Plan:
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {planName}
                </span>
              </div>
              <h3 className="text-sm font-semibold">
                Team Seats ({currentSeatsUsed} / {seatLimit} used)
              </h3>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    reachedLimit ? "bg-red-500" : "bg-primary"
                  )}
                  style={{ width: `${Math.min((currentSeatsUsed / seatLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
            {reachedLimit && (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-400 max-w-sm">
                <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
                <p>
                  You've reached your plan's team seat limit. Upgrade to invite more developers or admins to this project.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Active Members & Pending Invites List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Members */}
          <Card className="border-border/55 bg-card/60 backdrop-blur-md">
            <CardHeader className="p-4 sm:p-5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> Active Members
              </CardTitle>
              <CardDescription className="text-xs">
                These users currently have access to manage or view this project.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-border/40" />
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : members.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No active project members found.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {/* Implicit Owner Row */}
                  <div className="flex items-center justify-between p-4 sm:p-5 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary uppercase">
                        OW
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          Project Owner
                          <span className="inline-flex rounded bg-primary/10 border border-primary/20 px-1 py-0.2 text-[9px] font-medium text-primary">
                            Owner
                          </span>
                        </div>
                        <div className="text-[10px] opacity-60">Implicit Project Administrator</div>
                      </div>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                        Admin / Owner
                      </span>
                    </div>
                  </div>

                  {/* Collaborator Rows */}
                  {members.map((member) => {
                    const initials = member.user?.name
                      ? member.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                      : member.user?.email.slice(0, 2).toUpperCase() ?? "MB";

                    const isOwner = member.userId === currentProject?.ownerId;

                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 sm:p-5 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted border border-border text-[10px] font-semibold uppercase">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold">{member.user?.name || "Pending Name"}</div>
                            <div className="text-[10px] opacity-60">{member.user?.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isOwner ? (
                            <RoleBadge role="admin" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Select
                                value={member.role}
                                onValueChange={(val) =>
                                  handleRoleChange(member.id, val as any)
                                }
                                disabled={updateRoleMutation.isPending}
                              >
                                <SelectTrigger className="h-7 w-24 text-[10px] bg-muted/40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin" className="text-[10px]">Admin</SelectItem>
                                  <SelectItem value="developer" className="text-[10px]">Developer</SelectItem>
                                  <SelectItem value="viewer" className="text-[10px]">Viewer</SelectItem>
                                </SelectContent>
                              </Select>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-red-400"
                                onClick={() =>
                                  handleRemoveMember(member.id, member.user?.name || member.user?.email || "")
                                }
                                disabled={removeMemberMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card className="border-border/55 bg-card/60 backdrop-blur-md">
            <CardHeader className="p-4 sm:p-5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" /> Pending Invitations
              </CardTitle>
              <CardDescription className="text-xs">
                Sent invitations that have not been accepted yet.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-border/40" />
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No pending invitations found.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {invitations.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 sm:p-5 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                          <Mail className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold">{invite.email}</div>
                          <div className="text-[10px] opacity-60 flex items-center gap-1.5">
                            Role: <RoleBadge role={invite.role} />
                            &bull;
                            Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px] text-muted-foreground hover:text-red-400"
                        onClick={() => handleRevokeInvite(invite.id, invite.email)}
                        disabled={revokeInviteMutation.isPending}
                      >
                        {revokeInviteMutation.isPending &&
                        revokeInviteMutation.variables === invite.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invite Form */}
        <div className="lg:col-span-1">
          <Card className="border-border/55 bg-card/60 backdrop-blur-md sticky top-6">
            <CardHeader className="p-4 sm:p-5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> Invite Team Member
              </CardTitle>
              <CardDescription className="text-xs">
                Add administrators or developers to help support this project.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-border/40" />
            <CardContent className="p-4 sm:p-5">
              {reachedLimit ? (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-400 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Lock className="h-3.5 w-3.5" /> Invite Gated
                  </div>
                  <p className="leading-normal">
                    You have reached the seat limit on your plan ({seatLimit} seats). Please upgrade your subscription to add collaborators.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <Label htmlFor="invite-email" className="text-xs text-muted-foreground mb-1 block">
                      Email Address
                    </Label>
                    <Input
                      id="invite-email"
                      className="h-8 text-xs"
                      type="email"
                      placeholder="developer@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      disabled={inviteMutation.isPending}
                    />
                  </div>

                  <div>
                    <Label htmlFor="invite-role" className="text-xs text-muted-foreground mb-1 block">
                      Project Role
                    </Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(val) => setInviteRole(val as any)}
                      disabled={inviteMutation.isPending}
                    >
                      <SelectTrigger id="invite-role" className="h-8 text-xs bg-muted/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin" className="text-xs">
                          Admin (Full Config Access)
                        </SelectItem>
                        <SelectItem value="developer" className="text-xs">
                          Developer (Edit Configs)
                        </SelectItem>
                        <SelectItem value="viewer" className="text-xs">
                          Viewer (Read-Only Dash)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5"
                    disabled={inviteMutation.isPending || reachedLimit || !inviteEmail}
                  >
                    {inviteMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    Send Invitation
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
