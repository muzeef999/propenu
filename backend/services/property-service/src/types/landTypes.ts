import { IFileRef } from "./sharedTypes";

export interface ILand  {
  plotArea?: number;
  plotAreaUnit?: 'sqft' | 'sqmt' | 'acre' | 'guntha' | 'kanal' | 'hectare';
  roadWidthFt?: number;
  negotiable?: boolean;
  readyToConstruct?: boolean;
  waterConnection?: boolean;
  electricityConnection?: boolean;
  approvedByAuthority?: string[];
  facing?: string;
  cornerPlot?: boolean;
  fencing?: boolean;
  landUseZone?: string;
  conversionCertificateFile?: IFileRef | null;
  encumbranceCertificateFile?: IFileRef | null;
  soilTestReport?: IFileRef | null;
  surveyNumber?: string;
  layoutType?: string;
}