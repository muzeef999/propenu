import { useSelector } from "react-redux"
import BasicDetailsStep from "../steps/BasicDetailsStep"
import LocationDetailsStep from "../steps/LocationDetailsStep"

export default function StepRenderer() {
  const step = useSelector(
    (state: any) => state.postProperty.currentStep
  )

  switch (step) {
    case 1:
      return <BasicDetailsStep />
    case 2:
      return <LocationDetailsStep />
    
    default:
      return null
  }
}
