import { useState } from "react";

export interface AccordionItem {
  question: string;
  answer: string;
}

export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={item.question}>
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <span className="font-medium text-navy">{item.question}</span>
              <span className="text-gold">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-sm text-charcoal/70">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
