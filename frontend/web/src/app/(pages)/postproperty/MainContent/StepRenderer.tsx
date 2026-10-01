"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

type StepSkeletonVariant = "basic" | "location" | "profile" | "verification"

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-100 ${className}`} />
}

function StepSkeleton({ variant }: { variant: StepSkeletonVariant }) {
  if (variant === "verification") {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-56" />
          <SkeletonBlock className="h-4 w-full max-w-xl" />
        </div>
        <div className="rounded-lg border border-gray-100 p-5">
          <SkeletonBlock className="h-5 w-44" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <SkeletonBlock key={item} className="h-28 w-full" />
            ))}
          </div>
          <SkeletonBlock className="mt-6 h-10 w-36" />
        </div>
      </div>
    )
  }

  const fieldRows =
    variant === "location"
      ? ["md:grid-cols-[60%_1fr]", "md:grid-cols-3", "md:grid-cols-1"]
      : variant === "profile"
        ? ["md:grid-cols-3", "md:grid-cols-2", "md:grid-cols-4"]
        : ["md:grid-cols-2", "md:grid-cols-5", "md:grid-cols-4"]

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-32" />
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2].map((item) => (
            <SkeletonBlock key={item} className="h-10 w-28" />
          ))}
        </div>
      </div>

      {fieldRows.map((gridClassName, rowIndex) => (
        <div
          key={`${variant}-row-${rowIndex}`}
          className={`grid grid-cols-1 gap-4 ${gridClassName}`}
        >
          {[0, 1, 2, 3].slice(0, rowIndex === 0 ? 2 : 4).map((item) => (
            <div key={item} className="space-y-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          ))}
        </div>
      ))}

      {variant === "location" && <SkeletonBlock className="h-52 w-full" />}

      <SkeletonBlock className="h-10 w-28" />
    </div>
  )
}

const BasicDetailsStep = dynamic(() => import("../steps/BasicDetailsStep"), {
  loading: () => <StepSkeleton variant="basic" />,
})
const LocationDetailsStep = dynamic(
  () => import("../steps/LocationDetailsStep"),
  {
    loading: () => <StepSkeleton variant="location" />,
  },
)
const PropertyProfileStep = dynamic(
  () => import("../steps/PropertyProfileStep"),
  {
    loading: () => <StepSkeleton variant="profile" />,
  },
)
const VerificationStep = dynamic(() => import("../steps/VerificationStep"), {
  loading: () => <StepSkeleton variant="verification" />,
})

export default function StepRenderer() {
  const [roleName, setRoleName] = useState("")
  const [isRoleLoaded, setIsRoleLoaded] = useState(false)

  useEffect(() => {
    setRoleName(String(localStorage.getItem("role") ?? "").toLowerCase())
    setIsRoleLoaded(true)
  }, [])

  const step = useSelector(
    (state: any) => state.postProperty.currentStep
  )
  const normalizedRoleName = roleName.replace(/[-\s]+/g, "_")
  const maxStep =
    normalizedRoleName === "agent" || normalizedRoleName === "sales_agent"
      ? 3
      : 4
  const safeStep = Math.min(Math.max(step || 1, 1), maxStep)

  if (!isRoleLoaded) {
    return <StepSkeleton variant="basic" />
  }

  switch (safeStep) {
    case 1:
      return <BasicDetailsStep />
    case 2:
      return <LocationDetailsStep />
    case 3:
      return <PropertyProfileStep />
    case 4:
      return <VerificationStep />
    default:
      return null
  }
}
