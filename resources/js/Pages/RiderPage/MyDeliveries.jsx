import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePage, router } from "@inertiajs/react";
import Layout from "@/pages/Dashboard/Layout";
import DeliveryStepper from "@/components/delivery/DeliveryStepper";
import Step1CustomerInfo from "@/components/delivery/Step1CustomerInfo";
import Step2ItemsGeo from "@/components/delivery/Step2ItemsGeo";
import Step3ProofOfDelivery from "@/components/delivery/Step3ProofOfDelivery";
import Step4SignatureOrReason from "@/components/delivery/Step4SignatureOrReason";
import Step5ReviewAndStatus from "@/components/delivery/Step5ReviewAndStatus";
import DeliverySuccessModal from "@/components/delivery/DeliverySuccessModal";
import { Card, EmptyState, StatusPill, cx } from "@/components/delivery/DeliveryShared";
import { Search } from "lucide-react";

const OFFLINE_QUEUE_KEY = "rider_offline_queue_v1";

function loadQueue() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage errors
  }
}

function applyQueueToDeliveries(deliveries, queue) {
  if (!Array.isArray(deliveries) || !Array.isArray(queue) || queue.length === 0) return deliveries;

  const next = deliveries.map((d) => ({ ...d }));

  queue.forEach((item) => {
    const idx = next.findIndex((d) => d.id === item.deliveryId);
    if (idx === -1) return;

    if (item.type === "status") {
      next[idx].status = item.payload?.status || next[idx].status;
      if (item.payload?.proof_photo_data) {
        next[idx].proof_photo_url = item.payload.proof_photo_data;
      }
      if (item.payload?.proof_signature) {
        next[idx].proof_signature_url = item.payload.proof_signature;
      }
      if (item.payload?.proof_geo_lat !== undefined) {
        next[idx].proof_geo_lat = item.payload.proof_geo_lat;
      }
      if (item.payload?.proof_geo_lng !== undefined) {
        next[idx].proof_geo_lng = item.payload.proof_geo_lng;
      }
      if (item.payload?.proof_captured_at) {
        next[idx].proof_captured_at = item.payload.proof_captured_at;
      }
      if (item.payload?.proof_exceptions !== undefined) {
        next[idx].proof_exceptions = item.payload.proof_exceptions;
      }
      if (item.payload?.delivered_items) {
        next[idx].delivered_items = item.payload.delivered_items;
      }
    }
  });

  return next;
}

function makeQueueId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function canTransition(from, to) {
  const f = String(from || "").toLowerCase();
  const t = String(to || "").toLowerCase();

  const normalize = (x) => (x === "on the way" ? "on_the_way" : x);
  const F = normalize(f);
  const T = normalize(t);

  if ((F === "pending" || F === "assigned") && (T === "in_transit" || T === "failed")) return true;
  if (F === "in_transit" && (T === "delivered" || T === "failed")) return true;

  return false;
}

function buildDeliveredItems(delivery) {
  const base = Array.isArray(delivery?.items) ? delivery.items : [];
  return base.map((item, idx) => {
    const ordered = Number(item?.ordered_qty ?? item?.qty ?? 0);
    return {
      key: item?.sale_item_id ?? item?.id ?? item?.product_variant_id ?? `${idx}`,
      sale_item_id: item?.sale_item_id ?? item?.id ?? null,
      product_variant_id: item?.product_variant_id ?? null,
      name: item?.name || "Item",
      ordered_qty: Number.isFinite(ordered) ? ordered : 0,
      delivered_qty: Number.isFinite(ordered) ? ordered : 0,
    };
  });
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase();
}
export default function MyDeliveries() {
  const { auth, deliveries: serverDeliveries } = usePage().props;
  const user = auth?.user;

  const DEV_SAMPLE = [
    {
      id: 101,
      code: "DLV-000101",
      delivery_type: "delivery",
      scheduled_at: "Today 2:30 PM",
      created_at: "2026-01-20 10:12",
      status: "pending",

      customer_name: "Juan Dela Cruz",
      customer_phone: "09171234567",
      address: "Matina, Davao City",
      barangay: "Matina Crossing",
      landmark: "Near Jollibee",
      instructions: "Call when outside, gate is locked.",

      payment_method: "gcash",
      payment_status: "prepaid",
      amount_total: "P980.00",
      delivery_fee: "P50.00",

      distance_km: "6.2 km",
      eta_mins: "25 mins",

      items: [
        { name: "LPG Cylinder 11 kg", qty: 1 },
        { name: "Hose + Regulator", qty: 1 },
      ],

      notes: "",
    },
  ];

  const baseDeliveries = Array.isArray(serverDeliveries) ? serverDeliveries : DEV_SAMPLE;
  const initialQueue = useMemo(() => loadQueue(), []);
  const [queue, setQueue] = useState(initialQueue);
  const [deliveries, setDeliveries] = useState(() =>
    applyQueueToDeliveries(baseDeliveries, initialQueue)
  );

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [syncing, setSyncing] = useState(false);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(deliveries[0]?.id || null);

  const [activeStep, setActiveStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [onTheWayConfirmed, setOnTheWayConfirmed] = useState(false);
  const [proofGeo, setProofGeo] = useState({ lat: "", lng: "" });
  const [geoError, setGeoError] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [proofCapturedAt, setProofCapturedAt] = useState("");
  const [deliveredItems, setDeliveredItems] = useState([]);

  const [proofPhotoFile, setProofPhotoFile] = useState(null);
  const [proofPhotoData, setProofPhotoData] = useState("");
  const [proofPhotoPreview, setProofPhotoPreview] = useState("");
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const photoInputRef = useRef(null);
  const [cameraTrigger, setCameraTrigger] = useState(0);

  const [signatureData, setSignatureData] = useState("");
  const [customerAvailable, setCustomerAvailable] = useState(null);
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceOther, setAbsenceOther] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("delivered");

  const pendingCount = queue.length;

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  useEffect(() => {
    const nextBase = Array.isArray(serverDeliveries) ? serverDeliveries : DEV_SAMPLE;
    setDeliveries(applyQueueToDeliveries(nextBase, queue));
  }, [serverDeliveries]);

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncQueue();
    }
  }, [isOnline]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deliveries.filter((d) => {
      const hay = `${d.code || ""} ${d.customer_name || ""} ${d.address || ""}`.toLowerCase();
      const matchesQuery = !q || hay.includes(q);

      if (filter === "all") return matchesQuery;
      return matchesQuery && String(d.status || "").toLowerCase() === filter;
    });
  }, [deliveries, query, filter]);

  const selected = useMemo(() => deliveries.find((d) => d.id === selectedId) || null, [deliveries, selectedId]);
  const selectedAddress = selected?.address || "";
  const isCompletedStatus = selected
    ? ["delivered", "failed"].includes(normalizeStatus(selected.status))
    : false;

  function resetStepState() {
    setActiveStep(0);
    setStepError("");
    setOnTheWayConfirmed(false);
    setProofGeo({ lat: "", lng: "" });
    setGeoError("");
    setGeoBusy(false);
    setProofCapturedAt("");
    setDeliveredItems([]);
    setProofPhotoFile(null);
    setProofPhotoData("");
    setProofPhotoPreview("");
    setPhotoConfirmed(false);
    setSignatureData("");
    setCustomerAvailable(null);
    setAbsenceReason("");
    setAbsenceOther("");
    setDeliveryStatus("delivered");
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function hydrateFromDelivery(delivery) {
    resetStepState();
    if (!delivery) return;

    const status = normalizeStatus(delivery.status);
    if (["in_transit", "delivered", "failed"].includes(status)) {
      setOnTheWayConfirmed(true);
    }

    setDeliveredItems(buildDeliveredItems(delivery));

    if (delivery?.proof_geo_lat || delivery?.proof_geo_lng) {
      setProofGeo({
        lat: delivery.proof_geo_lat ?? "",
        lng: delivery.proof_geo_lng ?? "",
      });
    }
    if (delivery?.proof_captured_at) {
      setProofCapturedAt(delivery.proof_captured_at);
    }

    if (delivery?.proof_photo_url) {
      setProofPhotoPreview(delivery.proof_photo_url);
      setPhotoConfirmed(true);
    }

    if (delivery?.proof_signature_url) {
      setSignatureData(delivery.proof_signature_url);
      setCustomerAvailable("yes");
    }

    if (delivery?.proof_exceptions) {
      const known = [
        "Customer not home",
        "Refused delivery",
        "Wrong address",
        "Unable to contact",
        "Others",
      ];
      if (known.includes(delivery.proof_exceptions)) {
        setCustomerAvailable("no");
        setAbsenceReason(delivery.proof_exceptions);
      } else {
        setCustomerAvailable("no");
        setAbsenceReason("Others");
        setAbsenceOther(delivery.proof_exceptions);
      }
    }

    if (status === "failed") {
      setDeliveryStatus("failed");
    }
  }

  function selectDelivery(d) {
    setSelectedId(d.id);
    setStepError("");
  }

  useEffect(() => {
    if (selected) {
      hydrateFromDelivery(selected);
    } else {
      resetStepState();
    }
  }, [selectedId]);

  useEffect(() => {
    if (isCompletedStatus) {
      setActiveStep(0);
    }
  }, [isCompletedStatus]);

  useEffect(() => {
    if (!selected || activeStep !== 1) return;

    if (!proofCapturedAt) {
      setProofCapturedAt(new Date().toISOString());
    }
    if (!proofGeo.lat || !proofGeo.lng) {
      captureLocation();
    }
  }, [activeStep, selectedId]);

  useEffect(() => {
    if (!selected || activeStep !== 2) return;
    if (!proofPhotoPreview) {
      setCameraTrigger((v) => v + 1);
    }
  }, [activeStep, selectedId]);

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setProofPhotoFile(null);
      setProofPhotoData("");
      setProofPhotoPreview("");
      setPhotoConfirmed(false);
      return;
    }

    setProofPhotoFile(file);
    setPhotoConfirmed(false);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setProofPhotoData(dataUrl);
      setProofPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleRetakePhoto() {
    setProofPhotoFile(null);
    setProofPhotoData("");
    setProofPhotoPreview("");
    setPhotoConfirmed(false);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
    setCameraTrigger((v) => v + 1);
  }

  function handleConfirmPhoto() {
    if (proofPhotoPreview) {
      setPhotoConfirmed(true);
    }
  }
  function captureLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocation is not available on this device.");
      return;
    }

    setGeoBusy(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProofGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        if (!proofCapturedAt) {
          setProofCapturedAt(new Date(pos.timestamp).toISOString());
        }
        setGeoBusy(false);
      },
      (err) => {
        setGeoError(err?.message || "Unable to capture location.");
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  function setTimeNow() {
    setProofCapturedAt(new Date().toISOString());
  }

  function handleCustomerAvailableChange(value) {
    setCustomerAvailable(value);
    if (value === "yes") {
      setAbsenceReason("");
      setAbsenceOther("");
    }
    if (value === "no") {
      setSignatureData("");
    }
  }

  function handleAbsenceReasonChange(value) {
    setAbsenceReason(value);
    if (value !== "Others") {
      setAbsenceOther("");
    }
  }

  function updateLocalDelivery(deliveryId, changes) {
    setDeliveries((prev) => prev.map((d) => (d.id === deliveryId ? { ...d, ...changes } : d)));
  }

  function enqueueAction(action) {
    setQueue((prev) => {
      const pruned = prev.filter((item) => !(item.deliveryId === action.deliveryId && item.type === action.type));
      return [...pruned, action];
    });
  }

  async function sendStatusUpdate(deliveryId, payload) {
    const formData = new FormData();
    formData.append("_method", "PATCH");
    formData.append("status", payload.status);

    if (payload.proof_photo) {
      formData.append("proof_photo", payload.proof_photo);
    }
    if (payload.proof_photo_data) {
      formData.append("proof_photo_data", payload.proof_photo_data);
    }
    if (payload.proof_signature) {
      formData.append("proof_signature", payload.proof_signature);
    }
    if (payload.proof_geo_lat !== undefined && payload.proof_geo_lat !== "") {
      formData.append("proof_geo_lat", payload.proof_geo_lat);
    }
    if (payload.proof_geo_lng !== undefined && payload.proof_geo_lng !== "") {
      formData.append("proof_geo_lng", payload.proof_geo_lng);
    }
    if (payload.proof_captured_at) {
      formData.append("proof_captured_at", payload.proof_captured_at);
    }
    if (payload.proof_exceptions !== undefined) {
      formData.append("proof_exceptions", payload.proof_exceptions);
    }
    if (payload.delivered_items) {
      formData.append("delivered_items", JSON.stringify(payload.delivered_items));
    }

    return window.axios.post(`/dashboard/rider/deliveries/${deliveryId}`, formData, {
      headers: { Accept: "application/json" },
    });
  }

  async function syncQueue() {
    if (syncing || queue.length === 0) return;
    setSyncing(true);

    let remaining = [...queue];

    for (const item of queue) {
      try {
        if (item.type === "status") {
          await sendStatusUpdate(item.deliveryId, item.payload);
        }
        remaining = remaining.filter((queued) => queued.id !== item.id);
        setQueue(remaining);
      } catch {
        break;
      }
    }

    setSyncing(false);

    if (remaining.length === 0) {
      router.reload({ only: ["deliveries"] });
    }
  }

  function buildDeliveredPayload() {
    return deliveredItems.map((item) => {
      const orderedQty = Number(item?.ordered_qty ?? item?.qty ?? 0);
      const deliveredQty = Number(item?.delivered_qty ?? orderedQty);

      return {
        sale_item_id: item?.sale_item_id ?? item?.id ?? null,
        product_variant_id: item?.product_variant_id ?? null,
        name: item?.name || "Item",
        ordered_qty: Number.isFinite(orderedQty) ? orderedQty : 0,
        delivered_qty: Number.isFinite(deliveredQty) ? Math.max(0, deliveredQty) : 0,
      };
    });
  }

  async function updateStatus(nextStatus, { includeProof = false, showSuccess = false } = {}) {
    if (!selected) return false;

    if (!canTransition(selected.status, nextStatus)) {
      setStepError("Invalid status transition.");
      return false;
    }

    const payload = { status: nextStatus };
    const localProofUpdate = {};

    if (includeProof) {
      const proofExceptions =
        customerAvailable === "no"
          ? absenceReason === "Others"
            ? absenceOther
            : absenceReason
          : "";

      let capturedAt = proofCapturedAt;
      if (!capturedAt) {
        capturedAt = new Date().toISOString();
        setProofCapturedAt(capturedAt);
      }

      if (proofPhotoFile) {
        payload.proof_photo = proofPhotoFile;
      } else if (proofPhotoData) {
        payload.proof_photo_data = proofPhotoData;
      }

      if (signatureData) {
        payload.proof_signature = signatureData;
      }

      if (proofGeo.lat !== "") {
        payload.proof_geo_lat = proofGeo.lat;
      }
      if (proofGeo.lng !== "") {
        payload.proof_geo_lng = proofGeo.lng;
      }
      if (capturedAt) {
        payload.proof_captured_at = capturedAt;
      }

      payload.proof_exceptions = proofExceptions;
      payload.delivered_items = buildDeliveredPayload();

      if (proofPhotoPreview) {
        localProofUpdate.proof_photo_url = proofPhotoPreview;
      }
      if (signatureData) {
        localProofUpdate.proof_signature_url = signatureData;
      }
      if (proofGeo.lat !== "") {
        localProofUpdate.proof_geo_lat = proofGeo.lat;
      }
      if (proofGeo.lng !== "") {
        localProofUpdate.proof_geo_lng = proofGeo.lng;
      }
      if (capturedAt) {
        localProofUpdate.proof_captured_at = capturedAt;
      }
      localProofUpdate.proof_exceptions = proofExceptions;
      localProofUpdate.delivered_items = payload.delivered_items;
    }

    if (!isOnline) {
      enqueueAction({
        id: makeQueueId(),
        deliveryId: selected.id,
        type: "status",
        payload: {
          status: nextStatus,
          proof_photo_data: proofPhotoData,
          proof_signature: signatureData,
          proof_geo_lat: proofGeo.lat,
          proof_geo_lng: proofGeo.lng,
          proof_captured_at: payload.proof_captured_at,
          proof_exceptions: payload.proof_exceptions,
          delivered_items: payload.delivered_items,
        },
        created_at: new Date().toISOString(),
      });
      updateLocalDelivery(selected.id, { status: nextStatus, ...localProofUpdate });
      if (showSuccess) setSuccessOpen(true);
      return true;
    }

    try {
      await sendStatusUpdate(selected.id, payload);
      updateLocalDelivery(selected.id, { status: nextStatus, ...localProofUpdate });
      if (showSuccess) setSuccessOpen(true);
      return true;
    } catch (error) {
      if (!navigator.onLine) {
        enqueueAction({
          id: makeQueueId(),
          deliveryId: selected.id,
          type: "status",
          payload: {
            status: nextStatus,
            proof_photo_data: proofPhotoData,
            proof_signature: signatureData,
            proof_geo_lat: proofGeo.lat,
            proof_geo_lng: proofGeo.lng,
            proof_captured_at: payload.proof_captured_at,
            proof_exceptions: payload.proof_exceptions,
            delivered_items: payload.delivered_items,
          },
          created_at: new Date().toISOString(),
        });
        updateLocalDelivery(selected.id, { status: nextStatus, ...localProofUpdate });
        if (showSuccess) setSuccessOpen(true);
        return true;
      }

      const message = error?.response?.data?.message || "Unable to update status.";
      setStepError(message);
      return false;
    }
  }
  async function handleConfirmOnTheWay() {
    setStepError("");
    const ok = await updateStatus("in_transit", { includeProof: false, showSuccess: false });
    if (ok) {
      setOnTheWayConfirmed(true);
    }
  }

  function resetToSelectCustomer() {
    setSelectedId(null);
    resetStepState();
  }

  const stepCompletion = selected
    ? isCompletedStatus
      ? [true]
      : [
          Boolean(onTheWayConfirmed),
          Boolean(proofGeo.lat && proofGeo.lng && proofCapturedAt),
          Boolean(proofPhotoPreview && photoConfirmed),
          customerAvailable === "yes"
            ? Boolean(signatureData)
            : customerAvailable === "no"
            ? Boolean(absenceReason) && (absenceReason !== "Others" || absenceOther.trim())
            : false,
          Boolean(deliveryStatus),
        ]
    : [];

  const firstIncomplete = stepCompletion.findIndex((val) => !val);
  const maxAccessibleStep =
    selected && stepCompletion.length
      ? firstIncomplete === -1
        ? stepCompletion.length - 1
        : firstIncomplete
      : 0;

  function validateStep(index) {
    if (!selected) return { ok: false, message: "Select a customer first." };

    switch (index) {
      case 0:
        return onTheWayConfirmed
          ? { ok: true }
          : { ok: false, message: "Confirm On The Way to continue." };
      case 1:
        if (!proofGeo.lat || !proofGeo.lng) {
          return { ok: false, message: "Capture geolocation before continuing." };
        }
        if (!proofCapturedAt) {
          return { ok: false, message: "Delivery time is required." };
        }
        return { ok: true };
      case 2:
        if (!proofPhotoPreview) {
          return { ok: false, message: "Capture a proof photo before continuing." };
        }
        if (!photoConfirmed) {
          return { ok: false, message: "Confirm the proof photo to continue." };
        }
        return { ok: true };
      case 3:
        if (customerAvailable === "yes") {
          return signatureData
            ? { ok: true }
            : { ok: false, message: "Signature is required." };
        }
        if (customerAvailable === "no") {
          if (!absenceReason) return { ok: false, message: "Select an absence reason." };
          if (absenceReason === "Others" && !absenceOther.trim()) {
            return { ok: false, message: "Please provide absence details." };
          }
          return { ok: true };
        }
        return { ok: false, message: "Select if the customer is available." };
      case 4:
        return deliveryStatus
          ? { ok: true }
          : { ok: false, message: "Select the final status." };
      default:
        return { ok: true };
    }
  }

  function handleNext() {
    const result = validateStep(activeStep);
    if (!result.ok) {
      setStepError(result.message || "Complete required fields.");
      return;
    }
    setStepError("");
    setActiveStep((prev) => Math.min(prev + 1, 4));
  }

  function handleBack() {
    setStepError("");
    setActiveStep((prev) => Math.max(0, prev - 1));
  }

  async function handleFinish() {
    const result = validateStep(activeStep);
    if (!result.ok) {
      setStepError(result.message || "Complete required fields.");
      return;
    }
    if (stepCompletion.some((val) => !val)) {
      setStepError("Complete all required steps before finishing.");
      return;
    }

    setStepError("");
    setSubmitting(true);
    await updateStatus(deliveryStatus, { includeProof: true, showSuccess: true });
    setSubmitting(false);
  }

  const steps = selected
    ? isCompletedStatus
      ? [
          {
            key: "summary",
            label: "Summary",
            isComplete: true,
            content: (
              <Step5ReviewAndStatus
                delivery={selected}
                items={deliveredItems}
                geo={proofGeo}
                capturedAt={proofCapturedAt}
                photoPreview={proofPhotoPreview}
                signatureData={signatureData}
                customerAvailable={customerAvailable}
                absenceReason={absenceReason}
                absenceOther={absenceOther}
                status={selected.status}
                readOnly
              />
            ),
          },
        ]
      : [
          {
            key: "customer",
            label: "Customer",
            isComplete: stepCompletion[0],
            content: (
              <Step1CustomerInfo
                delivery={selected}
                address={selectedAddress}
                confirmed={onTheWayConfirmed}
                onConfirmOnTheWay={handleConfirmOnTheWay}
              />
            ),
          },
          {
            key: "items",
            label: "Items + Geo",
            isComplete: stepCompletion[1],
            content: (
              <Step2ItemsGeo
                items={deliveredItems}
                geo={proofGeo}
                capturedAt={proofCapturedAt}
                geoBusy={geoBusy}
                geoError={geoError}
                onCaptureLocation={captureLocation}
                onSetTimeNow={setTimeNow}
              />
            ),
          },
          {
            key: "proof",
            label: "Proof",
            isComplete: stepCompletion[2],
            content: (
              <Step3ProofOfDelivery
                photoPreview={proofPhotoPreview}
                photoConfirmed={photoConfirmed}
                onPhotoChange={handlePhotoChange}
                onRetake={handleRetakePhoto}
                onConfirmPhoto={handleConfirmPhoto}
                photoInputRef={photoInputRef}
                autoOpenSignal={cameraTrigger}
              />
            ),
          },
          {
            key: "signature",
            label: "Signature",
            isComplete: stepCompletion[3],
            content: (
              <Step4SignatureOrReason
                customerAvailable={customerAvailable}
                onCustomerAvailableChange={handleCustomerAvailableChange}
                signatureData={signatureData}
                onSignatureChange={setSignatureData}
                absenceReason={absenceReason}
                onAbsenceReasonChange={handleAbsenceReasonChange}
                absenceOther={absenceOther}
                onAbsenceOtherChange={setAbsenceOther}
              />
            ),
          },
          {
            key: "review",
            label: "Review",
            isComplete: stepCompletion[4],
            content: (
              <Step5ReviewAndStatus
                delivery={selected}
                items={deliveredItems}
                geo={proofGeo}
                capturedAt={proofCapturedAt}
                photoPreview={proofPhotoPreview}
                signatureData={signatureData}
                customerAvailable={customerAvailable}
                absenceReason={absenceReason}
                absenceOther={absenceOther}
                status={deliveryStatus}
                onStatusChange={setDeliveryStatus}
              />
            ),
          },
        ]
    : [
        {
          key: "empty",
          label: "Select",
          isComplete: false,
          content: (
            <EmptyState
              title="Select a customer"
              desc="Choose a delivery on the left to begin the step-by-step flow."
            />
          ),
        },
      ];

  const nextDisabled = activeStep === 0 ? !stepCompletion[0] : false;
  const finishDisabled = submitting || !stepCompletion[4];
  return (
    <Layout user={user}>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xl font-extrabold text-slate-900">My Deliveries</div>
              <div className="mt-1 text-sm text-slate-600">
                Follow the stepper to complete each delivery.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={cx(
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1",
                  isOnline
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
                )}
              >
                <span
                  className={cx(
                    "h-2 w-2 rounded-full",
                    isOnline ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
                {isOnline ? "Online" : "Offline"}
              </div>

              {pendingCount > 0 ? (
                <button
                  type="button"
                  onClick={syncQueue}
                  disabled={!isOnline || syncing}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-extrabold ring-1 transition",
                    !isOnline || syncing
                      ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                >
                  {syncing ? "Syncing..." : `Sync ${pendingCount}`}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card className="p-4 space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search deliveries"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "pending", label: "Pending" },
                    { key: "assigned", label: "Assigned" },
                    { key: "in_transit", label: "On the way" },
                    { key: "delivered", label: "Delivered" },
                    { key: "failed", label: "Failed" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setFilter(opt.key)}
                      className={cx(
                        "rounded-2xl px-3 py-1.5 text-xs font-extrabold ring-1 transition",
                        filter === opt.key
                          ? "bg-teal-600 text-white ring-teal-600"
                          : "bg-white text-teal-700 ring-teal-200 hover:bg-teal-50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="divide-y divide-slate-200">
                {filtered.length ? (
                  filtered.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => selectDelivery(d)}
                      className={cx(
                        "w-full text-left p-4 transition",
                        selectedId === d.id ? "bg-teal-50" : "bg-white hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-slate-900 truncate">
                            {d.customer_name || "Customer"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {d.code || `Delivery #${d.id}`} - {d.scheduled_at || "Scheduled"}
                          </div>
                        </div>
                        <StatusPill status={d.status} />
                      </div>

                      <div className="mt-2 text-xs text-slate-600 line-clamp-2">
                        {d.address || "No address provided"}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-sm text-slate-600">No deliveries found.</div>
                )}
              </Card>
            </div>

            <div>
              <DeliveryStepper
                steps={steps}
                activeStep={activeStep}
                maxAccessibleStep={maxAccessibleStep}
                onStepChange={(idx) => {
                  if (idx <= maxAccessibleStep) {
                    setStepError("");
                    setActiveStep(idx);
                  }
                }}
                onBack={handleBack}
                onNext={handleNext}
                onFinish={handleFinish}
                nextDisabled={nextDisabled}
                finishDisabled={finishDisabled}
                stepError={stepError}
                hideControls={!selected || isCompletedStatus}
              />
            </div>
          </div>
        </div>
      </div>

      <DeliverySuccessModal
        open={successOpen}
        statusLabel={deliveryStatus}
        onClose={() => {
          setSuccessOpen(false);
          resetToSelectCustomer();
          router.reload({ only: ["deliveries"] });
        }}
      />
    </Layout>
  );
}
