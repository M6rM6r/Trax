"use client";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { getColumnsFule } from "./columnsFule";
import { getColumnsTires } from "./columnsTires";
import { getColumnsTowing } from "./columnsTowing";
import { getColumnsDefault } from "./columnsDefault";
import AddPeakPrice from "./AddPeakPrice";
import { PeakTimeData, UnitsRecord } from "@/lib/types/responseTypes";

const Index = ({
  data,
  serviceName,
  fontasUnitLabel,
  fontasUnits,
}: {
  data: PeakTimeData[];
  serviceName?: string;
  fontasUnitLabel?: string;
  fontasUnits?: UnitsRecord[];
}) => {
  // Ensure data is always an array
  const peakTimesData = Array.isArray(data) ? data : [];

  // Get columns with existing peak times for overlap validation
  const getColumns = () => {
    if (serviceName === "fuel") return getColumnsFule(peakTimesData, fontasUnitLabel, serviceName);
    if (serviceName === "tires") return getColumnsTires(peakTimesData, fontasUnitLabel, serviceName);
    if (serviceName === "towing") return getColumnsTowing(peakTimesData, fontasUnitLabel, serviceName);
    return getColumnsDefault(peakTimesData, fontasUnitLabel, serviceName);
  };

  return (
    <DataTable
      columns={getColumns()}
      data={peakTimesData}
      heading="الاسعار اوقات الذروه"
      topComponent={
        <AddPeakPrice
          serviceName={serviceName}
          fontasUnitLabel={fontasUnitLabel}
          existingPeakTimes={peakTimesData}
          fontasUnits={fontasUnits}
        />
      }
      customizeColumnAppear={false}
    />
  );
};

export default Index;
