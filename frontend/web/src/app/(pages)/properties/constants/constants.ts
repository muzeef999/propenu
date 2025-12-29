import { MoreFilterSection, MoreFilterSectionAGR, MoreFilterSectionCom, MoreFilterSectionLand } from "@/types";

// constants/budget.ts
export const BUDGET_MIN = 5; // 5 Lac
export const BUDGET_MAX = 5000; // 50 Cr (in Lac)
export const BUDGET_STEP = 5;

export const budgetOptions = [
  5, 10, 20, 30, 50, 75,
  100, 150, 200, 300, 400,
  500, 750, 1000, 2000, 3000, 4000, 5000,
];

export const formatBudget = (value: number) => {
  if (value >= 100)
    return `₹${value / 100}${value === 5000 ? "+" : ""} Cr`;
  return `₹${value} Lac`;
};




export const CARPET_MIN = 300;
export const CARPET_MAX = 10000;

export const carpetOptions = [
  300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000,
];



export const moreFilterSections: MoreFilterSection[] = [
    {
      key: "Property Type",
      label: "Property Type",
      options: [
        "Apartment",
        "Independent house",
        "Villa",
        "Penthouse",
        "Studio",
        "Duplex",
        "Triplex",
        "Farmhouse",
        "independent-builder-floor",
      ],
      selectionType: "single",
    },
    {
      key: "Sales Type",
      label: "Sales Type",
      options: ["new-sale", "resale"],
      selectionType: "single",
    },
    {
      key: "Possession Status",
      label: "Possession Status",
      options: ["ready-to-move", "under-construction"],
      selectionType: "single",
    },
    { key: "Covered Area", label: "Covered Area" },
    {
      key: "Bathroom",
      label: "Bathroom",
      options: ["1+", "2+", "3+", "4+"],
      selectionType: "multiple",
    },
    {
      key: "Balcony",
      label: "Balcony",
      options: ["1+", "2+", "3+"],
      selectionType: "multiple",
    },
    {
      key: "Parking",
      label: "Parking",
      options: ["1 Car", "2 Cars"],
      selectionType: "multiple",
    },
    {
      key: "Furnishing",
      label: "Furnishing",
      options: ["Unfurnished", "Semi-Furnished", "Fully Furnished"],
      selectionType: "single",
    },
    {
      key: "Amenities",
      label: "Amenities",
      options: ["Lift", "Power Backup", "Gym", "Swimming Pool", "Security"],
      selectionType: "multiple",
    },
    {
      key: "Facing",
      label: "Facing",
      options: ["East", "West", "North", "South"],
      selectionType: "multiple",
    },
    { key: "Verified Properties", label: "Verified Properties" },
    {
      key: "Posted Since",
      label: "Posted Since",
      options: [
        "All",
        "Yesterday",
        "Last Week",
        "Last 2 Weeks",
        "Last 3 Weeks",
        "Last Month",
        "Last 2 Months",
        "Last 4 Months",
      ],
      selectionType: "single",
    },
    {
      key: "Posted By",
      label: "Posted By",
      options: ["owners", "Agents", "Builders"],
      selectionType: "multiple",
    },
  ];




  export const commercialMoreFilterSections: MoreFilterSectionCom[] = [
    {
      key: "Commercial Type",
      label: "Commercial Type",
      options: [
        "Office Space",
        "Shop",
        "Showroom",
        "Warehouse",
        "Industrial Shed",
        "IT Park",
        "Co-working Space",
      ],
    },
    {
      key: "Commercial Sub Type",
      label: "Commercial Sub Type",
      options: [
        "Independent Building",
        "Business Park",
        "Mall Shop",
        "High Street Shop",
        "SEZ Office",
      ],
    },
    {
      key: "Transaction Type",
      label: "Transaction Type",
      options: ["new-sale", "resale"],
    },
    {
      key: "Construction Status",
      label: "Construction Status",
      options: ["ready-to-move", "under-construction"],
    },
    {
      key: "Built-up Area",
      label: "Built-up Area",
    },
    {
      key: "Carpet Area",
      label: "Carpet Area",
    },
    {
      key: "Floor Number",
      label: "Floor Number",
      options: ["Ground", "1+", "5+", "10+"],
    },
    {
      key: "Total Floors",
      label: "Total Floors",
      options: ["1+", "5+", "10+", "20+"],
    },
    {
      key: "Furnishing Status",
      label: "Furnishing Status",
      options: ["unfurnished", "semi-furnished", "fully-furnished"],
    },
    {
      key: "Pantry",
      label: "Pantry",
      options: ["Inside Premises", "Shared"],
    },
    {
      key: "Power Capacity",
      label: "Power Capacity (KW)",
      options: ["10+", "25+", "50+", "100+"],
    },
    {
      key: "Parking",
      label: "Parking",
      options: ["Visitor Parking", "2 Wheeler", "4 Wheeler"],
    },
    {
      key: "Fire Safety",
      label: "Fire Safety",
      options: [
        "Fire Extinguisher",
        "Fire Sprinkler",
        "Smoke Detector",
        "Fire Alarm",
        "Emergency Exit",
      ],
    },
    {
      key: "Flooring Type",
      label: "Flooring Type",
      options: ["Vitrified", "Granite", "Marble", "Concrete"],
    },
    {
      key: "Wall Finish",
      label: "Wall Finish",
      options: ["Bare", "Painted", "Finished"],
    },
    {
      key: "Tenant Available",
      label: "Tenant Available",
      options: ["Yes"],
    },
    {
      key: "Banks Approved",
      label: "Banks Approved",
      options: ["SBI", "HDFC", "ICICI", "Axis"],
    },
    {
      key: "Price Negotiable",
      label: "Price Negotiable",
      options: ["Yes"],
    },
    {
      key: "Posted Since",
      label: "Posted Since",
      options: ["All", "Yesterday", "Last Week", "Last Month", "Last 3 Months"],
    },
    {
      key: "Posted By",
      label: "Posted By",
      options: ["Owners", "Agents", "Builders"],
    },
  ];



  
  export  const landMoreFilterSections: MoreFilterSectionLand[] = [
    {
      key: "Land Type",
      label: "Land Type",
      options: [
        "Residential Land",
        "Commercial Land",
        "Agricultural Land",
        "Industrial Land",
        "Farm Land",
      ],
    },
    {
      key: "Land Sub Type",
      label: "Land Sub Type",
      options: [
        "Open Plot",
        "Layout Plot",
        "Corner Plot",
        "DTCP Approved Plot",
        "HMDA Approved Plot",
      ],
    },
    {
      key: "Plot Area",
      label: "Plot Area",
    },
    {
      key: "Dimensions",
      label: "Dimensions",
    },
    {
      key: "Road Width",
      label: "Road Width (ft)",
      options: ["20+", "30+", "40+", "60+"],
    },
    {
      key: "Facing",
      label: "Facing",
      options: ["East", "West", "North", "South", "North-East", "North-West"],
    },
    {
      key: "Corner Plot",
      label: "Corner Plot",
      options: ["Yes"],
    },
    {
      key: "Ready To Construct",
      label: "Ready To Construct",
      options: ["Yes"],
    },
    {
      key: "Water Connection",
      label: "Water Connection",
      options: ["Available"],
    },
    {
      key: "Electricity Connection",
      label: "Electricity Connection",
      options: ["Available"],
    },
    {
      key: "Approved By",
      label: "Approved By Authority",
      options: ["DTCP", "HMDA", "BDA", "RERA"],
    },
    {
      key: "Land Use Zone",
      label: "Land Use Zone",
      options: ["Residential", "Commercial", "Industrial", "Agricultural"],
    },
    {
      key: "Banks Approved",
      label: "Banks Approved",
      options: ["SBI", "HDFC", "ICICI", "Axis"],
    },
    { key: "Verified Properties", label: "Verified Properties" },
    {
      key: "Price Negotiable",
      label: "Price Negotiable",
      options: ["Yes"],
    },
    {
      key: "Posted Since",
      label: "Posted Since",
      options: [
        "All",
        "Yesterday",
        "Last Week",
        "Last 2 Weeks",
        "Last Month",
        "Last 3 Months",
      ],
    },
    {
      key: "Posted By",
      label: "Posted By",
      options: ["Owners", "Agents", "Builders"],
    },
  ];



  
  export const agriculturalMoreFilterSections: MoreFilterSectionAGR[] = [
    {
      key: "Agricultural Type",
      label: "Agricultural Type",
      options: [
        "Dry Land",
        "Wet Land",
        "Farm Land",
        "Plantation Land",
        "Horticulture Land",
      ],
    },
    {
      key: "Agricultural Sub Type",
      label: "Agricultural Sub Type",
      options: [
        "Paddy Field",
        "Coconut Garden",
        "Mango Orchard",
        "Palm Plantation",
        "Mixed Crop Land",
      ],
    },
    {
      key: "Total Area",
      label: "Total Area",
    },
    {
      key: "Area Unit",
      label: "Area Unit",
      options: ["Acre", "Guntha", "Cent", "Hectare"],
    },
    { key: "Verified Properties", label: "Verified Properties" },
    {
      key: "Soil Type",
      label: "Soil Type",
      options: ["Red Soil", "Black Soil", "Alluvial Soil", "Sandy Soil"],
    },
    {
      key: "Irrigation Type",
      label: "Irrigation Type",
      options: ["Canal", "Borewell", "Drip", "Rain-fed"],
    },
    {
      key: "Number of Borewells",
      label: "Number of Borewells",
      options: ["1+", "2+", "3+", "4+"],
    },
    {
      key: "Water Source",
      label: "Water Source",
      options: ["River", "Canal", "Borewell", "Tank"],
    },
    {
      key: "Electricity Connection",
      label: "Electricity Connection",
      options: ["Available"],
    },
    {
      key: "Current Crop",
      label: "Current Crop",
      options: ["Paddy", "Cotton", "Sugarcane", "Groundnut", "Vegetables"],
    },
    {
      key: "Plantation Age",
      label: "Plantation Age (Years)",
      options: ["1+", "3+", "5+", "10+"],
    },
    {
      key: "Road Width",
      label: "Road Width",
      options: ["20+", "30+", "40+"],
    },
    {
      key: "Access Road Type",
      label: "Access Road Type",
      options: ["Mud Road", "BT Road", "CC Road"],
    },
    {
      key: "Boundary Wall",
      label: "Boundary Wall",
      options: ["Yes"],
    },
    {
      key: "State Restrictions",
      label: "State Purchase Restrictions",
      options: ["Applicable", "Not Applicable"],
    },
    {
      key: "Price Negotiable",
      label: "Price Negotiable",
      options: ["Yes"],
    },
    {
      key: "Posted Since",
      label: "Posted Since",
      options: ["All", "Yesterday", "Last Week", "Last Month", "Last 3 Months"],
    },
    {
      key: "Posted By",
      label: "Posted By",
      options: ["Owners", "Agents"],
    },
  ];