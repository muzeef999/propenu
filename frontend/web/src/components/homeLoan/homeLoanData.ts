export interface LoanOffer {
  bankName: string;
  logo: string;
  logoClass?: string;
  loanAmount: string;
  interest: string;
  tenure: string;
  monthlyEmi: string;
  processingFee?: string;
  processingTime?: string;
  discountOnProcessing?: string;
  loginFee?: string;
}

export const loanOffers: LoanOffer[] = [
  {
    bankName: "ICICI Bank",
    logo: "/home-loan/icici.png",
    logoClass: "h-6 w-6",
    loanAmount: "50L",
    interest: "7.25%",
    tenure: "30 Yr",
    monthlyEmi: "38.4K",
    processingFee: "₹ 0",
    processingTime: "15 Days",
    discountOnProcessing: "Yes",
    loginFee: "₹ 1000",
  },
  {
    bankName: "HDFC Bank",
    logo: "/home-loan/hdfc.png",
    logoClass: "h-5 w-5",
    loanAmount: "50L",
    interest: "7.25%",
    tenure: "30 Yr",
    monthlyEmi: "38.4K",
    processingFee: "₹ 0",
    processingTime: "15 Days",
    discountOnProcessing: "Yes",
    loginFee: "₹ 1000",
  },
  {
    bankName: "Bank of Baroda Bank",
    logo: "/home-loan/bob.png",
    logoClass: "h-6 w-6",
    loanAmount: "50L",
    interest: "7.25%",
    tenure: "30 Yr",
    monthlyEmi: "38.4K",
    processingFee: "₹ 0",
    processingTime: "15 Days",
    discountOnProcessing: "Yes",
    loginFee: "₹ 1000",
  },
];

export const filterItems = [
  "Product Type",
  "City",
  "Employment Type",
  "Gender",
  "Loan Amount",
  "Tenure",
  "LTU Ratio",
];

export const repeatedOffers: LoanOffer[] = Array.from({ length: 5 }).flatMap(
  () => loanOffers
);

export const topLoanOffers: LoanOffer[] = repeatedOffers.slice(0, 5);
