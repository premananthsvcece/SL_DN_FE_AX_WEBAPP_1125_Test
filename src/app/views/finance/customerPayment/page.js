"use client";
// React and Next imports
import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import axios from "axios";
import Cookies from "js-cookie";

// Function imports - Alphabetical
import {
  getDisplayPayments,
  handleOptionChange,
  handleRowClick,
  processPayments,
  fetchPayments,
} from "../../../../../controllers/customerPaymentControllers";

// Component imports - Alphabetical
import BackButton from "@/components/backButton";
import Navbar from "@/components/navbar";
import AddCustomer from "@/components/addcustfrom_finance";

// UI package imports - Alphabetical
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Snackbar,
  Alert,
  Modal,
} from "@mui/material";

// Icons and Images imports - Alphabetical
import SearchIcon from "@mui/icons-material/Search";

export default function CustomerPayment() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerPaymentContent />
    </Suspense>
  );
}

function CustomerPaymentContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  // Frontend extracted data states
  const router = useRouter();

  // Backend Data states
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [token, setToken] = useState("");
  const [changeinsupp_inv, setchangeinsupp_inv] = useState("");
  const [typedname, setTypedname] = useState("");

  // Add these new states
  const [openModal, setOpenModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  // Add a new state for search query
  const [searchQuery, setSearchQuery] = useState("");
  const [OpenAddCustomerModal, setOpenAddCustomerModal] = useState("");

  // Add a new state for search input
  const [searchInput, setSearchInput] = useState("");

  // Add a state to track if the view is mobile
  const [isMobileView, setIsMobileView] = useState(false);

  // Add date states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Function to determine if the screen is mobile-sized
  const isMobile = () =>
    typeof window !== "undefined" && window.innerWidth <= 768;

  // Add an effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(isMobile());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      handleResize(); // Call it initially to set the state

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Set default date range to last 6 months
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    setStartDate(formatDate(sixMonthsAgo));
    setEndDate(formatDate(today));
  }, []); // Run once on component mount

  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/customer?limit=9999&offset=0`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        setCustomers(response.data);
      } catch (error) {
        console.log("Error fetching customers:", error);
        setCustomers([]);
        setHasMore(false);
      }
    };

    const loadPayments = async () => {
      if (id) {
        const fetchedPayments = await fetchPayments(id);
        setPayments(fetchedPayments);
      }
      else {
        const fetchedPayments = await fetchPayments();
        setPayments(fetchedPayments);
        // setFilteredPayments(fetchedPayments);
      }
    };
    loadPayments();
    fetchCustomers();
  }, [changeinsupp_inv]);

  // Add useEffect to fetch data based on date range
  useEffect(() => {
    const fetchDataByDate = async () => {
      if (startDate && endDate) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/appointment/get_appointments_by_date/${startDate}/${endDate}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          // if id is present then filter the payments by customer_id
          if (id) {
            const filteredPayments = response.data.filter(
              (payment) =>
                payment.customer_id === id &&
                (payment.status === "invoice" || payment.status === "invoiced")
            );

            setFilteredPayments(filteredPayments);
            setPayments(filteredPayments);
          }
          else {
            setPayments(response.data);
          }
        } catch (error) {
          // console.error('Error fetching data by date:', error);
          // setSnackbarMessage('Error fetching data');
          // setSnackbarSeverity('error');
          // setSnackbarOpen(true);
        }
      }
    };

    fetchDataByDate();
  }, [startDate, endDate, token]);

  const uniqueVehiclePayments = processPayments(payments);

  // Functions that has to be in the same file
  const onRowClick = (vehicleId) => handleRowClick(vehicleId, router);

  // Get display payments
  const displayPayments = getDisplayPayments(
    filteredPayments,
    uniqueVehiclePayments
  );

  // Update displayPayments to filter based on search query and phone number
  const filteredDisplayPayments = displayPayments.filter(
    (payment) =>
      payment.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.phone && payment.phone.includes(searchQuery))
  );

  // Add these new handlers
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCustomer(null);
    setAdvanceAmount("");
  };

  // Add this function to handle the submission of advance payment
  const handleAdvancePaymentSubmit = async () => {
    if (!selectedCustomer || !advanceAmount) {
      setSnackbarMessage("Please fill all the fields.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/advance_payment/${selectedCustomer.customer_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ advance_payment: parseFloat(advanceAmount) }),
        }
      );

      const ledgerData = {
        customer_id: selectedCustomer.customer_id,
        status: "Advance Amount",
        creation_date: new Date().toISOString().split("T")[0],
        expense_type: "Advance",
        type: "customer-advance",
        description: `Advanced Amount By Customer #${selectedCustomer.customer_id}`,
        debit: advanceAmount,
      };

      const response2 = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/finance/post_ledger`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ledgerData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit advance payment.");
      }

      const data = await response.json();
      // console.log("Advance payment successful:", data);
      handleCloseModal();
      setSnackbarMessage("Advance payment successful.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.log(error.message);
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Function to handle Enter key press
  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      // Perform search or any other action on Enter key press
      setSearchQuery(searchInput);
    }
  };



   const pageType = Cookies.get("page_type"); // "tab" or others
  
  return (
    <div className="p-4">
      <Dialog
        maxWidth="sm"
        sx={{ padding: "50px" }}
        fullWidth
        open={OpenAddCustomerModal}
        onClose={() => setOpenAddCustomerModal(false)}
      >
        <AddCustomer
          token={token}
          setOpenAddCustomerModal={setOpenAddCustomerModal}
          onProductAdded={() => {
            setchangeinsupp_inv(!changeinsupp_inv);
            setOpenAddCustomerModal(false);
          }}
          typedname={typedname}
          setTypedname={setTypedname}
          from="customerPayment"
        // setProductAdded={setProductAdded}
        />
      </Dialog>
      {/* <Navbar pageName="Customer Payments" /> */}
 {pageType !== "tab" && <Navbar pageName="Customer Payments" />}

      <Box paddingX={"2%"}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {/* <BackButton />
          <h1 className="text-2xl font-bold mb-4">Customer Payments</h1> */}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "16px",
            color: "white",
          }}
        >
          <div>
            <TextField
              size="small"
              sx={{ backgroundColor: "white" }}
              label="Search"
              variant="outlined"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenModal}
            >
              Advance Payment
            </Button>
            <TextField
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{ backgroundColor: "white" }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{ backgroundColor: "white" }}
              InputLabelProps={{ shrink: true }}
            />
          </div>
        </div>
        {isMobileView ? (
          // Render card view for mobile
          <div>
            {filteredDisplayPayments.length > 0 ? (
              filteredDisplayPayments.map((payment) => (
                <Paper
                  key={payment._id}
                  sx={{
                    marginBottom: "16px",
                    padding: "16px",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                  onClick={() => onRowClick(payment.vehicle_id)}
                >
                  <Typography variant="h6">{payment.customer_name}</Typography>
                  <Typography variant="body2">
                    Vehicle ID: {payment.vehicle_id}
                  </Typography>
                  <Typography variant="body2">
                    Invoice Count: {payment.visitCount}
                  </Typography>
                  <Typography variant="body2">
                    Pending Amount: ₹{payment.pendingAmount.toFixed(2)}
                  </Typography>
                  <Chip
                    label={payment.paid_status}
                    color={
                      payment.paid_status === "Fully Paid"
                        ? "success"
                        : payment.paid_status === "Partially Paid"
                          ? "warning"
                          : "error"
                    }
                    size="small"
                  />
                </Paper>
              ))
            ) : (
              <Typography align="center">No data found</Typography>
            )}
          </div>
        ) : (
          // Render table view for larger screens
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="customer payments table">
              <TableHead>
                <TableRow>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Vehicle ID</TableCell>
                  <TableCell>Invoice Date</TableCell>
                  {/* <TableCell>Invoice Count </TableCell> */}
                  <TableCell>Invoice Amount</TableCell>
                  <TableCell>Pending Amount</TableCell>
                  <TableCell>Paid Amount</TableCell>
                  <TableCell>Payment Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDisplayPayments.length > 0 ? (
                  filteredDisplayPayments.map((payment) => (
                    <TableRow
                      key={payment._id}
                      onClick={() => onRowClick(payment.vehicle_id)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "#f5f5f5" },
                      }}
                    >
                      <TableCell>{payment.customer_name}</TableCell>
                      <TableCell>{payment.vehicle_id}</TableCell>
                      <TableCell>{payment.invoice_date || payment.creation_date}</TableCell>
                      {/* <TableCell>{payment.visitCount}</TableCell> */}
                      <TableCell>₹{payment.invoice_amount?.toFixed(2)}</TableCell>
                      <TableCell>₹{payment.pendingAmount?.toFixed(2)}</TableCell>
                      <TableCell>₹{payment.paid_amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.paid_status}
                          color={
                            payment.paid_status === "Fully Paid"
                              ? "success"
                              : payment.paid_status === "Partially Paid"
                                ? "warning"
                                : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog
          open={openModal}
          // onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Advance Payment</DialogTitle>
          <DialogContent>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                marginTop: "10px",
              }}
            >
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.customer_name}
                isOptionEqualToValue={(option, value) =>
                  option.customer_id === value.customer_id
                }
                onChange={(event, newValue) => {
                  console.log({ newValue });
                  setSelectedCustomer(newValue);
                }}
                onInputChange={(event, newValue) => {
                  // if value is blank dont set the value
                  if (newValue) {
                    setTypedname(newValue);
                  }
                }}
                value={selectedCustomer}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer Name"
                    variant="outlined"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.customer_id}>
                    {option.customer_name}
                  </li>
                )}
                noOptionsText={
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body1">No Items Available</Typography>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => {
                        setOpenAddCustomerModal(true);
                        // Assuming you have a similar function to set the product type
                        // setProductType("desiredProductType");
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                }
              />

              <TextField
                label="Phone Number"
                value={selectedCustomer ? selectedCustomer.contact.phone : ""}
                disabled
                variant="outlined"
              />

              <TextField
                label="Advance Amount"
                type="text"
                value={advanceAmount}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setAdvanceAmount(value);
                  }
                }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAdvancePaymentSubmit}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
