import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Returns & Exchanges | The Revamp UG',
  description: 'Our policy regarding damaged or defective item exchanges in Uganda.',
  alternates: {
    canonical: 'https://www.therevampug.com/return-policy',
  },
};

export default function ReturnPolicyPage() {
  // Structured data for Google Merchant Center & Search crawlers
  const returnPolicySchema = {
    '@context': 'https://schema.org',
    '@type': 'MerchantReturnPolicy',
    'applicableCountry': 'UG',
    'returnPolicyCategory': 'https://schema.org/MerchantReturnDefectiveOnly',
    'merchantReturnDays': 2,
    'returnMethod': 'https://schema.org/ReturnByMail',
    'returnFees': 'https://schema.org/FreeReturn',
    'refundType': 'https://schema.org/ExchangeRefund',
    'url': 'https://www.therevampug.com/return-policy',
  };

  return (
    <main className="min-h-screen bg-[#FBF9F5] text-stone-800 py-12 px-5 sm:px-8">
      {/* Schema Injection for Google Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(returnPolicySchema) }}
      />

      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-stone-200/80">
        {/* Header */}
        <header className="mb-8 border-b border-stone-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">
            Customer Care
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 mt-1">
            Returns & Exchanges
          </h1>
          <p className="text-xs text-stone-400 mt-2">
            Coverage Region: Uganda
          </p>
        </header>

        {/* Human Narrative Copy */}
        <div className="space-y-6 text-sm text-stone-700 leading-relaxed font-sans">
          <p className="text-base text-stone-900 font-medium">
            We craft and curate every piece with intense attention to detail. Because the majority of our furniture and decor items are custom-built, made-to-order, or produced in limited small batches, we handle returns with a simple, fair approach.
          </p>

          <hr className="border-stone-100 my-6" />

          {/* Core Policy Details */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-stone-900">
              When can an item be returned or exchanged?
            </h2>
            <p>
              We accept returns and issue exchanges <strong>strictly for products that arrive defective, structurally damaged, or incorrect</strong> from what you ordered. 
            </p>
            <p className="text-stone-500 text-xs italic">
              Please note: Due to the custom nature of our woodworking, upholstery, and sourcing, we cannot process returns or issue refunds for change of mind after delivery.
            </p>
          </section>

          <section className="space-y-3 pt-2">
            <h2 className="text-base font-semibold text-stone-900">
              What should you do upon delivery?
            </h2>
            <p>
              We ask that you or your representative inspect your item carefully as soon as our transport team delivers it to your home or site in Uganda.
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-stone-600">
              <li>Check the wood finish, fabric, frame, and glass parts thoroughly.</li>
              <li>If you spot any flaw or transit damage, take a clear photo or quick video clip.</li>
              <li>Notify us via WhatsApp or phone within <strong>48 hours of receipt</strong> so our team can resolve it immediately.</li>
            </ol>
          </section>

          <section className="space-y-3 pt-2">
            <h2 className="text-base font-semibold text-stone-900">
              How do exchanges and repairs work?
            </h2>
            <p>
              If an item is verified as defective or damaged:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li><strong>Zero Cost to You:</strong> The Revamp UG covers 100% of the return pickup and redelivery costs within Uganda. There are no hidden fees or restocking deductions.</li>
              <li><strong>Exchange or Repair:</strong> We will collect the piece to fix the issue or replace it with a fresh unit depending on the structural scope.</li>
              <li>If an exact replacement is impossible due to material availability, you can apply the full order credit toward any other item in our catalog.</li>
            </ul>
          </section>

          {/* Contact Box */}
          <div className="bg-stone-50 rounded-lg p-5 border border-stone-200/60 mt-8">
            <h3 className="font-semibold text-stone-900 text-sm mb-1">
              Need assistance with a delivered piece?
            </h3>
            <p className="text-xs text-stone-600 mb-3">
              Reach out to our Kampala studio team directly and we&apos;ll get it sorted for you.
            </p>
            <div className="text-xs space-y-1 font-mono text-stone-800">
              <p> WhatsApp / Call: +256 703 861 668</p>
              <p> Email: support@therevampug.com</p>
            </div>
          </div>
        </div>

        {/* Back Home */}
        <div className="mt-10 pt-4 border-t border-stone-100">
          <Link 
            href="/" 
            className="text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wider"
          >
            ← Back to Store
          </Link>
        </div>
      </div>
    </main>
  );
}



// import React from 'react';
// import Link from 'next/link';

// export const metadata = {
//   title: 'Returns & Exchanges | The Revamp UG',
//   description: 'Our policy regarding damaged or defective item exchanges in Uganda.',
//   alternates: {
//     canonical: 'https://www.therevampug.com/return-policy',
//   },
// };

// export default function ReturnPolicyPage() {
//   // Structured data for Google Merchant Center & Search crawlers
//   const returnPolicySchema = {
//     '@context': 'https://schema.org',
//     '@type': 'MerchantReturnPolicy',
//     'applicableCountry': 'UG',
//     'returnPolicyCategory': 'https://schema.org/MerchantReturnDefectiveOnly',
//     'merchantReturnDays': 2,
//     'returnMethod': 'https://schema.org/ReturnByMail',
//     'returnFees': 'https://schema.org/FreeReturn',
//     'refundType': 'https://schema.org/ExchangeRefund',
//     'url': 'https://www.therevampug.com/return-policy',
//   };

//   return (
//     <main className="min-h-screen bg-[#FBF9F5] text-stone-800 py-12 px-5 sm:px-8">
//       {/* Schema Injection for Google Crawlers */}
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON-stringify(returnPolicySchema) }}
//       />

//       <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-stone-200/80">
        
//         {/* Header */}
//         <header className="mb-8 border-b border-stone-200 pb-6">
//           <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">
//             Customer Care
//           </p>
//           <h1 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 mt-1">
//             Returns & Exchanges
//           </h1>
//           <p className="text-xs text-stone-400 mt-2">
//             Coverage Region: Uganda
//           </p>
//         </header>

//         {/* Human Narrative Copy */}
//         <div className="space-y-6 text-sm text-stone-700 leading-relaxed font-sans">
          
//           <p className="text-base text-stone-900 font-medium">
//             We craft and curate every piece with intense attention to detail. Because the majority of our furniture and decor items are custom-built, made-to-order, or produced in limited small batches, we handle returns with a simple, fair approach.
//           </p>

//           <hr className="border-stone-100 my-6" />

//           {/* Core Policy Details */}
//           <section className="space-y-3">
//             <h2 className="text-base font-semibold text-stone-900">
//               When can an item be returned or exchanged?
//             </h2>
//             <p>
//               We accept returns and issue exchanges <strong>strictly for products that arrive defective, structurally damaged, or incorrect</strong> from what you ordered. 
//             </p>
//             <p className="text-stone-500 text-xs italic">
//               Please note: Due to the custom nature of our woodworking, upholstery, and sourcing, we cannot process returns or issue refunds for change of mind after delivery.
//             </p>
//           </section>

//           <section className="space-y-3 pt-2">
//             <h2 className="text-base font-semibold text-stone-900">
//               What should you do upon delivery?
//             </h2>
//             <p>
//               We ask that you or your representative inspect your item carefully as soon as our transport team delivers it to your home or site in Uganda.
//             </p>
//             <ol className="list-decimal pl-5 space-y-1.5 text-stone-600">
//               <li>Check the wood finish, fabric, frame, and glass parts thoroughly.</li>
//               <li>If you spot any flaw or transit damage, take a clear photo or quick video clip.</li>
//               <li>Notify us via WhatsApp or phone within <strong>48 hours of receipt</strong> so our team can resolve it immediately.</li>
//             </ol>
//           </section>

//           <section className="space-y-3 pt-2">
//             <h2 className="text-base font-semibold text-stone-900">
//               How do exchanges and repairs work?
//             </h2>
//             <p>
//               If an item is verified as defective or damaged:
//             </p>
//             <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
//               <li><strong>Zero Cost to You:</strong> The Revamp UG covers 100% of the return pickup and redelivery costs within Uganda. There are no hidden fees or restocking deductions.</li>
//               <li><strong>Exchange or Repair:</strong> We will collect the piece to fix the issue or replace it with a fresh unit depending on the structural scope.</li>
//               <li>If an exact replacement is impossible due to material availability, you can apply the full order credit toward any other item in our catalog.</li>
//             </ul>
//           </section>

//           {/* Contact Box */}
//           <div className="bg-stone-50 rounded-lg p-5 border border-stone-200/60 mt-8">
//             <h3 className="font-semibold text-stone-900 text-sm mb-1">
//               Need assistance with a delivered piece?
//             </h3>
//             <p className="text-xs text-stone-600 mb-3">
//               Reach out to our Kampala studio team directly and we&apos;ll get it sorted for you.
//             </p>
//             <div className="text-xs space-y-1 font-mono text-stone-800">
//               <p>💬 WhatsApp / Call: +256 700 000 000</p>
//               <p>✉️ Email: hello@therevampug.com</p>
//             </div>
//           </div>

//         </div>

//         {/* Back Home */}
//         <div className="mt-10 pt-4 border-t border-stone-100">
//           <Link 
//             href="/" 
//             className="text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wider"
//           >
//             ← Back to Store
//           </Link>
//         </div>

//       </div>
//     </main>
//   );
// }
