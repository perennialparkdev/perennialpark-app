"use client";

import {
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Unlink,
  RefreshCw,
  Mail,
  User,
} from "lucide-react";
import type { Unit, UnitListItem } from "@/lib/api/units";
import { OWNER_STATUS_PENDING } from "@/lib/api/units";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_ACTIVE = 1;
const STATUS_ANULADO = 2;

export interface AdminUnitCardProps {
  /** Full list item from GET /api/units (unit + husband, wife, children, message, preliminarOwner). */
  listItem: UnitListItem;
  onEdit: (item: UnitListItem) => void;
  onDelete: (u: Unit) => void;
  onActivate: (u: Unit) => void;
  onAnular: (u: Unit) => void;
  onUnlink: (u: Unit) => void;
  onResetPassword: (id: string, email: string) => void;
  onSendInvitation: (id: string, email: string) => void;
  actionLoading: string | null;
}

export default function AdminUnitCard({
  listItem,
  onEdit,
  onDelete,
  onActivate,
  onAnular,
  onUnlink,
  onResetPassword,
  onSendInvitation,
  actionLoading,
}: AdminUnitCardProps) {
  const { unit, husband, wife, message, preliminarOwner } = listItem;
  const busy = actionLoading === unit._id;
  const isActive = unit.status === STATUS_ACTIVE;
  const isAnulado = unit.status === STATUS_ANULADO;
  const hasOwners = husband !== null || wife !== null;
  const subtitle =
    husband?.last_name ?? wife?.last_name ?? preliminarOwner?.last_name ?? "";

  return (
    <Card className="bg-white/90 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">
              Unit #{String(unit.unit_number ?? "")}
            </CardTitle>
            {subtitle && (
              <p className="mt-1 text-base font-bold text-slate-800">{subtitle}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(listItem)} aria-label="Edit">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete(unit)}
              disabled={busy}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {unit.notes && <p className="text-xs text-slate-500 line-clamp-2">{unit.notes}</p>}

        {/* Owners or message + preliminar */}
        <div className="border-t border-slate-200 pt-3 space-y-4">
          {hasOwners ? (
            <>
              {husband && (
                <OwnerBlock
                  label="Husband"
                  name={[husband.husband_first, husband.last_name].filter(Boolean).join(" ")}
                  email={husband.husband_email}
                  ownerStatus={husband.status}
                  unitId={unit._id}
                  busy={busy}
                  onResetPassword={onResetPassword}
                  onSendInvitation={onSendInvitation}
                />
              )}
              {wife && (
                <OwnerBlock
                  label="Wife"
                  name={[wife.wife_first, wife.last_name].filter(Boolean).join(" ")}
                  email={wife.wife_email}
                  ownerStatus={wife.status}
                  unitId={unit._id}
                  busy={busy}
                  onResetPassword={onResetPassword}
                  onSendInvitation={onSendInvitation}
                />
              )}
            </>
          ) : (
            <>
              {message && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">{message}</p>
              )}
              {preliminarOwner && (preliminarOwner.last_name || preliminarOwner.husband_phone) && (
                <div className="text-xs text-slate-600">
                  <span className="font-medium">Preliminar:</span>{" "}
                  {[preliminarOwner.last_name, preliminarOwner.husband_phone].filter(Boolean).join(" · ")}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-1 border-t border-slate-200 pt-3">
          {/*{isAnulado && (
            <Button variant="outline" size="sm" onClick={() => onActivate(unit)} disabled={busy}>
              <CheckCircle className="mr-1 h-3 w-3" /> Activate
            </Button>
          )}
          {isActive && (
            <Button variant="outline" size="sm" onClick={() => onAnular(unit)} disabled={busy}>
              <XCircle className="mr-1 h-3 w-3" /> Cancel Action
            </Button>
          )}*/}
          <Button variant="outline" size="sm" onClick={() => onUnlink(unit)} disabled={busy}>
            <Unlink className="mr-1 h-3 w-3" /> Unlink
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OwnerBlock({
  label,
  name,
  email,
  ownerStatus,
  unitId,
  busy,
  onResetPassword,
  onSendInvitation,
}: {
  label: string;
  name: string;
  email: string;
  /** -1 pending, 0 anulado, 1 activo; only pending (-1) can receive invitation */
  ownerStatus: number;
  unitId: string;
  busy: boolean;
  onResetPassword: (id: string, email: string) => void;
  onSendInvitation: (id: string, email: string) => void;
}) {
  const canSendInvitation = ownerStatus === OWNER_STATUS_PENDING;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
        <User className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-xs text-slate-700">
        {name && <span>{name}</span>}
        {name && email && " — "}
        {email && <span>{email}</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onResetPassword(unitId, email)}
          disabled={busy}
          aria-label={`Reset password for ${label.toLowerCase()}`}
        >
          <RefreshCw className={cn("mr-1 h-3 w-3", busy && "animate-spin")} />
          Reset password
        </Button>
        {canSendInvitation && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendInvitation(unitId, email)}
            disabled={busy}
            aria-label={`Send invitation to ${label.toLowerCase()}`}
          >
            <Mail className="mr-1 h-3 w-3" />
            Send invitation
          </Button>
        )}
      </div>
    </div>
  );
}
