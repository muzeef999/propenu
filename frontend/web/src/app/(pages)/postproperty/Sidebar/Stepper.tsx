import { useSelector } from "react-redux"
import StepItem from "./StepItem"
import { STEPS } from "../constants/steps"

export default function Stepper() {
  const currentStep = useSelector(
    (state: any) => state.postProperty.currentStep
  )

  return (
    <div className="space-y-4">
      {STEPS.map((step, index) => (
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
        isLast={index === STEPS.length - 1}
        />
      ))}
    </div>
  )
}
