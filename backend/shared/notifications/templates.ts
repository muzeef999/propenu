type Template = {
  title: string;
  body: string;
};

export const notificationTemplates: Record<string, Template> = {
  PROPERTY_APPROVED: {
    title: "🎉 Property Approved",
    body: "Hi {name}, your property '{propertyTitle}' is now live!",
  },

  PROPERTY_REJECTED: {
    title: "❌ Property Rejected",
    body: "Hi {name}, your property '{propertyTitle}' was rejected.",
  },

  NEW_LEAD: {
    title: "📞 New Lead",
    body: "Hi {name}, you got a new lead for '{propertyTitle}'!",
  },

  PAYMENT_SUCCESS: {
    title: "💰 Payment Successful",
    body: "Hi {name}, your payment of ₹{amount} was successful.",
  },
};