'use client';

import React from 'react';
import { ICreatePropertyFormState, IFeaturedProject } from '../types';

interface Step9SEOProps {
    data: ICreatePropertyFormState;
    onUpdate: <K extends keyof ICreatePropertyFormState>(
        field: K,
        value: ICreatePropertyFormState[K]
    ) => void;
    errors: string[];
}

export const Step9SEO: React.FC<Step9SEOProps> = ({
    data,
    onUpdate,
    errors = [],
}) => {
    const metaDescLength = (data.metaDescription || '').length;
    const metaTitleLength = (data.metaTitle || '').length;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">SEO Settings</h2>

            {errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <ul className="list-disc list-inside text-red-700">
                        {errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-800 leading-relaxed">
                    Optimize your project listing for search engines by filling out the SEO fields below.
                    These will help your property appear in search results.
                </p>
            </div>

            {/* Meta Title */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Meta Title *</label>
                    <span className={`text-xs ${metaTitleLength > 60 ? 'text-red-600' : 'text-gray-600'}`}>
                        {metaTitleLength}/60
                    </span>
                </div>
                <input
                    type="text"
                    value={data.metaTitle || ''}
                    onChange={(e) => onUpdate('metaTitle', e.target.value.slice(0, 60))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Luxury 2/3 BHK Apartment in Mumbai | XYZ Project"
                    maxLength={60}
                />
                <p className="text-xs text-gray-600 mt-1">
                    Recommended: 50-60 characters. This appears in search results.
                </p>
            </div>

            {/* Meta Description */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Meta Description *</label>
                    <span className={`text-xs ${metaDescLength > 160 ? 'text-red-600' : 'text-gray-600'}`}>
                        {metaDescLength}/160
                    </span>
                </div>
                <textarea
                    value={data.metaDescription || ''}
                    onChange={(e) => onUpdate('metaDescription', e.target.value.slice(0, 160))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe your property in 155-160 characters for best results in search engines..."
                    maxLength={160}
                />
                <p className="text-xs text-gray-600 mt-1">
                    Recommended: 150-160 characters. This appears below the title in search results.
                </p>
            </div>

            {/* Meta Keywords */}
            <div>
                <label className="block text-sm font-medium mb-2">Meta Keywords (Optional)</label>
                <input
                    type="text"
                    value={data.metaKeywords || ''}
                    onChange={(e) => onUpdate('metaKeywords', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., luxury apartment, mumbai, 2bhk, property, real estate"
                />
                <p className="text-xs text-gray-600 mt-1">
                    Comma-separated keywords. Include location, property type, and amenities.
                </p>
            </div>


            {/* Tips */}
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h3 className="font-semibold text-emerald-900 mb-3">
                    SEO Tips
                </h3>

                <ul className="space-y-2 text-sm text-emerald-800">
                    <li>✓ Include location name in title and description</li>
                    <li>✓ Mention key features like BHK, amenities, price range</li>
                    <li>✓ Use numbers and specifics (e.g., "2 BHK" instead of "apartment")</li>
                    <li>✓ Make description compelling and action-oriented</li>
                    <li>✓ Include relevant keywords naturally</li>
                    <li>✓ Avoid keyword stuffing – keep it readable</li>
                </ul>
            </div>

        </div>
    );
};
