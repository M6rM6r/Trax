"use client";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { FormikProps } from "formik";

const Index = ({
  min = 0,
  max = 100,
  step = 1,
  formikProps,
  name,
  labelName,
}: {
  min: number;
  max: number;
  step: number;
  formikProps: FormikProps<any>;
  name: string;
  labelName: string;
}) => {
  const [value, setValue] = useState<[number, number]>([min, max]);
  const containerRef = useRef<HTMLDivElement>(null);
  const startLabelRef = useRef<HTMLSpanElement>(null);
  const endLabelRef = useRef<HTMLSpanElement>(null);

  // Sync with Formik value
  useEffect(() => {
    if (formikProps.values[name] && formikProps.values[name].length === 2) {
      setValue(formikProps.values[name]);
    } else {
      // Reset to min/max when Formik value is empty
      setValue([min, max]);
    }
  }, [formikProps.values, name, min, max]);

  const getPositionPercentage = (val: number) => {
    return ((val - min) / (max - min)) * 100;
  };

  // Calculate dynamic positions considering label width and container boundaries
  const getAdjustedPosition = useCallback(
    (
      position: number,
      isStart: boolean
    ): { left: string; transform: string } => {
      if (
        !containerRef.current ||
        (!startLabelRef.current && !endLabelRef.current)
      ) {
        return {
          left: `${position}%`,
          transform: "translateX(-50%)",
        };
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;

      // Estimate label width (use actual ref if available, otherwise estimate)
      let labelWidth = 80; // fallback estimate in pixels
      const labelRef = isStart ? startLabelRef.current : endLabelRef.current;

      if (labelRef) {
        labelWidth = labelRef.getBoundingClientRect().width;
      } else {
        // Estimate based on content
        const labelContent = isStart
          ? `${value[0]} ${labelName}`
          : `${value[1]} ${labelName}`;
        labelWidth = Math.max(60, labelContent.length * 8); // rough estimate
      }

      const labelHalfWidth = labelWidth / 2;
      const positionInPixels = (position / 100) * containerWidth;

      // Calculate boundaries
      const minBoundary = labelHalfWidth;
      const maxBoundary = containerWidth - labelHalfWidth;

      let adjustedPosition = positionInPixels;

      if (positionInPixels < minBoundary) {
        // Label is too close to left edge - push right
        adjustedPosition = minBoundary;
      } else if (positionInPixels > maxBoundary) {
        // Label is too close to right edge - push left
        adjustedPosition = maxBoundary;
      }

      // Convert back to percentage for CSS
      const adjustedPercentage = (adjustedPosition / containerWidth) * 100;

      return {
        left: `${adjustedPercentage}%`,
        transform: "translateX(-50%)",
      };
    },
    [value, labelName]
  );

  return (
    <div ref={containerRef} className="relative pt-5 pb-7 px-2">
      <RangeSlider
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => {
          setValue(e);
          formikProps.setFieldValue(name, e);
        }}
      />

      {/* Start Label */}
      <span
        ref={startLabelRef}
        className="text-16 text-textMain font-[600] absolute -bottom-3 text-nowrap z-10"
        style={getAdjustedPosition(getPositionPercentage(value[0]), true)}
      >
        {value[0]} {labelName}
      </span>

      {/* End Label */}
      <span
        ref={endLabelRef}
        className="text-16 text-textMain font-[600] absolute -top-5 text-nowrap z-10"
        style={getAdjustedPosition(getPositionPercentage(value[1]), false)}
      >
        {value[1]} {labelName}
      </span>
    </div>
  );
};

export default Index;
