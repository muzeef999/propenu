import React from "react";

type CmgSoonSvgProps = React.SVGProps<SVGSVGElement>;

const CmgSoonSvg = (props: CmgSoonSvgProps) => {
  return (
    <svg
      width="796"
      height="313"
      viewBox="0 0 796 313"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M760.597 84.3397L871.158 2.18568C878.098 -2.97081 888 1.52551 888.685 10.144L911.274 294.526L2.1526 362.073C-0.0378608 362.236 -0.85139 359.261 1.1171 358.286L42.4341 337.832L123.604 287.685C133.069 281.837 143.569 277.86 154.533 275.967L223.487 264.067C232.01 262.596 240.097 259.237 247.154 254.236L270.511 237.687C305.185 213.119 348.166 203.256 390.082 210.248L415.611 214.507C443.3 219.126 471.483 209.777 490.921 189.526L555.976 121.748C579.995 96.7244 615.452 86.261 649.209 94.2357L678.789 101.224C707.214 107.939 737.153 101.76 760.597 84.3397Z"
        fill="url(#cmg-soon-gradient)"
      />
      <defs>
        <linearGradient
          id="cmg-soon-gradient"
          x1="3.01588"
          y1="213.617"
          x2="20.0133"
          y2="404.059"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#BEF4D4" />
          <stop offset="0.5" stopColor="#DEFAEA" />
          <stop offset="1" stopColor="#F1FCF5" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default CmgSoonSvg;
