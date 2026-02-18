"use client";

import React, { useState } from "react";
import { IoChevronDown } from "react-icons/io5";

export interface AccordionItem {
    id: string;
    question: string;
    answer: React.ReactNode;
}

interface AccordionProps {
    items: AccordionItem[];
    allowMultiple?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({
    items,
    allowMultiple = false,
}) => {
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (id: string) => {
        if (allowMultiple) {
            setOpenItems((prev) =>
                prev.includes(id)
                    ? prev.filter((item) => item !== id)
                    : [...prev, id]
            );
        } else {
            setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
        }
    };

    return (
        <div className="space-y-3">
            {items.map((item) => {
                const isOpen = openItems.includes(item.id);

                return (
                    <div
                        key={item.id}
                        className={`rounded-lg  transition-all duration-300 ${isOpen
                            ? "bg-[#f2fff9]"
                            : "bg-white"
                            }`}
                    >
                        <button
                            onClick={() => toggleItem(item.id)}
                            className="flex w-full items-center justify-between px-5 py-4 text-left cursor-pointer"
                        >
                            <span
                                className={`text-base font-medium transition-colors duration-300 ${isOpen ? "text-[#1e8b4b]" : "text-[#676666]"
                                    }`}
                            >
                                {item.question}
                            </span>

                            <IoChevronDown
                                className={`transition-transform duration-300 ${isOpen
                                    ? "rotate-180 text-[#27AE60]"
                                    : "text-gray-400"
                                    }`}
                            />
                        </button>

                        <div
                            className={`grid transition-all duration-300 ${isOpen
                                    ? "grid-rows-[1fr] opacity-100"
                                    : "grid-rows-[0fr] opacity-0"
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="px-5 pb-4 text-sm text-[#6f7a74] leading-relaxed whitespace-pre-line">
                                    {item.answer}
                                </div>
                            </div>
                        </div>

                    </div>
                );
            })}
        </div>
    );

};

export default Accordion;
