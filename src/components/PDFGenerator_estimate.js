import {
  Document,
  Page,
  View,
  Text,
  Image as PDFImage,
  pdf,
} from "@react-pdf/renderer";
import toWords from "number-to-words";
import { formatDate } from "../../controllers/jobStatusIDControllers.js";

// const allSpares = estimateItems.flatMap(item => item.spares);


const generatePDF = async ({
  printDate,
  printedBy,
  customer,
  estimateItems,
  appointmentId,
  vehicleId,
  km,
  grandTotal,
  PdfHeaderImage,
  pdfFooterImage,
  pdfLogo,
  companyDetails,
}) => {
  const amountInWords = (amount) => {
    const wholeNumber = Math.round(amount);
    return (
      toWords.toWords(wholeNumber).charAt(0).toUpperCase() +
      toWords.toWords(wholeNumber).slice(1)
    );
  };
  // const getPageGrandTotal = (pageItems) =>
  //   pageItems.reduce((sum, item) => {
  //     const qty = Number(item.qty ?? item.spares?.[0]?.qty ?? 0);
  //     const price = Number(item.price ?? item.spares?.[0]?.price ?? 0);
  //     return sum + qty * price;
  //   }, 0);
  const getPageGrandTotal = (pageItems) =>
  pageItems.reduce((sum, spare) => {
    const qty = Number(spare.qty ?? 0);
    const rate = Number(spare.price ?? 0);
    const base = qty * rate;
    const gst = hasGST ? (base * GST_PERCENT) / 100 : 0;
    return sum + base + gst;
  }, 0);

  const hasGST = Boolean(customer?.gst_number);
  const GST_PERCENT = 18;

  const itemsPerPage = 25;
  const totalSpares = estimateItems.reduce(
    (acc, item) => acc + item.spares.length,
    0
  );
  const totalPages = Math.ceil(totalSpares / itemsPerPage);
  const columns = hasGST
    ? {
        sno: "8%",
        particulars: "40%",
        qty: "12%",
        rate: "12.5%",
        gst: "12.5%",
        amount: "15%",
      }
    : {
        sno: "8%",
        particulars: "40%",
        qty: "12%",
        rate: "20%",
        amount: "20%",
      };
  const formatTextWithEllipsis = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };
  const fullAddress = [
    customer?.contact?.address?.street,
    customer?.contact?.address?.city,
    customer?.contact?.address?.state,
    customer?.contact?.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

    const filteredEstimateItems = estimateItems
  .flatMap(item => item.spares || []);


  const MyDocument = () => (
    <Document>
      {Array.from({ length: totalPages }).map((_, pageIndex) => (
        <Page
          key={pageIndex}
          size="A4"
          style={{
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 5,
            paddingBottom: 25,
            fontSize: 10,
            fontFamily: "Times-Roman",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "100vh",
          }}
        >
          {/* Main Content */}
          <View style={{ textAlign: "center" }} fixed>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>Estimate</Text>
          </View>
          {/* Watermark */}
          {/* <PDFImage
                        src="/icons/Arg_s7Cars Logo.png"
                        style={{
                            height: 300,
                            width: 450,
                            position: "absolute",
                            top: "30%",
                            left: "10%",
                            opacity: 0.1,
                            zIndex: 0,
                            pointerEvents: "none",
                        }}
                    /> */}
          <View
            style={{
              flex: 1,
              // margin: 20,
              borderWidth: 1,
              borderColor: "#000",
              // padding: 15,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "80%",
            }}
          >
            <PDFImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/logo/${pdfLogo}`}
              style={{
                height: 300,
                width: 450,
                position: "absolute",
                top: "30%",
                left: "10%",
                opacity: 0.1,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <PDFImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_header/${PdfHeaderImage}`}
              style={{
                objectFit: "cover",
                width: "100%",
                height: 88,
                paddingLeft: 20,
              }}
            />

            {/* Patron and Vehicle Details Section */}
            <View
              style={{
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
                // padding: 2,
                // marginBottom: 10,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  // justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    width: "60%",
                    borderRight: 1,
                    paddingTop: 5,
                    fontSize: 10,
                    paddingLeft: 10,
                    display: "flex",
                    gap: 5,
                    fontSize: 12,
                    // height:"100%"
                  }}
                >
                  {/* Patron */}
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ width: 90, fontFamily: "Helvetica-Bold" }}>
                      Patron
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text
                      style={{
                        width: 300, // important
                        fontFamily: "Helvetica-Bold",
                        flexWrap: "wrap",
                      }}
                    >
                      {formatTextWithEllipsis(
                        `${customer.prefix} ${customer.customer_name}`,
                        50
                      )}
                    </Text>
                  </View>

                  {/* Address */}
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ width: 90 }} />
                    <Text style={{ width: 10 }} />
                    <Text
                      style={{
                        width: 300, // important
                        fontFamily: "Helvetica",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* {customer.contact.address.street},{" "}
                      {customer.contact.address.city} */}
                      {formatTextWithEllipsis(fullAddress, 100)}
                    </Text>
                  </View>

                  {/* Phone */}
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ width: 90, fontFamily: "Helvetica-Bold" }}>
                      Phone
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ fontFamily: "Helvetica-Bold", width: 300 }}>
                      {customer.contact.phone}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    width: "40%",
                    alignItems: "flex-start",
                    paddingTop: 5,
                    paddingLeft: 10,
                    fontSize: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Estimate No
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {appointmentId}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Estimate Date
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {new Date().toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Vehicle No
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {vehicleId}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Vehicle Kms
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {km}
                    </Text>
                  </View>
                </View>
              </View>

              {/* {customer.gst_number && <Text>GSTIN: {customer.gst_number}</Text>} */}
            </View>

            {/* Items Table */}
            <View style={{ flex: 1, position: "relative" }}>
              {/* 1. COLUMN LINES OVERLAY */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{ width: columns.sno, borderRight: "1px solid #000" }}
                />
                <View
                  style={{
                    width: columns.particulars,
                    borderRight: "1px solid #000",
                  }}
                />
                <View
                  style={{ width: columns.qty, borderRight: "1px solid #000" }}
                />
                <View
                  style={{ width: columns.rate, borderRight: "1px solid #000" }}
                />

                {hasGST && (
                  <View
                    style={{
                      width: columns.gst,
                      borderRight: "1px solid #000",
                    }}
                  />
                )}

                <View style={{ width: columns.amount }} />
              </View>

              {/* 2. TABLE HEADER */}
              <View
                style={{
                  flexDirection: "row",
                  borderBottom: "1px solid #000",
                  // backgroundColor: "#f0f0f0",
                  fontFamily: "Helvetica-Bold",
                  fontSize: 12,
                  zIndex: 1, // ensure header is above the border lines
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    borderBottom: "1px solid #000",
                  }}
                >
                  <View style={{ width: columns.sno, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>S.No</Text>
                  </View>

                  <View style={{ width: columns.particulars, padding: 4 }}>
                    <Text>Particulars</Text>
                  </View>

                  <View style={{ width: columns.qty, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>Qty</Text>
                  </View>

                  <View style={{ width: columns.rate, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>Rate</Text>
                  </View>

                  {hasGST && (
                    <View style={{ width: columns.gst, padding: 4 }}>
                      <Text style={{ textAlign: "center" }}>GST</Text>
                    </View>
                  )}

                  <View style={{ width: columns.amount, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>Amount</Text>
                  </View>
                </View>
              </View>

              {/* 3. ITEMS ROWS */}
              {/* 3. ITEMS ROWS */}
              <View style={{ zIndex: 1, fontSize: 12 }}>
                {estimateItems
                  .flatMap((item) => item.spares)
                  .slice(
                    pageIndex * itemsPerPage,
                    (pageIndex + 1) * itemsPerPage
                  )
                  .map((spare, index) => {
                    // ✅ JS LOGIC HERE
                    const qty = Number(spare.qty ?? 0);
                    const rate = Number(spare.price ?? 0);
                    const baseAmount = qty * rate;

                    const gstAmount = hasGST
                      ? (baseAmount * GST_PERCENT) / 100
                      : 0;

                    const finalAmount = baseAmount + gstAmount;

                    const displayQty = qty % 1 === 0 ? qty : qty.toFixed(1);

                    // ✅ JSX RETURN
                    return (
                      <View key={index} style={{ flexDirection: "row" }}>
                        <View style={{ width: columns.sno, padding: 4 }}>
                          <Text style={{ textAlign: "center" }}>
                            {pageIndex * itemsPerPage + index + 1}
                          </Text>
                        </View>

                        <View
                          style={{ width: columns.particulars, padding: 4 }}
                        >
                          <Text style={{ fontFamily: "Helvetica" }}>
                            {spare.spareList || "N/A"}
                          </Text>
                        </View>
                        <View style={{ width: columns.qty, padding: 4 }}>
                          <Text style={{ textAlign: "center" }}>
                            {displayQty}
                          </Text>
                        </View>

                        <View style={{ width: columns.rate, padding: 4 }}>
                          <Text style={{ textAlign: "right", paddingRight: 4 }}>
                            {rate.toFixed(2)}
                          </Text>
                        </View>

                        {hasGST && (
                          <View style={{ width: columns.gst, padding: 4 }}>
                            <Text style={{ textAlign: "right" }}>
                              {gstAmount.toFixed(2)}
                            </Text>
                          </View>
                        )}

                        <View style={{ width: columns.amount, padding: 4 }}>
                          <Text style={{ textAlign: "right", paddingRight: 4 }}>
                            {finalAmount.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* ===== PAGE-WISE GRAND TOTAL ===== */}
           {/* ===== PAGE GRAND TOTAL (ONLY WHEN MULTIPLE PAGES & NOT LAST PAGE) ===== */}
{totalPages > 1 && pageIndex < totalPages - 1 && (
  <View
    style={{
      borderTop: "1px solid #000",
      paddingTop: 6,
      paddingRight: 10,
      alignItems: "flex-end",
      fontFamily: "Helvetica-Bold",
      fontSize: 11.5,
    }}
  >
    <Text>
      Page Grand Total : Rs.
      {getPageGrandTotal(
        filteredEstimateItems.slice(
          pageIndex * itemsPerPage,
          (pageIndex + 1) * itemsPerPage
        )
      ).toFixed(2)}
    </Text>
  </View>
)}


            {/* Total Section */}
            {pageIndex === totalPages - 1 && (
              <View
                style={{
                  borderTop: "1px solid #000",
                  //   marginTop: 6,
                  //   padding: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f5f5f5",
                  height: 50,
                  fontSize: 12,
                }}
              >
                {/* Amount in Words */}
                <View
                  style={{
                    width: "60%",
                    borderRight: "1px solid #000",
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignSelf: "stretch",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Helvetica-Bold",
                      //   marginBottom: 2,
                    }}
                  >
                    Amount in Words
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: "Helvetica",
                      lineHeight: 1.4,
                    }}
                  >
                    {`Rupees ${amountInWords(grandTotal)} Only.`}
                  </Text>
                </View>

                {/* Total Box */}
                <View
                  style={{
                    width: "40%",

                    padding: 6,
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignSelf: "stretch",
                    fontSize: 12,
                  }}
                >
                  <Text
                    style={{
                      // fontSize: 10,
                      fontFamily: "Helvetica-Bold",
                      marginBottom: 3,
                    }}
                  >
                    Grand Total :
                  </Text>

                  <Text
                    style={{
                      // fontSize: 10,
                      fontFamily: "Helvetica",
                    }}
                  >
                    Rs.
                    {grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Footer Section */}
            {/* {pageIndex === totalPages - 1 && ( */}
            <View
              style={{
                backgroundColor: "#f0f0f0",
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                borderTop: "1px solid #000",
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Our Services: {companyDetails?.[0]?.services || ""}
              </Text>
            </View>
            {/* )} */}

            {/* {pageIndex === totalPages - 1 && ( */}
            <View
              fixed
              style={{
                borderTop: "1px solid #000",
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
                paddingHorizontal: 10,
                fontSize: 8,
                backgroundColor: "#f5f5f5",
              }}
            >
               <Text
                style={{ fontSize: 9 }}
                render={({ pageNumber, totalPages }) =>
                  `Page ${pageNumber} of ${totalPages}`
                }
              />
              <Text>Date: {formatDate(printDate || new Date())}</Text>
              <Text>Printed By: {printedBy || "Unknown User"}</Text>
              <Text>Print Type: Reprint</Text>
            </View>

            {/* )} */}
          </View>
        
        </Page>
      ))}
    </Document>
  );

  const pdfBlob = await pdf(<MyDocument />).toBlob();
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  const Timestamp = new Date().getTime();
  link.download = `Estimate_${appointmentId}_${Timestamp}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const previewPDF = async ({
  customer,
  estimateItems,
  appointmentId,
  vehicleId,
  km,
  grandTotal,
  PdfHeaderImage,
  pdfFooterImage,
  pdfLogo,
  companyDetails,
  printDate,
  printedBy,
}) => {
  const amountInWords = (amount) => {
    const wholeNumber = Math.round(amount);
    return (
      toWords.toWords(wholeNumber).charAt(0).toUpperCase() +
      toWords.toWords(wholeNumber).slice(1)
    );
  };
  const getPageGrandTotal = (pageItems) =>
    pageItems.reduce((sum, item) => {
      const qty = Number(item.qty ?? item.spares?.[0]?.qty ?? 0);
      const price = Number(item.price ?? item.spares?.[0]?.price ?? 0);
      return sum + qty * price;
    }, 0);
  const hasGST = Boolean(customer?.gst_number);
  const columns = hasGST
    ? {
        sno: "8%",
        particulars: "40%",
        qty: "12%",
        rate: "12.5%",
        gst: "12.5%",
        amount: "15%",
      }
    : {
        sno: "8%",
        particulars: "40%",
        qty: "12%",
        rate: "20%",
        amount: "20%",
      };

  const itemsPerPage = 25;
  const totalSpares = estimateItems.reduce(
    (acc, item) => acc + item.spares.length,
    0
  );
  const totalPages = Math.ceil(totalSpares / itemsPerPage);

  const MyDocument = () => (
    <Document>
      {Array.from({ length: totalPages }).map((_, pageIndex) => (
        <Page
          key={pageIndex}
          size="A4"
          style={{
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 5,
            paddingBottom: 25,
            fontSize: 10,
            fontFamily: "Times-Roman",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "100vh",
          }}
        >
          {/* Main Content */}
          <View style={{ textAlign: "center" }} fixed>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>Estimate</Text>
          </View>
          {/* Watermark */}
          {/* <PDFImage
                        src="/icons/Arg_s7Cars Logo.png"
                        style={{
                            height: 300,
                            width: 450,
                            position: "absolute",
                            top: "30%",
                            left: "10%",
                            opacity: 0.1,
                            zIndex: 0,
                            pointerEvents: "none",
                        }}
                    /> */}
          <View
            style={{
              flex: 1,
              // margin: 20,
              borderWidth: 1,
              borderColor: "#000",
              // padding: 15,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "80%",
            }}
          >
            <PDFImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/logo/${pdfLogo}`}
              style={{
                height: 300,
                width: 450,
                position: "absolute",
                top: "30%",
                left: "10%",
                opacity: 0.1,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <PDFImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_header/${PdfHeaderImage}`}
              style={{
                objectFit: "cover",
                width: "100%",
                height: 88,
                paddingLeft: 20,
              }}
            />

            {/* Patron and Vehicle Details Section */}
            <View
              style={{
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
                // padding: 2,
                // marginBottom: 10,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    width: "60%",
                    borderRight: 1,
                    paddingTop: 5,
                    fontSize: 10,
                    paddingLeft: 10,
                    display: "flex",
                    gap: 5,
                    fontSize: 12,
                    // height:"100%"
                  }}
                >
                  {/* Patron */}
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ width: 90, fontFamily: "Helvetica-Bold" }}>
                      Patron
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text
                      style={{
                        width: 300, // important
                        fontFamily: "Helvetica-Bold",
                        flexWrap: "wrap",
                      }}
                    >
                      {customer.prefix} {customer.customer_name}
                    </Text>
                  </View>

                  {/* Address */}
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ width: 90 }} />
                    <Text style={{ width: 10 }} />
                    <Text>
                      {customer.contact.address.street},{" "}
                      {customer.contact.address.city}
                    </Text>
                  </View>

                  {/* Phone */}
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ width: 90, fontFamily: "Helvetica-Bold" }}>
                      Phone
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>
                      {customer.contact.phone}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    width: "40%",
                    alignItems: "flex-start",
                    paddingTop: 5,
                    paddingLeft: 10,
                    fontSize: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Estimate No
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {appointmentId}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Estimate Date
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {new Date().toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Vehicle No
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {vehicleId}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Vehicle Kms
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {km}
                    </Text>
                  </View>
                </View>
              </View>

              {/*{customer.gst_number && <Text>GSTIN: {customer.gst_number}</Text>}*/}
            </View>

            {/* Items Table */}
            <View style={{ flex: 1, position: "relative" }}>
              {/* 1. COLUMN LINES OVERLAY */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{ width: columns.sno, borderRight: "1px solid #000" }}
                />
                <View
                  style={{
                    width: columns.particulars,
                    borderRight: "1px solid #000",
                  }}
                />
                <View
                  style={{ width: columns.qty, borderRight: "1px solid #000" }}
                />
                <View
                  style={{ width: columns.rate, borderRight: "1px solid #000" }}
                />

                {hasGST && (
                  <View
                    style={{
                      width: columns.gst,
                      borderRight: "1px solid #000",
                    }}
                  />
                )}

                <View style={{ width: columns.amount }} />
              </View>

              {/* 2. TABLE HEADER */}
              <View
                style={{
                  flexDirection: "row",
                  // borderBottom: "1px solid #000",
                  // backgroundColor: "#f0f0f0",
                  fontFamily: "Helvetica-Bold",
                  fontSize: 12,
                  zIndex: 1, // ensure header is above the border lines
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    borderBottom: "1px solid #000",
                  }}
                >
                  <View style={{ width: columns.sno, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>S.No</Text>
                  </View>

                  <View style={{ width: columns.particulars, padding: 4 }}>
                    <Text>Particulars</Text>
                  </View>

                  <View style={{ width: columns.qty, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>Qty</Text>
                  </View>

                  <View style={{ width: columns.rate, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>Rate</Text>
                  </View>

                  {hasGST && (
                    <View style={{ width: columns.gst, padding: 4 }}>
                      <Text style={{ textAlign: "center" }}>GST</Text>
                    </View>
                  )}

                  <View style={{ width: columns.amount, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>Amount</Text>
                  </View>
                </View>
              </View>

              {/* 3. ITEMS ROWS */}
              {/* 3. ITEMS ROWS */}
              <View style={{ zIndex: 1, fontSize: 12 }}>
                {estimateItems
                  .flatMap((item) => item.spares)
                  .slice(
                    pageIndex * itemsPerPage,
                    (pageIndex + 1) * itemsPerPage
                  )
                  .map((spare, index) => {
                    // ✅ JS LOGIC HERE
                    const qty = Number(spare.qty ?? 0);
                    const rate = Number(spare.price ?? 0);
                    const baseAmount = qty * rate;

                    const gstAmount = hasGST
                      ? (baseAmount * GST_PERCENT) / 100
                      : 0;

                    const finalAmount = baseAmount + gstAmount;

                    const displayQty = qty % 1 === 0 ? qty : qty.toFixed(1);

                    // ✅ JSX RETURN
                    return (
                      <View key={index} style={{ flexDirection: "row" }}>
                        <View style={{ width: columns.sno, padding: 4 }}>
                          <Text style={{ textAlign: "center" }}>
                            {pageIndex * itemsPerPage + index + 1}
                          </Text>
                        </View>

                        <View
                          style={{ width: columns.particulars, padding: 4 }}
                        >
                          <Text style={{ fontFamily: "Helvetica" }}>
                            {spare.spareList || "N/A"}
                          </Text>
                        </View>
                        <View style={{ width: columns.qty, padding: 4 }}>
                          <Text style={{ textAlign: "center" }}>
                            {displayQty}
                          </Text>
                        </View>

                        <View style={{ width: columns.rate, padding: 4 }}>
                          <Text style={{ textAlign: "right", paddingRight: 4 }}>
                            {rate.toFixed(2)}
                          </Text>
                        </View>

                        {hasGST && (
                          <View style={{ width: columns.gst, padding: 4 }}>
                            <Text style={{ textAlign: "right" }}>
                              {gstAmount.toFixed(2)}
                            </Text>
                          </View>
                        )}

                        <View style={{ width: columns.amount, padding: 4 }}>
                          <Text style={{ textAlign: "right", paddingRight: 4 }}>
                            {finalAmount.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* ===== PAGE-WISE GRAND TOTAL ===== */}
   {/* ===== PAGE GRAND TOTAL (ONLY WHEN MULTIPLE PAGES & NOT LAST PAGE) ===== */}
{totalPages > 1 && pageIndex < totalPages - 1 && (
  <View
    style={{
      borderTop: "1px solid #000",
      paddingTop: 6,
      paddingRight: 10,
      alignItems: "flex-end",
      fontFamily: "Helvetica-Bold",
      fontSize: 11.5,
    }}
  >
    <Text>
      Page Grand Total : Rs.
      {getPageGrandTotal(
        filteredEstimateItems.slice(
          pageIndex * itemsPerPage,
          (pageIndex + 1) * itemsPerPage
        )
      ).toFixed(2)}
    </Text>
  </View>
)}


            {/* Total Section */}
            {pageIndex === totalPages - 1 && (
              <View
                style={{
                  borderTop: "1px solid #000",
                  //   marginTop: 6,
                  //   padding: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f5f5f5",
                  height: 50,
                  fontSize: 12,
                }}
              >
                {/* Amount in Words */}
                <View
                  style={{
                    width: "60%",
                    borderRight: "1px solid #000",
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignSelf: "stretch",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Helvetica-Bold",
                      //   marginBottom: 2,
                    }}
                  >
                    Amount in Words
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: "Helvetica",
                      lineHeight: 1.4,
                    }}
                  >
                    {`Rupees ${amountInWords(grandTotal)} Only.`}
                  </Text>
                </View>

                {/* Total Box */}
                <View
                  style={{
                    width: "40%",

                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignSelf: "stretch",
                    fontSize: 12,
                  }}
                >
                  <Text
                    style={{
                      // fontSize: 10,
                      fontFamily: "Helvetica-Bold",
                      marginBottom: 3,
                    }}
                  >
                    Grand Total
                  </Text>

                  <Text
                    style={{
                      // fontSize: 10,
                      fontFamily: "Helvetica",
                    }}
                  >
                    Rs.
                    {grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Footer Section */}
            {/* {pageIndex === totalPages - 1 && ( */}
            <View
              style={{
                backgroundColor: "#f0f0f0",
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                borderTop: "1px solid #000",
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Our Services: {companyDetails?.[0]?.services || ""}
              </Text>
            </View>
            {/* )} */}

            {/* {pageIndex === totalPages - 1 && ( */}
            <View
              fixed
              style={{
                borderTop: "1px solid #000",
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
                paddingHorizontal: 10,
                fontSize: 8,
                backgroundColor: "#f5f5f5",
              }}
            >
            <Text
              style={{ fontSize: 9 }}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
              <Text>Date: {formatDate(printDate || new Date())}</Text>
              <Text>Printed By: {printedBy || "Unknown User"}</Text>
              <Text>Print Type: Reprint</Text>
            </View>

            {/* )} */}
          </View>
         
        </Page>
      ))}
    </Document>
  );

  const pdfBlob = await pdf(<MyDocument />).toBlob();
  const url = URL.createObjectURL(pdfBlob);

  // Open the PDF in a new tab for preview
  window.open(url, "_blank");
};

export default generatePDF;
