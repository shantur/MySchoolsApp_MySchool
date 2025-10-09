/**
 * Create School Page - MySchool Admin
 *
 * Client-side form for creating new schools.
 * HTML structure designed for parsing by Flutter adapter.
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateSchoolPage() {
  const [formData, setFormData] = useState({
    schoolId: '',
    name: '',
    address: '',
    contactEmail: '',
    phone: '',
    website: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim() || !formData.address.trim() || !formData.contactEmail.trim()) {
      setError('Name, address, and contact email are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(formData.schoolId.trim() && { schoolId: formData.schoolId.trim() }),
          name: formData.name,
          address: formData.address,
          contactEmail: formData.contactEmail,
          contactPhone: formData.phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create school');
        setIsLoading(false);
        return;
      }

      // Redirect to schools list
      router.push('/admin/schools');
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/admin/schools"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Schools
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Create New School
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow">
          <form
            onSubmit={handleSubmit}
            data-form-type="create-school"
            aria-label="Create school form"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="schoolId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  School ID <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="schoolId"
                  name="schoolId"
                  type="text"
                  value={formData.schoolId}
                  onChange={handleInputChange}
                  data-field="school-id"
                  aria-label="School ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="my-school-123"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Custom identifier (3-50 chars, alphanumeric with hyphens). Auto-generated if not provided.
                </p>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  School Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  data-field="school-name"
                  aria-label="School name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lincoln Elementary School"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Address *
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={formData.address}
                onChange={handleInputChange}
                data-field="school-address"
                aria-label="School address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main St, City, State 12345"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contact Email *
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  data-field="contact-email"
                  aria-label="Contact email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@school.edu"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  data-field="phone"
                  aria-label="Phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                data-field="website"
                aria-label="School website"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://www.school.edu"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                data-field="description"
                aria-label="School description"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the school..."
                disabled={isLoading}
              />
            </div>

            <div
              data-error-container
              className="min-h-[24px]"
            >
              {error && (
                <div
                  data-error-message
                  className="text-red-600 text-sm"
                  role="alert"
                >
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                data-action="create-school-submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Creating School...' : 'Create School'}
              </button>
              <Link
                href="/admin/schools"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}