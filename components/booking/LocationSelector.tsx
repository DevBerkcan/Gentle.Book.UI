"use client";

import { motion } from "framer-motion";
import { Card, CardBody } from "@nextui-org/card";
import { MapPin, ArrowRight, CheckCircle } from "lucide-react";
import type { Location } from "@/lib/api/booking";

interface LocationSelectorProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelect: (location: Location) => void;
  onNext: () => void;
  primaryColor?: string;
  title: string;
  subtitle: string;
}

export function LocationSelector({
  locations,
  selectedLocation,
  onSelect,
  onNext,
  primaryColor = "#6355E4",
  title,
  subtitle,
}: LocationSelectorProps) {
  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-[#14162B] mb-2">{title}</h2>
        <p className="text-sm sm:text-base text-[#8A8A8A]">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3">
        {locations.map((loc) => {
          const isSelected = selectedLocation?.id === loc.id;
          return (
            <Card
              key={loc.id}
              isPressable
              onPress={() => { onSelect(loc); onNext(); }}
              className="w-full transition-all"
              style={isSelected ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${primaryColor}` } : undefined}
              fullWidth
            >
              <CardBody className="p-3 sm:p-4 w-full">
                <div className="flex items-center gap-3 sm:gap-4 w-full">
                  <div
                    className="flex-shrink-0 p-2 sm:p-3 rounded-xl transition-colors"
                    style={{ backgroundColor: isSelected ? primaryColor : `${primaryColor}1A` }}
                  >
                    <MapPin className={isSelected ? "text-white" : ""} size={20} style={!isSelected ? { color: primaryColor } : {}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#14162B] text-sm sm:text-base break-words">{loc.name}</h4>
                    <p className="text-xs sm:text-sm text-[#8A8A8A] mt-1 break-words">
                      {[loc.street, [loc.postalCode, loc.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  {isSelected ? (
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      <CheckCircle size={14} className="text-white" />
                    </div>
                  ) : (
                    <ArrowRight size={18} className="flex-shrink-0 text-[#D1D5DB]" />
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
