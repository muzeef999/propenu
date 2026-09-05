import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StepRenderer from "./StepRenderer";
import { useAppDispatch, useAppSelector } from "@/Redux/store";
import {
  getMyDraftThunk,
  createDraftThunk,
} from "@/Redux/thunks/submitPropertyApi";
import {
  hideAgentSubmissionSuccess,
  resetPostProperty,
  setBaseField,
  setProfileField,
  setPropertyType,
  type PropertyCategory,
} from "@/Redux/slice/postPropertySlice";
import AgentSubmissionSuccessDialog from "../components/AgentSubmissionSuccessDialog";
import { useAuth } from "@/hooks/useAuth";


const MainContent = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { role, isLoading: isAuthLoading } = useAuth();
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [roleName, setRoleName] = useState("");
  const editId = searchParams.get("editId");
  const editListingTypeParam = searchParams.get("listingType");
  const editCategory = searchParams.get("editCategory") as PropertyCategory | null;

const { currentStep, propertyType, draftId, agentSubmissionSuccess, base } = useAppSelector(
  (state) => state.postProperty
);
const listingTypeRef = useRef(base.listingType);
const normalizedRoleName = roleName.replace(/[-\s]+/g, "_");
const maxStep =
  normalizedRoleName === "agent" || normalizedRoleName === "sales_agent"
    ? 3
    : 4;
const safeCurrentStep = Math.min(Math.max(currentStep || 1, 1), maxStep);

const normalizeListingTypeForForm = (listingType?: string | null) => {
  const normalized = String(listingType ?? "").trim().toLowerCase();
  if (normalized === "rent" || normalized === "lease") return "rent";
  if (normalized === "sale" || normalized === "buy") return "sale";
  return undefined;
};

useEffect(() => {
  if (isAuthLoading) return;

  if (role === "builder" || role === "builder_staff") {
    router.replace("/builder/create-property");
  }
}, [isAuthLoading, role, router]);

useEffect(() => {
  if (typeof window === "undefined") return;

  const storedRoleName = String(localStorage.getItem("role") ?? "").toLowerCase();
  const normalizedStoredRoleName = storedRoleName.replace(/[-\s]+/g, "_");
  const canPostProject =
    normalizedStoredRoleName === "agent" ||
    normalizedStoredRoleName === "sales_agent";

  setRoleName(storedRoleName);

  const storedType = editCategory ?? localStorage.getItem("postproperty:propertyType");
  const editListingType = normalizeListingTypeForForm(editListingTypeParam);
  const allowedTypes: PropertyCategory[] = canPostProject ? [
    "residential",
    "commercial",
    "land",
    "agricultural",
    "project",
  ] : [
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

  if (editId && editListingType) {
    listingTypeRef.current = editListingType;
    dispatch(
      setBaseField({
        key: "listingType",
        value: editListingType,
      }),
    );

    if (storedType && allowedTypes.includes(storedType as PropertyCategory)) {
      dispatch(
        setProfileField({
          propertyType: storedType as PropertyCategory,
          key: "listingType",
          value: editListingType,
        }),
      );
    }
  }

  setIsBootstrapped(true);
  // Bootstrap once on mount to avoid update loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [editCategory, editId, editListingTypeParam]);

useEffect(() => {
  if (role === "builder" || role === "builder_staff") return;
  if (!isBootstrapped) return;
  // property type not selected yet
  if (!propertyType) return;
  if (propertyType === "project") return;
  if (!editId && draftId) return;

  if (editId) {
    if (draftId === editId) return;

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
        dispatch(
          createDraftThunk({
            category: propertyType,
            listingType: listingTypeRef.current,
          }),
        );
      }
    })
    .catch(() => {
      // 404 or error → create new draft
      dispatch(
        createDraftThunk({
          category: propertyType,
          listingType: listingTypeRef.current,
        }),
      );
    });
}, [dispatch, draftId, editId, isBootstrapped, propertyType, role]);

useEffect(() => {
  listingTypeRef.current = base.listingType;
}, [base.listingType]);

useEffect(() => {
  if (!isBootstrapped || typeof window === "undefined") return;

  if (propertyType) {
    localStorage.setItem("postproperty:propertyType", propertyType);
  }

  if (draftId) {
    localStorage.setItem("postproperty:draftId", draftId);
  }
}, [isBootstrapped, propertyType, draftId]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isAuthLoading || role === "builder" || role === "builder_staff") {
    return (
      <div className="min-h-full bg-white p-3 lg:p-3">
        <div className="rounded-xl border lg:p-4 sm:p-1 border-[#EBECF0] space-y-6 p-3">
          <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

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
        onPostAnother={() => {
          dispatch(hideAgentSubmissionSuccess());
          dispatch(resetPostProperty());
          window.location.href = "/postproperty";
        }}
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
