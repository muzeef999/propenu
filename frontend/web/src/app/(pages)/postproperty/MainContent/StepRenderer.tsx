import { useSelector } from "react-redux"
import BasicDetailsStep from "../steps/BasicDetailsStep"
import LocationDetailsStep from "../steps/LocationDetailsStep"
import PropertyProfileStep from "../steps/PropertyProfileStep"

export default function StepRenderer() {
  const step = useSelector(
    (state: any) => state.postProperty.currentStep
  )

  switch (step) {
    case 1:
      return <BasicDetailsStep />
    case 2:
      return <LocationDetailsStep />
    case 3 :
      return <PropertyProfileStep />
    default:
      return null
  }
}
