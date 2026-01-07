async function fetchEntries(
  token,
  setEntries,
  setLoading,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackBarSeverity,
  startDate, // new parameter
  endDate    // new parameter
) {
  try {
    if (!token) {
      setOpenSnackbar(true);
      setSnackbarMessage(
        "Unauthorized. Please log in with appropriate user credentials."
      );
      setSnackBarSeverity("error");
      setLoading(false);
      return;
    }

    // Construct query parameters
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch entries");

    const data = await response.json();
    setEntries(data);
    setLoading(false);
  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage(err.message);
    setSnackBarSeverity("error");
    setLoading(false);
  }
}


// Function to handle search logic
const handleSearch = (searchText, originalEntries, setEntries) => {
  if (!searchText) {
    setEntries(originalEntries);
    return;
  }

  const lowerSearchText = searchText.toLowerCase();
  const results = originalEntries.filter((tile) => {
    return (
      (tile.plateNumber && tile.plateNumber.toLowerCase().includes(lowerSearchText)) ||
      (tile.vehicle_id && tile.vehicle_id.toLowerCase().includes(lowerSearchText)) ||
      (tile.customer_name && tile.customer_name.toLowerCase().includes(lowerSearchText)) ||
      (tile.phone && tile.phone.toLowerCase().includes(lowerSearchText))
    );
  });
  setEntries(results);
};

export { fetchEntries, handleSearch };
