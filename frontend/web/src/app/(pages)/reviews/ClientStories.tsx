"use client";

import React from "react";
import Image from "next/image";

type Testimonial = {
    name: string;
    rating: number;
    date: string;
    avatarUrl: string;
    isQuote: boolean;
    quote?: string;
};

const testimonials: Testimonial[] = [
    {
        name: "Diana Johnston",
        rating: 4.9,
        date: "29 oct, 2025",
        avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
        isQuote: false,
    },
    {
        name: "Lauren Constreras",
        rating: 4.9,
        date: "29 oct, 2025",
        avatarUrl: "https://randomuser.me/api/portraits/women/65.jpg",
        isQuote: true,
        quote:
            "They have awesome customer service. I wouldn't recommend going to anyone else. All of you guys are awesome. Definitely love the way appscrip works",
    },
    {
        name: "Diana Johnston",
        rating: 4.9,
        date: "29 oct, 2025",
        avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
        isQuote: false,
    },
];

type ReviewItemProps = {
    name: string;
    rating: number;
    date: string;
    avatarUrl: string;
    highlight?: boolean;
};

const ReviewItem: React.FC<ReviewItemProps> = ({
    name,
    rating,
    date,
    avatarUrl,
    highlight,
}) => (
    <div className="flex items-center gap-3">
        <div
            className={`relative rounded-full border-2 border-[#3CB878] overflow-hidden bg-gray-100
      ${highlight ? "w-20 h-20" : "w-14 h-14"} shadow`}
        >
            <Image
                src={avatarUrl}
                alt={name}
                fill
                sizes="80px"
                className="object-cover"
            />
        </div>

        <div className="leading-tight text-[12px] sm:text-sm">
            <p className="text-gray-900 font-medium">{name}</p>
            <p className="flex items-center text-gray-500">
                <span className="text-[#3CB878] mr-1 text-sm">★</span>
                {rating} on {date}
            </p>
        </div>
    </div>
);

const ClientStories = () => {
    const quoteItem = testimonials.find((t) => t.isQuote)!;

    return (
        <>
            <div className="headingSideBar">
                <h1 className="text-2xl font-bold">
                    Client Stories
                </h1>
            </div>

            <section className="w-full flex justify-center py-10">
                <div className="grid grid-cols-[350px_1fr] gap-14 max-w-6xl w-full relative">

                    <div className="relative w-[350px] h-[400px]">
                        <svg
                            viewBox="0 0 220 420"
                            className="absolute inset-0 h-full w-[70%]"
                            fill="none"
                            stroke="#85B892"
                            strokeWidth="1.5"
                        >
                            <path d="M 20 20 C 140 60 140 360 20 400" />
                        </svg>

                        {/* Top Reviewer */}
                        <div className="absolute top-[9%] left-14">
                            <ReviewItem {...testimonials[0]} />
                        </div>

                        {/* Middle Reviewer */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-20">
                            <ReviewItem {...testimonials[1]} highlight />
                        </div>

                        {/* Bottom Reviewer */}
                        <div className="absolute bottom-[9%] left-14">
                            <ReviewItem {...testimonials[2]} />
                        </div>
                    </div>

                    <div className="relative flex items-center">
                        <blockquote className="max-w-3xl text-[18px] sm:text-[22px] lg:text-[18px] leading-relaxed text-gray-800 font-light">
                            <span className="mr-1 align-top text-5xl sm:text-4xl font-serif font-bold italic text-black select-none">
                                “T
                            </span>

                            {quoteItem.quote?.substring(1)}
                        </blockquote>
                    </div>

                </div>
            </section>
        </>
    );
};

export default ClientStories;
