import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import StepRenderer from "./StepRenderer";
import { useAppDispatch, useAppSelector } from "@/Redux/store";
import {
  getMyDraftThunk,
  createDraftThunk,
} from "@/Redux/thunks/submitPropertyApi";
import {
  hideAgentSubmissionSuccess,
  setPropertyType,
  type PropertyCategory,
} from "@/Redux/slice/postPropertySlice";
import AgentSubmissionSuccessDialog from "../components/AgentSubmissionSuccessDialog";


const MainContent = () => {

  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [roleName, setRoleName] = useState("");
  const editId = searchParams.get("editId");
  const editCategory = searchParams.get("editCategory") as PropertyCategory | null;

const { currentStep, propertyType, draftId, agentSubmissionSuccess } = useAppSelector(
  (state) => state.postProperty
);
const normalizedRoleName = roleName.replace(/[-\s]+/g, "_");
const maxStep =
  normalizedRoleName === "agent" || normalizedRoleName === "sales_agent"
    ? 3
    : 4;
const safeCurrentStep = Math.min(Math.max(currentStep || 1, 1), maxStep);

useEffect(() => {
  if (typeof window === "undefined") return;

  setRoleName(String(localStorage.getItem("role") ?? "").toLowerCase());

  const storedType = editCategory ?? localStorage.getItem("postproperty:propertyType");
  const allowedTypes: PropertyCategory[] = [
    "residential",
    "commercial",
    "land",
    "agricultural",
  ];

  if (
    storedType &&
    allowedTypes.includes(storedType as PropertyCategory) &&
    storedType !== propertyType
  ) {
    dispatch(setPropertyType(storedType as PropertyCategory));
  }

  setIsBootstrapped(true);
  // Bootstrap once on mount to avoid update loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [editCategory]);

useEffect(() => {
  if (!isBootstrapped) return;
  // property type not selected yet
  if (!propertyType) return;

  if (editId) {
    dispatch(
      getMyDraftThunk({
        category: propertyType,
        id: editId,
        startStep: 1,
      }),
    );
    return;
  }

  // try to resume draft
  dispatch(getMyDraftThunk(propertyType))
    .unwrap()
    .then((res) => {
      // no draft found → create one
      if (!res) {
        dispatch(createDraftThunk(propertyType));
      }
    })
    .catch(() => {
      // 404 or error → create new draft
      dispatch(createDraftThunk(propertyType));
    });
}, [dispatch, editId, isBootstrapped, propertyType]);

useEffect(() => {
  if (!isBootstrapped || typeof window === "undefined") return;

  if (propertyType) {
    localStorage.setItem("postproperty:propertyType", propertyType);
  }

  if (draftId) {
    localStorage.setItem("postproperty:draftId", draftId);
  }
}, [isBootstrapped, propertyType, draftId]);


  const STEP_TITLES: Record<number, string> = {
    1: "Add Basic Details",
    2: "Add Location Details",
    3: "Add Property Details",
    4: "Verify & Publish",
  };

  return (
    <div className="min-h-full bg-white p-3 lg:p-3">
      <AgentSubmissionSuccessDialog
        open={agentSubmissionSuccess}
        onPostAnother={() => dispatch(hideAgentSubmissionSuccess())}
        onViewProperties={() => {
          dispatch(hideAgentSubmissionSuccess());
          window.location.href = "/agent/my-properties";
        }}
      />
      <div className="rounded-xl border lg:p-4 sm:p-1 border-[#EBECF0] space-y-6 p-3">
        {/* --- Enquiry Banner --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 border-b border-gray-50 sm:border-none">
          <div className="flex items-center gap-3">

            <p className="text-sm text-gray-800 leading-tight ">
              <span className="font-semibold">Your next Buyer or Tenant is just one step away.</span> Post your Property now!
            </p>
          </div>
        </div>

        {/* --- Title & Help Button --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
          <p className="text-xl md:text-2xl font-semibold text-gray-900">
            {STEP_TITLES[safeCurrentStep]}
          </p>
        </div>

        {/* --- Form Content --- */}
        <div className="pt-2">
          <StepRenderer />
        </div>
      </div>
    </div>
  );
};

export default MainContent;
