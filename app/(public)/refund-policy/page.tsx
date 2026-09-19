import LegalPage from "../../../components/LegalPage";

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund Policy"
      intro="This policy explains when Myshop customers may request refunds, how requests are reviewed, and what happens after approval."
      updated="September 19, 2026"
      sections={[
        { title: "Eligibility", body: <><p>Refund requests may be considered when an order is cancelled within the permitted cancellation period, an item is materially different from its listing, an item arrives damaged, or an eligible item cannot be supplied.</p></> },
        { title: "Non-refundable situations", body: <><p>Refunds may not be available for normal wear, customer-caused damage, incorrect use, or situations where the item matches the order and listing requirements. Certain products may have additional restrictions.</p></> },
        { title: "How to request a refund", body: <><p>Contact Myshop through the Contact page and provide your order number, the item involved, the reason for the request, and clear supporting photographs where applicable. Never send passwords, PINs, OTPs, or full card details.</p></> },
        { title: "Review and decision", body: <><p>Myshop may review order records, payment status, delivery information, seller information, and supporting evidence before approving or declining a request. Where a return is required, customers will receive return instructions before sending the item.</p></> },
        { title: "Refund processing", body: <><p>Approved refunds are processed through the applicable payment channel where possible. The time for funds to appear can depend on the payment provider and financial institution. Myshop cannot guarantee a provider's exact settlement time.</p></> },
        { title: "Partial refunds", body: <><p>Where only part of an order qualifies, Myshop may issue a refund for the affected item or affected portion rather than the entire order.</p></> },
        { title: "Seller responsibility", body: <><p>Sellers are expected to provide accurate product information, fulfill confirmed orders, and cooperate with legitimate return and refund investigations.</p></> },
        { title: "Contact", body: <><p>For a refund or order dispute, use the Myshop Contact page and include your order number so the support team can identify the transaction.</p></> },
      ]}
    />
  );
}
