import React from "react";
import Sales from "../CashierPage/Sales";

export default function AccountantSales() {
  return <Sales basePath="/dashboard/accountant/sales" defaultExportFormat="csv" />;
}
