import React, { useEffect, useState } from "react";
import ConfirmActionModal from "@/components/modals/EmployeeModals/ConfirmActionModal";

function niceText(v) {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

export default function ResetPasswordConfirmModal({
  open,
  user,
  loading = false,
  success = false,
  error = "",
  onClose,
  onConfirm,
}) {
  const [localSuccess, setLocalSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLocalSuccess(false);
  }, [open]);

  useEffect(() => {
    if (success) setLocalSuccess(true);
  }, [success]);

  const title = localSuccess ? "Password reset complete" : "Reset password";
  const message = localSuccess
    ? `Password reset request completed for ${niceText(user?.email)}.`
    : `This will reset the password for ${niceText(user?.email)}. Continue?`;

  return (
    <ConfirmActionModal
      open={open}
      onClose={onClose}
      title={title}
      message={error ? `${message}\n\n${error}` : message}
      confirmLabel={localSuccess ? "Close" : "Reset"}
      tone={localSuccess ? "teal" : "amber"}
      loading={loading}
      onConfirm={localSuccess ? onClose : onConfirm}
    />
  );
}
