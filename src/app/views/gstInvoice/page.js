"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import axios from "axios";
import DynamicListTable from "@/components/DynamicListTable.js";
import { fetchEntries, handleSearch } from "../../../../controllers/invoiceListControllers";

export default function GSTInvoice() {
  const router = useRouter();
  const [token, setToken] = useState();
  const [entries, setEntries] = useState([]);
  const [invoiceEntries, setInvoiceEntries] = useState([]);
  const [originalEntries, setOriginalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  const [snackBarSeverity, setSnackBarSeverity] = useState();
  const [searchText, setSearchText] = useState("");
  const [pageType, setPageType] = useState(null);

  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);
    setPageType(Cookies.get("page_type"));

    fetchEntries(
      storedToken,
      (data) => {
        setEntries(data);
        setOriginalEntries(data);
      },
      setLoading,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackBarSeverity
    );
  }, []);

  useEffect(() => {
    const fetchInvoiceEntries = async () => {
      try {
        const storedToken = Cookies.get("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/get/get_all_appointments_to_invoice`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        if (response.data) {
          setInvoiceEntries(response.data);
        }
      } catch (error) {
        console.error("Error fetching invoice entries:", error);
      }
    };

    if (entries.length > 0) {
      fetchInvoiceEntries();
    }
  }, [entries]);

  const columns = [
    {
      key: "plateNumber",
      label: "Plate Number",
      minWidth: "100px",
      format: (value, row) => value || row.vehicle_id || "N/A",
    },
    {
      key: "phone",
      label: "Phone",
      minWidth: "120px",
      format: (value, row) => row.contact?.phone || row.phone || "N/A",
    },
    {
      key: "appointment_date",
      label: "Date",
      minWidth: "100px",
      format: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      key: "appointment_time",
      label: "Time",
      minWidth: "80px",
    },
    {
      key: "status",
      label: "Status",
      minWidth: "80px",
    },
  ];

  const filteredEntries = entries.filter((entry) => {
    const match = invoiceEntries.some(
      (inv) => inv.invoice_id === entry.appointment_id
    );

    return (
      match &&
      entry.plateNumber !== "CounterSales" &&
      entry.status !== "deleted" &&
      entry.status === "invoiced"
    );
  });

  const handleSearchSubmit = () => {
    handleSearch(searchText, originalEntries, setEntries);
  };

  const handleRowClick = (row) => {
    router.push(`/views/gstInvoice/${row.appointment_id}`);
  };

  return (
    <DynamicListTable
      title="GST Invoice"
      columns={columns}
      data={entries}
      filteredData={filteredEntries}
      loading={loading}
      showNavbar={pageType !== "tab"}
      searchText={searchText}
      onSearchChange={(e) => setSearchText(e.target.value)}
      onSearchSubmit={handleSearchSubmit}
      onRowClick={handleRowClick}
      snackbar={{
        open: openSnackbar,
        message: snackbarMessage,
        severity: snackBarSeverity,
        onClose: () => setOpenSnackbar(false),
      }}
    />
  );
}
