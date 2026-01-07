"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function LayoutWrapper({ children }) {
  const [bgImage, setBgImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`);
        const data = await response.json();
        const companyDetails = data.company_details?.[0];
        if (companyDetails?.background_image) {
          setBgImage(companyDetails.background_image);
        }
      } catch (error) {
        console.error("Failed to fetch company details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyDetails();
  }, []);

  return (
    <div
      style={{
        backgroundImage: bgImage ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      {children}
    </div>
  );
}
