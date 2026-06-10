import type { Metadata } from "next";
import { LegalPolicyClient } from "~/components/legal/LegalPolicyClient";
import { policyConfig } from "~/config/policies";
import { storeConfig } from "~/config/store";

export const metadata: Metadata = {
  title: `${policyConfig.locales.en.pages.privacy.title} | ${storeConfig.name}`,
  description: policyConfig.locales.en.pages.privacy.description,
};

export default function PrivacyPage() {
  return <LegalPolicyClient pageKey="privacy" />;
}
