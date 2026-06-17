import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import BasicDetailsStep from "../steps/BasicDetailsStep"
import LocationDetailsStep from "../steps/LocationDetailsStep"
import PropertyProfileStep from "../steps/PropertyProfileStep"
import VerificationStep from "../steps/VerificationStep"


export default function StepRenderer() {
  const [roleName, setRoleName] = useState("")

  useEffect(() => {
    setRoleName(String(localStorage.getItem("role") ?? "").toLowerCase())
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

  switch (safeStep) {
    case 1:
      return <BasicDetailsStep />
    case 2:
      return <LocationDetailsStep />
    case 3 :
      return <PropertyProfileStep />
    case 4:
      return <VerificationStep />
    default:
      return null
  }
}
