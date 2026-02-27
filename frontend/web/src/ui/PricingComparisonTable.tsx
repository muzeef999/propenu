"use client";
import { createPaymentOrder, verifyPayment } from "@/app/(pages)/builder/data";
import { Plan } from "@/types";
import SubscriptionLady from "@/svg/SubscriptionLady";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { me } from "@/data/ClientData";
import { toast } from "sonner";
import LoginDialog from "@/app/(auth)/Login";
import RegisterDialog from "@/app/(auth)/Register";

type FeatureRow = {
  label: string;
  render: (plan: Plan) => string;
};

type Props = {
  plans: Plan[];
  features: FeatureRow[];
  userType: "buyer" | "builder" | "agent" | "owner";
};


function getRedirectAfterPlan(plan: Plan, user: any) {
  const code = plan.code?.toLowerCase();


  // ✅ Owner plans → go post property
  if (code?.includes("owner") && (code.includes("sell") || code.includes("rent"))) {
    return "/postproperty";
  }

  // ✅ Buyer view plans → stay same page
  if (code?.includes("buyer") && code.includes("view")) {
    return null;
  }

  // ✅ Agent / Builder
  if (user?.roleName === "builder") return "/builder/dashboard";
  if (user?.roleName === "agent") return "/agent/dashboard";

  return "/membership";
}

export default function PricingComparisonTable({
  plans,
  features,
  userType,
}: Props) {
  // ✅ Hooks must be here
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // ✅ Fetch user once
  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await me();
        setUser(data);
      } catch (err) {
        console.error("User fetch error", err);
      }
    }
    fetchUser();
  }, []);

  // ✅ Normal async function
  const handleSubscribe = async (plan: Plan) => {
    try {
      if (!user) {
        toast.info("Please login to continue");
        setShowLoginDialog(true);
        return;
      }

      setLoadingPlan(plan._id);
      const order = await createPaymentOrder({
        planId: plan._id,
        userType,
      });

      if (order?.free) {
      
         if (order?.alreadyActive) {
    toast.info("Plan already active 👍");
    return;
  }

    toast.success("Plan activated 🎉");

        const redirect = getRedirectAfterPlan(plan, user);

        if (redirect) router.push(redirect);
        else router.refresh();

        return;
      }

      if (!(window as any).Razorpay) {
        alert("Payment SDK not loaded");
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Propenu",
        description: `${plan.name} Plan Subscription (${userType})`,

        prefill: {
          name: user?.fullName || "",
          email: user?.email || "",
        },

        handler: async (response: any) => {
          await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          const redirectMap: Record<string, string> = {
            agent: "/agent/membership",
            buyer: "/membership",
            owner: "/membership",
            builder: "/builder/dashboard",
          };

          router.replace(
            redirectMap[user?.roleName?.toLowerCase()] || "/postproperty",
          );
        },

        theme: { color: "#27AE60" },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div
      id="pricing-table"
      className="flex flex-col md:flex-row gap-4 items-stretch max-w-7xl mx-auto p-4 font-sans"
    >
      {/* ---------- LEFT SIDEBAR (Service Details) ---------- */}
      <div className="w-full md:w-50 relative mt-16 md:mt-12">
        {/* HEADER TEXT */}
        <div className="mb-4 ml-20">
          <p className="text-sm text-[#27AE60] font-medium">Get started</p>
          <h2 className="text-xl font-semibold text-gray-900 leading-tight">
            Service Details
          </h2>
        </div>

        {/* GREEN CARD (RELATIVE) */}
        <div className="relative bg-[#27AE60] rounded-2xl p-6 pt-14 flex flex-col">
          {/* SVG SITTING ON CARD */}
          <div className="absolute -top-22 left-4 scale-90 origin-top-left pointer-events-none">
            <SubscriptionLady />
          </div>

          {/* FEATURES */}
          <div className="flex flex-col text-white/90 text-sm">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="py-4 border-b border-white/20 last:border-0 font-medium"
              >
                {feature.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- PLANS LIST ---------- */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.code}
            className="min-w-[180px] flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col transition-transform hover:scale-[1.02]"
          >
            {/* Plan Header */}
            <div className="p-5 bg-[#F4FBF7] rounded-t-2xl text-center">
              <h3 className="text-[#27AE60] font-semibold text-lg mb-1">
                {plan.name}
              </h3>
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-semibold">
                  ₹{plan.price.toLocaleString()}
                </span>
                {plan.price > 0 && (
                  <span className="text-xs text-gray-400">
                    /{plan.validityDays || 30} Days
                  </span>
                )}
              </div>

              {/* Dummy "Was" price for Elite UI match */}
              {plan.name === "Elite" && (
                <p className="text-xs text-red-400 line-through">₹9,999</p>
              )}

              <button
                onClick={() => handleSubscribe(plan)}
                className="mt-4 w-full btn-primary font-medium cursor-pointer py-2"
              >
                Buy Now
              </button>
            </div>

            {/* Feature Values */}
            <div className="flex flex-col flex-1 justify-between py-4">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="py-4 text-center text-gray-700 text-sm border-b border-gray-50 last:border-0 flex items-center justify-center min-h-[60px]"
                >
                  {feature.render(plan)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="z-50">
            {showLoginDialog && (
              <LoginDialog
                open={showLoginDialog}
                onClose={() => setShowLoginDialog(false)}
                onSwitchToRegister={() => {
                  setShowLoginDialog(false);
                  setShowRegisterDialog(true);
                }}
              />
            )}

            {showRegisterDialog && (
              <RegisterDialog
                open={showRegisterDialog}
                onClose={() => setShowRegisterDialog(false)}
                onSwitchToLogin={() => {
                  setShowRegisterDialog(false);
                  setShowLoginDialog(true);
                }}
              />
            )}
          </div>
    </div>
  );
}
