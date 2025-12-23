declare module "india-pincode-search" {
  export function search(
    pincode: string
  ): Array<{
    city: string;
    district: string;
    office: string;
    pincode: string;
    state: string;
    village: string;
  }>;
}
