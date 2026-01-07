"use client";
//? React Imports
import React, { useState, useEffect, useRef, use } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCustomer, fetchVehicles } from "../../../../../controllers/shoppingidControllers";
import { FormControlLabel, Checkbox } from "@mui/material";
import AddProduct from "@/components/addProduct";
import Footer from "@/components/Footer";
import AddIcon from "@mui/icons-material/Add";
import generatePDFInvoice from "@/components/PDFGenerator_invoice";

import Navbar from "@/components/navbar";
import Cookies from "js-cookie";
import EditCustomerSimpleModal from "@/components/EditCustomerSimpleModal";

import { Document, Page, View, Text, Image, pdf } from "@react-pdf/renderer";

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

import {
  Box,
  Typography,
  Table,
  TableBody,
  Modal,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Autocomplete,
  Grid,
  TextField,
  Snackbar,
  Paper,
  Divider,
} from "@mui/material";

import MuiAlert from "@mui/material/Alert";

import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import UpdateIcon from "@mui/icons-material/Update";
import Tooltip from "@mui/material/Tooltip";

import DeleteIcon from "@mui/icons-material/Delete";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import QRCode from "qrcode";

const messageInit = [
  { sender: "Mechanic", text: "The vehicle inspection is complete." },
  { sender: "Garage Owner", text: "Great! Any issues found?" },
  {
    sender: "Mechanic",
    text: "Yes, there are a few issues with the brakes.",
  },
];

export default function CustomerDetail() {
  const router = useRouter();
  const params = useParams();
  const lastInputRef = useRef(null);

  const appointmentId = params.id;
  const [PdfHeaderImage, setPdfHeaderImage] = useState("");
  const [pdfFooterImage, setPdfFooterImage] = useState("");

  const [customer, setCustomer] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({});
  const [isChecked, setIsChecked] = useState(false);
  const [upi, setupi] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [km, setKm] = useState(0);
  const [tempKm, setTempKm] = useState(km);
  const [estimateItems, setEstimateItems] = useState([]);
  const [services, setServices] = useState([]);
  const [uomOptions, setUomOptions] = useState([]);
  const [prNo, setPrNo] = useState("");

  const [servicesActualExists, setServicesActualExists] = useState(false);
  const [servicesEstimateExists, setServicesEstimateExists] = useState(false);
  const [appointmentDataLog, setAppointmentDataLog] = useState([]);
  const [enableRelease, setEnableRelease] = useState(false);
  const [prCreated, setPrCreated] = useState(false);
  const [newdata, setnewdata] = useState();

  const [loading, setLoading] = useState(true);
  const [disableDelete, setDisableDelete] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openAddProductModal, setOpenAddProductModal] = useState(false);
  const [typedname, setTypedname] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [productType, setProductType] = useState("");

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [pdfLogo, setPdfLogo] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [saveButtonClicked, setSaveButtonClicked] = useState(false);
  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);
  const [isTableEditMode, setIsTableEditMode] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [isExistingCustomer, setIsExistingCustomer] = useState(false);

  const [companyDetails, setCompanyDetails] = useState([]);
  const [printMenuAnchor, setPrintMenuAnchor] = useState(null);

  const addNewProduct = () => {
    setOpenAddProductModal(true);
  };

  useEffect(() => {
    const fetchss = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`);
      const data = await response.json();
      setupi(data.company_details[0].company_upi);
      setCompanyName(data.company_details[0].company_name);
      setPdfHeaderImage(data.company_details[0]?.pdf_header || "");
      setPdfFooterImage(data.company_details[0]?.pdf_footer || "");
      setPdfLogo(data.company_details[0]?.logo || "");
    };
    fetchss();
  });

  const refetchInventory = async () => {
    const token = Cookies.get("token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=1000000`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch inventory data");
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.log("Error fetching inventory data:", error);
    }
  };

  const [printedBy, setPrintedBy] = useState(
    Cookies.get("userName") || "Unknown User"
  );

  useEffect(() => {
    const filledItems = estimateItems.filter((item) => item.spareList);
    if (filledItems.length <= 1) {
      setDisableDelete(true);
    } else {
      setDisableDelete(false);
    }
  }, [estimateItems]);

  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);

    fetchSoftware(storedToken);
  }, []);

  const fetchSoftware = async (authToken) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setCompanyDetails(data.company_details);
    } catch (error) {
      console.error("Error fetching company details:", error);
    }
  };

  const handleMakeChange = (value) => {
    setMake(value);
    setModel("");

    const selectedMake = makes.find((item) => item.make_name === value);
    setModels(selectedMake ? selectedMake.models : []);
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ss/service`
        );
        const data = await response.json();
        setServices(data.services);
      } catch (error) {
        console.log("Error fetching services:", error);
      }
    };

    const fetchUomData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uom`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setUomOptions(data);
      } catch (error) {
        console.log("Error fetching UOM data:", error);
      }
    };

    fetchUomData();
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ss/service`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        setServices(data.services);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      const token = Cookies.get("token");
      try {
        const appointmentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/${appointmentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!appointmentResponse.ok)
          throw new Error("Failed to fetch appointment details");
        const appointmentData = await appointmentResponse.json();
        const customerId = appointmentData.customer_id;
        const vehicleId = appointmentData.vehicle_id;
        if (appointmentData.km != undefined) {
          setKm(appointmentData.km);
        } else {
          setKm(0);
        }

        const [customerResponse, inventoryResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/${customerId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=1000000`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!customerResponse.ok)
          throw new Error("Failed to fetch customer details");
        if (!inventoryResponse.ok)
          throw new Error("Failed to fetch inventory details");

        const customerData = await customerResponse.json();
        const inventoryData = await inventoryResponse.json();

        setCustomer(customerData);
        setFormData({
          customer_id: customerData.customer_id,
          profix: customerData.prefix,
          email: customerData.email,
          name: customerData.customer_name,
          gst: customerData.gst_number || "",
          street: customerData.contact?.address?.street || "",
          city: customerData.contact?.address?.city || "",
          state: customerData.contact?.address?.state || "",
          phone: customerData?.contact?.phone || "",
          model: customerData?.vehicle?.model || "",
          appointment_id: appointmentId,
        });

        setVehicleId(vehicleId);
        setInventory(inventoryData);
        setAppointmentDataLog(appointmentData);

        if (
          appointmentData.services_actual &&
          appointmentData.services_actual.length > 0
        ) {
          const preFilledItems = appointmentData.services_actual.map(
            (service) => ({
              service_id: service.service_id || "",
              type: service.service_type || "",
              spareList: service.items_required[0]?.item_name || "",
              reportedIssue: service.service_description || "",
              qty: service.items_required[0]?.qty || 0,
              price: service.price || 0,
              discountType: "percentage",
              estimatedAmount: service.price || 0,
              tax: service.items_required[0]?.tax || 0,
            })
          );
          setEstimateItems(preFilledItems);
          calculateAllEstimatedAmounts(preFilledItems);
        } else {
          setEstimateItems([]);
        }

        if (
          appointmentData.services_actual &&
          appointmentData.services_actual.length > 0
        ) {
          setServicesActualExists(true);
        }
        if (
          appointmentData.services_actual &&
          appointmentData.services_actual.length > 0
        ) {
          setServicesEstimateExists(true);
        }
      } catch (err) {
        console.log("Error fetching details:", err);
        setError(err.message);
        setSnackbarMessage(err.message);
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [appointmentId, saveButtonClicked]);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const calculateTotals = () => {
    const grandTotal = estimateItems.reduce(
      (acc, item) => acc + parseFloat(item.price) * parseFloat(item.qty),
      0
    );

    const totalTax = estimateItems.reduce((acc, item) => {
      const itemTotal = parseFloat(item.price) * parseFloat(item.qty);
      const gstRate = parseFloat(item.tax);
      const gstAmount = itemTotal - itemTotal * (100 / (100 + gstRate));
      return acc + gstAmount;
    }, 0);

    const overallTotal = grandTotal;

    return { grandTotal, totalTax, overallTotal };
  };

  const { grandTotal, totalTax, overallTotal } = calculateTotals();

  const generatePDF = async (mode = "download") => {
    if (!estimateItems.some((item) => item.price > 0)) {
      showSnackbarAlert("Cannot print invoice: No valid prices available!", "error");
      return;
    }

    try {
      const token = Cookies.get("token");

      const checkResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/check-invoice/${appointmentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const checkData = await checkResponse.json();
      let invoice_id;

      if (checkData.invoice_id) {
        invoice_id = checkData.invoice_id;
      } else {
        const generateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/generateinvoice/${appointmentId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!generateResponse.ok) {
          throw new Error("Failed to generate invoice");
        }

        const generateData = await generateResponse.json();
        invoice_id = generateData.invoice_id;
      }

      await generatePDFInvoice({
        customer,
        estimateItems,
        appointmentId,
        vehicleId,
        km,
        grandTotal,
        totalTax,
        PdfHeaderImage,
        pdfFooterImage,
        pdfLogo,
        invoiceId: invoice_id,
        companyDetails,
        upi: upiDetails.pa,
        openInNewTab: mode === "newTab"
      });

      // Only navigate back if downloading, not when opening in new tab
      // if (mode === "download") {
      //   router.push(`/views/`);
      // }
    } catch (error) {
      console.error("Error generating PDF:", error);
      showSnackbarAlert("Error generating PDF", "error");
    }
  };

  const handlePrintMenuOpen = (event) => {
    setPrintMenuAnchor(event.currentTarget);
  };

  const handlePrintMenuClose = () => {
    setPrintMenuAnchor(null);
  };

  const handleDownloadPDF = async () => {
    handlePrintMenuClose();
    await generatePDF("download");
  };

  const handleViewPDFInNewTab = async () => {
    handlePrintMenuClose();
    await generatePDF("newTab");
  };

  const addEstimateItem = () => {
    const newItem = {
      type: "",
      spareList: "",
      reportedIssue: "",
      qty: 0,
      price: 0,
      discountType: "percentage",
      estimatedAmount: 0,
      tax: 0,
      isNew: true,
    };
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems, newItem];
      calculateEstimatedAmount(updatedItems.length - 1, updatedItems);
      return updatedItems;
    });
    setTimeout(() => {
      if (lastInputRef.current) {
        lastInputRef.current.focus();
      }
    }, 0);
  };

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  const handleDeleteClick = (index) => {
    setSelectedItemIndex(index);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);

    if (selectedItemIndex === null) return;

    const token = Cookies.get("token");
    const item = estimateItems[selectedItemIndex];
    const serviceId = item?.service_id;

    if (!serviceId) {
      setEstimateItems((prevItems) =>
        prevItems.filter((_, i) => i !== selectedItemIndex)
      );
      showSnackbarAlert("Product deleted successfully");
      setSelectedItemIndex(null);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/delete_service/${serviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setEstimateItems((prevItems) =>
          prevItems.filter((_, i) => i !== selectedItemIndex)
        );
        showSnackbarAlert("Product deleted successfully");
      } else if (response.status === 404) {
        showSnackbarAlert("Product not found");
      } else {
        showSnackbarAlert("Failed to delete product");
      }
    } catch (error) {
      console.log("Error deleting product:", error);
      showSnackbarAlert("Error deleting product");
    } finally {
      setSelectedItemIndex(null);
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setSelectedItemIndex(null);
  };

  const updateEstimateItem = (index, field, value) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      if (["qty", "price", "tax"].includes(field)) {
        calculateEstimatedAmount(index, updatedItems);
      }

      return updatedItems;
    });
  };

  const calculateEstimatedAmount = (index, items) => {
    const item = items[index];

    const price = parseFloat(item.price) || 0;
    const qty = parseFloat(item.qty) || 0;
    const tax = parseFloat(item.tax) || 0;

    const totalAmount = price * qty;

    items[index].estimatedAmount = totalAmount;
  };

  const calculateAllEstimatedAmounts = (items) => {
    items.forEach((_, index) => {
      calculateEstimatedAmount(index, items);
    });
  };

  useEffect(() => {
    if (estimateItems.length > 0 && estimateItems[0]?.type !== "") {
      setEnableRelease(true);
    }
  }, [estimateItems]);

  const handleSpareListChange = (index, value) => {
    const isDuplicate = estimateItems.some(
      (item, i) => item.spareList === value && i !== index
    );

    if (isDuplicate) {
      showSnackbarAlert("Duplicate spare list item selected");
      return;
    }

    const selectedItem = inventory.find((item) => item.part_name === value);
    if (selectedItem) {
      updateEstimateItem(index, "spareList", value);
      updateEstimateItem(index, "price", selectedItem.price);
      updateEstimateItem(index, "qty", estimateItems[index].qty || 1);
      updateEstimateItem(
        index,
        "tax",
        selectedItem.tax || estimateItems[index].tax
      );

      updateEstimateItem(index, "type", selectedItem.category);
    } else {
      updateEstimateItem(index, "spareList", value);
      updateEstimateItem(index, "price", 0);
      updateEstimateItem(index, "qty", 0);
      updateEstimateItem(index, "type", "");
    }
  };

  const getFilteredInventory = (type) => {
    return inventory.filter(
      (item) => item.category?.toLowerCase() === type?.toLowerCase()
    );
  };

  const handleTypeChange = (index, value) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        type: value,
      };
      return updatedItems;
    });
  };

  const handleKeyPress = (event, index) => {
    if (event.key === "Enter" && index === estimateItems.length - 1) {
      addEstimateItem();
    }
  };

  const validateAndPostService = async (
    serviceType,
    appointmentDataLog,
    type
  ) => {
    const token = Cookies.get("token");

    if (!formData.name || !formData.phone) {
      showSnackbarAlert(
        !formData.name && !formData.phone
          ? "Customer name and phone number are required!"
          : !formData.name
            ? "Customer name is required!"
            : "Phone number is required!"
      );
      return;
    }

    const validItems = estimateItems.filter(
      (item) => item.spareList && item.qty > 0 && item.price > 0
    );

    let Status = "approved";
    if (serviceType === "services_actual") {
      Status =
        appointmentDataLog.services_actual.length > 0 ? "approved" : "released";
    }

    try {

      const checkResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/check-invoice/${appointmentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const checkData = await checkResponse.json();
      let invoice_id;

      if (checkData.invoice_id) {
        appointmentDataLog.invoice_id = checkData.invoice_id;
      } else {
        const generateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/generateinvoice/${appointmentId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!generateResponse.ok) {
          throw new Error("Failed to generate invoice");
        }

        const generateData = await generateResponse.json();
        appointmentDataLog.invoice_id = generateData.invoice_id;
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      showSnackbarAlert("Error generating Invoice No", "error");
    }

    const services = validItems.map((item) => ({
      service_id: Status !== "released" ? item.service_id || "" : "",
      overallTotal: overallTotal,
      uom: item.uom,
      vehicle_id: appointmentDataLog.vehicle_id,
      items_required: [
        {
          item_id: inventory.find(
            (invItem) => invItem.part_name === item.spareList
          )?.inventory_id,
          item_name: item.spareList,
          qty: item.qty,
          tax: item.tax,
          price: item.price,
        },
      ],
      service_type: item.type,
      status: Status,
      customer_id: formData.customer_id,
      invoice_id: appointmentDataLog.invoice_id,
    }));
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/save/${appointmentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(services),
        }
      );

      if (!response.ok) throw new Error(`Failed to post to ${serviceType}`);

      showSnackbarAlert(
        type === "save"
          ? `Appointment ${appointmentId} saved successfully`
          : `Appointment ${appointmentId} updated successfully`
      );
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      if (type === "save") {
        setSaveButtonClicked(true);
        setUpdateButtonClicked(false);
      }

    } catch (error) {
      showSnackbarAlert("Invoice creation failed");
      throw error;
    }
  };

  const itemsToProcure = estimateItems
    .map((item) => {
      const stockQuantity =
        inventory.find((invItem) => invItem.part_name === item.spareList)
          ?.quantity || 0;
      const requiredQuantity =
        item.qty > stockQuantity ? item.qty - stockQuantity : 0;
      return {
        ...item,
        qty: requiredQuantity,
        item_id: inventory.find(
          (invItem) => invItem.part_name === item.spareList
        )?.inventory_id,
      };
    })
    .filter((item) => item.qty > 0);

  const isCreatePrEnabled = itemsToProcure.length > 0 && !prCreated;

  const getCommonPrNo = () => {
    if (!appointmentDataLog || !appointmentDataLog.services_actual) {
      return null;
    }

    const prNumbers = appointmentDataLog.services_actual.flatMap((service) =>
      service.items_required.map((item) => item.pr_no)
    );

    const uniquePrNumbers = [...new Set(prNumbers.filter((pr) => pr))];

    return uniquePrNumbers.length === 1 ? uniquePrNumbers[0] : null;
  };

  const commonPrNo = getCommonPrNo();

  const savecustomer = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/countertop`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to add customer");

      const responseData = await response.json();
      showSnackbarAlert("Customer added successfully!");
    } catch (error) {
      showSnackbarAlert("Error adding customer. Please try again.", "error");
    }
  };

  const [isPhoneSelected, setIsPhoneSelected] = useState(false);
  const [customerData, setCustomerData] = useState([]);
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);

    if (!event.target.checked) {
      setFormData((prevData) => ({
        ...prevData,
        gst: "",
      }));
    }
  };

  const handleInputChange = (event, field) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: event.target.value,
    }));
  };

  const filteredData = customerData.filter((customer) =>
    customer.phone.includes(phone)
  );

  const [showFullForm, setShowFullForm] = useState(false);

  const showSnackbarAlert = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handlePhoneChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      phone: value,
    }));

    setPhone(value);

    if (value && value.length > 0) {
      setShowFullForm(true);
      const selectedCustomer = customerData.find(
        (customer) => customer.phone === value
      );
      if (selectedCustomer) {
        setIsExistingCustomer(true);
        if (selectedCustomer.gst_number) {
          setIsChecked(true);
        }
        setFormData((prevData) => ({
          ...prevData,
          customer_id: selectedCustomer.customer_id,
          name: selectedCustomer.customer_name,
          gst: selectedCustomer.gst_number || "",
          street: selectedCustomer.street || "",
          appointment_id: appointmentId,
        }));
        setnewdata({
          customer_id: selectedCustomer.customer_id,
          name: selectedCustomer.customer_name,
          gst: selectedCustomer.gst_number || "",
          street: selectedCustomer.street || "",
          phone: selectedCustomer.phone || "",
        });
      } else {
        setIsExistingCustomer(false);
        setFormData((prevData) => ({
          ...prevData,
          name: "",
          gst: "",
          street: "",
        }));
        setnewdata({
          name: "",
          gst: "",
          street: "",
        });
      }
    } else {
      setShowFullForm(false);
      setIsExistingCustomer(false);
    }
  };

  const handleAddNewCustomer = () => {
    if (formData.phone) {
      setShowFullForm(true);
    } else {
      showSnackbarAlert("Please enter a phone number", "warning");
    }
  };

  let upiDetails = {
    pa: upi,
    pn: companyName,
    tn: "ARG's 7 Cars" + " - " + appointmentId,
    am: overallTotal,
    cu: "INR",
  };

  let upiLink = `upi://pay?pa=${encodeURIComponent(
    upiDetails.pa
  )}&pn=${encodeURIComponent(upiDetails.pn)}&tn=${encodeURIComponent(
    upiDetails.tn
  )}&am=${encodeURIComponent(upiDetails.am)}&cu=${encodeURIComponent(
    upiDetails.cu
  )}`;


  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [headerProductName, setHeaderProductName] = useState("");
  const [headerQty, setHeaderQty] = useState("");
  const [headerPrice, setHeaderPrice] = useState("");

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === customer.customer_name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/name/${customer.customer_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ customer_name: editedName }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setCustomer({ ...customer, customer_name: editedName });
        setSnackbarMessage("Customer name updated successfully");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage(data.error || "Failed to update name");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } catch (err) {
      setSnackbarMessage("Error updating name");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
    setSavingName(false);
    setIsEditingName(false);
  };

  const handleAddProductFromHeader = () => {
    const productName = headerProductName.trim();
    const qty = parseFloat(headerQty) || 0;
    const price = parseFloat(headerPrice) || 0;

    if (!productName) {
      showSnackbarAlert("Please enter product name", "warning");
      return;
    }

    if (!inventory || inventory.length === 0) {
      showSnackbarAlert("Inventory not loaded yet. Please wait.", "warning");
      return;
    }


    const selectedItem = inventory.find((item) => item.part_name === productName);

    const newItem = {
      type: selectedItem?.category || "Services",
      spareList: productName,
      reportedIssue: "",
      qty: qty || 1,
      price: price || selectedItem?.price || 0,
      discountType: "percentage",
      estimatedAmount: (qty || 1) * (price || selectedItem?.price || 0),
      tax: selectedItem?.tax || 0,
    };

    setEstimateItems((prevItems) => [...prevItems, newItem]);
    setHeaderProductName("");
    setHeaderQty("");
    setHeaderPrice("");
    showSnackbarAlert("Product added successfully");
  };

  const handleHeaderKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddProductFromHeader();
    }
  };
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      <Modal
        open={openAddProductModal}
        onClose={() => setOpenAddProductModal(false)}
      >
        <AddProduct
          token={token}
          category={productType}
          setOpenAddProductModal={setOpenAddProductModal}
          onProductAdded={refetchInventory}
          typedname={typedname}
        />
      </Modal>
      {/* <Navbar pageName="Counter Sales" hasChanges={hasChanges} /> */}
{pageType !== "tab"  && <Navbar pageName="Counter Sales" hasChanges={hasChanges} />}
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {loading && <Typography sx={{ fontSize: "0.8rem" }}>Loading...</Typography>}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <MuiAlert
            onClose={handleCloseSnackbar}
            severity={snackbarSeverity}
            sx={{ width: "100%", fontSize: "0.8rem" }}
          >
            {snackbarMessage}
          </MuiAlert>
        </Snackbar>

        {customer && (
          <Box display="flex" flexDirection="column" gap={0.5} sx={{ flex: 1, marginTop: pageType !== "tab" ? "0px" : "16px", paddingBottom: "80px" }}>
            {/* CUSTOMER SECTION */}
            <Paper elevation={0} sx={{ padding: 0.75, backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Grid container spacing={1} sx={{ flex: 1 }}>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: "#666", fontSize: "0.7rem" }}>ID</Typography>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                      {appointmentId}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: "#666", fontSize: "0.7rem" }}>Name</Typography>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                      {customer.customer_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: "#666", fontSize: "0.7rem" }}>Cust ID</Typography>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                      {customer.customer_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: "#666", fontSize: "0.7rem" }}>Phone</Typography>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                      {customer.contact?.phone || ""}
                    </Typography>
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => setOpenEditModal(true)}
                  sx={{
                    height: "36px",
                    textTransform: "none",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    marginLeft: 1
                  }}
                >
                  Edit
                </Button>
              </Box>
            </Paper>

            {/* PRODUCT ENTRY SECTION - Add Product */}
            <Paper elevation={0} sx={{ padding: 1, backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
             <Box
  sx={{
    display: "grid",
    gridTemplateColumns: "1fr 80px 90px auto",
    gap: 1,
    alignItems: "flex-end",
  }}
>
  <Box>
    <Typography
      variant="caption"
      sx={{
        color: "#666",
        display: "block",
        fontSize: "0.7rem",
        fontWeight: 500,
        mb: "4px",
      }}
    >
      Product
    </Typography>

    <Autocomplete
      size="small"
      options={inventory.map((option) => option.part_name)}
      value={headerProductName}
      onChange={(e, newValue) => {
        setHeaderProductName(newValue || "");
        if (newValue) {
          const selectedItem = inventory.find((item) => item.part_name === newValue);
          if (selectedItem) {
            setHeaderPrice(selectedItem.price || "");
          }
        }
      }}
      sx={{
        "& .MuiInputBase-root": {
          height: 40,
        },
        "& .MuiOutlinedInput-input": {
          padding: "8px 10px",
          fontSize: "0.85rem",
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          onKeyDown={handleHeaderKeyPress}
          placeholder="Select product"
        />
      )}
      noOptionsText={
        <Box sx={{ p: 1, textAlign: "center" }}>
          <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
            No products available
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => {
              setTypedname("");
              setProductType("Services");
              setOpenAddProductModal(true);
            }}
            sx={{ fontSize: "0.65rem", py: 0.5 }}
          >
            <AddIcon sx={{ fontSize: "14px", mr: 0.5 }} />
            Add Product
          </Button>
        </Box>
      }
    />
  </Box>

  {/* Qty */}
  <Box>
    <Typography
      variant="caption"
      sx={{
        color: "#666",
        display: "block",
        fontSize: "0.7rem",
        fontWeight: 500,
        mb: "4px",
      }}
    >
      Qty
    </Typography>

    <TextField
      size="small"
      type="number"
      value={headerQty}
      onChange={(e) => setHeaderQty(e.target.value)}
      onKeyDown={handleHeaderKeyPress}
      fullWidth
      placeholder="0.0"
      inputProps={{ step: "0.5", min: "0" }}
      sx={{
        "& .MuiInputBase-root": { height: 40 },
        "& input": { fontSize: "0.85rem", padding: "8px 10px" },
      }}
    />
  </Box>

  {/* Rate */}
  <Box>
    <Typography
      variant="caption"
      sx={{
        color: "#666",
        display: "block",
        fontSize: "0.7rem",
        fontWeight: 500,
        mb: "4px",
      }}
    >
      Rate
    </Typography>

    <TextField
      size="small"
      type="number"
      value={headerPrice}
      onChange={(e) => setHeaderPrice(e.target.value)}
      onKeyDown={handleHeaderKeyPress}
      fullWidth
      placeholder="0.00"
      sx={{
        "& .MuiInputBase-root": { height: 40 },
        "& input": { fontSize: "0.85rem", padding: "8px 10px" },
      }}
    />
  </Box>

  {/* Add Button */}
  <Button
    variant="contained"
    color="primary"
    size="small"
    onClick={handleAddProductFromHeader}
    sx={{
      fontSize: "0.75rem",
      padding: "6px 12px",
      height: "40px",
      whiteSpace: "nowrap",
    }}
  >
    Add
  </Button>
</Box>

            </Paper>

            {/* PRODUCTS TABLE */}
            <Paper elevation={0} sx={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
              <Box sx={{ padding: 0.5 }}>
                <Box
    sx={{
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 1,
    gap: 0.5,
    flexWrap: "wrap",
  }}

                >

            
                  <Box display="flex" gap={0.5}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handlePrintMenuOpen}
                      disabled={!estimateItems.some((item) => item.price > 0)}
                      sx={{ fontSize: "0.7rem", padding: "4px 8px", height: "28px" }}
                      title="Print Options"
                    >
                      <PrintIcon sx={{ fontSize: "14px" }} />
                    </Button>
                    <Menu
                      anchorEl={printMenuAnchor}
                      open={Boolean(printMenuAnchor)}
                      onClose={handlePrintMenuClose}
                    >
                      <MenuItem onClick={handleDownloadPDF}>Download PDF</MenuItem>
                      <MenuItem onClick={handleViewPDFInNewTab}>View in New Tab</MenuItem>
                    </Menu>

                    {Array.isArray(appointmentDataLog.services_actual) &&
                      appointmentDataLog.services_actual.length > 0 &&
                      appointmentDataLog.services_actual.some(
                        (service) => service.service_id
                      ) ? (
                      <Button
                        disabled={updateButtonClicked}
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={async () => {
                          setHasChanges(false);
                          try {
                            await validateAndPostService(
                              "services_actual",
                              appointmentDataLog,
                              "update"
                            );
                          } catch (error) {
                            /* handle error */
                          }
                        }}
                        sx={{ fontSize: "0.7rem", padding: "4px 8px", height: "28px" }}
                      >
                        Update
                      </Button>
                    ) : (
                      <Button
                        disabled={saveButtonClicked}
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={async () => {
                          setHasChanges(false);
                          setSaveButtonClicked(true);
                          setUpdateButtonClicked(false);
                          try {
                            await validateAndPostService(
                              "services_actual",
                              appointmentDataLog,
                              "save"
                            );
                          } catch (error) {
                            setSaveButtonClicked(false);
                            setUpdateButtonClicked(true);
                          }
                        }}
                        sx={{ fontSize: "0.7rem", padding: "4px 8px", height: "28px" }}
                      >
                        Save
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      color={isTableEditMode ? "success" : "info"}
                      size="small"
                      startIcon={isTableEditMode ? <SaveIcon /> : <EditIcon />}
                      onClick={() => setIsTableEditMode(!isTableEditMode)}
                      sx={{ fontSize: "0.7rem", padding: "4px 8px", height: "28px" }}
                    >
                      {isTableEditMode ? "Done" : "Edit"}
                    </Button>
                  </Box>
                 



                </Box>

                {estimateItems.filter((item) => item.spareList).length === 0 ? (
                  <Box sx={{ padding: 2, textAlign: "center" }}>
                    <Typography variant="body2" sx={{ color: "#999", marginBottom: 1.5 }}>
                      No products added yet
                    </Typography>
                    {/* <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setHeaderProductName("");
                        setHeaderQty("");
                        setHeaderPrice("");
                      }}
                    >
                      Add Product
                    </Button> */}
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small" sx={{ tableLayout: "fixed" }}>
                      <TableHead sx={{ backgroundColor: "#ddd" }}>
                        <TableRow sx={{ height: "28px" }}>
                          <TableCell align="center" sx={{ fontWeight: "bold", padding: "4px", fontSize: "0.75rem" }}>No</TableCell>
                          <TableCell sx={{ fontWeight: "bold", padding: "4px", fontSize: "0.75rem" }}>Product</TableCell>
                          <TableCell align="center" sx={{ fontWeight: "bold", padding: "4px", fontSize: "0.75rem" }}>Qty</TableCell>
                          <TableCell align="center" sx={{ fontWeight: "bold", padding: "4px", fontSize: "0.75rem" }}>Unit</TableCell>
                          <TableCell align="center" sx={{ fontWeight: "bold", padding: "4px", fontSize: "0.75rem" }}>Rate</TableCell>
                          <TableCell align="center" sx={{ fontWeight: "bold", padding: "4px", fontSize: "0.75rem" }}>Amount</TableCell>
                          <TableCell align="center" sx={{ fontWeight: "bold", padding: "4px", fontSize: "0.75rem" }}>Act</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {estimateItems.filter((item) => item.spareList).map((item, filteredIndex) => {
                          const selectedItem = inventory.find(
                            (invItem) => invItem.part_name === item.spareList
                          );

                          const originalIndex = estimateItems.findIndex((origItem) => origItem === item);

                          return (
                            <TableRow key={filteredIndex} sx={{ backgroundColor: filteredIndex % 2 === 0 ? "#f9f9f9" : "white", height: "28px" }}>
                              <TableCell align="center" sx={{ padding: "4px", fontSize: "0.75rem" }}>{filteredIndex + 1}</TableCell>
                              <TableCell sx={{ padding: "4px" }}>
                                {isTableEditMode ? (
                                  <Box>
                                    <Autocomplete
                                      size="small"
                                      options={inventory.map((option) => option.part_name)}
                                      value={item.spareList}
                                      onChange={(e, newValue) => {
                                        setHasChanges(true);
                                        updateEstimateItem(originalIndex, "spareList", newValue || "");
                                      }}
                                      renderInput={(params) => (
                                        <TextField {...params} size="small" sx={{ "& input": { fontSize: "0.75rem" } }} />
                                      )}
                                      noOptionsText={
                                        <Box sx={{ p: 1, textAlign: "center" }}>
                                          <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
                                            No products available
                                          </Typography>
                                          <Button
                                            size="small"
                                            variant="contained"
                                            color="primary"
                                            onClick={() => {
                                              setTypedname("");
                                              setProductType("Services");
                                              setOpenAddProductModal(true);
                                            }}
                                            sx={{ fontSize: "0.65rem", py: 0.5 }}
                                          >
                                            <AddIcon sx={{ fontSize: "14px", mr: 0.5 }} />
                                            Add Product
                                          </Button>
                                        </Box>
                                      }
                                    />
                                  </Box>
                                ) : (
                                  <Typography sx={{ fontSize: "0.75rem" }}>{item.spareList}</Typography>
                                )}
                              </TableCell>
                             <TableCell align="center" sx={{ padding: "4px" }}>
  <TextField
    size="small"
    type="number"
    value={item.qty}
    onChange={(e) => {
      setHasChanges(true);
      updateEstimateItem(
        originalIndex,
        "qty",
        parseFloat(e.target.value) || 0
      );
    }}
    disabled={!isTableEditMode}
    inputProps={{ step: "0.5", min: "0" }}
    sx={{
      width: "60px",
      "& input": {
        fontSize: "0.75rem",
        padding: "4px",
        textAlign: "right"   // 👈 right align number
      }
    }}
  />
</TableCell>

                              <TableCell align="center" sx={{ padding: "4px" }}>
                                <Typography sx={{ fontSize: "0.7rem" }}>
                                  {selectedItem?.uom || "N/A"}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ padding: "4px" }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => {
                                    setHasChanges(true);
                                    updateEstimateItem(originalIndex, "price", e.target.value);
                                  }}
                                  disabled={!isTableEditMode}
                                  sx={{ width: "70px", "& input": { fontSize: "0.75rem", padding: "4px",  textAlign: "right" } }}
                                />
                              </TableCell>
                              <TableCell align="center" sx={{ padding: "4px" }}>
                                <Typography sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>
                                  {parseFloat(item.estimatedAmount).toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ padding: "2px" }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(originalIndex)}
                                  sx={{ padding: "2px" }}
                                  title="Delete"
                                >
                                  <DeleteIcon sx={{ fontSize: "16px" }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
              <Footer total={overallTotal} label="Net" />
            </Paper>
          </Box>
        )}

      <Dialog
        open={openDialog}
        onClose={handleCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Product Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this product? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <EditCustomerSimpleModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        customer={customer}
        onSuccess={() => {
          setOpenEditModal(false);
          window.location.reload();
        }}
      />
      </Box>
    </div>
  );
}
