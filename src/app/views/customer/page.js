"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";
import Cookies from "js-cookie";

import { Tabs, Tab, Box ,Tooltip } from "@mui/material";

// 🔹 Define all tabs
const allTiles = [
  {
    name: "Leads",
    route: "/views/customer/leads",
    icon: "/icons/leads1.png",
  },
  {
    name: "Customers",
    route: "/views/customer/Salescustomers",
    icon: "/icons/customer1.png",
  },
];


export default function Sidebar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tilesToDisplay, setTilesToDisplay] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/");
      return;
    }

    setIsAuthenticated(true);

    const access = Cookies.get("access");
    if (access) {
      try {
        const accessList = JSON.parse(access);

        const filteredTiles = allTiles.filter((tile) => {
          const tileName = tile.name.toLowerCase().trim();

          return accessList.some((accessItem) => {
            let accessName = "";
            if (typeof accessItem === "string") {
              accessName = accessItem.toLowerCase().trim();
            } else if (accessItem && typeof accessItem === "object") {
              accessName =
                accessItem.name?.toLowerCase().trim() ||
                accessItem.moduleName?.toLowerCase().trim() ||
                accessItem.module?.toLowerCase().trim() ||
                "";
            }

            return (
              tileName.includes(accessName) ||
              accessName.includes(tileName)
            );
          });
        });

        setTilesToDisplay(filteredTiles);
      } catch {
        setTilesToDisplay([]);
      }
    }
  }, [router]);

  if (!isAuthenticated) return null;
 const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <>
      {/* <Navbar pageName="Customer" /> */}
          {pageType !== "tab" && <Navbar pageName="Customer" />}
      

      <Box sx={{ width: "100%" }}>
        {/* 🔹 Tabs */}
 <Tabs
  value={tabValue}
  onChange={(e, newValue) => setTabValue(newValue)}
  variant="scrollable"
  scrollButtons="auto"
  sx={{
    backgroundColor: "rgba(0,0,0,0.35)",
    borderBottom: "1px solid rgba(255,255,255,0.25)",
    minHeight: 60,
    "& .MuiTab-root": { minHeight: 60, color: "white" },
    "& .Mui-selected": { color: "#90caf9" },
    "& .MuiTabs-indicator": { backgroundColor: "#90caf9", height: 3 },
  }}
>
  {tilesToDisplay.map((tile, index) => (
    <Tab
      key={index}
      label={tile.name}         // ✅ This shows the name
      icon={
        <img
          src={tile.icon}
          alt={tile.name}
          style={{
            width: 32,
            height: 32,
            objectFit: "contain",
            filter: "brightness(0) invert(1)", // white effect
          }}
        />
      }
      iconPosition="top"        // ✅ icon above the text
    />
  ))}
</Tabs>



        {/* 🔹 IFRAME CONTENT */}
        <Box
          sx={{
            width: "100%",
            height: "calc(89vh - 56px)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          {tilesToDisplay[tabValue] && (
            <iframe
              src={tilesToDisplay[tabValue].route}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          )}
        </Box>
      </Box>
    </>
  );
}
