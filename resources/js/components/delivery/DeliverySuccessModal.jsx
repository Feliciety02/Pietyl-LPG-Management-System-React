import React from "react";
import TransactionResultModal from "@/components/modals/TransactionResultModal";

export default function DeliverySuccessModal({ open, onClose, statusLabel }) {
  const label = statusLabel ? String(statusLabel).toLowerCase() : "delivered";
  const message =
    label === "failed"
      ? "Delivery marked as failed. The record has been updated."
      : "Delivery completed successfully. The record has been updated.";

  return (
    <TransactionResultModal
      open={open}
      onClose={onClose}
      status="success"
      title="Delivery updated"
      message={message}
      primaryLabel="Done"
      autoCloseSeconds={4}
    />
  );
}
