import { useSelector } from "react-redux"
import BasicDetailsStep from "../steps/BasicDetailsStep"
import LocationDetailsStep from "../steps/LocationDetailsStep"
import PropertyProfileStep from "../steps/PropertyProfileStep"
import VerificationStep from "../steps/VerificationStep"


export default function StepRenderer() {


  const step = useSelector(
    (state: any) => state.postProperty.currentStep
  )
  const safeStep = Math.min(Math.max(step || 1, 1), 4)

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
