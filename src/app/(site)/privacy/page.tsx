import type { Metadata } from "next";
import { getSiteContent } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const { contact } = await getSiteContent();
  return (
    <div className="container-site max-w-3xl pt-6">
      <Breadcrumbs items={[{ label: "Privacy", href: "/privacy" }]} />
      <h1 className="font-display mt-6 text-5xl md:text-6xl">Privacy policy</h1>
      <div className="prose-wilson mt-8 text-ink-soft">
        <p>
          This website is a product catalogue operated by {contact.retailerName}. It does not take orders or payments.
          Purchases are completed on the retailer’s own online store, under that store’s policies.
        </p>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Contact form:</strong> your name, email address, optional phone number and message. We use these only
            to reply to you.
          </li>
          <li>
            <strong>Newsletter (if offered):</strong> your email address, used only to send product updates. You can ask
            to be removed at any time.
          </li>
          <li>
            <strong>Wishlist:</strong> stored only in your own browser (local storage) and never sent to us.
          </li>
          <li>
            <strong>Security logs:</strong> to prevent abuse we briefly process your IP address for rate limiting. These
            are not used to identify you.
          </li>
        </ul>
        <h2>Cookies</h2>
        <p>
          The public site does not use advertising or tracking cookies. A strictly necessary session cookie is set only
          when an administrator signs in.
        </p>
        <h2>Links to other sites</h2>
        <p>
          “Buy” buttons and source links open other websites, such as the retailer’s store. Their privacy policies apply
          there.
        </p>
        <h2>Contact</h2>
        <p>
          For privacy questions or to have your data deleted, contact{" "}
          {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : contact.retailerName}.
        </p>
      </div>
    </div>
  );
}
