import {
  Document,
  Page,
  View,
  Text,
  Image as PDFImage,
  pdf,
} from "@react-pdf/renderer";

import toWords from "number-to-words";
import { space } from "postcss/lib/list";
import QRCode from "qrcode";
import { formatDate } from "../../controllers/jobStatusIDControllers.js";

const getPageGrandTotal = (pageItems) =>
  pageItems.reduce((sum, item) => {
    const qty = Number(
      item.qty ??
        (item.spares && item.spares.length > 0 ? item.spares[0]?.qty : null) ??
        0
    );
    const price = Number(
      item.price ??
        (item.spares && item.spares.length > 0
          ? item.spares[0]?.price
          : null) ??
        0
    );
    return sum + qty * price;
  }, 0);

const generatePDFInvoice = async ({
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
  invoiceId,
  companyDetails,
  upi,
  printDate,
  printedBy,
  openInNewTab = false,
}) => {
  console.log("PDF Generation Data:", {
    customer,
    estimateItems,
    appointmentId,
    vehicleId,
    km,
    totalTax,
    PdfHeaderImage,
    pdfFooterImage,
    pdfLogo,
    invoiceId,
    companyDetails,
    upi,
  });

  const amountInWords = (amount) => {
    const wholeNumber = Math.round(amount);
    return (
      toWords.toWords(wholeNumber).charAt(0).toUpperCase() +
      toWords.toWords(wholeNumber).slice(1)
    );
  };
  const hasGST = totalTax > 0;

  // Filter out items with zero amount
  const filteredEstimateItems = estimateItems.filter((item) => {
    const price = Number(
      item.price ??
        (item.spares && item.spares.length > 0
          ? item.spares[0]?.price
          : null) ??
        0
    );
    const qty = Number(
      item.qty ??
        (item.spares && item.spares.length > 0 ? item.spares[0]?.qty : null) ??
        0
    );
    const amount = qty * price;
    return amount > 0; // Only include items with amount > 0
  });

  const columns = hasGST
    ? {
        no: "5%",
        particulars: "45%",
        qty: "10%",
        rate: "15%",
        gst: "10%",
        amount: "15%",
      }
    : {
        no: "5%",
        particulars: "45%", // ⬅ expands when GST removed
        qty: "10%",
        rate: "20%",
        amount: "20%",
      };

  // const itemsPerPage = 250;
  // const totalSpares = filteredEstimateItems.reduce(
  //   (acc, item) => acc + filteredEstimateItems.length, // item.spares.length,
  //   0
  // );
  // const totalPages = Math.ceil(totalSpares / itemsPerPage);
  const itemsPerPage = 25;
  const totalItems = filteredEstimateItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const taxDetails = {
    value: grandTotal,
    cgst: totalTax / 2,
    sgst: totalTax / 2,
    totalTax: totalTax,
  };

  let upiDetails = {
    pa: upi,
    pn: companyDetails[0]?.company_name,
    tn: "ARG's 7 Cars" + " - " + appointmentId,
    am: grandTotal?.toFixed(2),
    cu: "INR",
  };
  let upiLink = `upi://pay?pa=${encodeURIComponent(
    upiDetails.pa
  )}&pn=${encodeURIComponent(upiDetails.pn)}&tn=${encodeURIComponent(
    upiDetails.tn
  )}&am=${encodeURIComponent(upiDetails.am)}&cu=${encodeURIComponent(
    upiDetails.cu
  )}`;

  const qrCodeDataUrl = await QRCode.toDataURL(upiLink);
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

  const InvoiceDocument = () => (
    <Document>
      {Array.from({ length: totalPages }).map((_, pageIndex) => (
        <Page
          key={pageIndex}
          size="A4"
          style={{
            // padding: 5,
            paddingTop: 8,
            paddingLeft: 15,
            paddingRight: 15,
            paddingBottom: 25,
            fontSize: 10,
            fontFamily: "Times-Roman",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "100vh",
          }}
        >
          <View>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 16,
                textAlign: "center",
              }}
            >
              Invoice
            </Text>
          </View>
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
            {/* Watermark */}
            <PDFImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/logo/${pdfLogo}`}
              style={{
                height: 200,
                width: 450,
                position: "absolute",
                top: "30%",
                left: "10%",
                opacity: 0.1,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            {/* Header Section */}
            {/* <View style={{ textAlign: "center", marginBottom: 10 }} fixed>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingBottom: 10,
                                borderBottom: "2px solid #000",
                            }}
                        >
                            <PDFImage
                                src="/icons/pdf_head.png"
                                style={{ height: 75, width: 75 }}
                            />
                            <PDFImage
                                src="/icons/Arg_s7Cars Logo.png"
                                style={{ height: 100, width: 150 }}
                            />
                            <View style={{ textAlign: "center", flexGrow: 1 }}>
                                <PDFImage
                                    src="/icons/ayyanar.png"
                                    style={{ height: 30, width: 130, marginRight: 350 }}
                                />
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontWeight: "bolder",
                                        marginLeft: 80,
                                        fontFamily: "Helvetica-Bold",
                                    }}
                                >
                                    ARG's 7 Cars
                                </Text>
                                <Text
                                    style={{
                                        fontWeight: "light",
                                        fontStyle: "italic",
                                        marginLeft: 80,
                                    }}
                                >
                                    Perfectus Immutatio
                                </Text>
                                <Text style={{ marginLeft: 80 }}>
                                    No 366, Thiruthangal Road, Sivakasi - 626130
                                </Text>
                                <Text style={{ marginLeft: 80 }}>
                                    Contact: 77080 03008, 72003 77707
                                </Text>
                                <Text style={{ marginLeft: 80 }}>
                                    GSTIN: 33BGFPA9032E1ZY
                                </Text>
                            </View>
                        </View>
                    </View> */}

            <PDFImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_header/${PdfHeaderImage}`}
              style={{
                objectFit: "cover",
                width: "100%",
                height: 88,
                paddingLeft: 20,
              }}
            />

            {/* Patron and Vehicle Details */}
            <View
              style={{
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
                // padding: 10,
                // marginBottom: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                // flex: 0.24,
              }}
            >
              {/* First Column - Customer Details */}
              <View
                style={{
                  width: "60%",
                  borderRight: 1,
                  paddingTop: 5,

                  paddingLeft: 10,
                  fontSize: 12,
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
                    {formatTextWithEllipsis(fullAddress, 80)}
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

                {/* Next Service */}
                {km && km > 0 && (
                  <View style={{ flexDirection: "row", marginTop: 4 }}>
                    <Text style={{ width: 90, fontFamily: "Helvetica-Bold" }}>
                      Next Service
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ fontFamily: "Helvetica-Bold", width: 300 }}>
                      {km + 10000} KM /{" "}
                      {new Date(
                        new Date().setMonth(new Date().getMonth() + 6)
                      ).toLocaleDateString("en-GB")}
                    </Text>
                  </View>
                )}
              </View>

              {/* Second Column - Invoice Details */}
              <View
                style={{
                  width: "40%",
                  alignItems: "flex-start",
                  paddingTop: 5,
                  paddingLeft: 10,
                  fontSize: 12,
                }}
              >
                {[
                  { label: "Invoice No", value: invoiceId },
                  {
                    label: "Invoice Date",
                    value: new Date().toLocaleDateString("en-GB"),
                  },
                  { label: "Vehicle No", value: vehicleId },
                  ...(km > 0 ? [{ label: "Vehicle Kms", value: km }] : []),
                ].map((item, index) => (
                  <View
                    key={index}
                    style={{ flexDirection: "row", marginBottom: 2 }}
                  >
                    {/* Label */}
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      {item.label}
                    </Text>

                    {/* Colon */}
                    <Text style={{ width: 10 }}>:</Text>

                    {/* Value */}
                    <Text style={{ fontFamily: "Helvetica-Bold", width: 300 }}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Third Column - (Optional content goes here) */}
            </View>

            {/* Items Table */}
            {/* Items Table Section */}
            <View style={{ flex: 1, position: "relative" }}>
              {/* 1. COLUMN LINES OVERLAY (The Magic Part) */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  flexDirection: "row",
                  pointerEvents: "none",
                }}
              >
                <View
                  style={{ width: columns.no, borderRight: "1px solid #000" }}
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
                  fontSize: 11.5,
                  fontFamily: "Helvetica-Bold",
                  zIndex: 1,
                }}
              >
                <View style={{ width: columns.sno, padding: 4 }}>
                  <Text style={{ textAlign: "center" }}>No</Text>
                </View>
                <View
                  style={{
                    width: columns.particulars,
                    padding: 4,
                    alignItems: "center",
                  }}
                >
                  <Text>Particulars</Text>
                </View>
                <View style={{ width: columns.qty, padding: 4 }}>
                  <Text style={{ textAlign: "center" }}>Quanity</Text>
                </View>
                <View style={{ width: columns.rate, padding: 4 }}>
                  <Text style={{ textAlign: "center" }}>Rate</Text>
                </View>

                {hasGST && (
                  <View style={{ width: columns.gst, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>GST%</Text>
                  </View>
                )}

                <View style={{ width: columns.amount, padding: 4 }}>
                  <Text style={{ textAlign: "center" }}>Amount</Text>
                </View>
              </View>

              {/* 3. ITEMS ROWS */}
              <View style={{ zIndex: 1, fontSize: 10, fontSize: 12 }}>
                {filteredEstimateItems
                  .slice(
                    pageIndex * itemsPerPage,
                    (pageIndex + 1) * itemsPerPage
                  )
                  .map((item, index) => (
                    <View key={index} style={{ flexDirection: "row" }}>
                      <View style={{ width: columns.no, padding: 4 }}>
                        <Text style={{ textAlign: "center" }}>
                          {index + 1 + pageIndex * itemsPerPage}
                        </Text>
                      </View>
                      <View style={{ width: columns.particulars, padding: 4 }}>
                        <Text style={{ fontFamily: "Helvetica" }}>
                          {`${
                            item.spareList ||
                            (item.spares && item.spares.length > 0
                              ? item.spares[0]?.spareList
                              : "")
                          } ${
                            item.reportedIssue === "N/A"
                              ? ""
                              : "-" + item.reportedIssue
                          }`}
                        </Text>
                      </View>
                      <View style={{ width: columns.qty, padding: 4 }}>
                        <Text style={{ textAlign: "center" }}>
                          {Number(
                            item.qty ??
                              (item.spares && item.spares.length > 0
                                ? item.spares[0]?.qty
                                : 0)
                          ) %
                            1 ===
                          0
                            ? Number(
                                item.qty ??
                                  (item.spares && item.spares.length > 0
                                    ? item.spares[0]?.qty
                                    : 0)
                              )
                            : Number(
                                item.qty ??
                                  (item.spares && item.spares.length > 0
                                    ? item.spares[0]?.qty
                                    : 0)
                              ).toFixed(1)}
                        </Text>
                      </View>
                      <View style={{ width: columns.rate, padding: 4 }}>
                        <Text style={{ textAlign: "right", paddingRight: 4 }}>
                          {parseFloat(
                            item.price ||
                              (item.spares && item.spares.length > 0
                                ? item.spares[0]?.price
                                : 0)
                          ).toFixed(2)}
                        </Text>
                      </View>
                      {hasGST && (
                        <View style={{ width: columns.gst, padding: 4 }}>
                          <Text style={{ textAlign: "right", paddingRight: 4 }}>
                            {(item.tax ||
                              (item.spares && item.spares.length > 0
                                ? item.spares[0]?.tax
                                : 0)) + "%"}
                          </Text>
                        </View>
                      )}
                      <View style={{ width: columns.amount, padding: 4 }}>
                        <Text style={{ textAlign: "right", paddingRight: 4 }}>
                          {parseFloat(
                            item.qty * item.price ||
                              (item.spares && item.spares.length > 0
                                ? item.spares[0]?.qty * item.spares[0]?.price
                                : 0)
                          ).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            </View>

            {/* ===== PAGE-WISE GRAND TOTAL ===== */}
           {/* ===== PAGE GRAND TOTAL (ONLY WHEN MULTIPLE PAGES & NOT LAST PAGE) ===== */}
{/* {totalPages > 1 && pageIndex < totalPages - 1 && ( */}
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
{/* )} */}


            {/* Only add the footer on the last page */}
            {/* Total Section */}
            {pageIndex === totalPages - 1 && (
              <>
                <View
                  style={{
                    borderTop: "1px solid #000",
                    width: "100%",
                    borderBottom: "1px solid #000",
                    height: 120,
                    // padding: 5,
                    display: "flex",
                    flexDirection: "row",
                    flex: 0.38,
                  }}
                >
                  <View style={{ width: "60%", borderRight: "1px solid #000" }}>
                    <View
                      style={{
                        height: "75%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        padding: 5,
                      }}
                    >
                      <View
                        style={{
                          width: "22%",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          // paddingLeft: 3,
                          // alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            // fontWeight: "bold",
                            // marginBottom: 5,
                            textDecoration: "underline",
                            fontFamily: "Helvetica-Bold",
                          }}
                        >
                          Bank Details:
                        </Text>
                        <PDFImage
                          src={qrCodeDataUrl}
                          style={{ width: 60, height: 60 }}
                        />
                      </View>
                      <View
                        style={{
                          height: "100%",
                          width: "38%",

                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Text style={{ fontWeight: "bold" }}>
                          ARG's 7 Cars & {"\n"}Sree Jaya Finserve
                        </Text>
                        <Text>{companyDetails[0].bank_name}</Text>
                        <View style={{ height: 8 }} />
                      </View>
                      <View
                        style={{
                          height: "100%",
                          width: "40%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          // paddingTop: 12,
                          gap: 4,
                        }}
                      >
                        <Text>Account No: {companyDetails[0].account_no}</Text>
                        <Text>IFSC Code: {companyDetails[0].ifsc_code}</Text>
                        <Text>GPay: {companyDetails[0].gpay_number}</Text>
                        <View style={{ height: 8 }} />
                      </View>
                    </View>
                    <View
                      style={{
                        height: "25%",
                        borderTop: "1px solid #000",
                        paddingLeft: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Helvetica-Bold",
                        }}
                      >
                        Rupees in words:
                      </Text>
                      <Text
                        style={{ fontSize: 10, marginTop: 8 }}
                      >{`Rupees ${amountInWords(grandTotal)} Only.`}</Text>
                    </View>
                  </View>
                  <View
                    style={{
                      width: "40%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      // justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flex: 1,

                        borderBottom: "1px solid #000",
                        // padding: 6,
                        fontFamily: "Helvetica-Bold",
                        fontSize: 11.5,
                        justifyContent: "flex-end",
                      }}
                    >
                      <View
                        style={{
                          borderTop: "1px solid #000", // border just above Net Amount
                          padding: 5, // some spacing from border
                          justifyContent: "space-between",
                        }}
                      >
                        {/* Net Amount */}
                        <View style={{ flexDirection: "row" }}>
                          <Text style={{ width: 90 }}>Net Amount</Text>
                          <Text style={{ width: 10, textAlign: "center" }}>
                            :
                          </Text>
                          <Text style={{ width: 120 }}>
                            {"Rs." + (grandTotal - totalTax).toFixed(2)}
                          </Text>
                        </View>

                        {/* GST + Overall Total (ONLY IF GST EXISTS) */}
                        {totalTax > 0 && (
                          <>
                            <View style={{ flexDirection: "row" }}>
                              <Text style={{ width: 90 }}>GST Total</Text>
                              <Text style={{ width: 10, textAlign: "center" }}>
                                :
                              </Text>
                              <Text style={{ width: 120 }}>
                                {"Rs." + totalTax.toFixed(2)}
                              </Text>
                            </View>

                            <View style={{ flexDirection: "row" }}>
                              <Text style={{ width: 90, fontWeight: "bold" }}>
                                Overall Total
                              </Text>
                              <Text style={{ width: 10, textAlign: "center" }}>
                                :
                              </Text>
                              <Text style={{ width: 120, fontWeight: "bold" }}>
                                {"Rs." + grandTotal.toFixed(2)}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>

                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}
                      >
                        For ARG's 7 Cars
                      </Text>
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontWeight: "bold",
                          marginTop: 25,
                        }}
                      >
                        Authorized Signature
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Footer Section */}
                {/* ================= FOOTER START ================= */}
              </>
            )}
            <View
              style={{
                borderTop: "1px solid #000",
                backgroundColor: "#f0f0f0",
                // padding: 10,
                justifyContent: "center",
                height: 40,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  // fontFamily: "Helvetica-Bold",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: 8, // ✅ readable size
                  // lineHeight: 1.4,
                }}
              >
                Our Services: {companyDetails[0].services}
              </Text>
            </View>
            {/* ===== LAST PRINT FOOTER (ONLY LAST PAGE) ===== */}
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
              <Text>
                Date: {formatDate(printDate || new Date().toISOString())}
              </Text>
               
              <Text>Printed By: {printedBy || "System"}</Text>
              <Text>Print Type: Reprint</Text>
            </View>
           
          </View>
        </Page>
      ))}
    </Document>
  );

  const pdfBlob = await pdf(<InvoiceDocument />).toBlob();
  const url = URL.createObjectURL(pdfBlob);
  const Timestamp = new Date().getTime();

  if (openInNewTab) {
    // Open PDF in new tab/window
    window.open(url, "_blank");
  } else {
    // Download PDF
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_JB_${appointmentId}_${Timestamp}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default generatePDFInvoice;
