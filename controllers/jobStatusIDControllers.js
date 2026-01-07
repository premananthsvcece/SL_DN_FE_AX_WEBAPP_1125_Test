import Cookies from "js-cookie";
const storedToken = Cookies.get("token");

const fetchDetails = async (
  token,
  appointmentId,
  vehicleId,
  setLoading,
  setError,
  setSnackbarMessage,
  setOpenSnackbar,
  setSnackBarSeverity,
  setServices,
  setKm,
  setCustomer,
  setVehicleId,
  setInventory,
  setAppointmentStatus,
  setEstimateItems
) => {
  // console.log({storedToken})
  try {
    const appointmentResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Add print tracking
    const printResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/print`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          print_type: "reprint",
          printed_by: Cookies.get("userName") || "Unknown User",
          print_date: new Date().toISOString()
        })
      }
    );

    if (!appointmentResponse.ok)
      throw new Error("Failed to fetch appointment details");
    const appointmentData = await appointmentResponse.json();
    setServices(appointmentData.services_actual);
    setKm(appointmentData.km);
    setAppointmentStatus(appointmentData.status);

    // Format and set estimate items
    if (appointmentData.services_actual && appointmentData.services_actual.length > 0) {
      const formattedEstimateItems = appointmentData.services_actual.map(service => ({
        service_id: service.service_id || "",
        type: service.service_type || "",
        spares: service.items_required.map(item => ({
          spareList: item.item_name || "",
          qty: item.qty || 0,
          price: item.price || 0,
          uom: item.uom || "",
          tax: item.tax
        })),
        reportedIssue: service.service_description || "",
        estimatedAmount: service.price || 0
      }));
      setEstimateItems(formattedEstimateItems);
    } else {
      // Set default empty estimate item if no services exist
      setEstimateItems([{
        service_id: "",
        type: "Services",
        spares: [],
        reportedIssue: "",
        estimatedAmount: 0
      }]);
    }

    const customerId = appointmentData.customer_id; // Extract customer_id
    // const 
    vehicleId = appointmentData.vehicle_id;

    const [customerResponse, inventoryResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/${customerId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
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

    // Filter inventory to only include items with quantity > 0
    const inStockInventory = inventoryData;

    setCustomer(customerData);
    console.log("customerData", customerData)
    setVehicleId(vehicleId);
    setInventory(inStockInventory);
  } catch (err) {
    console.log("Error fetching details:", err);
    setError(err.message);
    setSnackbarMessage(err.message);
    setSnackBarSeverity("error");
    setOpenSnackbar(true);
  } finally {
    setLoading(false);
  }
};

const fetchInvoiceId = async (appointmentId, setInvoiceId) => {
  console.log(appointmentId);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/appointments_to_invoice/${appointmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch invoice ID");
    // const data = await response.json();
    // // console.log("data", data);
    // let invoiceid = {};
    // // invoiceid = data.find(item => item.appointment_id === appointmentId);
    // let res = data.map((dta) => {
    //   // console.log(dta.appointment_id)
    //   if (dta.appointment_id === appointmentId && dta.invoice_status === "active") {
    //     invoiceid = dta.invoice_id;
    //     return dta.invoice_id;
    //   }
    // })
    const final_data = await response.json()
    console.log("response", final_data)
    setInvoiceId(final_data.invoice_id);

    // console.log("res", res);
  } catch (err) {
    console.log("Error fetching invoice ID:", err);
  }
};

const ReadInvoiceId = (appointmentId, setInvoiceId) => {
  console.log(appointmentId);
  try {
    const request = new XMLHttpRequest();
    request.open(
      "GET",
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/appointments_to_invoice/invoice_status`,
      false // ❗ Makes it Synchronous
    );

    request.setRequestHeader("Authorization", `Bearer ${storedToken}`);
    request.setRequestHeader("Content-Type", "application/json");

    request.send(); // Sends the request (synchronously)

    if (request.status !== 200) {
      throw new Error("Failed to fetch invoice ID");
    }

    const data = JSON.parse(request.responseText);

    // Find active invoice for the given appointment ID
    const invoice = data.find(
      (dta) => dta.appointment_id === appointmentId && dta.invoice_status === "active"
    );

    setInvoiceId(invoice ? invoice.invoice_id : null);
    return invoice.invoice_id;
    // setInvoiceId(invoiceid);

    // console.log("res", res);
  } catch (err) {
    console.log("Error fetching invoice ID:", err);
  }
};
const handleCloseSnackbar = (setOpenSnackbar) => {
  setOpenSnackbar(false);
};

// Add helper for formatting dates
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export { fetchDetails, handleCloseSnackbar, formatDate, fetchInvoiceId, ReadInvoiceId };
