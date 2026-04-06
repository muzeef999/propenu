import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v19.0";

const TOKEN = "EAAXhIccvVfgBQvEc8BR5zh8DSyeEfvY9ZCoQHrIG7a8zRBHkN2kfKuUHujlpo31J1oZBfwCNM9DlXpXhQuoubdcAhLmhahYj2LdgQ8iTYytWMK6HMghwHZCxaNSLEhZBrvD3r9ZA6ZCRnJmStnLhoflMLt2szXvyW3fmC507UKfLFX3RCvSbFpAjYut2Avw1rQUgZDZD";
const BUSINESS_ID = "1519313212465013";

// CREATE TEMPLATE
export const createTemplateService = async (data: any) => {
  const res = await axios.post(
    `${BASE_URL}/${BUSINESS_ID}/message_templates`,
    data,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data;
};

// GET ALL TEMPLATES
export const getTemplatesService = async () => {
  const res = await axios.get(
    `${BASE_URL}/${BUSINESS_ID}/message_templates`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );
  return res.data;
};

// DELETE TEMPLATE
export const deleteTemplateService = async (name: string) => {
  const res = await axios.delete(
    `${BASE_URL}/${BUSINESS_ID}/message_templates?name=${encodeURIComponent(name)}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );

  return res.data;
};