/**
 * Zoho Subscriptions Service
 * Manage recurring billing plans for students.
 */

import zohoConfig from "../config/zoho.js";
import { zohoFetch } from "./zohoAuth.js";

const orgHeader = () => ({
  "X-com-zoho-subscriptions-organizationid": zohoConfig.subscriptions.orgId,
});

/**
 * Create a new subscription for a student.
 */
export const createSubscription = async ({ customerEmail, customerName, planCode }) => {
  const url = `${zohoConfig.subscriptions.apiBase}/subscriptions`;

  const payload = {
    customer: {
      display_name: customerName,
      email: customerEmail,
    },
    plan: {
      plan_code: planCode,
    },
  };

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: orgHeader(),
  });
};

/**
 * Get subscription details.
 */
export const getSubscription = async (subscriptionId) => {
  const url = `${zohoConfig.subscriptions.apiBase}/subscriptions/${subscriptionId}`;

  return zohoFetch(url, {
    headers: orgHeader(),
  });
};

/**
 * Get all subscriptions.
 */
export const getSubscriptions = async (page = 1) => {
  const url = `${zohoConfig.subscriptions.apiBase}/subscriptions?page=${page}`;

  return zohoFetch(url, {
    headers: orgHeader(),
  });
};

/**
 * Cancel a subscription.
 */
export const cancelSubscription = async (subscriptionId) => {
  const url = `${zohoConfig.subscriptions.apiBase}/subscriptions/${subscriptionId}/cancel`;

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify({ cancel_at_end: true }),
    headers: orgHeader(),
  });
};

/**
 * Get available plans.
 */
export const getPlans = async () => {
  const url = `${zohoConfig.subscriptions.apiBase}/plans`;

  return zohoFetch(url, {
    headers: orgHeader(),
  });
};

/**
 * Handle webhook from Zoho Subscriptions.
 */
export const handleWebhook = (payload) => {
  const event = payload.event_type;
  const data = payload.data || {};

  return {
    event,
    subscriptionId: data.subscription?.subscription_id,
    customerEmail: data.subscription?.customer?.email,
    status: data.subscription?.status,
    planName: data.subscription?.plan?.name,
    processedAt: new Date().toISOString(),
  };
};
