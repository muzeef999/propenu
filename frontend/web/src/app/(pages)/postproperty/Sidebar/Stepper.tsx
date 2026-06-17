import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import StepItem from "./StepItem"
import { STEPS } from "../constants/steps"

export default function Stepper() {
  const [roleName, setRoleName] = useState("")

  useEffect(() => {
    setRoleName(String(localStorage.getItem("role") ?? "").toLowerCase())
  }, [])

  const currentStep = useSelector(
    (state: any) => state.postProperty.currentStep
  )
  const visibleSteps = roleName === "agent" ? STEPS.filter((step) => step.id <= 3) : STEPS

  return (
    <div className="space-y-4">
      {visibleSteps.map((step, index) => (
        <StepItem
          key={step.id}
          label={step.label}
          status={
            step.id === currentStep
              ? "active"
              : step.id < currentStep
              ? "completed"
              : "pending"
          }
        isLast={index === visibleSteps.length - 1}
        />
      ))}
    </div>
  )
}
