
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface SchoolData {
  schoolId: string;
  name: string;
  address: string;
  contactEmail: string;
  contactPhone?: string;
}

export default function EditSchoolPage() {
  const router = useRouter();
  const params = useParams();
  const { schoolId } = params;

  const [formData, setFormData] = useState<SchoolData>({
    schoolId: '',
    name: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (schoolId) {
      fetchSchoolData(schoolId as string);
    }
  }, [schoolId]);

  const fetchSchoolData = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/schools/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch school data');
      }
      const apiResponse = await response.json();
      if (!apiResponse.success || !apiResponse.school) {
        throw new Error('Invalid API response format');
      }
      const schoolData: SchoolData = {
        schoolId: apiResponse.school.schoolId,
        name: apiResponse.school.name,
        address: apiResponse.school.address || '',
        contactEmail: apiResponse.school.contactEmail || '',
        contactPhone: (apiResponse.school as any).contactPhone || '',
      };
      setFormData(schoolData);
    } catch (err: any) {
      setError(err.message || 'Error fetching school data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.address.trim() || !formData.contactEmail.trim()) {
      setError('Name, address, and contact email are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/schools/${schoolId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update school');
      }

      setSuccess(`School "${formData.name}" updated successfully.`);
      // Optionally redirect or update local state
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setSuccess('');
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/schools/${schoolId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete school');
      }

      setSuccess(`School "${formData.name}" successfully deleted.`);
      router.push('/admin/schools'); // Redirect after successful deletion
    } catch (err: any) {
      setError(err.message || 'An error occurred during deletion.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading school data...</p>
      </div>
    );
  }

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
            Edit School: {formData.name}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow">
          {error && (
            <div
              data-error-message
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          {success && (
            <div
              data-success-message
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Success:</strong>
              <span className="block sm:inline"> {success}</span>
            </div>
          )}

          <form
            onSubmit={handleSave}
            data-form-type="edit-school"
            aria-label="Edit school form"
            className="space-y-6"
          >
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
                disabled={isSaving || isDeleting}
              />
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
                disabled={isSaving || isDeleting}
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
                  disabled={isSaving || isDeleting}
                />
              </div>

              <div>
                <label
                  htmlFor="contactPhone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number
                </label>
                <input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  data-field="contact-phone"
                  aria-label="Phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSaving || isDeleting}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                data-action="save-school-submit"
                disabled={isSaving || isDeleting}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                data-action="delete-school-initiate"
                disabled={isSaving || isDeleting}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Delete School
              </button>
              <Link
                href="/admin/schools"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>

          {showDeleteConfirm && (
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center"
              data-testid="delete-confirmation-dialog"
            >
              <div className="bg-white p-8 rounded-lg shadow-xl m-4 max-w-sm w-full">
                <h3 className="text-lg font-bold mb-4">Delete {formData.name}?</h3>
                <p className="mb-6 text-gray-700">
                  Are you sure you want to delete {formData.name}? This action cannot be undone and will permanently remove all associated data.
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    data-action="delete-school-cancel"
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    data-action="delete-school-confirm"
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
